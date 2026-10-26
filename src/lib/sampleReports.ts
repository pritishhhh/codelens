import { COMPARE_EXAMPLES, REVIEW_EXAMPLES } from "./examples";
import type { ReviewResult } from "@/types/review";
import type { CompareResult } from "@/types/compare";

// Curated, synthetic reports. These are never presented as live model output.
export const SAMPLE_REVIEW_CODE = REVIEW_EXAMPLES.typescript;
export const SAMPLE_COMPARISON = COMPARE_EXAMPLES.typescript;
export const SAMPLE_REVIEW: ReviewResult = {
  overallScore: 64,
  summary: "The types make the intent clear, but the lookup can crash when a user is missing. Handle the not-found case explicitly so callers can make a safe decision.",
  issues: [{
    line: 5, severity: "major", category: "bug",
    description: "The non-null assertion only silences TypeScript. If no user matches the id, accessing name on undefined throws at runtime.",
    suggestedFix: "Change the return type to string | undefined and return user?.name; callers must then handle a missing user.",
  }],
};
export const SAMPLE_COMPARE: CompareResult = {
  winner: "solutionB",
  summary: "For arrays of ordinary strings or finite numbers, Solution B expresses deduplication more directly and avoids repeated linear searches.",
  reasoning: "Solution A calls indexOf for every item, taking O(n²) time in the worst case. A Set typically provides average O(n) construction. Their equality behavior differs for NaN: indexOf never finds it, while Set retains one NaN, so the intended input contract matters.",
  solutionA: { score: 65, strengths: ["Preserves the order of first occurrences for strings and finite numbers."], weaknesses: ["Repeated indexOf calls give quadratic worst-case time.", "NaN values are all discarded."] },
  solutionB: { score: 89, strengths: ["Concise intent and average linear-time deduplication.", "Preserves insertion order."], weaknesses: ["Uses additional Set storage.", "Objects are deduplicated by identity, not by their field values."] },
};
