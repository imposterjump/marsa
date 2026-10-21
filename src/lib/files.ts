/**
 * File-type rules shared by the browser (Dropzone) and the server (ingest, P3.2).
 * Policy (PRD FR-3.2 / NFR uploads): any document format is accepted except executables
 * and scripts; legacy binary Office formats are stored but can't be previewed or read by AI.
 */

export type FileKind = "pdf" | "word" | "sheet" | "slides" | "image" | "text" | "archive" | "other";

/** Never accepted — executable or script content. */
export const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "msi",
  "bat",
  "cmd",
  "com",
  "scr",
  "ps1",
  "psm1",
  "vbs",
  "vbe",
  "js",
  "jse",
  "wsf",
  "wsh",
  "sh",
  "bash",
  "app",
  "dmg",
  "pkg",
  "deb",
  "rpm",
  "jar",
  "dll",
  "so",
  "sys",
  "lnk",
  "reg",
  "hta",
  "cpl",
  "msc",
  "iso",
  "apk",
]);

/** Accepted and stored, but no preview and not AI-readable (convert to PDF/DOCX/XLSX). */
export const LEGACY_EXTENSIONS = new Set(["doc", "xls", "ppt", "rtf", "odt", "ods", "odp", "wps"]);

const KIND_BY_EXT: Record<string, FileKind> = {
  pdf: "pdf",
  doc: "word",
  docx: "word",
  rtf: "word",
  odt: "word",
  xls: "sheet",
  xlsx: "sheet",
  xlsm: "sheet",
  csv: "sheet",
  ods: "sheet",
  tsv: "sheet",
  ppt: "slides",
  pptx: "slides",
  odp: "slides",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  gif: "image",
  tif: "image",
  tiff: "image",
  bmp: "image",
  txt: "text",
  md: "text",
  json: "text",
  xml: "text",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
};

export function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 && i < name.length - 1 ? name.slice(i + 1).toLowerCase() : "";
}

export function fileKind(name: string): FileKind {
  return KIND_BY_EXT[extensionOf(name)] ?? "other";
}

export const isBlocked = (name: string) => BLOCKED_EXTENSIONS.has(extensionOf(name));
export const isLegacy = (name: string) => LEGACY_EXTENSIONS.has(extensionOf(name));

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[u]}`;
}

/** "Very_long_file_name_FINAL_v3.xlsx" → "Very_long_fi…AL_v3.xlsx" — keeps the extension visible. */
export function middleTruncate(name: string, max = 42): string {
  if (name.length <= max) return name;
  const ext = extensionOf(name);
  const tail = ext ? Math.min(ext.length + 7, Math.floor(max / 2)) : Math.floor(max / 3);
  const head = max - tail - 1;
  return `${name.slice(0, head)}…${name.slice(name.length - tail)}`;
}

export type FileRejection =
  | { code: "empty"; message: string }
  | { code: "too_large"; message: string }
  | { code: "blocked"; message: string }
  | { code: "duplicate"; message: string }
  | { code: "too_many"; message: string };

export interface FileCheckOptions {
  maxSizeMb: number;
}

/** Validate one file by name/size. Duplicate and count checks need list context (Dropzone). */
export function checkFile(
  file: { name: string; size: number },
  { maxSizeMb }: FileCheckOptions,
): FileRejection | null {
  if (isBlocked(file.name)) {
    return {
      code: "blocked",
      message: `.${extensionOf(file.name)} files are not allowed (executables and scripts are blocked).`,
    };
  }
  if (file.size === 0) return { code: "empty", message: "This file is empty (0 bytes)." };
  if (file.size > maxSizeMb * 1024 * 1024) {
    return {
      code: "too_large",
      message: `${formatBytes(file.size)} exceeds the ${maxSizeMb} MB limit per file.`,
    };
  }
  return null;
}

export function legacyWarning(name: string): string | null {
  return isLegacy(name)
    ? `Legacy .${extensionOf(name)} format: it will be stored and downloadable, but it can't be previewed or read by the AI. Convert it to PDF, DOCX or XLSX for analysis.`
    : null;
}
