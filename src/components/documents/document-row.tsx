"use client";

import { useState } from "react";
import { Download, Eye, Trash2 } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FileIcon } from "@/components/ui/file-icon";
import { Pill } from "@/components/ui/status-pill";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DocumentDto } from "@/lib/api-types";
import { middleTruncate } from "@/lib/files";
import { DocumentPreviewDialog } from "./document-preview-dialog";

/**
 * One stored document: type icon, name, size · pages · date, AI-readable badge,
 * preview / download / delete. Shared by standards and projects.
 */
export function DocumentRow({
  doc,
  onDelete,
  deleteDescription,
  nameMax = 28,
}: {
  doc: DocumentDto;
  /** Omit to hide the delete action (read-only contexts). */
  onDelete?: () => Promise<unknown>;
  deleteDescription?: string;
  /** Middle-truncation length; keep it short in narrow columns so the extension stays visible. */
  nameMax?: number;
}) {
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  const [preview, setPreview] = useState(false);

  return (
    <li className="group/doc flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-border-strong">
      <FileIcon name={doc.originalName} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <button
          type="button"
          onClick={() => setPreview(true)}
          className="truncate text-start font-medium text-ink underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/25"
          title={doc.originalName}
          dir="auto"
        >
          {middleTruncate(doc.originalName, nameMax)}
        </button>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted tabular-nums">
          <span>{t.bytes(doc.sizeBytes)}</span>
          {doc.pageCount != null && (
            <>
              <span aria-hidden>·</span>
              <span>{t.plural(doc.pageCount, "{n} page", "{n} pages")}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span>{t.date(doc.createdAt)}</span>
          {doc.aiReadable ? (
            <Pill tone="ok" size="sm">
              {t("AI-readable")}
            </Pill>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Pill tone="partial" size="sm">
                    {t("Not AI-readable")}
                  </Pill>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {t("Convert to PDF, DOCX or XLSX so the AI can read it.")}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-ink-muted"
          onClick={() => setPreview(true)}
          aria-label={t("Preview {file}", { file: doc.originalName })}
        >
          <Eye />
        </Button>
        <Button asChild variant="ghost" size="icon-sm" className="text-ink-muted">
          <a
            href={`${doc.url}?download=1`}
            aria-label={t("Download {file}", { file: doc.originalName })}
          >
            <Download />
          </a>
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-ink-muted hover:text-fail"
            onClick={() => setConfirm(true)}
            aria-label={t("Delete {file}", { file: doc.originalName })}
          >
            <Trash2 />
          </Button>
        )}
      </div>
      <DocumentPreviewDialog doc={doc} open={preview} onOpenChange={setPreview} />
      {onDelete && (
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={t("Delete document?")}
          description={
            deleteDescription ??
            t("“{file}” will be removed from disk.", { file: doc.originalName })
          }
          confirmLabel={t("Delete document")}
          onConfirm={onDelete}
        />
      )}
    </li>
  );
}
