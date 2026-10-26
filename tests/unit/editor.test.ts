import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLineDiff } from "../../src/lib/lineDiff";
import { formatCode } from "../../src/lib/formatCode";
import { SAMPLE_REVIEW, SAMPLE_REVIEW_CODE, SAMPLE_COMPARE } from "../../src/lib/sampleReports";
import { validateReviewResult } from "../../src/lib/validateReview";
import { validateCompareResult } from "../../src/lib/validateCompare";
import { reportToMarkdown } from "../../src/lib/reports";

test("source diff assigns separate line numbers to additions and removals", () => {
  assert.deepEqual(buildLineDiff("one\ntwo\nthree\n", "one\nchanged\nthree\n"), [
    { kind: "unchanged", text: "one", oldLine: 1, newLine: 1 },
    { kind: "removed", text: "two", oldLine: 2, newLine: null },
    { kind: "added", text: "changed", oldLine: null, newLine: 2 },
    { kind: "unchanged", text: "three", oldLine: 3, newLine: 3 },
  ]);
  assert.deepEqual(buildLineDiff("", ""), []);
  assert.equal(buildLineDiff("", "new")[0].kind, "added");
  assert.equal(buildLineDiff("old", "")[0].kind, "removed");
  assert.equal(buildLineDiff("same", "same")[0].kind, "unchanged");
});

test("browser formatter supports JavaScript and TypeScript and rejects invalid syntax", async () => {
  assert.equal(await formatCode("const x={a:1}", "javascript"), "const x = { a: 1 };\n");
  assert.equal(await formatCode("const n:number=1", "typescript"), "const n: number = 1;\n");
  await assert.rejects(formatCode("const =", "javascript"));
  await assert.rejects(formatCode("print(1)", "python"));
});

test("sample feedback validates against its source and stays labelled in exports", () => {
  assert.equal(validateReviewResult(SAMPLE_REVIEW, SAMPLE_REVIEW_CODE.split("\n").length).issues.length, 1);
  assert.equal(validateCompareResult(SAMPLE_COMPARE).winner, "solutionB");
  assert.match(reportToMarkdown({ kind: "review", source: "sample", code: SAMPLE_REVIEW_CODE, language: "typescript", result: SAMPLE_REVIEW }), /curated sample report \(no AI request\)/);
});
