"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropzone, type UploadFn } from "@/components/ui/dropzone";
import { FileIcon } from "@/components/ui/file-icon";
import { Pill } from "@/components/ui/status-pill";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettings } from "@/hooks/use-settings";
import { useDeleteDocument, useInvalidateStandard } from "@/hooks/use-standards";
import type { DocumentDto, StandardDetailDto } from "@/lib/api-types";
import { formatBytes, middleTruncate } from "@/lib/files";
import { formatDate } from "@/lib/format";
import { uploadFile } from "@/lib/upload";

export function StandardDocuments({ standard }: { standard: StandardDetailDto }) {
  const { data: settings } = useSettings();
  const invalidate = useInvalidateStandard(standard.id);

  const upload: UploadFn = async (file, onProgress) => {
    const doc = await uploadFile<DocumentDto>(
      `/api/standards/${standard.id}/documents`,
      file,
      onProgress,
    );
    await invalidate();
    toast.success(`${middleTruncate(doc.originalName, 40)} uploaded`, {
      description: doc.pageCount
        ? `${doc.pageCount} page${doc.pageCount === 1 ? "" : "s"}`
        : undefined,
    });
  };

  return (
    <section
      aria-labelledby="docs-title"
      className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 shadow-xs"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="docs-title"
          className="font-heading text-base font-semibold tracking-tight text-ink"
        >
          Documents
        </h2>
        <p className="text-[13px] text-ink-muted">
          The official text of the standard. Sent to the AI together with the rules.
        </p>
      </div>

      {standard.documents.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Uploaded documents">
          {standard.documents.map((d) => (
            <DocumentRow key={d.id} doc={d} standardId={standard.id} />
          ))}
        </ul>
      )}

      <Dropzone
        label={standard.documents.length ? "Add documents" : "Upload documents"}
        maxSizeMb={settings?.runtime.maxUploadMb ?? 50}
        maxFiles={10}
        upload={upload}
        removeOnDone
        description={
          <>
            PDF preferred · Word, Excel and images also accepted · up to{" "}
            {settings?.runtime.maxUploadMb ?? 50} MB each
          </>
        }
      />
    </section>
  );
}

function DocumentRow({ doc, standardId }: { doc: DocumentDto; standardId: string }) {
  const remove = useDeleteDocument(standardId);
  const [confirm, setConfirm] = useState(false);
  const short = middleTruncate(doc.originalName, 28); // narrow column: keep the extension visible

  return (
    <li className="group/doc flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-border-strong">
      <FileIcon name={doc.originalName} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <a
          href={doc.url}
          target="_blank"
          rel="noreferrer"
          className="truncate font-medium text-ink underline-offset-2 hover:underline focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
          title={doc.originalName}
          dir="auto"
        >
          {short}
        </a>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted tabular-nums">
          <span>{formatBytes(doc.sizeBytes)}</span>
          {doc.pageCount != null && (
            <>
              <span aria-hidden>·</span>
              <span>
                {doc.pageCount} page{doc.pageCount === 1 ? "" : "s"}
              </span>
            </>
          )}
          <span aria-hidden>·</span>
          <span>{formatDate(doc.createdAt)}</span>
          {doc.aiReadable ? (
            <Pill tone="ok" size="sm">
              AI-readable
            </Pill>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Pill tone="partial" size="sm">
                    Not AI-readable
                  </Pill>
                </span>
              </TooltipTrigger>
              <TooltipContent>Convert to PDF, DOCX or XLSX so the AI can read it.</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button asChild variant="ghost" size="icon-sm" className="text-ink-muted">
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${doc.originalName}`}
          >
            <ExternalLink />
          </a>
        </Button>
        <Button asChild variant="ghost" size="icon-sm" className="text-ink-muted">
          <a href={`${doc.url}?download=1`} aria-label={`Download ${doc.originalName}`}>
            <Download />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-ink-muted hover:text-fail"
          onClick={() => setConfirm(true)}
          aria-label={`Delete ${doc.originalName}`}
        >
          <Trash2 />
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete document?"
        description={<>“{doc.originalName}” will be removed from this standard and from disk.</>}
        confirmLabel="Delete document"
        onConfirm={() => remove.mutateAsync(doc.id).then(() => toast.success("Document deleted."))}
      />
    </li>
  );
}
