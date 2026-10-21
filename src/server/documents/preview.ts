/**
 * Reader previews for formats the browser can't render natively (P5.6, RDD §8.3):
 * spreadsheets → one table per sheet; CSV/TSV → one table; text formats → plain text.
 * PDFs and images render in the browser; DOCX is rendered client-side with docx-preview.
 */
import ExcelJS from "exceljs";
import { extensionOf } from "../../lib/files";
import { cellText } from "./extract-text";

export interface SheetPreview {
  name: string;
  rows: string[][];
  /** Rows or columns were cut to keep the preview light. */
  truncated: boolean;
}
export type DocumentPreview =
  | { kind: "sheets"; sheets: SheetPreview[] }
  | { kind: "text"; text: string; truncated: boolean }
  | { kind: "none" };

const MAX_ROWS = 1_000;
const MAX_COLS = 50;
const MAX_TEXT = 1_000_000;

export async function buildPreview(fileName: string, bytes: Uint8Array): Promise<DocumentPreview> {
  const ext = extensionOf(fileName);
  if (ext === "xlsx" || ext === "xlsm") return { kind: "sheets", sheets: await xlsxSheets(bytes) };
  if (ext === "csv" || ext === "tsv") {
    const text = decode(bytes);
    const rows = parseDelimited(text, ext === "tsv" ? "\t" : guessDelimiter(text));
    return {
      kind: "sheets",
      sheets: [
        {
          name: fileName.replace(/\.[^.]+$/, ""),
          rows: rows.slice(0, MAX_ROWS).map((r) => r.slice(0, MAX_COLS)),
          truncated: rows.length > MAX_ROWS || rows.some((r) => r.length > MAX_COLS),
        },
      ],
    };
  }
  if (["txt", "md", "json", "xml", "log"].includes(ext)) {
    const text = decode(bytes);
    return { kind: "text", text: text.slice(0, MAX_TEXT), truncated: text.length > MAX_TEXT };
  }
  return { kind: "none" };
}

const decode = (bytes: Uint8Array) => new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "");

async function xlsxSheets(bytes: Uint8Array): Promise<SheetPreview[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(bytes) as unknown as ArrayBuffer);
  const sheets: SheetPreview[] = [];
  wb.eachSheet((ws) => {
    const cols = Math.min(ws.actualColumnCount || ws.columnCount || 0, MAX_COLS);
    const rows: string[][] = [];
    let truncated = (ws.actualColumnCount || 0) > MAX_COLS;
    ws.eachRow({ includeEmpty: false }, (row) => {
      if (rows.length >= MAX_ROWS) {
        truncated = true;
        return;
      }
      const cells: string[] = [];
      for (let c = 1; c <= cols; c++)
        cells.push(cellText(row.getCell(c)).replace(/\s+/g, " ").trim());
      while (cells.length && !cells[cells.length - 1]) cells.pop();
      rows.push(cells);
    });
    sheets.push({ name: ws.name, rows, truncated });
  });
  return sheets;
}

function guessDelimiter(text: string): string {
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const count = (d: string) => first.split(d).length - 1;
  return count(";") > count(",") ? ";" : ",";
}

/** RFC 4180-style parser: quoted fields, doubled quotes, CRLF. */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"' && field === "") quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}
