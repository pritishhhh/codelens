import { chromium } from "@playwright/test";

// Run against a local production server: npm start, then npm run screenshot.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  const configuration = page.waitForResponse((response) => response.url().endsWith("/api/config"));
  await page.goto("http://127.0.0.1:3000");
  await configuration;
  await page.getByRole("button", { name: "View sample review", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Sample report" }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "docs/preview.png", fullPage: true, animations: "disabled" });
  await page.getByRole("tab", { name: "Compare", exact: true }).click();
  await page.getByRole("button", { name: "View sample comparison", exact: true }).click();
  await page.getByText("Solution B wins").waitFor();
  await page.screenshot({ path: "docs/comparison.png", fullPage: true, animations: "disabled" });
  console.log("Captured review and comparison previews using curated samples.");
} finally {
  await browser.close();
}
