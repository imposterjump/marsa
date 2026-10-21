import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrateDb, openDb, type Db } from "@/server/db/connect";
import { deleteDocument, ingestDocument } from "@/server/documents/ingest";
import { contentMatchesExtension, sanitizeFileName, sniff } from "@/server/documents/sniff";
import { createStandard } from "@/server/services/standards";
import { createLocalStorage, type LocalStorage } from "@/server/storage/local";

const enc = (s: string) => new TextEncoder().encode(s);
const RFP_PDF = path.join(process.cwd(), "test-inputs/phase-1/rfp-pack/01-RFP-NGPA-T-2026-014.pdf");

describe("sniff", () => {
  it("recognises common signatures", () => {
    expect(sniff(enc("%PDF-1.7\n..."))).toBe("pdf");
    expect(sniff(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe("png");
    expect(sniff(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2]))).toBe("zip");
    expect(sniff(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))).toBe("ole");
    expect(sniff(enc("{\\rtf1 hello}"))).toBe("rtf");
    expect(sniff(enc("Plain text, عربي too"))).toBe("text");
    expect(sniff(new Uint8Array([0, 1, 2, 3, 255]))).toBe("unknown");
  });

  it("checks content against the extension", () => {
    expect(contentMatchesExtension("a.pdf", "pdf")).toBe(true);
    expect(contentMatchesExtension("a.pdf", "zip")).toBe(false);
    expect(contentMatchesExtension("a.docx", "zip")).toBe(true);
    expect(contentMatchesExtension("legacy.doc", "rtf")).toBe(true);
    expect(contentMatchesExtension("archive.7z", "unknown")).toBe(true); // unchecked type
  });

  it("sanitises file names", () => {
    expect(sanitizeFileName("..\\..\\evil/name.pdf")).toBe("name.pdf");
    expect(sanitizeFileName('a\u0000b<>:"|?*.pdf')).toBe("ab.pdf");
    expect(sanitizeFileName("عرض-فني-مختصر.pdf")).toBe("عرض-فني-مختصر.pdf");
    const long = sanitizeFileName(`${"x".repeat(300)}.xlsx`);
    expect(long.length).toBeLessThanOrEqual(180);
    expect(long.endsWith(".xlsx")).toBe(true);
  });
});

describe("ingestDocument", () => {
  let tmp: string;
  let storage: LocalStorage;
  let db: Db;
  let standardId: string;

  beforeAll(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "marsa-ingest-"));
    storage = createLocalStorage(tmp);
  });
  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
  beforeEach(() => {
    db = openDb(":memory:");
    migrateDb(db);
    standardId = createStandard(db, {
      code: "CITS-2026",
      title: "IT security",
      category: "IT & security",
      description: "",
      isActive: true,
    }).id;
  });

  const owner = () => ({ kind: "standard" as const, standardId });

  it("stores a real PDF with page count, hash and AI-readable flag", async () => {
    const bytes = new Uint8Array(fs.readFileSync(RFP_PDF));
    const row = await ingestDocument(db, storage, {
      owner: owner(),
      fileName: "RFP.pdf",
      bytes,
      maxSizeMb: 50,
    });
    expect(row).toMatchObject({
      kind: "standard",
      ext: "pdf",
      mimeType: "application/pdf",
      pageCount: 13,
      aiReadable: true,
    });
    expect(row.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(await storage.exists(row.storagePath)).toBe(true);
    expect(row.storagePath.startsWith(`standards/${standardId}/`)).toBe(true);
  });

  it("rejects renamed files, blocked types, empty and oversized files", async () => {
    await expect(
      ingestDocument(db, storage, {
        owner: owner(),
        fileName: "fake.pdf",
        bytes: enc("not a pdf"),
        maxSizeMb: 50,
      }),
    ).rejects.toMatchObject({ status: 415, code: "file_content_mismatch" });
    await expect(
      ingestDocument(db, storage, {
        owner: owner(),
        fileName: "x.exe",
        bytes: enc("MZ"),
        maxSizeMb: 50,
      }),
    ).rejects.toMatchObject({ status: 415, code: "file_blocked" });
    await expect(
      ingestDocument(db, storage, {
        owner: owner(),
        fileName: "e.txt",
        bytes: new Uint8Array(),
        maxSizeMb: 50,
      }),
    ).rejects.toMatchObject({ code: "file_empty" });
    await expect(
      ingestDocument(db, storage, {
        owner: owner(),
        fileName: "big.txt",
        bytes: new Uint8Array(2 * 1024 * 1024).fill(65),
        maxSizeMb: 1,
      }),
    ).rejects.toMatchObject({ status: 413, code: "file_too_large" });
  });

  it("accepts legacy .doc but marks it not AI-readable", async () => {
    const row = await ingestDocument(db, storage, {
      owner: owner(),
      fileName: "Legacy.doc",
      bytes: enc("{\\rtf1 old}"),
      maxSizeMb: 50,
    });
    expect(row.aiReadable).toBe(false);
  });

  it("deletes the row and the file", async () => {
    const row = await ingestDocument(db, storage, {
      owner: owner(),
      fileName: "n.txt",
      bytes: enc("hello"),
      maxSizeMb: 50,
    });
    await deleteDocument(db, storage, row.id);
    expect(await storage.exists(row.storagePath)).toBe(false);
  });
});
