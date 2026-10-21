import type { DocumentDto } from "../../lib/api-types";
import type { DocumentRow } from "./ingest";

/** Public shape of a document: never exposes storage paths, hashes or provider file ids. */
export function toDocumentDto(d: DocumentRow): DocumentDto {
  return {
    id: d.id,
    kind: d.kind,
    originalName: d.originalName,
    mimeType: d.mimeType,
    ext: d.ext,
    sizeBytes: d.sizeBytes,
    pageCount: d.pageCount,
    aiReadable: d.aiReadable,
    createdAt: d.createdAt,
    url: `/api/documents/${d.id}/file`,
  };
}
