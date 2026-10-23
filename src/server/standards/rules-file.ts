/**
 * Standard rules from a dropped file (P8 guided form, "New standard"): Excel, CSV/TSV, Word
 * tables and text files are read as `code | rule text | priority` rows, free and exact. A PDF is
 * first read the same way from its text; only when that finds nothing usable does it need the AI
 * (the caller asks the customer first, because that call is paid). No `server-only` (tests).
 */
import { extensionOf } from "../../lib/files";
import { parseRules, parsePriority, type ParseError, type ParsedRule } from "../../lib/rules-parse";
import { extractText } from "../documents/extract-text";
import { readPdfPages } from "../documents/pdf-text";
import { parseDelimited } from "../documents/preview";

export interface RulesFromFile {
  rules: ParsedRule[];
  errors: ParseError[];
  /** The file is a PDF (or similar) whose text gave no rules: AI extraction can be offered. */
  needsAi: boolean;
}

const HEADER = /^(code|id|ref|reference|rule ?(id|no|code)?|no\.?|#)$/i;
const SEPARATOR = /^:?-{3,}:?$/;

/** Table rows (cells) → the paste format the rules parser already validates. */
export function rowsToRules(rows: string[][]): { rules: ParsedRule[]; errors: ParseError[] } {
  const lines: string[] = [];
  for (const raw of rows) {
    const filled = raw.map((c) => c.replace(/\s+/g, " ").trim()).filter(Boolean);
    if (filled.length < 2) continue;
    if (filled.every((c) => SEPARATOR.test(c))) continue;
    // Header rows: "Code | Rule | Priority" and the like.
    if (HEADER.test(filled[0]) && !parsePriority(filled.at(-1) ?? "")) continue;
    if (filled.length === 2 || parsePriority(filled.at(-1)!)) lines.push(filled.join(" | "));
    else lines.push(`${filled[0]} | ${filled.slice(1).join(" ")}`);
  }
  return parseRules(lines.join("\n"));
}

/** Pipe tables from extracted DOCX / XLSX text ("| a | b |"), or plain `a | b | c` lines. */
export function textToRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.replace(/^\|/, "").replace(/\|$/, ""))
    .filter((l) => l.includes("|") || l.includes("\t"))
    .map((l) => (l.includes("\t") ? l.split("\t") : l.split("|")));
}

const PDF_CODE = /(?:^|\n)\s*([A-Z][A-Z0-9]{0,7}-\d{1,3}(?:\.\d+)?)\s+/g;

/** Rules in a PDF's text: each rule code starts a block; a trailing priority word is kept. */
export function pdfTextToRules(pages: string[]): { rules: ParsedRule[]; errors: ParseError[] } {
  const text = pages.join("\n");
  const marks = [...text.matchAll(PDF_CODE)];
  const lines: string[] = [];
  marks.forEach((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < marks.length ? (marks[i + 1].index ?? text.length) : text.length;
    let body = text.slice(start, end).replace(/\s+/g, " ").trim();
    // Running headers / footers ("Page 2 of 4") end up in the last block of a page.
    body = body.replace(/\bPage \d+ of \d+.*$/i, "").trim();
    const prio = body.match(/\s(mandatory|important|desirable)\s*$/i);
    if (prio) body = body.slice(0, prio.index).trim();
    if (body.length < 8) return;
    lines.push(`${m[1]} | ${body.slice(0, 1000)}${prio ? ` | ${prio[1].toLowerCase()}` : ""}`);
  });
  return parseRules(lines.join("\n"));
}

export async function rulesFromFile(name: string, bytes: Uint8Array): Promise<RulesFromFile> {
  const ext = extensionOf(name);
  if (ext === "csv" || ext === "tsv") {
    const text = new TextDecoder("utf-8").decode(bytes).replace(/^﻿/, "");
    const delimiter = ext === "tsv" ? "\t" : text.split("\n")[0].includes(";") ? ";" : ",";
    return { ...rowsToRules(parseDelimited(text, delimiter)), needsAi: false };
  }
  if (["xlsx", "xlsm", "docx", "txt", "md"].includes(ext)) {
    const text = (await extractText(name, bytes)) ?? "";
    const rows = textToRows(text);
    // A text file may be a plain paste block without pipes per row: let the parser decide.
    const parsed = rows.length ? rowsToRules(rows) : parseRules(text);
    return { ...parsed, needsAi: parsed.rules.length === 0 && ext === "docx" };
  }
  if (ext === "pdf") {
    const parsed = pdfTextToRules(await readPdfPages(bytes));
    return { ...parsed, needsAi: parsed.rules.length < 2 };
  }
  return {
    rules: [],
    errors: [{ line: 0, raw: name, message: "Use Excel, CSV, Word, text or PDF." }],
    needsAi: false,
  };
}
