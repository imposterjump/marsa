/**
 * Detect a file's real format from its first bytes (never trust the browser's MIME type)
 * and check it matches the extension. Pure — unit-tested in tests/unit/ingest.test.ts.
 */
import { extensionOf } from "../../lib/files";

export type Signature =
  | "pdf"
  | "png"
  | "jpeg"
  | "gif"
  | "webp"
  | "tiff"
  | "bmp"
  | "zip"
  | "ole"
  | "rtf"
  | "text"
  | "unknown";

const startsWith = (b: Uint8Array, bytes: number[], offset = 0) =>
  bytes.every((v, i) => b[offset + i] === v);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

export function sniff(bytes: Uint8Array): Signature {
  const head = bytes.subarray(0, 1024);
  if (indexOf(head, ascii("%PDF-")) >= 0) return "pdf";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, ascii("GIF87a")) || startsWith(bytes, ascii("GIF89a"))) return "gif";
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) return "webp";
  if (startsWith(bytes, [0x49, 0x49, 0x2a, 0x00]) || startsWith(bytes, [0x4d, 0x4d, 0x00, 0x2a]))
    return "tiff";
  if (startsWith(bytes, ascii("BM"))) return "bmp";
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return "zip";
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "ole";
  if (startsWith(bytes, ascii("{\\rtf"))) return "rtf";
  if (looksLikeText(bytes.subarray(0, 8192))) return "text";
  return "unknown";
}

function indexOf(hay: Uint8Array, needle: number[]): number {
  outer: for (let i = 0; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

function looksLikeText(b: Uint8Array): boolean {
  if (b.length === 0) return false;
  if (b.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(b.length === 8192 ? trimPartialUtf8(b) : b);
    return true;
  } catch {
    return false;
  }
}

/** Don't fail UTF-8 validation because the 8 KB window cut a multi-byte character. */
function trimPartialUtf8(b: Uint8Array): Uint8Array {
  let end = b.length;
  for (let i = 1; i <= 3 && end - i >= 0; i++) {
    const c = b[end - i];
    if ((c & 0xc0) === 0x80) continue; // continuation byte
    if ((c & 0xc0) === 0xc0) end = end - i; // lead byte of a cut sequence
    break;
  }
  return b.subarray(0, end);
}

/** Which signatures are acceptable for an extension (absent = no content check). */
const EXPECTED: Record<string, Signature[]> = {
  pdf: ["pdf"],
  png: ["png"],
  jpg: ["jpeg"],
  jpeg: ["jpeg"],
  gif: ["gif"],
  webp: ["webp"],
  tif: ["tiff"],
  tiff: ["tiff"],
  bmp: ["bmp"],
  docx: ["zip"],
  xlsx: ["zip"],
  xlsm: ["zip"],
  pptx: ["zip"],
  odt: ["zip"],
  ods: ["zip"],
  odp: ["zip"],
  zip: ["zip"],
  doc: ["ole", "rtf"],
  xls: ["ole", "text"],
  ppt: ["ole"],
  rtf: ["rtf"],
  txt: ["text"],
  md: ["text"],
  csv: ["text"],
  tsv: ["text"],
  json: ["text"],
  xml: ["text"],
};

export function contentMatchesExtension(name: string, sig: Signature): boolean {
  const expected = EXPECTED[extensionOf(name)];
  return !expected || expected.includes(sig);
}

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  tif: "image/tiff",
  tiff: "image/tiff",
  bmp: "image/bmp",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  doc: "application/msword",
  xls: "application/vnd.ms-excel",
  ppt: "application/vnd.ms-powerpoint",
  rtf: "application/rtf",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  tsv: "text/tab-separated-values; charset=utf-8",
  json: "application/json",
  xml: "application/xml",
  zip: "application/zip",
};

export const mimeFor = (name: string) => MIME[extensionOf(name)] ?? "application/octet-stream";

/** Formats Claude can read directly or after text extraction (RDD §5.2). */
const AI_READABLE = new Set([
  "pdf",
  "docx",
  "xlsx",
  "xlsm",
  "csv",
  "tsv",
  "txt",
  "md",
  "json",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
]);
export const isAiReadable = (name: string) => AI_READABLE.has(extensionOf(name));

/** Strip paths/control characters, collapse whitespace, cap length but keep the extension. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  let clean = base
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean || clean === "." || clean === "..") clean = "file";
  if (clean.length > 180) {
    const ext = extensionOf(clean);
    clean = `${clean.slice(0, 170 - ext.length).trimEnd()}….${ext}`;
  }
  return clean;
}
