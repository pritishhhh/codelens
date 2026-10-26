import { test } from "node:test";
import assert from "node:assert/strict";
import { POST as review } from "../../src/app/api/review/route";
import { POST as compare } from "../../src/app/api/compare/route";
import { GET as config } from "../../src/app/api/config/route";
import { getAIClient, RequestError } from "../../src/lib/apiSupport";

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
  const previous = { AI_PROVIDER: process.env.AI_PROVIDER, GROQ_API_KEY: process.env.GROQ_API_KEY, OPENAI_API_KEY: process.env.OPENAI_API_KEY, GROQ_MODEL: process.env.GROQ_MODEL, OPENAI_BASE_URL: process.env.OPENAI_BASE_URL };
  delete process.env.AI_PROVIDER;
  delete process.env.GROQ_MODEL;
  process.env.GROQ_API_KEY = "synthetic-groq-key";
  process.env.OPENAI_API_KEY = "synthetic-paid-key-never-used";
  process.env.OPENAI_BASE_URL = "https://untrusted.example/v1";
  let content: unknown = validReview;
  let providerStatus = 200;
  let prompt = "";
  context.mock.method(globalThis, "fetch", async (input: unknown, init?: RequestInit) => {
    assert.equal(String(input), "https://api.groq.com/openai/v1/chat/completions");
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer synthetic-groq-key");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, "openai/gpt-oss-120b");
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
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("a missing Groq key never falls back to an existing paid OpenAI key", async (context) => {
  const previous = { AI_PROVIDER: process.env.AI_PROVIDER, GROQ_API_KEY: process.env.GROQ_API_KEY, OPENAI_API_KEY: process.env.OPENAI_API_KEY };
  let requests = 0;
  context.mock.method(globalThis, "fetch", async () => { requests += 1; throw new Error("No provider call expected"); });
  try {
    delete process.env.AI_PROVIDER;
    delete process.env.GROQ_API_KEY;
    process.env.OPENAI_API_KEY = "synthetic-paid-key-never-used";
    assert.throws(getAIClient, (error: unknown) => error instanceof RequestError && error.status === 503);
    for (const [handler, body] of [
      [review, { code: "const x = 1;", language: "javascript" }],
      [compare, { solutionA: "a", solutionB: "b", language: "javascript" }],
    ] as const) assert.equal((await handler(request(body))).status, 503);
    const metadata = await config();
    assert.deepEqual(await metadata.json(), { provider: "groq", label: "Groq", model: "openai/gpt-oss-120b" });
    assert.equal(requests, 0);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("OpenAI requires explicit selection and provider-specific model configuration", async () => {
  const previous = { AI_PROVIDER: process.env.AI_PROVIDER, GROQ_API_KEY: process.env.GROQ_API_KEY, OPENAI_API_KEY: process.env.OPENAI_API_KEY, OPENAI_MODEL: process.env.OPENAI_MODEL, GROQ_MODEL: process.env.GROQ_MODEL };
  try {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "synthetic-openai-key";
    process.env.OPENAI_MODEL = "explicit-openai-model";
    process.env.GROQ_API_KEY = "synthetic-groq-key";
    process.env.GROQ_MODEL = "explicit-groq-model";
    const selected = getAIClient();
    assert.equal(selected.client.baseURL, "https://api.openai.com/v1");
    assert.equal(selected.model, "explicit-openai-model");
    process.env.AI_PROVIDER = "groq";
    assert.equal(getAIClient().model, "explicit-groq-model");
    const metadata = await (await config()).json();
    assert.ok(!JSON.stringify(metadata).includes("synthetic"));
    process.env.AI_PROVIDER = "invalid";
    assert.throws(getAIClient, RequestError);
    assert.equal((await config()).status, 503);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
