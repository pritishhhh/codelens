import { test } from "node:test";
import assert from "node:assert/strict";
import { POST as review } from "../../src/app/api/review/route";
import { POST as compare } from "../../src/app/api/compare/route";

const request = (body: unknown) => new Request("http://localhost/api/review", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
const validReview = { issues: [], overallScore: 90, summary: "Clear and concise." };
const validCompare = {
  winner: "tie", summary: "Similar.", reasoning: "Both work.",
  solutionA: { score: 90, strengths: ["Clear"], weaknesses: ["Hardcoded"] },
  solutionB: { score: 90, strengths: ["Clear"], weaknesses: ["Hardcoded"] },
};

test("APIs reject malformed JSON, empty code, unsupported languages, and oversized whitespace", async () => {
  assert.equal((await review(new Request("http://localhost/api/review", { method: "POST", body: "{" }))).status, 400);
  for (const body of [
    { code: " ", language: "javascript" }, { code: "x", language: "ruby" },
    { code: " ".repeat(10_000) + "x", language: "javascript" },
  ]) assert.equal((await review(request(body))).status, 400);
  assert.equal((await compare(request({ solutionA: "x", solutionB: "", language: "python" }))).status, 400);
});

test("APIs preserve whitespace and distinguish model failures from bad input", async (context) => {
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-placeholder-never-sent";
  let content: unknown = validReview;
  let providerStatus = 200;
  let prompt = "";
  context.mock.method(globalThis, "fetch", async (_input: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    prompt = body.messages[1].content;
    const data = providerStatus === 200
      ? { choices: [{ message: { content: typeof content === "string" ? content : JSON.stringify(content) } }] }
      : { error: { message: "private provider details", type: "invalid_request_error" } };
    return new Response(JSON.stringify(data), { status: providerStatus, headers: { "Content-Type": "application/json" } });
  });
  try {
    const code = "\n\n  const x = 1;";
    assert.equal((await review(request({ code, language: "javascript" }))).status, 200);
    assert.ok(prompt.includes(code));
    content = { ...validReview, issues: [{ line: 20, severity: "minor", category: "bug", description: "Invalid line", suggestedFix: "fix" }] };
    assert.equal((await review(request({ code, language: "javascript" }))).status, 502);
    content = "invalid json";
    assert.equal((await review(request({ code, language: "javascript" }))).status, 502);
    content = validCompare;
    assert.equal((await compare(request({ solutionA: "\n  a", solutionB: "b", language: "python" }))).status, 200);
    assert.ok(prompt.includes("\n  a"));
    content = { ...validCompare, winner: "invalid" };
    assert.equal((await compare(request({ solutionA: "a", solutionB: "b", language: "python" }))).status, 502);
    providerStatus = 401;
    const unavailable = await review(request({ code, language: "javascript" }));
    assert.equal(unavailable.status, 502);
    assert.ok(!JSON.stringify(await unavailable.json()).includes("private provider details"));
    providerStatus = 429;
    assert.equal((await review(request({ code, language: "javascript" }))).status, 429);
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});
