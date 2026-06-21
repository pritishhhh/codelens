import {
  COMPARE_WINNERS,
  type CompareResult,
  type CompareSolutionAnalysis,
  type CompareWinner,
} from "@/types/compare";
import { ReviewValidationError } from "@/lib/validateReview";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCompareWinner(value: unknown): value is CompareWinner {
  return typeof value === "string" && (COMPARE_WINNERS as readonly string[]).includes(value);
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function validateScore(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ReviewValidationError(`${field} must be a finite number.`);
  }

  const score = Math.round(value);
  if (score < 0 || score > 100) {
    throw new ReviewValidationError(`${field} must be between 0 and 100.`);
  }

  return score;
}

function validateSolutionAnalysis(value: unknown, label: string): CompareSolutionAnalysis {
  if (!isRecord(value)) {
    throw new ReviewValidationError(`${label} must be an object.`);
  }

  const score = validateScore(value.score, `${label}.score`);

  if (!isNonEmptyStringArray(value.strengths)) {
    throw new ReviewValidationError(`${label}.strengths must be a non-empty string array.`);
  }

  if (!isNonEmptyStringArray(value.weaknesses)) {
    throw new ReviewValidationError(`${label}.weaknesses must be a non-empty string array.`);
  }

  return {
    score,
    strengths: value.strengths.map((item) => item.trim()),
    weaknesses: value.weaknesses.map((item) => item.trim()),
  };
}

export function validateCompareResult(value: unknown): CompareResult {
  if (!isRecord(value)) {
    throw new ReviewValidationError("Compare response must be a JSON object.");
  }

  if (!isCompareWinner(value.winner)) {
    throw new ReviewValidationError("winner must be solutionA, solutionB, or tie.");
  }

  if (typeof value.summary !== "string" || value.summary.trim().length === 0) {
    throw new ReviewValidationError("summary must be a non-empty string.");
  }

  if (typeof value.reasoning !== "string" || value.reasoning.trim().length === 0) {
    throw new ReviewValidationError("reasoning must be a non-empty string.");
  }

  return {
    winner: value.winner,
    summary: value.summary.trim(),
    reasoning: value.reasoning.trim(),
    solutionA: validateSolutionAnalysis(value.solutionA, "solutionA"),
    solutionB: validateSolutionAnalysis(value.solutionB, "solutionB"),
  };
}
