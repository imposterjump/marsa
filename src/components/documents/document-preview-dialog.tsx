"use client";

import { useState } from "react";
import { useT } from "@/components/i18n-provider";
import { FileIcon } from "@/components/ui/file-icon";
import { DocumentReader } from "@/components/viewer/document-reader";
import type { DocumentDto } from "@/lib/api-types";

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
  const t = useT();
  const [page, setPage] = useState(1);
  return (
    <DocumentReader
      open={open}
      onOpenChange={onOpenChange}
      leading={<FileIcon name={doc.originalName} className="size-8" />}
      title={<span dir="auto">{doc.originalName}</span>}
      subtitle={`${t.bytes(doc.sizeBytes)}${doc.pageCount != null ? ` · ${t.plural(doc.pageCount, "{n} page", "{n} pages")}` : ""}`}
      groups={[{ id: "doc", label: doc.originalName, docs: [doc] }]}
      docId={doc.id}
      page={page}
      onNavigate={(_id, p) => setPage(p)}
    />
  );
}
