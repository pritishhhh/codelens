import { test, expect } from "@playwright/test";

test("typing keeps the caret aligned with rendered text", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "Code", exact: true });
  await editor.click();
  await editor.pressSequentially("const total = 1234567890;", { delay: 10 });
  await expect(editor).toHaveText("const total = 1234567890;");
  await expect(page.getByText("Ln 1, Col 26", { exact: true })).toBeVisible();
  await expect.poll(async () => editor.evaluate((element) => {
    const selection = window.getSelection();
    if (!selection?.anchorNode) return 1000;
    const range = document.createRange();
    range.setStart(selection.anchorNode, Math.max(0, selection.anchorOffset - 1));
    range.setEnd(selection.anchorNode, selection.anchorOffset);
    const character = range.getBoundingClientRect();
    const cursor = element.closest(".cm-editor")?.querySelector(".cm-cursor")?.getBoundingClientRect();
    return cursor ? Math.abs(cursor.left - character.right) : 1000;
  })).toBeLessThan(2);
});

test("indent, undo, long-line scrolling, and leaving the editor work", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "Code", exact: true });
  await editor.fill("hello");
  await editor.press("End");
  await editor.press("Enter");
  await editor.press("Tab");
  await page.keyboard.insertText("world");
  await expect(editor).toHaveText(/hello\s+world/);
  await editor.press("ControlOrMeta+z");
  await expect(editor).not.toContainText("world");
  await editor.fill("x".repeat(300));
  await editor.press("ControlOrMeta+End");
  await expect.poll(() => page.locator(".cm-scroller").first().evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await editor.press("Escape");
  await editor.press("Tab");
  await expect(editor).not.toBeFocused();
});
