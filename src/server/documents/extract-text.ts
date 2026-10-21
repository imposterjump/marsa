/**
 * Plain-text extraction for formats Claude can't take as a native document (RDD §5.1/§5.2):
 * DOCX → Markdown-like text (headings, lists, tables kept as pipe rows), XLSX → one block per
 * sheet with pipe-separated rows (formula results, not formulas), text formats → UTF-8.
 * PDFs and images are sent to Claude natively, so they return null here.
 */
import ExcelJS from "exceljs";
import { extensionOf } from "../../lib/files";

export const TEXT_CONTENT_MAX = 2_000_000; // characters; larger documents are truncated with a note

export async function extractText(fileName: string, bytes: Uint8Array): Promise<string | null> {
  const ext = extensionOf(fileName);
  let text: string | null = null;
  if (ext === "docx") text = await docxToText(bytes);
  else if (ext === "xlsx" || ext === "xlsm") text = await xlsxToText(bytes);
  else if (["txt", "md", "csv", "tsv", "json", "xml"].includes(ext)) text = new TextDecoder("utf-8").decode(bytes);
  if (text && text.length > TEXT_CONTENT_MAX) {
    text = `${text.slice(0, TEXT_CONTENT_MAX)}\n\n[… truncated: document longer than ${TEXT_CONTENT_MAX.toLocaleString()} characters]`;
  }
  return text?.trim() || null;
}

async function docxToText(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("mammoth");
  const { value: html } = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) });
  return htmlToText(html);
}

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .trim();

/** mammoth emits a small, clean tag set (p, h1–h6, strong, em, ul/ol/li, table, a, br). */
export function htmlToText(html: string): string {
  let out = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<table[\s\S]*?<\/table>/gi, (table) => {
      const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((r) =>
        [...r[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => decode(c[1]).replace(/\|/g, "/")),
      );
      if (rows.length === 0) return "";
      const lines = rows.map((cells) => `| ${cells.join(" | ")} |`);
      lines.splice(1, 0, `|${rows[0].map(() => " --- ").join("|")}|`);
      return `\n\n${lines.join("\n")}\n\n`;
    })
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, n, t) => `\n\n${"#".repeat(Number(n))} ${decode(t)}\n\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, t) => `\n- ${decode(t)}`)
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, t) => `\n${decode(t)}\n`);
  out = decode(out.replace(/\n/g, "\u0000")).replace(/\u0000/g, "\n"); // strip leftover tags, keep newlines
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

async function xlsxToText(bytes: Uint8Array): Promise<string> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(bytes) as unknown as ArrayBuffer);
  const blocks: string[] = [];
  wb.eachSheet((ws) => {
    const lines: string[] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        cells.push(cellText(cell).replace(/\|/g, "/").replace(/\s+/g, " ").trim());
      });
      while (cells.length && !cells[cells.length - 1]) cells.pop();
      if (cells.some(Boolean)) lines.push(`| ${cells.join(" | ")} |`);
    });
    if (lines.length) blocks.push(`## Sheet: ${ws.name}\n\n${lines.join("\n")}`);
  });
  return blocks.join("\n\n");
}

function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v == null) return "";
  if (typeof v === "object") {
    if ("result" in v && v.result != null) return String(v.result); // formula → computed value
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("text" in v) return String(v.text);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  return cell.text ?? String(v);
}
