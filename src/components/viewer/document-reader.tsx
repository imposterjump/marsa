"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileWarning,
  Loader2,
  Minus,
  MoveHorizontal,
  Plus,
  Scan,
  X,
} from "lucide-react";
import { cn } from "cn";
import type { DocumentDto } from "@/lib/api-types";
import { fileKind, formatBytes, middleTruncate } from "@/lib/files";
import { PdfCanvas, usePageSizes } from "./pdf-canvas";
import { usePdf } from "./use-pdf";

export interface ReaderGroup {
  id: string;
  label: string;
  docs: DocumentDto[];
}

interface DocumentReaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Shown before the title, e.g. the vendor's avatar. */
  leading?: React.ReactNode;
  /** One group per envelope (Commercial, Technical) or a single group for a plain document. */
  groups: ReaderGroup[];
  docId: string | null;
  page: number;
  /** Controlled navigation: the parent stores doc + page (e.g. in the URL). */
  onNavigate: (docId: string, page: number) => void;
}

type Fit = "page" | "width";
const ZOOMS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2, 2.5, 3];
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Full-screen document reader (PRD FR-7, "Sheet Stack", P5.4–P5.6): one sharp page at a time on
 * a dark stage, page-turn animation, a stack of sheets behind the page that thins as you read,
 * thumbnail filmstrip, floating toolbar (page, zoom, fit, download) and keyboard shortcuts.
 * Replaces the browser's built-in PDF viewer everywhere (user feedback, 2026-10-21).
 */
export function DocumentReader(props: DocumentReaderProps) {
  return (
    <DialogPrimitive.Root open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgb(4_10_18/0.6)] backdrop-blur-[3px] duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-stage text-stage-ink shadow-lg duration-200 outline-none sm:inset-3 sm:rounded-2xl sm:border sm:border-stage-line data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.985] data-closed:animate-out data-closed:fade-out-0"
        >
          {props.open && <ReaderBody {...props} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: e.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

function ReaderBody({
  title,
  subtitle,
  leading,
  groups,
  docId,
  page,
  onNavigate,
}: DocumentReaderProps) {
  const all = groups.flatMap((g) => g.docs);
  const doc = all.find((d) => d.id === docId) ?? all[0];
  const group = groups.find((g) => g.docs.some((d) => d.id === doc?.id));
  const kind = doc ? fileKind(doc.originalName) : "other";
  const { pdf, error } = usePdf(doc && kind === "pdf" ? doc.url : null);
  const sizes = usePageSizes(pdf);
  const numPages = pdf?.numPages ?? doc?.pageCount ?? 1;
  const current = Math.min(Math.max(1, page), numPages);

  const [fit, setFit] = useState<Fit>("page");
  const [zoom, setZoom] = useState(1);
  const [dir, setDir] = useState(0);
  const [stageRef, stage] = useElementSize<HTMLDivElement>();

  const go = (n: number) => {
    if (!doc) return;
    const next = Math.min(Math.max(1, n), numPages);
    if (next === current) return;
    setDir(Math.sign(next - current));
    onNavigate(doc.id, next);
  };
  const openDoc = (id: string) => {
    setDir(0);
    setZoom(1);
    onNavigate(id, 1);
  };
  const zoomBy = (step: 1 | -1) =>
    setZoom((z) => {
      const i = ZOOMS.findIndex((x) => x >= z - 0.001);
      return ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, (i < 0 ? 3 : i) + step))];
    });

  // Keyboard: ← → PageUp/Down Home End, + − 0. Inputs keep their own keys.
  const keys = useRef<(e: KeyboardEvent) => void>(null);
  useEffect(() => {
    keys.current = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, select")) return;
      if (["ArrowRight", "PageDown"].includes(e.key)) go(current + 1);
      else if (["ArrowLeft", "PageUp"].includes(e.key)) go(current - 1);
      else if (e.key === "Home") go(1);
      else if (e.key === "End") go(numPages);
      else if (e.key === "+" || e.key === "=") zoomBy(1);
      else if (e.key === "-") zoomBy(-1);
      else if (e.key === "0") setZoom(1);
      else return;
      e.preventDefault();
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keys.current?.(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Sheet size from the page's real proportions, the stage size, fit mode and zoom.
  const pad = stage.w < 640 ? 16 : 40;
  const toolbar = 84;
  const ps = sizes[current - 1] ?? { w: 595, h: 842 };
  const availW = Math.max(120, stage.w - pad * 2);
  const availH = Math.max(160, stage.h - pad - toolbar);
  const fitScale =
    fit === "page" ? Math.min(availW / ps.w, availH / ps.h) : Math.min(availW / ps.w, 3);
  const sheetW = Math.round(ps.w * fitScale * zoom);
  const sheetH = Math.round(ps.h * fitScale * zoom);
  const ghosts = Math.min(2, numPages - current);

  return (
    <>
      {/* ── Top bar: identity · envelope switcher · actions ── */}
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-stage-line px-3 py-2.5 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {leading}
          <div className="flex min-w-0 flex-col">
            <DialogPrimitive.Title className="truncate text-sm font-semibold text-stage-ink">
              {title}
            </DialogPrimitive.Title>
            {subtitle && <p className="truncate text-xs text-stage-muted">{subtitle}</p>}
          </div>
        </div>
        {groups.length > 1 && (
          <div
            role="tablist"
            aria-label="Envelope"
            className="order-last flex w-full gap-1 rounded-lg bg-stage-raised p-1 sm:order-none sm:w-auto"
          >
            {groups.map((g) => {
              const active = g.id === group?.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={!g.docs.length}
                  onClick={() => g.docs[0] && openDoc(g.docs[0].id)}
                  className={cn(
                    "relative h-8 flex-1 rounded-md px-4 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 sm:flex-none",
                    active ? "text-stage-ink" : "text-stage-muted hover:text-stage-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="reader-envelope"
                      className="absolute inset-0 rounded-md bg-white/10"
                      transition={{ type: "spring", stiffness: 480, damping: 38 }}
                    />
                  )}
                  <span className="relative">{g.label}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex flex-1 items-center justify-end gap-1">
          {doc && (
            <>
              <StageButton asLink href={doc.url} target="_blank" label="Open in a new tab">
                <ExternalLink />
              </StageButton>
              <StageButton
                asLink
                href={`${doc.url}?download=1`}
                label={`Download ${doc.originalName}`}
              >
                <Download />
              </StageButton>
            </>
          )}
          <DialogPrimitive.Close asChild>
            <StageButton label="Close reader (Esc)">
              <X />
            </StageButton>
          </DialogPrimitive.Close>
        </div>
      </header>

      {/* Several files in one envelope → file pills */}
      {group && group.docs.length > 1 && (
        <div className="flex shrink-0 [scrollbar-width:none] gap-2 overflow-x-auto border-b border-stage-line px-3 py-2 sm:px-5">
          {group.docs.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => openDoc(d.id)}
              aria-current={d.id === doc?.id || undefined}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand",
                d.id === doc?.id
                  ? "border-brand bg-brand/20 text-stage-ink"
                  : "border-stage-line text-stage-muted hover:text-stage-ink",
              )}
              dir="auto"
            >
              {middleTruncate(d.originalName, 44)}
            </button>
          ))}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* ── Filmstrip ── */}
        {pdf && numPages > 1 && (
          <Filmstrip pdf={pdf} numPages={numPages} current={current} sizes={sizes} onSelect={go} />
        )}

        {/* ── Stage ── */}
        <div ref={stageRef} className="relative min-w-0 flex-1 overflow-auto">
          <div
            className="flex min-h-full min-w-full items-start justify-center"
            style={{ padding: `${pad}px ${pad}px ${toolbar}px` }}
          >
            {!doc ? (
              <Notice
                icon={<FileWarning />}
                title="No document"
                text="This envelope has no files."
              />
            ) : kind === "pdf" && error ? (
              <Notice
                icon={<FileWarning />}
                title="This PDF couldn't be opened"
                text="It may be damaged or password-protected. Download it to open it locally."
                doc={doc}
              />
            ) : kind === "pdf" && (!pdf || sizes.length === 0 || stage.w === 0) ? (
              <div
                className="flex items-center justify-center rounded-sm bg-white/5"
                style={{ width: Math.min(availW, 560), height: Math.min(availH, 760) }}
              >
                <Loader2
                  className="size-6 animate-spin text-stage-muted"
                  aria-label="Loading document"
                />
              </div>
            ) : kind === "pdf" && pdf ? (
              <div className="relative shrink-0" style={{ width: sheetW, height: sheetH }}>
                {/* The sheet stack: remaining pages peek out behind the current one. */}
                {Array.from({ length: ghosts }, (_, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="absolute inset-0 rounded-[3px] bg-white shadow-md"
                    style={{
                      transform: `translate(${(i + 1) * 5}px, ${(i + 1) * 5}px)`,
                      opacity: 0.32 - i * 0.12,
                    }}
                  />
                ))}
                <AnimatePresence initial={false} custom={dir} mode="popLayout">
                  <motion.div
                    key={`${doc.id}:${current}`}
                    custom={dir}
                    variants={{
                      enter: (d: number) => ({
                        opacity: 0,
                        x: d * 56,
                        rotateY: d * -6,
                        scale: d ? 1 : 0.985,
                      }),
                      center: { opacity: 1, x: 0, rotateY: 0, scale: 1 },
                      exit: (d: number) => ({ opacity: 0, x: d * -56, rotateY: d * 6 }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.32, ease: EASE }}
                    className="absolute inset-0 overflow-hidden rounded-[3px] bg-white shadow-lg [transform-style:preserve-3d]"
                    style={{ transformPerspective: 1600 }}
                  >
                    <PdfCanvas
                      pdf={pdf}
                      pageNumber={current}
                      width={sheetW}
                      label={`${doc.originalName}, page ${current}`}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : kind === "image" ? (
              /* eslint-disable-next-line @next/next/no-img-element -- user-uploaded file served by our API */
              <img
                src={doc.url}
                alt={doc.originalName}
                className="rounded-[3px] bg-white object-contain shadow-lg"
                style={{
                  maxWidth: availW * zoom,
                  maxHeight: fit === "page" ? availH * zoom : undefined,
                }}
              />
            ) : (
              <Notice
                icon={<FileWarning />}
                title={`No in-app preview for .${doc.ext} yet`}
                text="Word, Excel and other formats get a reader view later. The AI still reads their text."
                doc={doc}
              />
            )}
          </div>

          {/* ── Floating toolbar ── */}
          {doc && (kind === "pdf" || kind === "image") && (
            <div className="pointer-events-none sticky bottom-0 left-0 flex w-full justify-center pb-4">
              <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-stage-line bg-stage-raised/90 p-1.5 shadow-lg backdrop-blur-md">
                {kind === "pdf" && (
                  <>
                    <StageButton
                      label="Previous page (←)"
                      onClick={() => go(current - 1)}
                      disabled={current <= 1}
                    >
                      <ChevronLeft className="rtl:rotate-180" />
                    </StageButton>
                    <PageInput page={current} numPages={numPages} onGo={go} />
                    <StageButton
                      label="Next page (→)"
                      onClick={() => go(current + 1)}
                      disabled={current >= numPages}
                    >
                      <ChevronRight className="rtl:rotate-180" />
                    </StageButton>
                    <span aria-hidden className="mx-1 h-5 w-px bg-stage-line" />
                  </>
                )}
                <StageButton
                  label="Zoom out (−)"
                  onClick={() => zoomBy(-1)}
                  disabled={zoom <= ZOOMS[0]}
                >
                  <Minus />
                </StageButton>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  title="Reset zoom (0)"
                  aria-label={`Zoom ${Math.round(zoom * 100)}%. Reset zoom`}
                  className="h-8 min-w-14 rounded-md px-1 text-xs font-medium text-stage-ink tabular-nums outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <StageButton
                  label="Zoom in (+)"
                  onClick={() => zoomBy(1)}
                  disabled={zoom >= ZOOMS[ZOOMS.length - 1]}
                >
                  <Plus />
                </StageButton>
                <span aria-hidden className="mx-1 hidden h-5 w-px bg-stage-line sm:block" />
                <StageButton
                  label={fit === "page" ? "Fit to width" : "Fit whole page"}
                  onClick={() => {
                    setFit(fit === "page" ? "width" : "page");
                    setZoom(1);
                  }}
                  className="hidden sm:inline-flex"
                >
                  {fit === "page" ? <MoveHorizontal /> : <Scan />}
                </StageButton>
              </div>
            </div>
          )}
          <p aria-live="polite" className="sr-only">
            {kind === "pdf" ? `Page ${current} of ${numPages}` : ""}
          </p>
        </div>
      </div>
    </>
  );
}

function Filmstrip({
  pdf,
  numPages,
  current,
  sizes,
  onSelect,
}: {
  pdf: PDFDocumentProxy;
  numPages: number;
  current: number;
  sizes: { w: number; h: number }[];
  onSelect: (page: number) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-page="${current}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [current]);
  return (
    <nav aria-label="Pages" className="hidden w-32 shrink-0 border-e border-stage-line md:block">
      <ol
        ref={listRef}
        className="flex h-full [scrollbar-width:thin] flex-col items-center gap-4 overflow-y-auto px-3 py-5"
      >
        {Array.from({ length: numPages }, (_, i) => {
          const n = i + 1;
          const s = sizes[i] ?? { w: 595, h: 842 };
          const active = n === current;
          return (
            <li key={n} data-page={n} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelect(n)}
                aria-label={`Page ${n}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "overflow-hidden rounded-[2px] bg-white ring-offset-2 ring-offset-stage transition-[box-shadow,opacity] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  active ? "ring-2 ring-brand" : "opacity-60 hover:opacity-100",
                )}
                style={{ width: 88, height: Math.round((88 * s.h) / s.w) }}
              >
                <LazyThumb pdf={pdf} page={n} />
              </button>
              <span
                className={cn(
                  "text-2xs tabular-nums",
                  active ? "text-stage-ink" : "text-stage-muted",
                )}
              >
                {n}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Renders a thumbnail only once it scrolls into view. */
function LazyThumb({ pdf, page }: { pdf: PDFDocumentProxy; page: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="size-full">
      {visible && <PdfCanvas pdf={pdf} pageNumber={page} width={88} />}
    </div>
  );
}

function PageInput({
  page,
  numPages,
  onGo,
}: {
  page: number;
  numPages: number;
  onGo: (n: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    const n = Number(draft);
    if (draft !== null && Number.isFinite(n)) onGo(Math.round(n));
    setDraft(null);
  };
  return (
    <label className="flex items-center gap-1.5 px-1 text-xs text-stage-muted tabular-nums">
      <span className="sr-only">Page</span>
      <input
        inputMode="numeric"
        value={draft ?? String(page)}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setDraft(null);
        }}
        className="h-8 w-10 rounded-md bg-white/10 text-center text-xs font-medium text-stage-ink outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label={`Page number, 1 to ${numPages}`}
      />
      <span>/ {numPages}</span>
    </label>
  );
}

function StageButton({
  label,
  children,
  onClick,
  disabled,
  className,
  asLink,
  href,
  target,
  ...rest
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  asLink?: boolean;
  href?: string;
  target?: string;
}) {
  const cls = cn(
    "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-stage-muted outline-none transition-colors hover:bg-white/10 hover:text-stage-ink focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-4",
    className,
  );
  if (asLink) {
    return (
      <a
        href={href}
        target={target}
        rel={target ? "noreferrer" : undefined}
        aria-label={label}
        title={label}
        className={cls}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      {...rest}
    >
      {children}
    </button>
  );
}

function Notice({
  icon,
  title,
  text,
  doc,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  doc?: DocumentDto;
}) {
  return (
    <div className="mt-[10vh] flex max-w-sm flex-col items-center gap-3 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-white/5 text-stage-muted [&_svg]:size-6">
        {icon}
      </span>
      <h3 className="font-heading text-base font-semibold text-stage-ink">{title}</h3>
      <p className="text-[13px] leading-relaxed text-stage-muted">{text}</p>
      {doc && (
        <a
          href={`${doc.url}?download=1`}
          className="mt-1 inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-on-brand outline-none hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-stage"
        >
          <Download className="size-4" /> Download ({formatBytes(doc.sizeBytes)})
        </a>
      )}
    </div>
  );
}
