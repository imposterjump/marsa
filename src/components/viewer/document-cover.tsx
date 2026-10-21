"use client";

import { FileIcon } from "@/components/ui/file-icon";
import type { DocumentDto } from "@/lib/api-types";
import { fileKind } from "@/lib/files";
import { cn } from "cn";
import { PdfCanvas } from "./pdf-canvas";
import { usePdf } from "./use-pdf";

/**
 * A document's first page as a small stack of sheets (the "Sheet Stack" motif): the cover on
 * top, up to two sheets behind it that fan out on hover. Click handling is the parent's.
 */
export function DocumentCover({
  doc,
  width = 168,
  className,
}: {
  doc: DocumentDto;
  width?: number;
  className?: string;
}) {
  const kind = fileKind(doc.originalName);
  const { pdf } = usePdf(kind === "pdf" ? doc.url : null);
  const height = Math.round(width * 1.414); // A4 portrait
  const behind = Math.min(2, Math.max(0, (doc.pageCount ?? 1) - 1));

  return (
    <div
      className={cn("group/cover relative shrink-0", className)}
      style={{ width, height }}
      aria-hidden
    >
      {Array.from({ length: behind }, (_, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 rounded-[3px] border border-border/60 bg-white shadow-xs transition-transform duration-300 ease-out-quint",
            i === 0
              ? "rotate-[3deg] group-hover/cover:translate-x-2 group-hover/cover:rotate-[5deg]"
              : "-rotate-[3deg] group-hover/cover:-translate-x-2 group-hover/cover:-rotate-[5deg]",
          )}
        />
      ))}
      <div className="absolute inset-0 overflow-hidden rounded-[3px] border border-border/60 bg-white shadow-paper transition-transform duration-300 ease-out-quint group-hover/cover:-translate-y-1">
        {pdf ? (
          <PdfCanvas
            pdf={pdf}
            pageNumber={1}
            width={width}
            label={`First page of ${doc.originalName}`}
          />
        ) : kind === "image" ? (
          /* eslint-disable-next-line @next/next/no-img-element -- user-uploaded file served by our API */
          <img src={doc.url} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-surface-muted/40">
            <FileIcon name={doc.originalName} className="size-12" />
          </div>
        )}
      </div>
    </div>
  );
}
