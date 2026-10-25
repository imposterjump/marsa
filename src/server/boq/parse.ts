/**
 * Bill of quantities (BOQ) reader (2026-10-25, building works tenders). Reads a client's BOQ
 * workbook or a bidder's priced copy: items (number, description, unit, quantity, unit rate,
 * amount) under their section headings, and the totals the bidder wrote. Columns are found by
 * their headings, in English or Arabic, so the column order may differ ("م | البنود | الوحدة |
 * الكمية | سعر الوحدة | الإجمالي"). A summary sheet ("ملخص الجدول") gives the project total.
 * Pure: no database; never throws on odd sheets, it just finds no items in them.
 */
import ExcelJS from "exceljs";

export interface BoqItem {
  /** Order in the workbook, across sheets. */
  index: number;
  sheet: string;
  /** The nearest heading above the item ("Demolition Works", "الأعمال المدنية"). */
  section: string;
  /** The item number as written ("1", "1.1"). */
  no: string;
  description: string;
  unit: string;
  qty: number | null;
  rate: number | null;
  /** What was written instead of a rate ("LS", "Included"). */
  rateText: string | null;
  amount: number | null;
  /** What was written instead of an amount. */
  amountText: string | null;
  /**
   * The amount cell is merged with the rows above: one lump-sum price covers the group, written
   * on its first row (Excel repeats it on every merged row; it is counted once).
   */
  inGroup: boolean;
  row: number;
}

export interface BoqTotals {
  total: number | null;
  vat: number | null;
  totalWithVat: number | null;
}

export interface ParsedBoq {
  items: BoqItem[];
  sheets: { name: string; items: number; total: number | null }[];
  /** Totals written in the workbook (the summary sheet's, else the item sheets'). */
  stated: BoqTotals;
  /** The currency named in the headings or total rows, when there is one. */
  currency: string | null;
}

type Field = "no" | "desc" | "unit" | "qty" | "rate" | "amount";

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "") // Arabic diacritics and tatweel
    .replace(/[^\p{L}\p{N}%#]+/gu, " ")
    .trim();

/** Heading patterns, checked in this order (a "Unit Price" column is a rate, not a unit). */
const HEADINGS: [Field, RegExp][] = [
  ["rate", /(unit price|unit rate|^rate|سعر الوحدة|فئة|^السعر$|^سعر$)/],
  ["amount", /(amount|^total|الإجمالي|الاجمالي|المبلغ|القيمة|الجملة)/],
  ["qty", /(qty|quantit|الكمية|الكميات)/],
  ["unit", /^(unit|units|uom|الوحدة|وحدة|الوحده)$/],
  ["desc", /(description|البنود|البيان|الوصف|بيان|^items?$|^البند$)/],
  ["no", /^(s ?no|sr ?no|sl ?no|item ?no|no|#|م|رقم|ت|الرقم|رقم البند|مسلسل)$/],
];

const TOTAL_ROW =
  /(total|sub ?total|grand|الإجمالي|الاجمالي|إجمالي|اجمالي|مجموع|جملة|vat|ضريبة|in words|بالحروف|قدره|قدرة)/i;
const IN_WORDS = /(in words|بالحروف|قدره|قدرة|كتابة)/i;
const VAT = /(vat|ضريبة)/i;
const WITH_VAT = /(with vat|incl|including|شامل|شاملة|بعد الضريبة)/i;
// (These run on normalised text: lower case, no diacritics or tatweel, punctuation as spaces.)

function cellValue(cell: ExcelJS.Cell): unknown {
  const v = cell.value;
  if (v && typeof v === "object") {
    if ("result" in v) return v.result ?? null;
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("text" in v) return v.text;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if ("error" in v) return null;
  }
  return v;
}

function textOf(v: unknown): string {
  if (v == null || v === MERGED) return "";
  return String(v).replace(/\s+/g, " ").trim();
}

/** A number written as a number or as text ("1,250,000", "AED 12,500.50"); null otherwise. */
export function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const s = v
    .replace(/[,\s]/g, "")
    .replace(/^(aed|درهم|usd|\$)/i, "")
    .replace(/(aed|درهم)$/i, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function currencyIn(text: string): string | null {
  if (/\baed\b|درهم/i.test(text)) return "AED";
  if (/\busd\b|\$|دولار/i.test(text)) return "USD";
  return null;
}

/** A merged cell other than the first: it repeats the first cell's value. */
const MERGED = Symbol("merged");

interface Sheet {
  name: string;
  rows: { n: number; cells: unknown[] }[];
}

function readSheets(wb: ExcelJS.Workbook): Sheet[] {
  const out: Sheet[] = [];
  wb.eachSheet((ws) => {
    const rows: Sheet["rows"] = [];
    ws.eachRow({ includeEmpty: false }, (row, n) => {
      const cells: unknown[] = [];
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        cells[col] =
          cell.isMerged && cell.master.address !== cell.address ? MERGED : cellValue(cell);
      });
      rows.push({ n, cells });
    });
    out.push({ name: ws.name, rows });
  });
  return out;
}

function findHeader(sheet: Sheet): { at: number; cols: Partial<Record<Field, number>> } | null {
  for (const row of sheet.rows.slice(0, 25)) {
    const cols: Partial<Record<Field, number>> = {};
    row.cells.forEach((v, col) => {
      const t = norm(textOf(v));
      if (!t || t.length > 40) return;
      for (const [field, re] of HEADINGS) {
        if (cols[field] == null && re.test(t)) {
          cols[field] = col;
          break;
        }
      }
    });
    if (cols.desc != null && (cols.qty != null || cols.amount != null)) return { at: row.n, cols };
  }
  return null;
}

export async function parseBoq(bytes: Uint8Array): Promise<ParsedBoq | null> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(Buffer.from(bytes) as unknown as ArrayBuffer);
  } catch {
    return null;
  }
  const items: BoqItem[] = [];
  const sheets: ParsedBoq["sheets"] = [];
  let summary: BoqTotals | null = null;
  const itemSheetTotals: BoqTotals[] = [];
  let currency: string | null = null;

  for (const sheet of readSheets(wb)) {
    const header = findHeader(sheet);
    if (!header) continue;
    const { cols } = header;
    const headerRow = sheet.rows.find((r) => r.n === header.at);
    currency ??= currencyIn((headerRow?.cells ?? []).map(textOf).join(" "));
    // A summary sheet lists section totals: an amount column but no quantity and no unit.
    const isSummary = cols.qty == null && cols.unit == null;
    const totals: BoqTotals = { total: null, vat: null, totalWithVat: null };
    let section = "";
    let count = 0;
    for (const row of sheet.rows) {
      if (row.n <= header.at) continue;
      const get = (f: Field) => (cols[f] == null ? null : row.cells[cols[f]!]);
      const desc = textOf(get("desc"));
      const no = textOf(get("no"));
      // Normalised: "اجمــــالي" (stretched with tatweel) reads as "اجمالي".
      const rowText = norm(row.cells.map(textOf).filter(Boolean).join(" "));
      const numbers = row.cells.map(toNumber).filter((n): n is number => n !== null);
      let qty = toNumber(get("qty"));
      let unit = textOf(get("unit"));
      // A row with the quantity and the unit swapped ("1 | مقطوعية").
      if (qty === null && unit && toNumber(unit) !== null && cols.qty != null) {
        const q = textOf(get("qty"));
        qty = toNumber(unit);
        unit = q;
      }
      const rateRaw = get("rate");
      const amountRaw = get("amount");
      const rate = toNumber(rateRaw);
      const amount = toNumber(amountRaw);

      if (TOTAL_ROW.test(rowText) && qty === null && (!no || toNumber(no) === null)) {
        currency ??= currencyIn(rowText);
        if (IN_WORDS.test(rowText) && !VAT.test(rowText)) continue;
        const value = amount ?? (numbers.length ? numbers[numbers.length - 1] : null);
        if (value === null) continue;
        if (VAT.test(rowText) && WITH_VAT.test(rowText)) totals.totalWithVat = value;
        else if (VAT.test(rowText)) totals.vat = value;
        else totals.total = value; // the last total row of a sheet is its total
        continue;
      }
      if (isSummary || !desc) continue;
      const priced = qty !== null || amount !== null || rate !== null;
      if (!priced && !/^\d+(\.\d+)*$/.test(no)) {
        section = desc.slice(0, 160); // a heading
        continue;
      }
      items.push({
        index: items.length,
        sheet: sheet.name,
        section,
        no,
        description: desc,
        unit,
        qty,
        rate,
        rateText: rate === null && textOf(rateRaw) ? textOf(rateRaw) : null,
        amount,
        amountText: amount === null && textOf(amountRaw) ? textOf(amountRaw) : null,
        inGroup: amountRaw === MERGED,
        row: row.n,
      });
      count++;
    }
    if (isSummary) summary = totals;
    else {
      sheets.push({ name: sheet.name, items: count, total: totals.total });
      itemSheetTotals.push(totals);
    }
  }
  if (!items.length) return null;

  // The summary sheet's totals; else the only item sheet's; else the sheets' totals added up.
  const one = itemSheetTotals.length === 1 ? itemSheetTotals[0] : null;
  const sum = (key: keyof BoqTotals) =>
    itemSheetTotals.every((t) => t[key] !== null)
      ? itemSheetTotals.reduce((s, t) => s + (t[key] ?? 0), 0)
      : null;
  const stated: BoqTotals = summary?.total
    ? summary
    : (one ?? { total: sum("total"), vat: sum("vat"), totalWithVat: sum("totalWithVat") });
  return { items, sheets, stated, currency };
}
