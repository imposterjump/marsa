/**
 * Tender import (2026-10-25): reads a tender as the e-procurement portal exports it (the
 * Public Works Department's folders) and works out what is what, without changing any file:
 *
 *   <tender>/مستندات الطرح/الخارجية/…              the tender documents sent to bidders → RFP
 *   <tender>/مستندات الطرح/الداخلية/…              internal papers → never imported; the cost
 *                                                    estimate is read from them
 *   <tender>/عطاءات الشركات في محضر الفتح/<co>-<id>/  bids at opening (one folder per company)
 *   <tender>/عطاءات الشركات لمحضر التفاوض/<co>-<id>/  revised bids of the negotiation round
 *   <co>-<id>/supplier.txt                           the company's legal name
 *   <co>-<id>/{BOQ,جدول_الكميات,الكفالة_المصرفية}/…   priced BOQ, bank guarantee → commercial
 *   <co>-<id>/{_,General_Attachments}/…              licence, programme, declaration → technical
 *
 * Zip files are opened in memory (bids often come as one zip), one zip inside another too.
 * Identical files of one company are kept once. English folder names work as well.
 */
import crypto from "node:crypto";
import JSZip from "jszip";
import type {
  TenderImportFileDto,
  TenderImportPreviewDto,
  TenderImportRoundDto,
} from "../../lib/api-types";
import { ApiError } from "../api-errors";
import { readPdfPages } from "../documents/pdf-text";

export interface ImportEntry {
  /** Relative path with "/" separators, the top folder first. */
  path: string;
  size: number;
  read(): Promise<Uint8Array>;
}

export type RoundKey = "opening" | "negotiation" | "bids";

/** Why a file is left out by default (lean import, 2026-10-25); the user can still take it. */
export type LeftOut = "drawing" | "image" | "map" | "permit" | "site_report" | "bank_details";

export interface ScannedFile {
  entry: ImportEntry;
  name: string;
  kind: "commercial" | "technical";
  sha256: string;
  leftOut: LeftOut | null;
}

export interface ScannedVendor {
  folder: string;
  name: string;
  files: ScannedFile[];
  duplicates: number;
}

export interface TenderScan {
  name: string;
  reference: string | null;
  tenderDocs: { entry: ImportEntry; name: string; sha256: string; leftOut: LeftOut | null }[];
  internalDocs: ImportEntry[];
  rounds: { key: RoundKey; vendors: ScannedVendor[] }[];
  estimate: { amount: number; currency: string; source: string } | null;
  ignored: string[];
}

const TENDER_DOCS = /(مستندات الطرح|وثائق المناقصة|tender ?doc|rfp)/i;
const INTERNAL = /(الداخلية|داخلية|internal)/i;
const OPENING = /(محضر الفتح|الفتح|opening)/i;
const NEGOTIATION = /(التفاوض|negotiation)/i;
const BIDS = /(عطاءات|العطاءات|العروض|bids?|offers?|rfq_.*price)/i;
const COMPANY_FOLDER = /-\d{3,}$/;
const COMMERCIAL_SLOT =
  /^(boq|جدول_الكميات|جدول الكميات|الكفالة_المصرفية|الكفالة المصرفية|commercial|financial|price)/i;
const COMMERCIAL_NAME =
  /(boq|كميات|price|priced|سعر|أسعار|عرض_سعر|عرض سعر|commercial|financial|iban|ايبان|bond|كفالة|تأمين|تامين|ضمان|guarantee)/i;
const META = /^(supplier|rfq)\.txt$/i;

// ─── Lean import (user, 2026-10-25: "i dont want the project to take so long to load or be too
// heavy"): what the evaluation does not need stays out unless the user ticks it back in. ───
const CAD = /\.(dwg|dxf|dwf|rvt|rfa|skp|ifc|dgn|nwd|nwc)$/i;
const IMAGE = /\.(jpe?g|png|gif|bmp|tiff?|webp|heic)$/i;
const MAP =
  /(صورة جوية|صور جوية|aerial|خارطة|خريطة|site ?plan|location ?map|\bmap\b|مخطط الموقع|كروكي)/i;
const PERMIT = /(ممانعة|no.?objection|\bnoc\b)/i;
const SITE_REPORT = /(تقرير الزيارة|زيارة موقعية|site ?visit ?report)/i;
const BANK = /(iban|ايبان|آيبان|bank ?account|حساب بنكي|رقم الحساب)/i;
/** Drawing sheets by discipline ("ARC.pdf", "STR.pdf"…), as bidders return them signed. */
const DRAWING_SHEET =
  /^(ac|arc|arch|architectural|drainage|ele|elec|electrical|fire|str|struct|structural|tel|tele|water|mep|hvac|plumbing|lighting|landscape)$/i;
/** A bid's own documents, which stay even as images (a scanned licence, a guarantee photo). */
const BID_DOCUMENT =
  /(كميات|boq|رخصة|ترخيص|licen|كفالة|تأمين|تامين|ضمان|guarantee|bond|برنامج|program|schedule|إقرار|اقرار|declaration)/i;

export function leftOutReason(path: string, role: "tender" | "bid"): LeftOut | null {
  const name = path.split("/").pop() ?? path;
  const stem = name.replace(/\.[^.]+$/, "").trim();
  if (CAD.test(name)) return "drawing";
  if (BANK.test(name)) return "bank_details";
  if (PERMIT.test(name)) return "permit";
  if (SITE_REPORT.test(name)) return "site_report";
  if (MAP.test(name)) return "map";
  if (DRAWING_SHEET.test(stem)) return "drawing";
  if (IMAGE.test(name) && !(role === "bid" && BID_DOCUMENT.test(name))) return "image";
  return null;
}

const basename = (p: string) => p.split("/").pop() ?? p;
const sha = (b: Uint8Array) => crypto.createHash("sha256").update(b).digest("hex");
const text = (b: Uint8Array) => new TextDecoder("utf-8").decode(b).replace(/^﻿/, "").trim();

/** Every file, with the files of zips (and of zips in zips) added under the zip's name. */
async function expand(entries: ImportEntry[], depth = 0): Promise<ImportEntry[]> {
  const out: ImportEntry[] = [];
  for (const e of entries) {
    if (!/\.zip$/i.test(e.path) || depth > 1) {
      out.push(e);
      continue;
    }
    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(await e.read());
    } catch {
      out.push(e); // not a readable zip: imported as a file
      continue;
    }
    const base = e.path.replace(/\.zip$/i, "");
    const inner: ImportEntry[] = Object.values(zip.files)
      .filter((f) => !f.dir && !f.name.startsWith("__MACOSX/"))
      .map((f) => ({
        path: `${base}/${f.name}`,
        size:
          (f as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0,
        read: () => f.async("uint8array"),
      }));
    out.push(...(await expand(inner, depth + 1)));
  }
  // A folder extracted next to its own zip appears twice: keep one of each path.
  const seen = new Set<string>();
  return out.filter((e) => (seen.has(e.path) ? false : (seen.add(e.path), true)));
}

/** The company's name: its supplier.txt, else the folder name without the portal number. */
function companyName(folder: string, supplier: string | null): string {
  if (supplier && supplier.length >= 2) return supplier.replace(/\s+/g, " ").slice(0, 120);
  return basename(folder).replace(COMPANY_FOLDER, "").replace(/[_]+/g, " ").trim() || folder;
}

/** Commercial (prices, bank guarantee) or technical (licence, programme, declaration…). */
export function envelopeOf(slot: string, fileName: string): "commercial" | "technical" {
  if (COMMERCIAL_SLOT.test(slot)) return "commercial";
  if (/^(general_attachments|general attachments)$/i.test(slot) && COMMERCIAL_NAME.test(fileName))
    return "commercial";
  if (/\.xlsx?$/i.test(fileName) && /كميات|boq/i.test(fileName)) return "commercial";
  return "technical";
}

/** The internal approval's amount: the figure that recurs most (≥ 10,000), in AED. */
async function findEstimate(internal: ImportEntry[]) {
  const counts = new Map<number, { n: number; source: string }>();
  const ranked = [...internal].sort(
    (a, b) =>
      +/(اعتماد|الإعتماد|مالي|تكلفة|ميزانية|estimate|budget|financial)/i.test(basename(b.path)) -
      +/(اعتماد|الإعتماد|مالي|تكلفة|ميزانية|estimate|budget|financial)/i.test(basename(a.path)),
  );
  for (const e of ranked) {
    if (!/\.pdf$/i.test(e.path)) continue;
    let pages: string[] = [];
    try {
      pages = await readPdfPages(await e.read());
    } catch {
      continue;
    }
    for (const m of pages.join(" ").matchAll(/\d{1,3}(?:,\d{3})+(?:\.\d+)?/g)) {
      const n = Number(m[0].replace(/,/g, ""));
      if (n < 10_000) continue;
      const c = counts.get(n) ?? { n: 0, source: basename(e.path) };
      c.n++;
      counts.set(n, c);
    }
  }
  const best = [...counts.entries()].sort((a, b) => b[1].n - a[1].n || b[0] - a[0])[0];
  return best ? { amount: best[0], currency: "AED", source: best[1].source } : null;
}

export async function scanTender(input: ImportEntry[]): Promise<TenderScan> {
  const entries = await expand(input.map((e) => ({ ...e, path: e.path.replace(/\\/g, "/") })));
  // The tender: the folder that holds its tender documents. One tender per import.
  const roots = new Set<string>();
  for (const e of entries) {
    const folders = e.path.split("/").slice(0, -1);
    const at = folders.findIndex((s) => TENDER_DOCS.test(s));
    if (at >= 0) roots.add(folders.slice(0, at).join("/"));
  }
  if (roots.size > 1) {
    throw new ApiError(
      400,
      "several_tenders",
      `This folder holds ${roots.size} tenders. Import them one at a time.`,
    );
  }
  const rootSegs = roots.size ? [...roots][0].split("/").filter(Boolean) : [];
  const tops = new Set(entries.map((e) => e.path.split("/")[0]));
  const name =
    [...rootSegs].reverse().find((s) => !/^(المناقصة|المشروع|tender|project)$/i.test(s)) ??
    (tops.size === 1 && entries.some((e) => e.path.includes("/"))
      ? [...tops][0]
      : "Imported tender");
  const ignored: string[] = [];
  const tenderDocs: TenderScan["tenderDocs"] = [];
  const internalDocs: ImportEntry[] = [];
  let reference: string | null = null;

  // Company folders: those holding a supplier.txt, else named "<company>-<portal number>".
  const supplierFolders = new Map<string, string | null>();
  for (const e of entries) {
    if (/(^|\/)supplier\.txt$/i.test(e.path)) {
      const folder = e.path.slice(0, e.path.lastIndexOf("/"));
      supplierFolders.set(folder, text(await e.read()) || null);
    }
    if (/(^|\/)rfq\.txt$/i.test(e.path)) reference ??= text(await e.read()) || null;
  }

  const rounds = new Map<RoundKey, Map<string, ScannedVendor>>();
  for (const e of entries) {
    const segs = e.path.split("/");
    const file = segs[segs.length - 1];
    const folders = segs.slice(0, -1);
    if (META.test(file)) continue;
    const tenderAt = folders.findIndex((s) => TENDER_DOCS.test(s));
    const bidsAt = folders.findIndex((s) => BIDS.test(s) || OPENING.test(s) || NEGOTIATION.test(s));
    if (tenderAt >= 0 && (bidsAt < 0 || tenderAt < bidsAt)) {
      if (folders.slice(tenderAt + 1).some((s) => INTERNAL.test(s))) internalDocs.push(e);
      else {
        const bytes = await e.read();
        tenderDocs.push({
          entry: e,
          name: file,
          sha256: sha(bytes),
          leftOut: leftOutReason(e.path, "tender"),
        });
      }
      continue;
    }
    if (bidsAt < 0) {
      ignored.push(e.path);
      continue;
    }
    const roundName = folders[bidsAt];
    const key: RoundKey = NEGOTIATION.test(roundName)
      ? "negotiation"
      : OPENING.test(roundName)
        ? "opening"
        : "bids";
    // The company folder: the deepest ancestor with a supplier.txt, else "<name>-<number>".
    let companyAt = -1;
    for (let i = folders.length; i > bidsAt; i--) {
      if (supplierFolders.has(folders.slice(0, i).join("/"))) {
        companyAt = i - 1;
        break;
      }
    }
    if (companyAt < 0)
      companyAt = folders.findIndex((s, i) => i > bidsAt && COMPANY_FOLDER.test(s));
    if (companyAt < 0) {
      ignored.push(e.path);
      continue;
    }
    const folder = folders.slice(0, companyAt + 1).join("/");
    const vendors = rounds.get(key) ?? new Map<string, ScannedVendor>();
    rounds.set(key, vendors);
    const v = vendors.get(folder) ?? {
      folder,
      name: companyName(folder, supplierFolders.get(folder) ?? null),
      files: [],
      duplicates: 0,
    };
    vendors.set(folder, v);
    const bytes = await e.read();
    const hash = sha(bytes);
    const slot = folders[companyAt + 1] ?? "";
    const kept = v.files.find((f) => f.sha256 === hash);
    if (kept) {
      // The same file in a price slot too: it belongs in the commercial envelope.
      if (envelopeOf(slot, file) === "commercial") kept.kind = "commercial";
      v.duplicates++;
      continue;
    }
    v.files.push({
      entry: e,
      name: file,
      kind: envelopeOf(slot, file),
      sha256: hash,
      leftOut: leftOutReason(e.path, "bid"),
    });
  }

  // Identical tender documents (a copy in two folders) once.
  const seenDocs = new Set<string>();
  const docs = tenderDocs.filter((d) =>
    seenDocs.has(d.sha256) ? false : (seenDocs.add(d.sha256), true),
  );
  const order: RoundKey[] = ["opening", "negotiation", "bids"];
  return {
    name,
    reference,
    tenderDocs: docs,
    internalDocs,
    rounds: order
      .filter((k) => rounds.has(k))
      .map((key) => ({
        key,
        vendors: [...rounds.get(key)!.values()].filter((v) => v.files.length),
      })),
    // The internal approval first; else a cover memo sent with the tender documents (its text
    // carries the approved cost when the internal papers are scans).
    estimate:
      (await findEstimate(internalDocs)) ??
      (await findEstimate(
        docs
          .map((d) => d.entry)
          .filter((e) => /(مذكرة|memo|اعتماد|الإعتماد|مالي)/i.test(basename(e.path))),
      )),
    ignored,
  };
}

const fileDto = (
  path: string,
  size: number,
  leftOut: LeftOut | null,
  kind?: "commercial" | "technical",
): TenderImportFileDto => ({
  name: basename(path),
  path,
  size,
  kind: kind ?? null,
  include: leftOut === null,
  leftOut,
});

export function previewOf(id: string, scan: TenderScan): TenderImportPreviewDto {
  return {
    id,
    name: scan.name,
    reference: scan.reference,
    tenderDocuments: scan.tenderDocs.map((d) => fileDto(d.entry.path, d.entry.size, d.leftOut)),
    internalDocuments: scan.internalDocs.map((d) => ({
      ...fileDto(d.path, d.size, null),
      include: false,
    })),
    estimate: scan.estimate,
    rounds: scan.rounds.map((r): TenderImportRoundDto => ({
      key: r.key,
      vendors: r.vendors.map((v) => ({
        folder: v.folder,
        name: v.name,
        duplicates: v.duplicates,
        files: v.files.map((f) => fileDto(f.entry.path, f.entry.size, f.leftOut, f.kind)),
      })),
    })),
    ignored: scan.ignored,
  };
}
