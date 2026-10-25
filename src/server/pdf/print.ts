/**
 * HTML → PDF with the Chromium that Playwright installed (`npx playwright install chromium`), for
 * the consultant reports (reports/pdf.ts). One browser per call; `withBrowser` lets a caller print
 * several times (e.g. to fit a page count) without starting Chromium again.
 */
import "server-only";
import type { Browser } from "playwright-core";

export interface PrintOptions {
  margin?: { top: string; right: string; bottom: string; left: string };
  /** Chromium header/footer templates (system fonts only; `pageNumber`, `totalPages` classes). */
  headerTemplate?: string;
  footerTemplate?: string;
  /** 0.1–2; below 1 shrinks the content to fit fewer pages. */
  scale?: number;
}

export type Print = (html: string, opts?: PrintOptions) => Promise<Uint8Array>;

export async function withBrowser<T>(fn: (print: Print) => Promise<T>): Promise<T> {
  const { chromium } = await import("playwright-core");
  let browser: Browser;
  try {
    browser = await chromium.launch();
  } catch {
    throw new Error(
      "PDF rendering needs Chromium. Install it once with: npx playwright install chromium",
    );
  }
  try {
    const page = await browser.newPage();
    return await fn(async (html, opts = {}) => {
      await page.setContent(html, { waitUntil: "load" });
      await page.emulateMedia({ media: "print" });
      const withFrame = Boolean(opts.headerTemplate || opts.footerTemplate);
      return new Uint8Array(
        await page.pdf({
          format: "A4",
          printBackground: true,
          margin: opts.margin,
          scale: opts.scale,
          displayHeaderFooter: withFrame,
          headerTemplate: withFrame ? (opts.headerTemplate ?? "<span></span>") : undefined,
          footerTemplate: withFrame ? (opts.footerTemplate ?? "<span></span>") : undefined,
        }),
      );
    });
  } finally {
    await browser.close();
  }
}
