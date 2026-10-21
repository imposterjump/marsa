/**
 * Store an uploaded file and register it in `documents` (RDD §5.1).
 * Validates (blocked type / empty / size), sniffs real content, hashes, counts PDF pages,
 * stores atomically, inserts the row — and removes the file again if the DB insert fails.
 * Extracts text for DOCX/XLSX/TXT (extract-text.ts); PDFs and images go to Claude natively.
 */
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import type { Db } from "../db/connect";
import { documents } from "../db/schema";
import type { LocalStorage } from "../storage/local";
import { ApiError } from "../api-errors";
import { checkFile, extensionOf, isLegacy } from "../../lib/files";
import { newId } from "../../lib/ids";
import { extractText } from "./extract-text";
import { readPdfMeta } from "./pdf-meta";
import { contentMatchesExtension, isAiReadable, mimeFor, sanitizeFileName, sniff } from "./sniff";

export type DocumentOwner =
  | { kind: "rfp"; projectId: string }
  | { kind: "commercial" | "technical"; projectId: string; proposalId: string }
  | { kind: "standard"; standardId: string };

export interface IngestInput {
  owner: DocumentOwner;
  fileName: string;
  bytes: Uint8Array;
  maxSizeMb: number;
}

export type DocumentRow = typeof documents.$inferSelect;

export async function ingestDocument(
  db: Db,
  storage: LocalStorage,
  input: IngestInput,
): Promise<DocumentRow> {
  const originalName = sanitizeFileName(input.fileName);
  const rejection = checkFile(
    { name: originalName, size: input.bytes.byteLength },
    { maxSizeMb: input.maxSizeMb },
  );
  if (rejection) {
    const status = rejection.code === "too_large" ? 413 : rejection.code === "blocked" ? 415 : 400;
    throw new ApiError(status, `file_${rejection.code}`, rejection.message);
  }

  const ext = extensionOf(originalName) || "bin";
  const sig = sniff(input.bytes);
  if (!contentMatchesExtension(originalName, sig)) {
    throw new ApiError(
      415,
      "file_content_mismatch",
      `The file content doesn't match its .${ext} extension. Was it renamed?`,
    );
  }

  let pageCount: number | null = null;
  let aiReadable = isAiReadable(originalName) && !isLegacy(originalName);
  if (sig === "pdf") {
    const meta = await readPdfMeta(input.bytes);
    pageCount = meta.pageCount;
    if (meta.encrypted) aiReadable = false; // password-protected PDFs can't be analysed
  } else if (["png", "jpeg", "gif", "webp", "tiff", "bmp"].includes(sig)) {
    pageCount = 1;
  }

  // Text for non-PDF formats (DOCX/XLSX/TXT…), used by the AI pipeline (RDD §5.2). Never fatal.
  const textContent = aiReadable ? await extractText(originalName, input.bytes).catch(() => null) : null;

  const id = newId("document");
  const dir =
    input.owner.kind === "standard"
      ? ["standards", input.owner.standardId]
      : input.owner.kind === "rfp"
        ? ["projects", input.owner.projectId, "rfp"]
        : ["projects", input.owner.projectId, "proposals", input.owner.proposalId];
  const storagePath = storage.buildPath(dir, id, ext);
  await storage.save(storagePath, input.bytes);

  try {
    db.insert(documents)
      .values({
        id,
        kind: input.owner.kind,
        projectId: "projectId" in input.owner ? input.owner.projectId : null,
        proposalId: "proposalId" in input.owner ? input.owner.proposalId : null,
        standardId: input.owner.kind === "standard" ? input.owner.standardId : null,
        originalName,
        mimeType: mimeFor(originalName),
        ext,
        sizeBytes: input.bytes.byteLength,
        sha256: crypto.createHash("sha256").update(input.bytes).digest("hex"),
        storagePath,
        pageCount,
        textContent,
        aiReadable,
      })
      .run();
  } catch (err) {
    await storage.delete(storagePath).catch(() => {});
    throw err;
  }
  return db.select().from(documents).where(eq(documents.id, id)).get()!;
}

export function getDocument(db: Db, id: string): DocumentRow | undefined {
  return db.select().from(documents).where(eq(documents.id, id)).get();
}

/** Delete the DB row and its file (file errors are ignored: the row is the source of truth). */
export async function deleteDocument(
  db: Db,
  storage: LocalStorage,
  id: string,
): Promise<DocumentRow> {
  const row = getDocument(db, id);
  if (!row) throw new ApiError(404, "not_found", "Document not found.");
  db.delete(documents).where(eq(documents.id, id)).run();
  await storage.delete(row.storagePath).catch(() => {});
  return row;
}
