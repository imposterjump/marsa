"use client";

import { Download, ExternalLink } from "lucide-react";
import { DocumentsArt } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FileIcon } from "@/components/ui/file-icon";
import type { DocumentDto } from "@/lib/api-types";
import { fileKind, formatBytes } from "@/lib/files";

/**
 * Quick in-app preview. PDFs use the browser's built-in viewer for now; the custom
 * "Sheet Stack" viewer with pagination replaces this in Phase 5 (PRD FR-7).
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
  const kind = fileKind(doc.originalName);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92dvh,1000px)] w-[min(96vw,1200px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3 pe-14">
          <FileIcon name={doc.originalName} className="size-9" />
          <div className="flex min-w-0 flex-1 flex-col">
            <DialogTitle className="truncate text-base" dir="auto">
              {doc.originalName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {formatBytes(doc.sizeBytes)}
              {doc.pageCount != null && ` · ${doc.pageCount} page${doc.pageCount === 1 ? "" : "s"}`}
            </DialogDescription>
          </div>
          <Button asChild variant="secondary" size="sm">
            <a href={doc.url} target="_blank" rel="noreferrer">
              <ExternalLink /> Open in new tab
            </a>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href={`${doc.url}?download=1`}>
              <Download /> Download
            </a>
          </Button>
        </div>
        <div className="min-h-0 flex-1 bg-sunken">
          {open && kind === "pdf" ? (
            <iframe
              title={`Preview of ${doc.originalName}`}
              src={doc.url}
              className="size-full border-0"
            />
          ) : open && kind === "image" ? (
            <div className="flex size-full items-center justify-center overflow-auto p-6">
              {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded file served by our API */}
              <img
                src={doc.url}
                alt={doc.originalName}
                className="max-h-full max-w-full rounded-md shadow-paper"
              />
            </div>
          ) : (
            <EmptyState
              art={<DocumentsArt />}
              title="Preview not available yet"
              description="Word, Excel and other formats get an in-app viewer in Phase 5. Download the file to open it now."
              actions={
                <Button asChild>
                  <a href={`${doc.url}?download=1`}>
                    <Download /> Download
                  </a>
                </Button>
              }
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
