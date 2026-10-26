import { test, expect } from "@playwright/test";

test("same-origin browser posts reach the real API and other origins are rejected", async ({ page, request }) => {
  await page.goto("/");
  for (const path of ["/api/review", "/api/compare"]) {
    // Deliberately avoid route mocking: NextRequest rewrites loopback URLs.
    // An empty object cannot reach the paid provider, even with credentials set.
    const result = await page.evaluate(async (endpoint) => {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      return { status: response.status, body: await response.json() as { error: string } };
    }, path);
    expect([400, 401, 503]).toContain(result.status);
    expect(result.body.error).not.toContain("Cross-origin");
    const blocked = await request.post(path, { headers: { Origin: "https://another.example" }, data: {} });
    expect(blocked.status()).toBe(403);
  }
});
