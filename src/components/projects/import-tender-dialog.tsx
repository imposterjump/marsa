"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CloudUpload,
  EyeOff,
  FileArchive,
  FileStack,
  FolderInput,
  FolderOpen,
  Import,
  Loader2,
  Lock,
  X,
} from "lucide-react";
import { cn } from "cn";
import { currentT, useT, type T } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  droppedItems,
  dropImport,
  filesFromPicker,
  IMPORT_MAX_FILE,
  IMPORT_MAX_TOTAL,
  isZip,
  readDropped,
  scanImport,
  startImport,
  uploadImportFiles,
  useCommitImport,
  type ImportFile,
  type ImportProgress,
} from "@/hooks/use-import";
import type {
  TenderImportFileDto,
  TenderImportPreviewDto,
  TenderImportResultDto,
  TenderImportRoundDto,
  TenderImportVendorDto,
} from "@/lib/api-types";
import { WORKS_CATEGORY } from "@/lib/domain";
import { msg } from "@/lib/i18n/core";
import { PROJECT_CATEGORY_LABEL } from "@/lib/labels";
import { DEFAULT_CURRENCY, EstimateFields, estimateError } from "./project-details-form";

type RoundKey = TenderImportRoundDto["key"];

const ROUND_LABEL: Record<RoundKey, string> = {
  opening: msg("Bids at opening"),
  negotiation: msg("Revised bids, negotiation round"),
  bids: msg("Bids"),
};

/** The server's name when the folder gives none (src/server/imports/tender.ts). */
const FALLBACK_NAME = "Imported tender"; // i18n-ignore

/**
 * A file of the scan with the server's default choice (user, 2026-10-25: keep imported projects
 * light): drawings, photos, maps, permits… are left out unless the user ticks them back in.
 * Both fields are optional so a scan without them imports everything.
 */
type ScanFile = TenderImportFileDto & { include?: boolean; leftOut?: string | null };

const LEFT_OUT: Record<string, { label: string; group: string }> = {
  drawing: { label: msg("CAD drawing — the app can't read it"), group: msg("drawings") },
  image: { label: msg("Image"), group: msg("photos") },
  map: { label: msg("Map or site plan"), group: msg("maps") },
  permit: { label: msg("Permit / no-objection letter"), group: msg("permits") },
  site_report: { label: msg("Site visit report"), group: msg("site visit reports") },
  bank_details: { label: msg("Bank account details"), group: msg("bank details") },
};
const LEFT_OUT_OTHER = { label: msg("Left out by default"), group: msg("other files") };
const leftOutOf = (f: ScanFile) => LEFT_OUT[f.leftOut ?? ""] ?? LEFT_OUT_OTHER;

const byDefault = (f: ScanFile) => f.include ?? true;
/** Imported? `flipped` holds the paths whose choice differs from the server's default. */
const isIn = (f: ScanFile, flipped: ReadonlySet<string>) => byDefault(f) !== flipped.has(f.path);
const sizeOf = (files: ScanFile[]) => files.reduce((s, f) => s + f.size, 0);

type Phase =
  | { step: "choose"; error?: string }
  /** progress null: still reading the dropped folder. */
  | { step: "upload"; progress: ImportProgress | null }
  | { step: "scan" }
  | { step: "preview"; preview: TenderImportPreviewDto }
  | { step: "done"; result: TenderImportResultDto; name: string };

/** idle: closes like any dialog · busy: a click outside doesn't close it · locked: can't close. */
type Guard = "idle" | "busy" | "locked";
const guardOf = (p: Phase): Guard => (p.step === "choose" || p.step === "done" ? "idle" : "busy");

interface Draft {
  name: string;
  round: RoundKey | null;
  amount: number | null;
  currency: string | null;
  /** Files the user ticked in or out, against the server's default. */
  flipped: ReadonlySet<string>;
}

/** The files the chosen round would import or leave out: the tender documents and the bids. */
const filesOf = (preview: TenderImportPreviewDto, round: RoundKey | null): ScanFile[] => [
  ...preview.tenderDocuments,
  ...(preview.rounds.find((r) => r.key === round)?.vendors.flatMap((v) => v.files) ?? []),
];

/**
 * Import a tender as the Sharjah e-procurement portal exports it (2026-10-25): one folder (or its
 * zip) with the client's tender documents, internal papers and one folder per bidding company.
 * Choose → upload (3 files at a time, with progress) → the server's preview (name, estimate,
 * round of bids, companies) → Import, which creates the project and opens it. Closing the dialog
 * before the import drops what was uploaded.
 */
export function ImportTenderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [guard, setGuard] = useState<Guard>("idle");
  const change = (next: boolean) => {
    if (!next && guard === "locked") return;
    if (!next) setGuard("idle");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent
        scrollable
        className="sm:max-w-2xl"
        showCloseButton={guard !== "locked"}
        onEscapeKeyDown={(e) => {
          if (guard === "locked") e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (guard !== "idle") e.preventDefault();
        }}
      >
        {open && (
          <ImportFlow
            onGuard={setGuard}
            onCancel={() => change(false)}
            onImported={(projectId) => {
              setGuard("idle");
              onOpenChange(false);
              router.push(`/projects/${projectId}`);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** What is wrong with the chosen files, before anything is sent. */
function selectionProblem(files: ImportFile[], t: T): string | null {
  if (!files.length) return t("There is nothing to import: the folder is empty.");
  if (!files.some((f) => f.path.includes("/") || isZip(f.path)))
    return t("Choose the tender's folder or its .zip file, not single documents.");
  const big = files.find((f) => f.file.size > IMPORT_MAX_FILE);
  if (big)
    return t("“{name}” is larger than 300 MB, the most a tender file can be.", {
      name: big.file.name,
    });
  if (files.reduce((s, f) => s + f.file.size, 0) > IMPORT_MAX_TOTAL)
    return t("The tender is larger than 2 GB.");
  return null;
}

function ImportFlow({
  onGuard,
  onCancel,
  onImported,
}: {
  onGuard: (guard: Guard) => void;
  onCancel: () => void;
  onImported: (projectId: string) => void;
}) {
  const t = useT();
  const commit = useCommitImport();
  const [phase, setPhase] = useState<Phase>({ step: "choose" });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [touched, setTouched] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  // The server's upload session and the running upload: Cancel and closing drop them.
  const live = useRef<{ session: string | null; ctrl: AbortController | null }>({
    session: null,
    ctrl: null,
  });

  const go = (p: Phase) => {
    setPhase(p);
    onGuard(guardOf(p));
  };

  /** Stops the upload and drops the session on the server. */
  const discard = () => {
    const l = live.current;
    l.ctrl?.abort();
    if (l.session) dropImport(l.session);
    l.ctrl = null;
    l.session = null;
  };

  // Closing the dialog, leaving the page or reloading it before the import drops the upload.
  useEffect(() => {
    const l = live.current;
    const onHide = () => {
      if (l.session) dropImport(l.session);
      l.session = null;
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      l.ctrl?.abort();
      if (l.session) dropImport(l.session);
      l.session = null;
    };
  }, []);

  /** Reads the chosen files, uploads them and asks the server what the tender holds. */
  const begin = async (read: () => Promise<ImportFile[]>) => {
    discard();
    const ctrl = new AbortController();
    live.current.ctrl = ctrl;
    setCommitError(null);
    go({ step: "upload", progress: null });
    try {
      const files = await read();
      ctrl.signal.throwIfAborted();
      const problem = selectionProblem(files, t);
      if (problem) {
        live.current.ctrl = null;
        return go({ step: "choose", error: problem });
      }
      const totalBytes = files.reduce((s, f) => s + f.file.size, 0);
      go({
        step: "upload",
        progress: { files: 0, totalFiles: files.length, bytes: 0, totalBytes },
      });
      const id = await startImport();
      if (ctrl.signal.aborted) return dropImport(id);
      live.current.session = id;
      await uploadImportFiles(id, files, {
        signal: ctrl.signal,
        onProgress: (progress) =>
          setPhase((p) => (p.step === "upload" ? { step: "upload", progress } : p)),
      });
      ctrl.signal.throwIfAborted();
      go({ step: "scan" });
      const preview = await scanImport(id, ctrl.signal);
      ctrl.signal.throwIfAborted();
      setDraft({
        name: (preview.name === FALLBACK_NAME ? t("Imported tender") : preview.name).slice(0, 160),
        round: preview.rounds[0]?.key ?? null,
        amount: preview.estimate?.amount ?? null,
        currency: preview.estimate?.currency ?? null,
        flipped: new Set(),
      });
      setTouched(false);
      go({ step: "preview", preview });
    } catch (err) {
      if (ctrl.signal.aborted) return; // cancelled, or the dialog was closed
      discard();
      go({
        step: "choose",
        error: err instanceof Error ? err.message : t("Couldn't read the tender."),
      });
    } finally {
      if (live.current.ctrl === ctrl) live.current.ctrl = null;
    }
  };

  const cancel = () => {
    discard();
    go({ step: "choose" });
  };

  const finish = (result: TenderImportResultDto, name: string) => {
    const t = currentT();
    toast.success(t("“{name}” imported", { name }), {
      description: [
        t.plural(result.vendors, "{n} company", "{n} companies"),
        t.plural(result.documents, "{n} document", "{n} documents"),
        result.skipped.length > 0 &&
          t.plural(result.skipped.length, "{n} file skipped", "{n} files skipped"),
      ]
        .filter(Boolean)
        .join(" · "),
    });
    onImported(result.projectId);
  };

  const runImport = async (preview: TenderImportPreviewDto, d: Draft) => {
    setTouched(true);
    const hasRfp = preview.tenderDocuments.some((f) => isIn(f, d.flipped));
    if (nameError(d.name, t) || estimateError(d.amount, t) || !d.round || !hasRfp) return;
    setCommitError(null);
    onGuard("locked");
    const name = d.name.trim();
    // Only the choices that differ from the server's default, for this round's files.
    const changed = filesOf(preview, d.round).filter((f) => d.flipped.has(f.path));
    const include = changed.filter((f) => !byDefault(f)).map((f) => f.path);
    const exclude = changed.filter((f) => byDefault(f)).map((f) => f.path);
    try {
      const result = await commit.mutateAsync({
        id: preview.id,
        input: {
          name,
          category: WORKS_CATEGORY,
          round: d.round,
          estimateAmount: d.amount,
          estimateCurrency: d.amount != null ? d.currency?.trim() || DEFAULT_CURRENCY : null,
          ...(include.length ? { include } : {}),
          ...(exclude.length ? { exclude } : {}),
        },
      });
      live.current.session = null; // the server emptied the upload area
      if (result.skipped.length) go({ step: "done", result, name });
      else finish(result, name);
    } catch (err) {
      onGuard("busy");
      setCommitError(
        err instanceof Error ? err.message : currentT()("Couldn't import the tender."),
      );
    }
  };

  switch (phase.step) {
    case "choose":
      return (
        <ChooseStep
          error={phase.error}
          onFiles={(read) => void begin(read)}
          onPickError={(error) => go({ step: "choose", error })}
          onCancel={onCancel}
        />
      );
    case "upload":
      return <UploadStep progress={phase.progress} onCancel={cancel} />;
    case "scan":
      return <ScanStep onCancel={cancel} />;
    case "preview":
      return draft ? (
        <PreviewStep
          preview={phase.preview}
          draft={draft}
          onDraft={setDraft}
          touched={touched}
          error={commitError}
          importing={commit.isPending}
          onImport={() => void runImport(phase.preview, draft)}
          onBack={cancel}
          onCancel={onCancel}
        />
      ) : null;
    case "done":
      return <DoneStep result={phase.result} onOpen={() => finish(phase.result, phase.name)} />;
  }
}

const nameError = (name: string, t: T) =>
  name.trim().length < 3
    ? t("Give the project a name of at least 3 characters.")
    : name.length > 160
      ? t("Keep it under 160 characters.")
      : null;

/* ───────────────────────── Step 1 · Choose the folder ───────────────────────── */
function ChooseStep({
  error,
  onFiles,
  onPickError,
  onCancel,
}: {
  error?: string;
  /** Called with a reader of the chosen files (a dropped folder is read asynchronously). */
  onFiles: (read: () => Promise<ImportFile[]>) => void;
  onPickError: (error: string) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const folderInput = useRef<HTMLInputElement>(null);
  const zipInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const hintId = useId();

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("Import tender")}</DialogTitle>
        <DialogDescription>
          {t(
            "Bring in a tender exported from the e-procurement portal. {app} creates the project with its tender documents and each company's bid.",
            { app: t.appName },
          )}
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            dragDepth.current++;
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={() => {
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (dragDepth.current === 0) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            // Read the dropped items now: the browser empties the list after the event.
            const items = droppedItems(e.dataTransfer);
            if (!items.length) return;
            onFiles(() =>
              readDropped(items).catch(() => {
                throw new Error(currentT()("Couldn't read the folder."));
              }),
            );
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-xl border-[1.5px] border-dashed px-6 py-10 text-center",
            "transition-[border-color,background-color] duration-200 ease-out-quint",
            dragging
              ? "border-brand bg-brand-soft/50"
              : "border-border-strong bg-surface hover:border-brand/60 hover:bg-brand-soft/20",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "flex size-14 items-center justify-center rounded-xl shadow-xs transition-[background-color,color,transform] duration-200 motion-reduce:transition-none",
              dragging ? "-translate-y-1 bg-brand text-on-brand" : "bg-brand-soft text-brand-ink",
            )}
          >
            <FolderInput className="size-7" strokeWidth={1.75} />
          </span>
          <div className="flex max-w-md flex-col gap-1.5">
            <p className="font-medium text-ink">
              {dragging
                ? t("Drop to read the tender")
                : t("Drop the tender folder or its .zip here")}
            </p>
            <p id={hintId} className="text-[13px] leading-relaxed text-ink-muted">
              {t(
                "A tender as the e-procurement portal exports it: the tender documents and the companies' bids. Files are only read, never changed.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              aria-describedby={hintId}
              onClick={() => folderInput.current?.click()}
            >
              <FolderOpen /> {t("Choose folder")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              aria-describedby={hintId}
              onClick={() => zipInput.current?.click()}
            >
              <FileArchive /> {t("Choose zip")}
            </Button>
          </div>
          <p className="text-xs text-ink-faint">
            {t("Up to 300 MB per file and 2 GB per tender.")}
          </p>
          <input
            ref={folderInput}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            {...{ webkitdirectory: "" }}
            onChange={(e) => {
              const files = filesFromPicker(e.target.files);
              e.target.value = "";
              onFiles(() => Promise.resolve(files));
            }}
          />
          <input
            ref={zipInput}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const files = filesFromPicker(e.target.files);
              e.target.value = "";
              if (files.length && !files.every((f) => isZip(f.path)))
                return onPickError(t("Choose a .zip file."));
              onFiles(() => Promise.resolve(files));
            }}
          />
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("Cancel")}
        </Button>
      </DialogFooter>
    </>
  );
}

/* ───────────────────────── Upload ───────────────────────── */
function UploadStep({
  progress,
  onCancel,
}: {
  progress: ImportProgress | null;
  onCancel: () => void;
}) {
  const t = useT();
  const pct = progress?.totalBytes ? Math.round((progress.bytes / progress.totalBytes) * 100) : 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("Import tender")}</DialogTitle>
        <DialogDescription>
          {t("Keep this window open: closing it cancels the import.")}
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface px-5 py-6">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink"
            >
              {progress ? (
                <CloudUpload className="size-5" strokeWidth={1.75} />
              ) : (
                <Loader2 className="size-5 animate-spin" />
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="font-medium text-ink">
                {progress ? t("Uploading the tender…") : t("Reading the folder…")}
              </p>
              {progress && (
                <p className="text-xs text-ink-muted tabular-nums">
                  {t.plural(progress.totalFiles, "{done} of {n} file", "{done} of {n} files", {
                    done: progress.files,
                  })}
                  {" · "}
                  {t("{sent} of {size}", {
                    sent: t.bytes(progress.bytes),
                    size: t.bytes(progress.totalBytes),
                  })}
                </p>
              )}
            </div>
            {progress && (
              <span className="font-heading text-2xl font-semibold text-ink tabular-nums">
                {pct}%
              </span>
            )}
          </div>
          <div
            role="progressbar"
            aria-label={t("Upload progress")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="h-2 overflow-hidden rounded-full bg-surface-muted"
          >
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-200 ease-out motion-reduce:transition-none"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          <X /> {t("Cancel upload")}
        </Button>
      </DialogFooter>
    </>
  );
}

/* ───────────────────────── Scan ───────────────────────── */
function ScanStep({ onCancel }: { onCancel: () => void }) {
  const t = useT();
  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("Import tender")}</DialogTitle>
        <DialogDescription>
          {t("Keep this window open: closing it cancels the import.")}
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div
          role="status"
          className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-6 py-10 text-center"
        >
          <Loader2 className="size-8 animate-spin text-brand" aria-hidden />
          <p className="font-medium text-ink">{t("Reading the tender…")}</p>
          <p className="max-w-sm text-[13px] text-ink-muted">
            {t("Sorting the tender documents, the internal papers and each company's bid.")}
          </p>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t("Cancel")}
        </Button>
      </DialogFooter>
    </>
  );
}

/* ───────────────────────── Step 2 · Preview ───────────────────────── */
function PreviewStep({
  preview,
  draft,
  onDraft,
  touched,
  error,
  importing,
  onImport,
  onBack,
  onCancel,
}: {
  preview: TenderImportPreviewDto;
  draft: Draft;
  onDraft: (d: Draft) => void;
  touched: boolean;
  error: string | null;
  importing: boolean;
  onImport: () => void;
  onBack: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const docsId = useId();
  const bidsId = useId();
  const round = preview.rounds.find((r) => r.key === draft.round) ?? preview.rounds[0];
  const vendors = round?.vendors ?? [];
  const docs: ScanFile[] = preview.tenderDocuments;
  const docsIn = docs.filter((f) => isIn(f, draft.flipped)).length;
  const internal = preview.internalDocuments.length;
  const all = filesOf(preview, round?.key ?? null);
  const filesIn = all.filter((f) => isIn(f, draft.flipped));
  const filesOut = all.filter((f) => !isIn(f, draft.flipped));
  const problem = !docs.length
    ? t(
        "No tender documents were found in this folder. The import needs them as the project's RFP.",
      )
    : !preview.rounds.length
      ? t("No company bids were found in this folder.")
      : !docsIn
        ? t("Keep at least one tender document: they become the project's RFP.")
        : null;
  const toggle = (path: string) => {
    const flipped = new Set(draft.flipped);
    if (!flipped.delete(path)) flipped.add(path);
    onDraft({ ...draft, flipped });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("Import tender")}</DialogTitle>
        <DialogDescription>
          {t("Check what {app} found in the folder, then import it.", { app: t.appName })}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="gap-7">
        <Field
          label={t("Project name")}
          error={touched ? nameError(draft.name, t) : null}
          hint={
            <>
              {preview.reference && (
                <>{t("Tender reference {ref}.", { ref: preview.reference })} </>
              )}
              {t("Imported as a “{category}” project.", {
                category: t(PROJECT_CATEGORY_LABEL[WORKS_CATEGORY]),
              })}
            </>
          }
        >
          <Input
            value={draft.name}
            onChange={(e) => onDraft({ ...draft, name: e.target.value })}
            maxLength={170}
            dir="auto"
            disabled={importing}
          />
        </Field>

        <section aria-labelledby={docsId} className="flex flex-col gap-2.5">
          <h3 id={docsId} className="text-[13px] font-medium text-ink">
            {t("Tender documents")}
          </h3>
          <div className="flex flex-col rounded-xl border border-border bg-surface">
            <Disclosure
              disabled={!docs.length}
              summary={
                <SummaryLine
                  icon={<FileStack />}
                  tone="brand"
                  title={t.plural(docsIn, "{n} tender document", "{n} tender documents")}
                  detail={
                    docs.length > docsIn
                      ? `${t("They become the project's RFP documents.")} ${t.plural(
                          docs.length - docsIn,
                          "{n} file is left out.",
                          "{n} files are left out.",
                        )}`
                      : t("They become the project's RFP documents.")
                  }
                />
              }
            >
              <FileGroup
                files={docs}
                flipped={draft.flipped}
                onToggle={toggle}
                disabled={importing}
              />
            </Disclosure>
            {internal > 0 && (
              <div className="border-t border-border/70 px-4 py-3">
                <SummaryLine
                  icon={<Lock />}
                  title={t.plural(
                    internal,
                    "{n} internal paper is not imported.",
                    "{n} internal papers are not imported.",
                  )}
                  detail={t("They stay with the client. Only the estimate is read from them.")}
                />
              </div>
            )}
            {preview.ignored.length > 0 && (
              <Disclosure
                className="border-t border-border/70"
                summary={
                  <SummaryLine
                    icon={<EyeOff />}
                    title={t.plural(
                      preview.ignored.length,
                      "{n} file is not part of the tender and is left out.",
                      "{n} files are not part of the tender and are left out.",
                    )}
                  />
                }
              >
                <ul className="flex flex-col divide-y divide-border/70 border-t border-border/70">
                  {preview.ignored.map((path) => (
                    <li
                      key={path}
                      className="truncate px-4 py-2 text-[13px] text-ink-2"
                      dir="auto"
                      title={path}
                    >
                      {path}
                    </li>
                  ))}
                </ul>
              </Disclosure>
            )}
          </div>
        </section>

        <EstimateFields
          amount={draft.amount}
          currency={draft.currency}
          onChange={(amount, currency) => onDraft({ ...draft, amount, currency })}
          error={estimateError(draft.amount, t)}
          hint={
            preview.estimate
              ? t("Read from “{source}”. Never shown to vendors.", {
                  source: preview.estimate.source,
                })
              : t(
                  "Not found in the tender's papers: type it if you have it. Never shown to vendors.",
                )
          }
        />

        {preview.rounds.length > 0 && (
          <section aria-labelledby={bidsId} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 id={bidsId} className="text-[13px] font-medium text-ink">
                {t("Companies' bids")}
              </h3>
              <span className="text-xs text-ink-muted tabular-nums">
                {t.plural(vendors.length, "{n} company", "{n} companies")}
              </span>
            </div>
            {preview.rounds.length > 1 && (
              <div className="flex flex-col gap-2">
                <p className="text-[13px] text-ink-muted">
                  {t("This tender has more than one round of bids. Choose the one to import.")}
                </p>
                <SegmentedControl<RoundKey>
                  aria-label={t("Round of bids")}
                  value={round.key}
                  onValueChange={(key) => onDraft({ ...draft, round: key })}
                  className="self-start"
                  options={preview.rounds.map((r) => ({
                    value: r.key,
                    label: t(ROUND_LABEL[r.key]),
                    count: r.vendors.length,
                  }))}
                />
              </div>
            )}
            <ul className="flex flex-col gap-2" aria-labelledby={bidsId}>
              {vendors.map((v) => (
                <CompanyRow
                  key={v.folder}
                  vendor={v}
                  flipped={draft.flipped}
                  onToggle={toggle}
                  disabled={importing}
                />
              ))}
            </ul>
            <p className="text-xs text-ink-muted">
              {t("Each company becomes a vendor with its commercial and technical proposal.")}
            </p>
          </section>
        )}

        {problem && <ErrorNote>{problem}</ErrorNote>}
        {error && <ErrorNote>{error}</ErrorNote>}
      </DialogBody>
      <DialogFooter className="sm:flex-wrap sm:justify-between">
        {/* What the import takes: first line on wide screens, on top of the buttons on phones. */}
        <p className="order-last flex basis-full flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted tabular-nums sm:order-first">
          <span className="font-medium text-ink-2">
            {t("To import: {files} · {size}", {
              files: t.plural(filesIn.length, "{n} file", "{n} files"),
              size: t.bytes(sizeOf(filesIn)),
            })}
          </span>
          {filesOut.length > 0 && (
            <span>
              {t("Left out: {files} · {size}", {
                files: t.plural(filesOut.length, "{n} file", "{n} files"),
                size: t.bytes(sizeOf(filesOut)),
              })}
            </span>
          )}
        </p>
        <Button type="button" variant="ghost" onClick={onBack} disabled={importing}>
          <ArrowLeft className="rtl:rotate-180" /> {t("Choose another folder")}
        </Button>
        <span className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          {importing && (
            <span className="text-xs text-ink-muted" role="status">
              {t("A large tender takes a minute or two.")}
            </span>
          )}
          <Button type="button" variant="ghost" onClick={onCancel} disabled={importing}>
            {t("Cancel")}
          </Button>
          <Button type="button" onClick={onImport} loading={importing} disabled={!!problem}>
            <Import /> {t("Import tender")}
          </Button>
        </span>
      </DialogFooter>
    </>
  );
}

function CompanyRow({
  vendor,
  flipped,
  onToggle,
  disabled,
}: {
  vendor: TenderImportVendorDto;
  flipped: ReadonlySet<string>;
  onToggle: (path: string) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const files: ScanFile[] = vendor.files;
  const kept = files.filter((f) => isIn(f, flipped));
  const commercial = kept.filter((f) => f.kind === "commercial").length;
  const out = files.length - kept.length;
  return (
    <li className="rounded-xl border border-border bg-surface">
      <Disclosure
        summary={
          <span className="flex min-w-0 items-center gap-3">
            <InitialsAvatar name={vendor.name} size="sm" />
            <span className="flex min-w-0 flex-col gap-0.5">
              {/* <bdi>: an Arabic name keeps its direction but the line stays aligned. */}
              <span className="truncate font-medium text-ink">
                <bdi>{vendor.name}</bdi>
              </span>
              <span className="text-xs text-ink-muted tabular-nums">
                {t("{files} ({commercial} commercial, {technical} technical)", {
                  files: t.plural(kept.length, "{n} file", "{n} files"),
                  commercial,
                  technical: kept.length - commercial,
                })}
                {out > 0 && (
                  <>
                    {" · "}
                    {t.plural(out, "{n} file left out", "{n} files left out")}
                  </>
                )}
                {vendor.duplicates > 0 && (
                  <>
                    {" · "}
                    {t.plural(
                      vendor.duplicates,
                      "{n} duplicate file left out",
                      "{n} duplicate files left out",
                    )}
                  </>
                )}
              </span>
            </span>
          </span>
        }
      >
        <FileGroup
          files={files}
          flipped={flipped}
          onToggle={onToggle}
          disabled={disabled}
          envelope
        />
      </Disclosure>
    </li>
  );
}

/* ───────────────────────── Step 3 · Done, with files that were skipped ───────────────────────── */
function DoneStep({ result, onOpen }: { result: TenderImportResultDto; onOpen: () => void }) {
  const t = useT();
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CircleCheck className="size-5 text-ok" aria-hidden /> {t("Tender imported")}
        </DialogTitle>
        <DialogDescription>
          {t.plural(
            result.skipped.length,
            "{n} file could not be imported. The rest of the tender is in the project.",
            "{n} files could not be imported. The rest of the tender is in the project.",
          )}
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <ul className="flex flex-col divide-y divide-border/70 rounded-xl border border-border bg-surface">
          {result.skipped.map((s, i) => (
            <li key={`${s.name}-${i}`} className="flex flex-col gap-0.5 px-4 py-2.5">
              <span className="truncate text-[13px] font-medium text-ink" dir="auto" title={s.name}>
                {s.name}
              </span>
              <span className="flex items-start gap-1.5 text-xs text-fail">
                <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                {t.auto(s.reason)}
              </span>
            </li>
          ))}
        </ul>
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onOpen}>
          {t("Open the project")} <ArrowRight className="rtl:rotate-180" />
        </Button>
      </DialogFooter>
    </>
  );
}

/* ───────────────────────── Pieces ───────────────────────── */
function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-fail/30 bg-fail-soft/40 px-3 py-2.5 text-[13px] text-fail"
    >
      <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

function SummaryLine({
  icon,
  title,
  detail,
  tone = "muted",
}: {
  icon: React.ReactNode;
  title: string;
  detail?: string;
  tone?: "brand" | "muted";
}) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4",
          tone === "brand" ? "bg-brand-soft text-brand-ink" : "bg-surface-muted text-ink-muted",
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-medium text-ink">{title}</span>
        {detail && <span className="text-xs text-ink-muted">{detail}</span>}
      </span>
    </span>
  );
}

/** A summary row that shows or hides its list (rendered only when open: lists can be long). */
function Disclosure({
  summary,
  children,
  disabled,
  flat,
  className,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  /** Square corners: a group inside a list. */
  flat?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-start transition-colors outline-none hover:bg-surface-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset disabled:pointer-events-none",
          flat ? "rounded-none" : "rounded-xl",
        )}
      >
        <span className="min-w-0 flex-1">{summary}</span>
        {!disabled && (
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-ink-muted transition-transform duration-200 motion-reduce:transition-none",
              open && "rotate-180",
            )}
          />
        )}
      </button>
      {open && <div id={id}>{children}</div>}
    </div>
  );
}

/**
 * A group's files with a checkbox each: the files to import (untick one to leave it out), then
 * the files left out by default, collapsed, each with its reason (tick one to import it anyway).
 */
function FileGroup({
  files,
  flipped,
  onToggle,
  disabled,
  envelope = false,
}: {
  files: ScanFile[];
  flipped: ReadonlySet<string>;
  onToggle: (path: string) => void;
  disabled?: boolean;
  /** Show each file's envelope (a company's bid). */
  envelope?: boolean;
}) {
  const t = useT();
  const kept = files.filter(byDefault);
  const leftOut = files.filter((f) => !byDefault(f));
  const reasons = [...new Set(leftOut.map((f) => t(leftOutOf(f).group)))];
  const row = (f: ScanFile, reason: boolean) => (
    <FileRow
      key={f.path}
      file={f}
      checked={isIn(f, flipped)}
      onToggle={() => onToggle(f.path)}
      disabled={disabled}
      envelope={envelope}
      reason={reason ? t(leftOutOf(f).label) : undefined}
    />
  );
  return (
    <div className="border-t border-border/70">
      {kept.length > 0 && (
        <ul className="flex flex-col divide-y divide-border/70">
          {kept.map((f) => row(f, false))}
        </ul>
      )}
      {leftOut.length > 0 && (
        <Disclosure
          className={cn(kept.length > 0 && "border-t border-border/70")}
          flat
          summary={
            <SummaryLine
              icon={<EyeOff />}
              title={t("Left out ({n}): {reasons}", {
                n: leftOut.length,
                reasons: new Intl.ListFormat(t.locale, { type: "conjunction" }).format(reasons),
              })}
              detail={t("Tick a file to import it anyway.")}
            />
          }
        >
          <ul className="flex flex-col divide-y divide-border/70 border-t border-border/70">
            {leftOut.map((f) => row(f, true))}
          </ul>
        </Disclosure>
      )}
    </div>
  );
}

function FileRow({
  file: f,
  checked,
  onToggle,
  disabled,
  envelope,
  reason,
}: {
  file: ScanFile;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  envelope?: boolean;
  /** Why the file is left out by default. */
  reason?: string;
}) {
  const t = useT();
  return (
    <li>
      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 px-4 py-2 text-[13px] transition-colors hover:bg-surface-muted/50",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <Checkbox checked={checked} onCheckedChange={onToggle} disabled={disabled} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn("truncate", checked ? "text-ink-2" : "text-ink-muted")}
            dir="auto"
            title={f.path}
          >
            {f.name}
          </span>
          {reason && <span className="text-xs text-ink-muted">{reason}</span>}
        </span>
        {envelope && f.kind && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-2xs font-medium",
              f.kind === "commercial" ? "bg-partial-soft text-partial" : "bg-info-soft text-info",
            )}
          >
            {f.kind === "commercial" ? t("Commercial") : t("Technical")}
          </span>
        )}
        <span className="shrink-0 text-xs text-ink-muted tabular-nums">{t.bytes(f.size)}</span>
      </label>
    </li>
  );
}
