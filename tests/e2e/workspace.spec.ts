import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("formatting is undoable, syntax errors preserve code, and source downloads keep the language", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "Code", exact: true });
  const tools = page.getByRole("group", { name: "Code tools", exact: true });
  await editor.fill("const x={a:1}");
  await tools.getByRole("button", { name: "Format", exact: true }).click();
  await expect(editor).toHaveText("const x = { a: 1 };");
  await editor.focus();
  await editor.press("ControlOrMeta+z");
  await expect(editor).toHaveText("const x={a:1}");
  await editor.fill("const =");
  await tools.getByRole("button", { name: "Format", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Could not format" })).toBeVisible();
  await expect(editor).toHaveText("const =");
  await page.locator("#language").selectOption("typescript");
  const downloadPromise = page.waitForEvent("download");
  await tools.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("code-editor.ts");
  expect(await readFile((await download.path())!, "utf8")).toBe("const =");
  await tools.getByRole("button", { name: "Wrap lines" }).click();
  await expect(editor).toHaveClass(/cm-lineWrapping/);
  await page.getByLabel("Code font size", { exact: true }).selectOption("18");
  await expect(editor).toHaveCSS("font-size", "18px");
});

test("sample review and comparison work without contacting AI and exports identify samples", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/**", (route) => { requests += 1; return route.abort(); });
  await page.goto("/");
  await page.getByRole("button", { name: "View sample review", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Sample report" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Code", exact: true })).toContainText("user!.name");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  expect(JSON.parse(await readFile((await download.path())!, "utf8")).source).toBe("sample");
  await page.getByRole("tab", { name: "Compare", exact: true }).click();
  await page.getByRole("button", { name: "View sample comparison", exact: true }).click();
  await expect(page.getByText("Solution B wins")).toBeVisible();
  await expect(page.getByRole("region", { name: "Source differences" })).toContainText("new Set");
  expect(requests).toBe(0);
});

test("draft saving is opt-in and disabling it removes stored source", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "Code", exact: true });
  const save = page.getByLabel("Save draft on this device", { exact: true });
  await expect(save).not.toBeChecked();
  await editor.fill("const privateDraft = 1;");
  expect(await page.evaluate(() => localStorage.getItem("codelens:review-draft:v1"))).toBeNull();
  await save.check();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("codelens:review-draft:v1"))).toContain("privateDraft");
  await save.uncheck();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("codelens:review-draft:v1"))).toBeNull();
  await expect(editor).toHaveText("const privateDraft = 1;");
  await page.reload();
  await expect(editor.locator(".cm-placeholder")).toBeVisible();
  await expect(page.getByRole("button", { name: "Review Code", exact: true })).toBeDisabled();
});

test("deployment access code is sent only with analysis and is not persisted", async ({ page }) => {
  let authorization = "";
  await page.route("**/api/review", (route) => {
    authorization = route.request().headers().authorization;
    return route.fulfill({ json: { overallScore: 90, summary: "Reviewed with access.", issues: [] } });
  });
  await page.goto("/");
  await page.getByText("Live AI access", { exact: false }).first().click();
  await page.getByLabel("Deployment access code", { exact: true }).fill("synthetic-private-code");
  await page.getByRole("button", { name: "Load example", exact: true }).click();
  await page.getByRole("button", { name: "Review Code", exact: true }).click();
  await expect(page.getByText("Reviewed with access.")).toBeVisible();
  expect(authorization).toBe("Bearer synthetic-private-code");
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain("synthetic-private-code");
  await page.reload();
  await expect(page.getByLabel("Deployment access code", { exact: true })).toHaveValue("");
});
