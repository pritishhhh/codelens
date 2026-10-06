import {
  CATEGORIES,
  SEVERITIES,
  type Category,
  type ReviewIssue,
  type ReviewResult,
  type Severity,
} from "@/types/review";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSeverity(value: unknown): value is Severity {
  return typeof value === "string" && (SEVERITIES as readonly string[]).includes(value);
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

function isReviewIssue(value: unknown): value is ReviewIssue {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.line === "number" &&
    Number.isInteger(value.line) &&
    value.line >= 1 &&
    isSeverity(value.severity) &&
    isCategory(value.category) &&
    typeof value.description === "string" &&
    value.description.trim().length > 0 &&
    typeof value.suggestedFix === "string" &&
    value.suggestedFix.trim().length > 0
  );
}

export class ReviewValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewValidationError";
  }
}

export function validateReviewResult(value: unknown, lineCount?: number): ReviewResult {
  if (!isRecord(value)) {
    throw new ReviewValidationError("Review response must be a JSON object.");
  }

  if (!Array.isArray(value.issues)) {
    throw new ReviewValidationError("Review response must include an issues array.");
  }

  const issues: ReviewIssue[] = [];
  for (let index = 0; index < value.issues.length; index += 1) {
    const issue = value.issues[index];
    if (!isReviewIssue(issue)) {
      throw new ReviewValidationError(`Invalid issue at index ${index}.`);
    }
    if (lineCount !== undefined && issue.line > lineCount) {
      throw new ReviewValidationError(`Issue at index ${index} references a line outside the snippet.`);
    }
    issues.push(issue);
  }

  if (typeof value.overallScore !== "number" || !Number.isFinite(value.overallScore)) {
    throw new ReviewValidationError("overallScore must be a finite number.");
  }

  if (value.overallScore < 0 || value.overallScore > 100) {
    throw new ReviewValidationError("overallScore must be between 0 and 100.");
  }
  const overallScore = Math.round(value.overallScore);

  if (typeof value.summary !== "string" || value.summary.trim().length === 0) {
    throw new ReviewValidationError("summary must be a non-empty string.");
  }

  return {
    issues,
    overallScore,
    summary: value.summary.trim(),
  };
}
