"use client";

import { useCallback, useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, CircleCheck, CloudUpload, Loader2, TriangleAlert, X } from "lucide-react";
import { cn } from "cn";
import { checkFile, formatBytes, legacyWarning, middleTruncate } from "@/lib/files";
import { Button } from "./button";
import { FileIcon } from "./file-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type DropzoneItemStatus = "ready" | "uploading" | "done" | "error" | "rejected";

export interface DropzoneItem {
  id: string;
  file: File;
  status: DropzoneItemStatus;
  progress: number; // 0–100
  error?: string;
  warning?: string;
}

export type UploadFn = (file: File, onProgress: (pct: number) => void) => Promise<void>;

interface DropzoneProps {
  /** Visible label, e.g. "RFP documents". */
  label: string;
  description?: React.ReactNode;
  maxSizeMb: number;
  maxFiles?: number;
  /** When provided, accepted files upload immediately with progress. */
  upload?: UploadFn;
  /** Called whenever the list of accepted (non-rejected) items changes. */
  onChange?: (items: DropzoneItem[]) => void;
  disabled?: boolean;
  className?: string;
}

// Same name + size = same file (lastModified differs between pickers, so it is not used).
const fileKey = (f: File) => `${f.name}::${f.size}`;

export function Dropzone({
  label,
  description,
  maxSizeMb,
  maxFiles = 20,
  upload,
  onChange,
  disabled,
  className,
}: DropzoneProps) {
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<DropzoneItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const dragDepth = useRef(0);

  // Report accepted items to the parent after each change (never inside a state updater).
  const emitChange = useEffectEvent((next: DropzoneItem[]) =>
    onChange?.(next.filter((i) => i.status !== "rejected")),
  );
  useEffect(() => emitChange(items), [items]);

  const commit = useCallback(
    (updater: (prev: DropzoneItem[]) => DropzoneItem[]) => setItems(updater),
    [],
  );

  const patch = useCallback(
    (id: string, p: Partial<DropzoneItem>) =>
      commit((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i))),
    [commit],
  );

  const startUpload = useCallback(
    async (item: DropzoneItem) => {
      if (!upload) return;
      patch(item.id, { status: "uploading", progress: 0, error: undefined });
      try {
        await upload(item.file, (pct) => patch(item.id, { progress: Math.round(pct) }));
        patch(item.id, { status: "done", progress: 100 });
      } catch (err) {
        patch(item.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed. Try again.",
        });
      }
    },
    [upload, patch],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      if (disabled || files.length === 0) return;
      const existing = new Set(
        items.filter((i) => i.status !== "rejected").map((i) => fileKey(i.file)),
      );
      let acceptedCount = items.filter((i) => i.status !== "rejected").length;
      const added: DropzoneItem[] = files.map((file) => {
        const id = crypto.randomUUID();
        const rejection =
          checkFile(file, { maxSizeMb }) ??
          (existing.has(fileKey(file))
            ? { message: "This file is already in the list." }
            : acceptedCount >= maxFiles
              ? { message: `Limit reached: at most ${maxFiles} files per upload.` }
              : null);
        if (rejection)
          return { id, file, status: "rejected", progress: 0, error: rejection.message };
        existing.add(fileKey(file));
        acceptedCount++;
        return {
          id,
          file,
          status: "ready",
          progress: 0,
          warning: legacyWarning(file.name) ?? undefined,
        };
      });
      commit((prev) => [...prev, ...added]);
      const ok = added.filter((i) => i.status !== "rejected");
      const rejected = added.length - ok.length;
      setAnnouncement(
        `${ok.length} file${ok.length === 1 ? "" : "s"} added${rejected ? `, ${rejected} rejected` : ""}.`,
      );
      ok.forEach((i) => void startUpload(i));
    },
    [disabled, items, maxSizeMb, maxFiles, commit, startUpload],
  );

  const remove = (item: DropzoneItem) => {
    commit((prev) => prev.filter((i) => i.id !== item.id));
    setAnnouncement(`${item.file.name} removed.`);
  };

  const accepted = items.filter((i) => i.status !== "rejected");
  const totalBytes = accepted.reduce((s, i) => s + i.file.size, 0);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={inputId} className="font-medium text-ink">
          {label}
        </label>
        {accepted.length > 0 && (
          <span className="text-xs text-ink-muted tabular-nums">
            {accepted.length} / {maxFiles} files · {formatBytes(totalBytes)}
          </span>
        )}
      </div>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (disabled) return;
          dragDepth.current++;
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          addFiles(Array.from(e.dataTransfer.files));
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "group/dz relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-[1.5px] border-dashed px-6 py-10 text-center",
          "transition-[border-color,background-color] duration-200 ease-out-quint",
          dragging
            ? "border-brand bg-brand-soft/50"
            : "border-border-strong bg-surface hover:border-brand/60 hover:bg-brand-soft/20",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <motion.span
          aria-hidden
          animate={dragging ? { y: -4, scale: 1.06 } : { y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className={cn(
            "flex size-12 items-center justify-center rounded-xl shadow-xs transition-colors",
            dragging ? "bg-brand text-on-brand" : "bg-brand-soft text-brand-ink",
          )}
        >
          <CloudUpload className="size-6" strokeWidth={1.75} />
        </motion.span>
        <div className="flex flex-col gap-1">
          <p className="font-medium text-ink">
            {dragging ? "Drop to add files" : "Drag & drop files here"}
          </p>
          <p id={hintId} className="text-xs text-ink-muted">
            {description ?? (
              <>
                PDF, Word, Excel, images or any document · up to {maxSizeMb} MB each · max{" "}
                {maxFiles} files
              </>
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Browse files
        </Button>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          aria-describedby={hintId}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {items.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label={`${label}: selected files`}>
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <FileRow
                  item={item}
                  onRemove={() => remove(item)}
                  onRetry={() => startUpload(item)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function FileRow({
  item,
  onRemove,
  onRetry,
}: {
  item: DropzoneItem;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const { file, status, progress, error, warning } = item;
  const bad = status === "rejected" || status === "error";
  const shortName = middleTruncate(file.name, 48);

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 overflow-hidden rounded-lg border p-3 transition-colors",
        bad ? "border-fail/30 bg-fail-soft/40" : "border-border bg-surface",
      )}
    >
      <FileIcon name={file.name} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          {shortName !== file.name ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate font-medium text-ink" tabIndex={0}>
                  {shortName}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-md break-all">{file.name}</TooltipContent>
            </Tooltip>
          ) : (
            <span className="truncate font-medium text-ink" dir="auto">
              {file.name}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted tabular-nums">
          <span>{formatBytes(file.size)}</span>
          <span aria-hidden>·</span>
          <StatusText status={status} progress={progress} />
        </div>
        {error && (
          <p className="flex items-start gap-1.5 text-xs text-fail">
            <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
            {error}
            {status === "error" && (
              <button
                type="button"
                onClick={onRetry}
                className="ms-1 font-medium underline underline-offset-2"
              >
                Retry
              </button>
            )}
          </p>
        )}
        {warning && !error && (
          <p className="flex items-start gap-1.5 text-xs text-partial">
            <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
            {warning}
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="text-ink-muted"
      >
        <X />
      </Button>
      {status === "uploading" && (
        <motion.span
          aria-hidden
          className="absolute start-0 bottom-0 h-0.5 bg-brand"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "linear", duration: 0.2 }}
        />
      )}
    </div>
  );
}

function StatusText({ status, progress }: { status: DropzoneItemStatus; progress: number }) {
  switch (status) {
    case "uploading":
      return (
        <span className="inline-flex items-center gap-1 text-brand-ink">
          <Loader2 className="size-3 animate-spin" aria-hidden /> Uploading {progress}%
        </span>
      );
    case "done":
      return (
        <span className="inline-flex items-center gap-1 text-ok">
          <CircleCheck className="size-3" aria-hidden /> Uploaded
        </span>
      );
    case "error":
      return <span className="text-fail">Upload failed</span>;
    case "rejected":
      return <span className="text-fail">Not added</span>;
    default:
      return <span>Ready</span>;
  }
}
