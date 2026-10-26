import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const review = {
  overallScore: 70, summary: "Handle edge cases and improve naming.",
  issues: [
    { line: 3, severity: "major", category: "bug", description: "Handle empty input.", suggestedFix: "if (!values.length) return 0;" },
    { line: 3, severity: "style", category: "readability", description: "Choose a clear name.", suggestedFix: "const count = 1;" },
  ],
};
const comparison = {
  winner: "solutionB", summary: "Solution B avoids repeated searches.", reasoning: "A set removes duplicates in one pass.",
  solutionA: { score: 70, strengths: ["Readable"], weaknesses: ["Repeated linear searches"] },
  solutionB: { score: 90, strengths: ["Efficient"], weaknesses: ["Uses extra memory"] },
};

test("drafts survive mode changes and reload; comparison examples can be swapped", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Save draft on this device", { exact: true }).check();
  const code = page.getByRole("textbox", { name: "Code", exact: true });
  await code.fill("const saved = 42;");
  await page.getByRole("tab", { name: "Compare", exact: true }).click();
  await page.getByLabel("Save comparison on this device", { exact: true }).check();
  await page.getByRole("button", { name: "Load examples", exact: true }).click();
  const a = page.getByRole("textbox", { name: "Solution A", exact: true });
  const b = page.getByRole("textbox", { name: "Solution B", exact: true });
  await expect(a).toContainText("filter");
  await expect(b).toContainText("Set");
  await page.getByRole("button", { name: "Swap solutions" }).click();
  await expect(a).toContainText("Set");
  await page.getByRole("tab", { name: "Review", exact: true }).click();
  await expect(code).toHaveText("const saved = 42;");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("codelens:review-draft:v1"))).toContain("const saved");
  await page.reload();
  await expect(code).toHaveText("const saved = 42;");
  await page.getByRole("tab", { name: "Compare", exact: true }).click();
  await expect(a).toContainText("Set");
});

test("imports detect language and oversized files preserve the current draft", async ({ page }) => {
  await page.goto("/");
  const upload = page.locator('input[type="file"][aria-label="Import file"]');
  await upload.setInputFiles({ name: "demo.tsx", mimeType: "text/plain", buffer: Buffer.from("const Title = () => <h1>Hello</h1>;\r\n") });
  await expect(page.locator("#language")).toHaveValue("typescript");
  const code = page.getByRole("textbox", { name: "Code", exact: true });
  await expect(code).toContainText("const Title");
  await upload.setInputFiles({ name: "large.js", mimeType: "text/plain", buffer: Buffer.from("x".repeat(10_001)) });
  await expect(page.getByRole("alert").filter({ hasText: "10,000 character limit" })).toBeVisible();
  await expect(code).toContainText("const Title");
});

test("review preserves blank lines, filters issues, toggles fixes, and exports reports", async ({ page }) => {
  let submittedCode = "";
  await page.route("**/api/review", async (route) => {
    submittedCode = route.request().postDataJSON().code;
    await route.fulfill({ json: review });
  });
  await page.goto("/");
  await page.getByLabel("Save draft on this device", { exact: true }).check();
  const code = "\n\n  const x = 1;";
  const editor = page.getByRole("textbox", { name: "Code", exact: true });
  await page.locator('input[type="file"][aria-label="Import file"]').setInputFiles({
    name: "source.js", mimeType: "text/plain", buffer: Buffer.from(code),
  });
  await expect.poll(() => page.evaluate(() => {
    const draft = localStorage.getItem("codelens:review-draft:v1");
    return draft ? JSON.parse(draft).code : "";
  })).toBe(code);
  await editor.focus();
  await editor.press("ControlOrMeta+Enter");
  await expect(page.getByText(review.summary)).toBeVisible();
  expect(submittedCode).toBe(code);
  await expect(page.getByText("major", { exact: true })).toHaveCSS("color", "rgb(251, 146, 60)");
  await page.getByRole("button", { name: "bug", exact: true }).click();
  await expect(page.getByText("Showing 1 of 2 issues")).toBeVisible();
  await expect(page.getByText("Choose a clear name.", { exact: true })).not.toBeVisible();
  await page.getByRole("switch", { name: "Diff view" }).click();
  await expect(page.getByText("Showing original lines struck through", { exact: false })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Markdown" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("codelens-review.md");
  const markdown = await readFile((await download.path())!, "utf8");
  expect(markdown).toContain(code);
  expect(markdown).toContain("Line 3");
  expect(markdown).toContain("Choose a clear name.");
  await page.getByLabel("Search issues").fill("no match");
  await expect(page.getByText("No issues match your filters.")).toBeVisible();
});

test("comparison displays the winner and exports both solutions", async ({ page }) => {
  await page.route("**/api/compare", (route) => route.fulfill({ json: comparison }));
  await page.goto("/");
  await page.getByRole("tab", { name: "Compare", exact: true }).click();
  await page.getByRole("button", { name: "Load examples" }).click();
  await page.getByRole("button", { name: "Compare Solutions", exact: true }).click();
  await expect(page.getByText("Solution B wins")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  const report = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(report.result.winner).toBe("solutionB");
  expect(report.solutionA).toContain("filter");
  expect(report.solutionB).toContain("Set");
});

test("failed requests can be retried with the same code", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/review", (route) => {
    attempts += 1;
    return route.fulfill(attempts === 1
      ? { status: 503, json: { error: "Temporarily unavailable." } }
      : { json: { ...review, issues: [] } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Load example", exact: true }).click();
  await page.getByRole("button", { name: "Review Code", exact: true }).click();
  await expect(page.getByRole("region", { name: "Results" }).getByRole("alert")).toContainText("Temporarily unavailable.");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText(review.summary)).toBeVisible();
  expect(attempts).toBe(2);
});

test("switching modes cancels pending work and ignores a late result", async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/review", async (route) => {
    await pending;
    await route.fulfill({ json: review }).catch(() => {});
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Load example", exact: true }).click();
  await page.getByRole("button", { name: "Review Code", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cancel analysis" })).toBeVisible();
  await page.getByRole("tab", { name: "Compare", exact: true }).click();
  release();
  await expect(page.getByRole("button", { name: "Cancel analysis" })).not.toBeVisible();
  await expect(page.getByText(review.summary)).not.toBeVisible();
  await page.getByRole("tab", { name: "Review", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Code", exact: true })).toContainText("getActiveUsers");
  await expect(page.getByText(review.summary)).not.toBeVisible();
});

test("storage restrictions do not break typing or cause hydration errors", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("Storage disabled"); };
    Storage.prototype.setItem = () => { throw new DOMException("Storage disabled"); };
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("textbox", { name: "Code", exact: true }).fill("const x = 1;");
  await expect(page.getByText("Draft storage unavailable; keep a copy before closing.", { exact: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile layout contains long code and tabs work with the keyboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Code", exact: true }).fill("x".repeat(300));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const reviewTab = page.getByRole("tab", { name: "Review", exact: true });
  await reviewTab.focus();
  await reviewTab.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Compare", exact: true })).toBeFocused();
  await expect(page.getByRole("tabpanel", { name: "Compare", exact: true })).toBeVisible();
});
