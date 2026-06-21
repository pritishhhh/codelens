import OpenAI from "openai";
import { NextResponse } from "next/server";
import { MAX_CODE_LENGTH, OPENAI_MODEL } from "@/lib/constants";
import { parseJsonObject } from "@/lib/parseJsonResponse";
import { buildReviewUserPrompt, REVIEW_SYSTEM_PROMPT } from "@/lib/prompts";
import { ReviewValidationError, validateReviewResult } from "@/lib/validateReview";
import { isSupportedLanguage, LANGUAGE_LABELS, type SupportedLanguage } from "@/types/language";
import type { ReviewRequestBody } from "@/types/review";

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

function validateRequestBody(body: unknown): { code: string; language: SupportedLanguage } {
  if (typeof body !== "object" || body === null) {
    throw new ReviewValidationError("Request body must be a JSON object.");
  }

  const { code, language } = body as ReviewRequestBody;

  if (typeof code !== "string") {
    throw new ReviewValidationError("code must be a string.");
  }

  const trimmedCode = code.trim();
  if (trimmedCode.length === 0) {
    throw new ReviewValidationError("code must not be empty.");
  }

  if (trimmedCode.length > MAX_CODE_LENGTH) {
    throw new ReviewValidationError(
      `code exceeds the maximum length of ${MAX_CODE_LENGTH} characters.`,
    );
  }

  if (typeof language !== "string" || !isSupportedLanguage(language)) {
    throw new ReviewValidationError("language must be a supported language.");
  }

  return { code: trimmedCode, language };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }

    const { code, language } = validateRequestBody(body);
    const client = getOpenAIClient();
    const languageLabel = LANGUAGE_LABELS[language];

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: REVIEW_SYSTEM_PROMPT },
        { role: "user", content: buildReviewUserPrompt(languageLabel, code) },
      ],
    });

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
        { error: "Failed to parse review response as JSON." },
        { status: 502 },
      );
    }

    const review = validateReviewResult(parsed);
    return NextResponse.json(review);
  } catch (error) {
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

    if (error instanceof OpenAI.APIError) {
      const status = error.status ?? 502;
      return NextResponse.json(
        { error: error.message || "OpenAI API request failed." },
        { status: status >= 400 && status < 600 ? status : 502 },
      );
    }

    console.error("Unexpected error in /api/review:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
