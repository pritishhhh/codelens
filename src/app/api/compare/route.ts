import OpenAI from "openai";
import { NextResponse } from "next/server";
import { MAX_CODE_LENGTH, OPENAI_MODEL } from "@/lib/constants";
import { parseJsonObject } from "@/lib/parseJsonResponse";
import { buildCompareUserPrompt, COMPARE_SYSTEM_PROMPT } from "@/lib/prompts";
import { validateCompareResult } from "@/lib/validateCompare";
import { ReviewValidationError } from "@/lib/validateReview";
import { isSupportedLanguage, LANGUAGE_LABELS, type SupportedLanguage } from "@/types/language";
import type { CompareRequestBody } from "@/types/compare";

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey, timeout: 60_000, maxRetries: 0 });
}

function validateSolutionCode(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new ReviewValidationError(`${field} must be a string.`);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ReviewValidationError(`${field} must not be empty.`);
  }

  if (value.length > MAX_CODE_LENGTH) {
    throw new ReviewValidationError(
      `${field} exceeds the maximum length of ${MAX_CODE_LENGTH} characters.`,
    );
  }

  return value;
}

function validateRequestBody(body: unknown): {
  solutionA: string;
  solutionB: string;
  language: SupportedLanguage;
} {
  if (typeof body !== "object" || body === null) {
    throw new ReviewValidationError("Request body must be a JSON object.");
  }

  const { solutionA, solutionB, language } = body as CompareRequestBody;

  const trimmedA = validateSolutionCode(solutionA, "solutionA");
  const trimmedB = validateSolutionCode(solutionB, "solutionB");

  if (typeof language !== "string" || !isSupportedLanguage(language)) {
    throw new ReviewValidationError("language must be a supported language.");
  }

  return { solutionA: trimmedA, solutionB: trimmedB, language };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }

    const { solutionA, solutionB, language } = validateRequestBody(body);
    const client = getOpenAIClient();
    const languageLabel = LANGUAGE_LABELS[language];

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || OPENAI_MODEL,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: COMPARE_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildCompareUserPrompt(languageLabel, solutionA, solutionB),
        },
      ],
    }, { signal: request.signal });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Model returned an empty response." },
        { status: 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = parseJsonObject(content);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse compare response as JSON." },
        { status: 502 },
      );
    }

    try {
      return NextResponse.json(validateCompareResult(parsed));
    } catch {
      return NextResponse.json({ error: "The AI returned an invalid comparison. Please try again." }, { status: 502 });
    }
  } catch (error) {
    if (request.signal.aborted) {
      return NextResponse.json({ error: "Request cancelled." }, { status: 499 });
    }
    if (error instanceof ReviewValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Error && error.message === "OPENAI_API_KEY is not configured.") {
      return NextResponse.json(
        {
          error:
            "Server is not configured with an OpenAI API key. Add OPENAI_API_KEY to .env.local and restart the dev server.",
        },
        { status: 500 },
      );
    }

    if (error instanceof OpenAI.APIConnectionTimeoutError) {
      return NextResponse.json({ error: "The AI service timed out. Please try again." }, { status: 504 });
    }
    if (error instanceof OpenAI.APIError) {
      const status = error.status === 429 ? 429 : 502;
      return NextResponse.json(
        { error: status === 429 ? "The AI service is busy or its quota is exhausted. Please try again later." : "The AI service is unavailable. Please try again later." },
        { status },
      );
    }

    console.error("Unexpected error in /api/compare:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
