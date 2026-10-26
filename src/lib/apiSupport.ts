import { createHash, timingSafeEqual } from "node:crypto";
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const MAX_REQUEST_BYTES = 128 * 1024;

export class RequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export function authorizeAnalysis(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    throw new RequestError("Cross-origin analysis requests are not allowed.", 403);
  }
  const token = process.env.CODELENS_ACCESS_TOKEN;
  if (!token && process.env.NODE_ENV === "production") {
    throw new RequestError("Live analysis is disabled on this deployment. Explore a sample report instead.", 503);
  }
  if (token) {
    const supplied = request.headers.get("authorization") ?? "";
    const digest = (value: string) => createHash("sha256").update(value).digest();
    if (!timingSafeEqual(digest(supplied), digest(`Bearer ${token}`))) {
      throw new RequestError("Enter a valid deployment access code in Live AI access.", 401);
    }
  }
}

// Limit the actual stream, not just the caller-controlled Content-Length header.
export async function readJsonBody(request: Request): Promise<unknown> {
  const declaredSize = Number(request.headers.get("content-length"));
  if (declaredSize > MAX_REQUEST_BYTES) throw new RequestError("Request body is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("A JSON request body is required.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new RequestError("Request body is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new RequestError("Invalid JSON in request body.", 400);
  }
}

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new RequestError("Live analysis is unavailable. Explore a sample report instead.", 503);
  // Complete before Vercel's 60-second function deadline; retries could exceed it.
  return new OpenAI({ apiKey, timeout: 45_000, maxRetries: 0 });
}

export function apiErrorResponse(error: unknown, signal: AbortSignal): NextResponse {
  if (signal.aborted) return NextResponse.json({ error: "Request cancelled." }, { status: 499 });
  if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return NextResponse.json({ error: "The AI service timed out. Try again with a shorter snippet." }, { status: 504 });
  }
  if (error instanceof OpenAI.APIError) {
    const status = error.status === 429 ? 429 : 502;
    return NextResponse.json({ error: status === 429 ? "The AI service is busy or its quota is exhausted. Please try again later." : "The AI service is unavailable. Please try again later." }, { status });
  }
  // Never log source, tokens, or raw provider responses.
  console.error("Unexpected analysis failure.");
  return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
}
