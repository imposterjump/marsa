"use client";

import { useState } from "react";
import { FileIcon } from "@/components/ui/file-icon";
import { DocumentReader } from "@/components/viewer/document-reader";
import type { DocumentDto } from "@/lib/api-types";
import { formatBytes } from "@/lib/files";

/**
 * Opens one stored document (RFP, standard, …) in the full-screen reader. Same reader as the
 * proposal page (user feedback 2026-10-21: no more browser PDF viewer in a box).
 */
export function DocumentPreviewDialog({
  doc,
  open,
  onOpenChange,
}: {
  doc: DocumentDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [page, setPage] = useState(1);
  return (
    <DocumentReader
      open={open}
      onOpenChange={onOpenChange}
      leading={<FileIcon name={doc.originalName} className="size-8" />}
      title={<span dir="auto">{doc.originalName}</span>}
      subtitle={`${formatBytes(doc.sizeBytes)}${doc.pageCount != null ? ` · ${doc.pageCount} page${doc.pageCount === 1 ? "" : "s"}` : ""}`}
      groups={[{ id: "doc", label: doc.originalName, docs: [doc] }]}
      docId={doc.id}
      page={page}
      onNavigate={(_id, p) => setPage(p)}
    />
  );
}
