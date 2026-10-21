/**
 * Design-review screenshots (P1.9 and later checkpoints).
 * Usage: start a dev server with a throwaway DATA_DIR, then
 *   npx tsx scripts/screenshots.ts http://localhost:3100 <outDir>
 * Captures: first-run welcome, every shell page in light + dark, collapsed rail, mobile.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3100";
const out = path.resolve(process.argv[3] ?? "screenshots");
fs.mkdirSync(out, { recursive: true });

async function shot(page: Page, name: string, fullPage = false) {
  await page.waitForTimeout(900); // let entrance animations settle
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage });
  console.log("  ✔", name);
}

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate((t) => localStorage.setItem("marsa-theme", t), theme);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("  ✘ pageerror:", e.message));
  page.on("console", (m) => m.type() === "error" && console.log("  ✘ console:", m.text()));

  console.log("Welcome flow");
  await page.goto(`${base}/projects`);
  await page.getByRole("dialog").waitFor();
  await shot(page, "01-welcome-dialog");
  await page.getByLabel("Your name").fill("Layla Mansour");
  await page
    .getByLabel(/Organization/)
    .fill("Northern Gulf Ports Authority — Procurement Directorate");
  await shot(page, "02-welcome-filled");
  await page.getByRole("button", { name: /Enter workspace/ }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });

  for (const theme of ["light", "dark"] as const) {
    console.log(`Pages (${theme})`);
    await setTheme(page, theme);
    for (const [route, name] of [
      ["/projects", "projects"],
      ["/standards", "standards"],
      ["/settings", "settings"],
    ] as const) {
      await page.goto(`${base}${route}`);
      await shot(page, `${theme}-${name}`);
    }
    await page.goto(`${base}/dev/ui`);
    await shot(page, `${theme}-ui-kit-full`, true);
  }

  console.log("Collapsed sidebar + menus");
  await setTheme(page, "light");
  await page.goto(`${base}/projects`);
  await page.keyboard.press("Control+b");
  await shot(page, "light-projects-collapsed");
  await page.keyboard.press("Control+b");
  await page.getByRole("button", { name: /^Account:/ }).click();
  await shot(page, "light-customer-menu");
  await page.keyboard.press("Escape");

  console.log("Mobile 390");
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const m = await mobile.newPage();
  await m.goto(`${base}/projects`);
  await m.evaluate(() => localStorage.setItem("marsa-theme", "light"));
  await m.goto(`${base}/projects`);
  await shot(m, "mobile-projects");
  await m.getByRole("button", { name: "Open navigation" }).click();
  await shot(m, "mobile-drawer");

  await browser.close();
  console.log(`Saved to ${out}`);
})();
