import { MAX_CODE_LENGTH } from "./constants";
import { isSupportedLanguage, type SupportedLanguage } from "@/types/language";

export interface ReviewDraft {
  code: string;
  language: SupportedLanguage;
}

export interface CompareDraft {
  solutionA: string;
  solutionB: string;
  language: SupportedLanguage;
}

export const EMPTY_REVIEW_DRAFT: ReviewDraft = { code: "", language: "javascript" };
export const EMPTY_COMPARE_DRAFT: CompareDraft = {
  solutionA: "", solutionB: "", language: "javascript",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCode(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_CODE_LENGTH;
}

export function isReviewDraft(value: unknown): value is ReviewDraft {
  return isRecord(value) && isCode(value.code) &&
    typeof value.language === "string" && isSupportedLanguage(value.language);
}

export function isCompareDraft(value: unknown): value is CompareDraft {
  return isRecord(value) && isCode(value.solutionA) && isCode(value.solutionB) &&
    typeof value.language === "string" && isSupportedLanguage(value.language);
}
