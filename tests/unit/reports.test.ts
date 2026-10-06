import { test } from "node:test";
import assert from "node:assert/strict";
import { reportToMarkdown } from "../../src/lib/reports";

test("review report preserves source whitespace, line numbers, and suggested fixes", () => {
  const markdown = reportToMarkdown({
    kind: "review", language: "javascript", code: "\n  const x = 1;",
    result: { overallScore: 80, summary: "A small issue.", issues: [
      { line: 2, severity: "minor", category: "readability", description: "Use a meaningful name.", suggestedFix: "const count = 1;" },
    ] },
  });
  assert.ok(markdown.includes("Overall score: 80/100"));
  assert.ok(markdown.includes("Line 2 · minor · readability"));
  assert.ok(markdown.includes("\n\n  const x = 1;\n"));
  assert.ok(markdown.includes("const count = 1;"));
});
test("source containing Markdown fences cannot close its code block", () => {
  const markdown = reportToMarkdown({
    kind: "review", language: "javascript", code: "const fence = '```';",
    result: { overallScore: 100, summary: "No issues.", issues: [] },
  });
  assert.ok(markdown.includes("````javascript"));
  assert.ok(markdown.includes("No issues found."));
});
test("comparison report includes both sources, scores, and rationale", () => {
  const markdown = reportToMarkdown({
    kind: "compare", language: "python", solutionA: "print(1)", solutionB: "print(2)",
    result: { winner: "tie", summary: "Similar.", reasoning: "Both are simple.",
      solutionA: { score: 90, strengths: ["Clear"], weaknesses: ["Hardcoded"] },
      solutionB: { score: 92, strengths: ["Short"], weaknesses: ["Hardcoded"] },
    },
  });
  for (const text of ["Winner: Tie", "Solution A · 90/100", "Solution B · 92/100", "print(1)", "print(2)", "Both are simple."]) {
    assert.ok(markdown.includes(text));
  }
});
