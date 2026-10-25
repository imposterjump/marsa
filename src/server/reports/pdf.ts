/**
 * The consultant report PDF (2026-10-25): laid out from the report on its step, printed by
 * Chromium, shrunk a little when the text would spill onto a third page, and kept on disk under
 * `reports/<run>/` until the report changes (its step's finish time is in the file name).
 */
import "server-only";
import fsp from "node:fs/promises";
import path from "node:path";
import type { Db } from "../db/connect";
import { pdfPageCount } from "../documents/pdf-text";
import { withBrowser } from "../pdf/print";
import type { LocalStorage } from "../storage/local";
import { APP_NAME, APP_NAME_AR } from "../../lib/brand";
import type { ReportLanguage } from "../../lib/domain";
import { reportFooter, reportHtml, type ReportAssets, type ReportView } from "./html";
import { buildReportView } from "./view";

/** Bump when the layout changes, so cached PDFs are laid out again. */
const LAYOUT_VERSION = "v3"; // v3: the Arabic report names the product ميزان
const MAX_PAGES = 2;
const SCALES = [1, 0.94, 0.88, 0.82];

async function dataUri(file: string, mime: string): Promise<string | null> {
  try {
    return `data:${mime};base64,${(await fsp.readFile(file)).toString("base64")}`;
  } catch {
    return null;
  }
}

let assets: Promise<ReportAssets> | null = null;
/** The app's fonts and the emblem, embedded so the PDF looks the same on every machine. */
function loadAssets(): Promise<ReportAssets> {
  assets ??= (async () => {
    const root = process.cwd();
    const fonts = path.join(/*turbopackIgnore: true*/ root, "node_modules", "@fontsource-variable");
    return {
      latinFont: await dataUri(
        path.join(fonts, "hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2"),
        "font/woff2",
      ),
      arabicFont: await dataUri(
        path.join(fonts, "noto-sans-arabic/files/noto-sans-arabic-arabic-wght-normal.woff2"),
        "font/woff2",
      ),
      emblem: await dataUri(
        path.join(/*turbopackIgnore: true*/ root, "public", "brand", "sharjah-emblem.png"),
        "image/png",
      ),
    };
  })();
  return assets;
}

/** Print the report, smaller step by step until it fits on two pages. */
export async function renderReportPdf(view: ReportView): Promise<Uint8Array> {
  const html = reportHtml(view, await loadAssets());
  return withBrowser(async (print) => {
    let pdf: Uint8Array = new Uint8Array();
    for (const scale of SCALES) {
      pdf = await print(html, {
        scale,
        margin: { top: "12mm", right: "14mm", bottom: "14mm", left: "14mm" },
        footerTemplate: reportFooter(view),
      });
      if ((await pdfPageCount(pdf)) <= MAX_PAGES) break;
    }
    return pdf;
  });
}

const inFlight = new Map<string, Promise<Uint8Array>>();

export async function getReportPdf(
  db: Db,
  storage: LocalStorage,
  runId: string,
  proposalId: string,
  lang?: ReportLanguage,
): Promise<{ bytes: Uint8Array; filename: string }> {
  const { view, stamp } = buildReportView(db, runId, proposalId, lang);
  const key = storage.buildPath(
    ["reports", runId],
    `${proposalId}-${LAYOUT_VERSION}-${stamp.replace(/[^0-9A-Za-z]/g, "")}`,
    "pdf",
  );
  const filename =
    view.language === "ar"
      ? `تقرير ${APP_NAME_AR} - ${view.project.code} - ${view.vendor.name}.pdf`
      : `${APP_NAME} report - ${view.project.code} - ${view.vendor.name}.pdf`;
  if (await storage.exists(key)) return { bytes: await storage.read(key), filename };
  // View and Download at once (or pdf.js retrying) render the PDF only once.
  let job = inFlight.get(key);
  if (!job) {
    job = renderReportPdf(view)
      .then(async (bytes) => {
        await storage.save(key, bytes);
        return bytes;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, job);
  }
  return { bytes: await job, filename };
}
