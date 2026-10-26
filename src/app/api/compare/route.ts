import { NextResponse } from "next/server";
import { parseJsonObject } from "@/lib/parseJsonResponse";
import { buildCompareUserPrompt, COMPARE_SYSTEM_PROMPT } from "@/lib/prompts";
import { validateCompareResult } from "@/lib/validateCompare";
import { LANGUAGE_LABELS } from "@/types/language";
import { apiErrorResponse, authorizeAnalysis, getAIClient, readJsonBody } from "@/lib/apiSupport";
import { requestCode, requestLanguage, requestObject } from "@/lib/validateRequest";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    authorizeAnalysis(request);
    const body = requestObject(await readJsonBody(request));
    const solutionA = requestCode(body.solutionA, "solutionA");
    const solutionB = requestCode(body.solutionB, "solutionB");
    const language = requestLanguage(body.language);
    const { client, model } = getAIClient();
    const completion = await client.chat.completions.create({
      model,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: COMPARE_SYSTEM_PROMPT },
        { role: "user", content: buildCompareUserPrompt(LANGUAGE_LABELS[language], solutionA, solutionB) },
      ],
    }, { signal: request.signal });
    try {
      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response");
      return NextResponse.json(validateCompareResult(parseJsonObject(content)));
    } catch {
      return NextResponse.json({ error: "The AI returned an invalid comparison. Please try again." }, { status: 502 });
    }
  } catch (error) {
    return apiErrorResponse(error, request.signal);
  }
}
