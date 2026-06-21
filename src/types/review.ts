export const SEVERITIES = ["critical", "major", "minor", "style"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const CATEGORIES = ["bug", "security", "performance", "readability"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface ReviewIssue {
  line: number;
  severity: Severity;
  category: Category;
  description: string;
  suggestedFix: string;
}

export interface ReviewResult {
  issues: ReviewIssue[];
  overallScore: number;
  summary: string;
}

export interface ReviewRequestBody {
  code: string;
  language: string;
}

export interface ReviewApiError {
  error: string;
}
