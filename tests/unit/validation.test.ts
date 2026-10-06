import { test } from "node:test";
import assert from "node:assert/strict";
import { validateReviewResult, ReviewValidationError } from "../../src/lib/validateReview";
import { validateCompareResult } from "../../src/lib/validateCompare";
import { parseJsonObject } from "../../src/lib/parseJsonResponse";
import { isReviewDraft, isCompareDraft } from "../../src/lib/drafts";

const issue = {
  line: 2, severity: "major", category: "bug",
  description: "Handle empty input.", suggestedFix: "if (!values.length) return 0;",
};
const review = { issues: [issue], overallScore: 72.4, summary: "Useful, with an edge case." };
const analysis = { score: 90, strengths: ["Clear"], weaknesses: ["Limited validation"] };
const comparison = { winner: "solutionB", summary: "B is clearer.", reasoning: "It avoids nesting.", solutionA: analysis, solutionB: analysis };

test("review validation accepts valid data and normalizes scores", () => {
  assert.equal(validateReviewResult(review, 3).overallScore, 72);
  assert.deepEqual(validateReviewResult({ ...review, issues: [] }).issues, []);
});
test("review validation rejects hallucinated lines and invalid severity", () => {
  assert.throws(() => validateReviewResult(review, 1), ReviewValidationError);
  assert.throws(() => validateReviewResult({ ...review, issues: [{ ...issue, severity: "urgent" }] }), ReviewValidationError);
});
test("out-of-range fractional scores are rejected before rounding", () => {
  for (const score of [-0.1, 100.1, NaN, Infinity]) {
    assert.throws(() => validateReviewResult({ ...review, overallScore: score }));
    assert.throws(() => validateCompareResult({ ...comparison, solutionA: { ...analysis, score } }));
  }
});
test("comparison validates winner and non-empty strengths and weaknesses", () => {
  assert.equal(validateCompareResult(comparison).winner, "solutionB");
  assert.throws(() => validateCompareResult({ ...comparison, winner: "A" }));
  assert.throws(() => validateCompareResult({ ...comparison, solutionA: { ...analysis, strengths: [] } }));
  assert.throws(() => validateCompareResult({ ...comparison, solutionB: { ...analysis, weaknesses: [" "] } }));
});
test("parses raw, fenced, and prose-wrapped JSON while rejecting malformed JSON", () => {
  for (const input of ['{"issues":[]}', '```json\n{"issues":[]}\n```', 'Review: {"issues":[]} Done.']) {
    assert.deepEqual(parseJsonObject(input), { issues: [] });
  }
  assert.throws(() => parseJsonObject('{"issues": [}'));
});
test("persisted drafts validate their shape, language, and size", () => {
  assert.ok(isReviewDraft({ code: "\n  const x = 1;", language: "javascript" }));
  assert.ok(isCompareDraft({ solutionA: "", solutionB: "x", language: "python" }));
  assert.ok(!isReviewDraft({ code: "x".repeat(10_001), language: "javascript" }));
  assert.ok(!isReviewDraft({ code: "", language: "ruby" }));
  assert.ok(!isCompareDraft({ solutionA: "", language: "javascript" }));
  assert.ok(!isReviewDraft(null));
});
