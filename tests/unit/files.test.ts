import { describe, expect, it } from "vitest";
import {
  checkFile,
  extensionOf,
  fileKind,
  formatBytes,
  legacyWarning,
  middleTruncate,
} from "@/lib/files";

const MB = 1024 * 1024;

describe("file rules", () => {
  it("extracts extensions case-insensitively", () => {
    expect(extensionOf("RFP.PDF")).toBe("pdf");
    expect(extensionOf("archive.tar.gz")).toBe("gz");
    expect(extensionOf(".env")).toBe("");
    expect(extensionOf("README")).toBe("");
  });

  it("classifies kinds", () => {
    expect(fileKind("a.docx")).toBe("word");
    expect(fileKind("a.xlsx")).toBe("sheet");
    expect(fileKind("a.csv")).toBe("sheet");
    expect(fileKind("a.png")).toBe("image");
    expect(fileKind("a.bin")).toBe("other");
  });

  it("blocks executables and scripts", () => {
    expect(checkFile({ name: "tool.exe", size: 10 }, { maxSizeMb: 50 })?.code).toBe("blocked");
    expect(checkFile({ name: "run.ps1", size: 10 }, { maxSizeMb: 50 })?.code).toBe("blocked");
    expect(checkFile({ name: "Setup.MSI", size: 10 }, { maxSizeMb: 50 })?.code).toBe("blocked");
  });

  it("rejects empty and oversized files, accepts the limit exactly", () => {
    expect(checkFile({ name: "a.pdf", size: 0 }, { maxSizeMb: 50 })?.code).toBe("empty");
    expect(checkFile({ name: "a.pdf", size: 50 * MB + 1 }, { maxSizeMb: 50 })?.code).toBe(
      "too_large",
    );
    expect(checkFile({ name: "a.pdf", size: 50 * MB }, { maxSizeMb: 50 })).toBeNull();
  });

  it("checks blocked before empty (a 0-byte .exe is reported as blocked)", () => {
    expect(checkFile({ name: "x.exe", size: 0 }, { maxSizeMb: 50 })?.code).toBe("blocked");
  });

  it("warns (but accepts) legacy Office formats", () => {
    expect(checkFile({ name: "old.doc", size: 100 }, { maxSizeMb: 50 })).toBeNull();
    expect(legacyWarning("old.doc")).toMatch(/can't be previewed or read by the AI/);
    expect(legacyWarning("new.docx")).toBeNull();
  });

  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(55 * MB)).toBe("55.0 MB");
  });

  it("middle-truncates long names but keeps the extension", () => {
    const long = "NGPA-T-2026-014_Annex-B_Technical-Specifications_Compliance-Matrix_FINAL_v3.xlsx";
    const short = middleTruncate(long, 42);
    expect(short.length).toBe(42);
    expect(short.endsWith(".xlsx")).toBe(true);
    expect(short).toContain("…");
    expect(middleTruncate("short.pdf", 42)).toBe("short.pdf");
  });
});
