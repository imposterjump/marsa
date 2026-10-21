/**
 * HTML → PDF / PNG via headless Chromium (Playwright). Produces real, text-selectable,
 * multi-page PDFs with running headers/footers — like documents a port authority would issue.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser } from "@playwright/test";

let browser: Browser | null = null;
async function getBrowser() {
  browser ??= await chromium.launch();
  return browser;
}
export async function closeBrowser() {
  await browser?.close();
  browser = null;
}

export interface PdfOptions {
  /** Left part of the running header, e.g. "NGPA/T/2026/014 · Request for Proposal". */
  headerLeft: string;
  /** Right part of the running header, e.g. "Northern Gulf Ports Authority". */
  headerRight: string;
  /** Footer note (left), page numbers are added on the right. */
  footerLeft?: string;
  landscape?: boolean;
}

export async function htmlToPdf(html: string, outFile: string, opts: PdfOptions) {
  const b = await getBrowser();
  const page = await b.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const small =
    "font-family:Arial,Helvetica,sans-serif;font-size:7.5px;color:#5c6774;width:100%;padding:0 16mm;display:flex;justify-content:space-between;";
  await page.pdf({
    path: outFile,
    format: "A4",
    landscape: opts.landscape,
    printBackground: true,
    displayHeaderFooter: true,
    margin: { top: "22mm", bottom: "20mm", left: "16mm", right: "16mm" },
    headerTemplate: `<div style="${small}"><span>${opts.headerLeft}</span><span>${opts.headerRight}</span></div>`,
    footerTemplate: `<div style="${small}"><span>${opts.footerLeft ?? "SAMPLE — fictional tender created for software testing. Not a real procurement."}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
  });
  await page.close();
}

export async function htmlToPng(
  html: string,
  outFile: string,
  size: { width: number; height: number },
  scale = 2,
) {
  const b = await getBrowser();
  const page = await b.newPage({ viewport: size, deviceScaleFactor: scale });
  await page.setContent(html, { waitUntil: "load" });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  await page.screenshot({ path: outFile, fullPage: false });
  await page.close();
}

/** Shared print stylesheet for authority documents. */
export const DOC_CSS = `
  @page { size: A4; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; color: #1b2733; font-size: 10.2pt; line-height: 1.5; margin: 0; }
  .watermark { position: fixed; top: 42%; left: 4%; width: 92%; text-align: center; transform: rotate(-28deg);
    font-size: 64pt; font-weight: 800; color: rgba(19, 48, 77, 0.045); letter-spacing: 6px; z-index: -1; }
  h1 { font-size: 20pt; color: #13304d; margin: 0 0 6pt; line-height: 1.2; }
  h2 { font-size: 13.5pt; color: #13304d; margin: 18pt 0 6pt; padding-bottom: 3pt; border-bottom: 1.2pt solid #0e7c7b; page-break-after: avoid; }
  h3 { font-size: 11pt; color: #13304d; margin: 12pt 0 4pt; page-break-after: avoid; }
  p { margin: 0 0 6pt; text-align: justify; }
  .clause { display: flex; gap: 8pt; margin: 0 0 6pt; text-align: justify; }
  .clause > .no { flex: 0 0 34pt; font-weight: 600; color: #13304d; }
  .clause > .tx { flex: 1; }
  .tag { display: inline-block; font-size: 7.5pt; font-weight: 700; padding: 0 4pt; border-radius: 3pt; margin-left: 3pt; vertical-align: 1px; }
  .M { background: #fbe9e7; color: #a12a20; } .I { background: #fcf1de; color: #8a4f00; } .D { background: #e6eef8; color: #1f5fa8; }
  table { width: 100%; border-collapse: collapse; margin: 6pt 0 10pt; font-size: 9pt; page-break-inside: auto; }
  th { background: #13304d; color: #fff; text-align: left; padding: 4pt 6pt; font-weight: 600; }
  td { border-bottom: 0.6pt solid #d6d1c6; padding: 4pt 6pt; vertical-align: top; }
  tr:nth-child(even) td { background: #f7f6f3; }
  tr { page-break-inside: avoid; }
  .note { border-left: 3pt solid #0e7c7b; background: #eef7f6; padding: 6pt 9pt; margin: 6pt 0 10pt; font-size: 9.2pt; }
  .warn { border-left: 3pt solid #a15c00; background: #fcf6ea; padding: 6pt 9pt; margin: 6pt 0 10pt; font-size: 9.2pt; }
  .small { font-size: 8.5pt; color: #5c6774; }
  .pb { page-break-before: always; }
  .cover { height: 245mm; display: flex; flex-direction: column; justify-content: space-between; }
  .cover .band { background: linear-gradient(135deg, #13304d, #0e7c7b); color: #fff; padding: 22pt 24pt; border-radius: 6pt; }
  .cover .band h1 { color: #fff; font-size: 24pt; }
  .kv { width: 100%; font-size: 9.5pt; } .kv td { border: none; padding: 2pt 0; background: none !important; } .kv td:first-child { color: #5c6774; width: 38%; }
  .toc div { display: flex; justify-content: space-between; border-bottom: 0.5pt dotted #b8b2a6; padding: 2pt 0; font-size: 9.5pt; }
  .sig { margin-top: 18pt; display: flex; gap: 30pt; } .sig div { flex: 1; border-top: 0.8pt solid #1b2733; padding-top: 4pt; font-size: 8.5pt; color: #5c6774; }
`;

export function tag(level: "M" | "I" | "D") {
  const label = { M: "MANDATORY", I: "IMPORTANT", D: "DESIRABLE" }[level];
  return `<span class="tag ${level}">${label}</span>`;
}

export function clause(no: string, text: string) {
  return `<div class="clause"><div class="no">${no}</div><div class="tx">${text}</div></div>`;
}

export function doc(body: string, title: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>${DOC_CSS}</style></head><body><div class="watermark">SAMPLE · FICTIONAL</div>${body}</body></html>`;
}
