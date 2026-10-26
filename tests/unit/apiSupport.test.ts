import { test } from "node:test";
import assert from "node:assert/strict";
import { authorizeAnalysis, readJsonBody, MAX_REQUEST_BYTES, RequestError } from "../../src/lib/apiSupport";
import { POST as review } from "../../src/app/api/review/route";
import { POST as compare } from "../../src/app/api/compare/route";
import { NextRequest } from "next/server";

const makeRequest = (headers: Record<string, string> = {}, body = "{}") => new Request("https://codelens.example/api/review", { method: "POST", headers, body });

test("both routes protect production AI access and reject other origins before provider calls", async () => {
  const env = process.env as Record<string, string | undefined>;
  const original = { NODE_ENV: env.NODE_ENV, CODELENS_ACCESS_TOKEN: env.CODELENS_ACCESS_TOKEN };
  try {
    env.NODE_ENV = "production";
    delete env.CODELENS_ACCESS_TOKEN;
    for (const handler of [review, compare]) assert.equal((await handler(makeRequest())).status, 503);
    env.CODELENS_ACCESS_TOKEN = "synthetic-test-token";
    for (const handler of [review, compare]) {
      assert.equal((await handler(makeRequest())).status, 401);
      assert.equal((await handler(makeRequest({ authorization: "Bearer wrong" }))).status, 401);
      assert.equal((await handler(makeRequest({ origin: "https://another.example" }))).status, 403);
    }
    assert.doesNotThrow(() => authorizeAnalysis(makeRequest({ authorization: "Bearer synthetic-test-token", origin: "https://codelens.example" })));
    const loopbackRequest = new NextRequest("http://127.0.0.1:3000/api/review", {
      method: "POST", headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", authorization: "Bearer synthetic-test-token" },
    });
    // This is the framework normalization that a plain Request mock misses.
    assert.equal(new URL(loopbackRequest.url).hostname, "localhost");
    assert.doesNotThrow(() => authorizeAnalysis(loopbackRequest));
    assert.throws(() => authorizeAnalysis(makeRequest({ authorization: "synthetic-test-token" })), RequestError);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete env[key]; else env[key] = value;
    }
  }
});

test("JSON reader caps actual body bytes even when Content-Length is absent or false", async () => {
  const oversized = "x".repeat(MAX_REQUEST_BYTES + 1);
  const headerCases: Record<string, string>[] = [{}, { "content-length": "1" }, { "content-length": String(MAX_REQUEST_BYTES + 1) }];
  for (const headers of headerCases) {
    await assert.rejects(readJsonBody(makeRequest(headers, oversized)), (error: unknown) => error instanceof RequestError && error.status === 413);
  }
  await assert.rejects(readJsonBody(makeRequest({}, "{")), (error: unknown) => error instanceof RequestError && error.status === 400);
  assert.deepEqual(await readJsonBody(makeRequest({}, '{"code":"नमस्ते"}')), { code: "नमस्ते" });
});

test("origin checks preserve host, port, and scheme boundaries after framework normalization", () => {
  const env = process.env as Record<string, string | undefined>;
  const original = { NODE_ENV: env.NODE_ENV, CODELENS_ACCESS_TOKEN: env.CODELENS_ACCESS_TOKEN, VERCEL: env.VERCEL };
  try {
    env.NODE_ENV = "development";
    delete env.CODELENS_ACCESS_TOKEN;
    delete env.VERCEL;
    for (const host of ["localhost:3000", "127.0.0.1:3000", "[::1]:3000"]) {
      const url = `http://${host}/api/review`;
      assert.doesNotThrow(() => authorizeAnalysis(new NextRequest(url, { headers: { host, origin: `http://${host}` } })));
    }
    const withHeaders = (headers: Record<string, string>) => new NextRequest("http://127.0.0.1:3000/api/review", { headers: { host: "127.0.0.1:3000", ...headers } });
    for (const origin of ["http://localhost:3000", "http://127.0.0.1:3001", "https://127.0.0.1:3000", "null", "https://evil.example"]) {
      assert.throws(() => authorizeAnalysis(withHeaders({ origin })), (error: unknown) => error instanceof RequestError && error.status === 403);
    }
    // Untrusted forwarding headers cannot turn an external origin into a match.
    assert.throws(() => authorizeAnalysis(withHeaders({ origin: "https://evil.example", "x-forwarded-host": "evil.example", "x-forwarded-proto": "https" })), RequestError);
    const proxied = new Request("http://internal:3000/api/review", { headers: { host: "codelens.example", origin: "https://codelens.example", "x-forwarded-proto": "https" } });
    assert.throws(() => authorizeAnalysis(proxied), RequestError);
    env.VERCEL = "1";
    assert.doesNotThrow(() => authorizeAnalysis(proxied));
    assert.throws(() => authorizeAnalysis(withHeaders({ host: "evil.example/path", origin: "http://evil.example" })), RequestError);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete env[key]; else env[key] = value;
    }
  }
});
