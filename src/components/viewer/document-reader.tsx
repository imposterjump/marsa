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
  Maximize,
  Minimize,
  Minus,
  MoveHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Quote,
  Scan,
  SearchX,
  X,
} from "lucide-react";
import { cn } from "cn";
import type { DocumentDto } from "@/lib/api-types";
import { formatBytes, middleTruncate } from "@/lib/files";
import { findQuotePage, highlightQuote } from "@/lib/quote";
import { preloadPdfjs } from "@/lib/pdf/pdfjs";
import { PdfCanvas } from "./pdf-canvas";
import { PdfTextLayer } from "./pdf-text-layer";
import { useReaderSource, type HtmlPage, type ReaderSource } from "./use-reader-source";

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
  /** Evidence quote to find, jump to and highlight (deep link `q`, RDD §8.4). */
  quote?: string | null;
}

type Fit = "page" | "width";
type ReadySource = Extract<ReaderSource, { status: "ready" }>;
const ZOOMS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2, 2.5, 3];
/** Documents open at 200 % of "whole page" (user, 2026-10-25: pages looked too far away), or
 * at full width when 200 % would be wider than the stage (landscape sheets, phones). */
const OPEN_ZOOM = 2;
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Full-screen document reader, "Sheet Stack" (PRD FR-7, P5.4–P5.7): one page at a time on a dark
 * stage with the remaining pages stacked behind it; page turns; filmstrip; scrubber; floating
 * toolbar (page, zoom, fit, fullscreen); keyboard; quote highlight. PDF, images, DOCX, XLSX/CSV
 * and text files (see useReaderSource). Replaces the browser PDF viewer everywhere.
 */
export function DocumentReader(props: DocumentReaderProps) {
  // Pages with a reader warm the PDF engine while idle, so the first document opens fast.
  useEffect(() => preloadPdfjs(), []);
  return (
    <DialogPrimitive.Root open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgb(4_10_18/0.6)] backdrop-blur-[3px] duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-stage text-stage-ink shadow-lg duration-200 outline-none sm:inset-3 sm:rounded-2xl sm:border sm:border-stage-line data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.985] data-closed:animate-out data-closed:fade-out-0 [&:fullscreen]:inset-0 [&:fullscreen]:rounded-none"
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

function pageSizes(source: ReaderSource): { w: number; h: number }[] {
  if (source.status !== "ready") return [];
  return source.kind === "pdf" ? source.sizes : source.pages.map((p) => ({ w: p.w, h: p.h }));
}

/** Text of every page, for finding a quote (PDF text is extracted lazily, once per document). */
const pdfTextCache = new WeakMap<PDFDocumentProxy, Promise<string[]>>();
function pageTexts(source: ReadySource): Promise<string[]> {
  if (source.kind === "html") return Promise.resolve(source.pages.map((p) => p.text));
  const pdf = source.pdf;
  let hit = pdfTextCache.get(pdf);
  if (!hit) {
    hit = (async () => {
      const out: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const content = await (await pdf.getPage(i)).getTextContent();
        out.push(content.items.map((it) => ("str" in it ? it.str : "")).join(""));
      }
      return out;
    })();
    pdfTextCache.set(pdf, hit);
  }
  return hit;
}

function ReaderBody({
  title,
  subtitle,
  leading,
  groups,
  docId,
  page,
  onNavigate,
  quote,
}: DocumentReaderProps) {
  const all = groups.flatMap((g) => g.docs);
  const doc = all.find((d) => d.id === docId) ?? all[0];
  const group = groups.find((g) => g.docs.some((d) => d.id === doc?.id));
  const source = useReaderSource(doc);
  const sizes = pageSizes(source);
  const numPages = sizes.length || doc?.pageCount || 1;
  const current = Math.min(Math.max(1, page), numPages);
  const ready = source.status === "ready";

  const [fit, setFit] = useState<Fit>("page");
  // null = the opening zoom (OPEN_ZOOM, capped to the width), worked out from the layout below.
  const [zoomSet, setZoom] = useState<number | null>(null);
  const [dir, setDir] = useState(0);
  const [strip, setStrip] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [pulse, setPulse] = useState(0);
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
    setZoom(null);
    onNavigate(id, 1);
  };
  // Next preset up or down from the current zoom (which may sit between presets).
  const zoomBy = (step: 1 | -1) =>
    setZoom(
      (step > 0 ? ZOOMS.find((x) => x > zoom + 0.001) : ZOOMS.findLast((x) => x < zoom - 0.001)) ??
        zoom,
    );
  const toggleFullscreen = () => {
    const root = stageRef.current?.closest<HTMLElement>("[role='dialog']");
    if (!root) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.requestFullscreen?.().catch(() => {});
  };
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, []);

  // ── Evidence quote: find its page once per (document, quote), then highlight + pulse ──
  const [quoteState, setQuoteState] = useState<{ key: string; status: "found" | "missing" } | null>(
    null,
  );
  const quoteKey = quote && doc ? `${doc.id}|${quote}` : null;
  const navigate = useRef(onNavigate);
  const currentRef = useRef(current);
  useEffect(() => {
    navigate.current = onNavigate;
    currentRef.current = current;
  });
  useEffect(() => {
    if (!quote || !doc || source.status !== "ready" || !quoteKey) return;
    let cancelled = false;
    void pageTexts(source).then((texts) => {
      if (cancelled) return;
      const here = currentRef.current - 1;
      const hit = findQuotePage(texts, quote, here);
      setQuoteState({ key: quoteKey, status: hit < 0 ? "missing" : "found" });
      if (hit >= 0 && hit !== here) {
        setDir(0);
        navigate.current(doc.id, hit + 1);
      }
    });
    return () => {
      cancelled = true;
    };
    // Search once per quote and document; page turns afterwards must not re-run it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey, source.status]);
  const quoteStatus = quoteState?.key === quoteKey ? quoteState.status : quote ? "searching" : null;
  // Pulse and scroll once per quote and page: a highlight re-applied by a re-render must not
  // trigger another state update (that was a highlight ↔ render loop on sheet pages, G-72).
  const lastHit = useRef<string | null>(null);
  const onHighlight = (mark: HTMLElement | null) => {
    if (!mark) {
      lastHit.current = null; // coming back to the quote's page pulses and scrolls again
      return;
    }
    const hitKey = `${quoteKey}|${current}`;
    if (lastHit.current === hitKey) return;
    lastHit.current = hitKey;
    setPulse(Date.now());
    requestAnimationFrame(() => {
      // Sheet and text pages scroll inside themselves (and are CSS-scaled): centre the mark in
      // those inner areas first, otherwise a row near the bottom stays cut off (G-72).
      for (let a = mark.parentElement; a && a !== stageRef.current; a = a.parentElement) {
        if (!/(auto|scroll)/.test(getComputedStyle(a).overflowY)) continue;
        if (a.scrollHeight <= a.clientHeight) continue;
        const box = a.getBoundingClientRect();
        const m = mark.getBoundingClientRect();
        const scale = box.height / a.clientHeight || 1;
        a.scrollTop += (m.top - box.top - (box.height - m.height) / 2) / scale;
      }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      mark.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: reduce ? "auto" : "smooth",
      });
    });
  };

  // Keyboard: ← → PageUp/Down Home End, + − 0, F. Inputs keep their own keys.
  const keys = useRef<(e: KeyboardEvent) => void>(null);
  useEffect(() => {
    keys.current = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement)?.closest("input, textarea, select") ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (["ArrowRight", "PageDown"].includes(e.key)) go(current + 1);
      else if (["ArrowLeft", "PageUp"].includes(e.key)) go(current - 1);
      else if (e.key === "Home") go(1);
      else if (e.key === "End") go(numPages);
      else if (e.key === "+" || e.key === "=") zoomBy(1);
      else if (e.key === "-") zoomBy(-1);
      else if (e.key === "0") setZoom(null);
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
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
  const multi = numPages > 1;
  const pad = stage.w < 640 ? 16 : 40;
  const toolbar = multi ? 108 : 84;
  const ps = sizes[current - 1] ?? { w: 595, h: 842 };
  const tall = ps.h / ps.w > 1.9; // long pages (e.g. a DOCX without page breaks) read better at width
  const effectiveFit: Fit = tall ? "width" : fit;
  const bannerSpace = quote ? 56 : 0; // keep the evidence banner off the top of the page
  // Auto-width pages (tall) stay at a readable measure instead of filling a wide screen.
  const availW = Math.max(120, Math.min(stage.w - pad * 2, tall ? 880 : Infinity));
  const availH = Math.max(160, stage.h - pad - bannerSpace - toolbar);
  const widthScale = Math.min(availW / ps.w, 3);
  const fitScale = effectiveFit === "page" ? Math.min(availW / ps.w, availH / ps.h) : widthScale;
  const zoom =
    zoomSet ?? (effectiveFit === "page" ? Math.min(OPEN_ZOOM, widthScale / fitScale) : 1);
  const sheetW = Math.round(ps.w * fitScale * zoom);
  const sheetH = Math.round(ps.h * fitScale * zoom);
  const ghosts = Math.min(3, numPages - current);

  return (
    <>
      {source.status === "ready" && source.kind === "html" && source.css && (
        <style>{source.css}</style>
      )}

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
              <StageButton
                asLink
                href={doc.url}
                target="_blank"
                label="Open the original in a new tab"
              >
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
          <StageButton
            label={fullscreen ? "Exit full screen (F)" : "Full screen (F)"}
            onClick={toggleFullscreen}
            className="hidden sm:inline-flex"
          >
            {fullscreen ? <Minimize /> : <Maximize />}
          </StageButton>
          <DialogPrimitive.Close asChild>
            <StageButton label="Close reader (Esc)">
              <X />
            </StageButton>
          </DialogPrimitive.Close>
        </div>
      </header>

      {/* Several files in one envelope → file pills (FR-7.4) */}
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
        {/* ── Filmstrip (multi-page only, collapsible) ── */}
        {source.status === "ready" && multi && strip && (
          <Filmstrip source={source} current={current} onSelect={go} />
        )}

        {/* ── Stage ── */}
        <div ref={stageRef} className="relative min-w-0 flex-1 overflow-auto overscroll-none">
          {quoteStatus && quote && <QuoteBanner status={quoteStatus} quote={quote} />}
          <div
            className="flex min-h-full min-w-full items-start justify-center"
            style={{ padding: `${pad + bannerSpace}px ${pad}px ${toolbar}px` }}
          >
            {!doc || source.status === "none" ? (
              <Notice
                icon={<FileWarning />}
                title={doc ? `No in-app preview for .${doc.ext}` : "No document"}
                text={
                  doc
                    ? "Download the file to open it locally. The AI still reads its text where possible."
                    : "This envelope has no files."
                }
                doc={doc}
              />
            ) : source.status === "error" ? (
              <Notice
                icon={<FileWarning />}
                title="Couldn't open this file"
                text={source.message}
                doc={doc}
              />
            ) : source.status === "loading" || stage.w === 0 ? (
              <div
                className="flex items-center justify-center rounded-sm bg-white/5"
                style={{ width: Math.min(availW, 560), height: Math.min(availH, 760) }}
              >
                <Loader2
                  className="size-6 animate-spin text-stage-muted"
                  aria-label="Loading document"
                />
              </div>
            ) : (
              <div className="relative isolate shrink-0" style={{ width: sheetW, height: sheetH }}>
                {/* The sheet stack: up to three remaining pages peek out behind the current one. */}
                {Array.from({ length: ghosts }, (_, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="absolute inset-0 -z-10 rounded-[3px] bg-white shadow-md"
                    style={{
                      transform: `translate(${(i + 1) * 5}px, ${(i + 1) * 5}px)`,
                      opacity: 0.34 - i * 0.1,
                    }}
                  />
                ))}
                <AnimatePresence initial={false} custom={dir} mode="popLayout">
                  <motion.div
                    key={`${doc.id}:${current}`}
                    custom={dir}
                    variants={{
                      // RDD §8.2: next rises from the first ghost; prev slides in from the left.
                      enter: (d: number) =>
                        d > 0
                          ? { opacity: 0.4, x: 5, y: 5, scale: 0.985, rotate: 0 }
                          : d < 0
                            ? { opacity: 0, x: -32, y: 0, scale: 1, rotate: -1.5 }
                            : { opacity: 0, x: 0, y: 6, scale: 0.99, rotate: 0 },
                      center: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 },
                      exit: (d: number) =>
                        d > 0
                          ? {
                              opacity: 0,
                              x: -32,
                              rotate: -1.5,
                              transition: { duration: 0.2, ease: EASE },
                            }
                          : d < 0
                            ? {
                                opacity: 0,
                                x: 5,
                                y: 5,
                                scale: 0.985,
                                transition: { duration: 0.2, ease: EASE },
                              }
                            : { opacity: 0, transition: { duration: 0.12 } },
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.32, ease: EASE }}
                    className="absolute inset-0 overflow-hidden rounded-[3px] bg-white shadow-lg"
                  >
                    {/* Re-keyed on each highlight so the 1.2 s pulse replays (RDD §8.4). */}
                    <span
                      key={pulse}
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-0 z-20 rounded-[3px]",
                        pulse > 0 && "marsa-pulse",
                      )}
                    />
                    {source.kind === "pdf" ? (
                      <>
                        <PdfCanvas
                          pdf={source.pdf}
                          pageNumber={current}
                          width={sheetW}
                          label={`${doc.originalName}, page ${current}`}
                        />
                        <PdfTextLayer
                          pdf={source.pdf}
                          pageNumber={current}
                          width={sheetW}
                          quote={quoteStatus === "found" ? quote : null}
                          onHighlight={onHighlight}
                        />
                      </>
                    ) : (
                      <ScaledHtml
                        page={source.pages[current - 1]}
                        width={sheetW}
                        label={`${doc.originalName}, page ${current}`}
                        quote={quoteStatus === "found" ? quote : null}
                        onHighlight={onHighlight}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ── Scrubber + floating toolbar ── */}
          {doc && ready && (
            <div className="pointer-events-none sticky bottom-0 left-0 flex w-full flex-col items-center gap-2 pb-4">
              {multi && numPages <= 150 && (
                <Scrubber numPages={numPages} current={current} onSelect={go} />
              )}
              <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-stage-line bg-stage-raised/90 p-1.5 shadow-lg backdrop-blur-md">
                {multi ? (
                  <>
                    <StageButton
                      label={strip ? "Hide thumbnails" : "Show thumbnails"}
                      onClick={() => setStrip((s) => !s)}
                      className="hidden md:inline-flex"
                    >
                      {strip ? <PanelLeftClose /> : <PanelLeftOpen />}
                    </StageButton>
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
                  </>
                ) : (
                  <span className="px-2 text-xs text-stage-muted">1 page</span>
                )}
                <span aria-hidden className="mx-1 h-5 w-px bg-stage-line" />
                <StageButton
                  label="Zoom out (−)"
                  onClick={() => zoomBy(-1)}
                  disabled={zoom <= ZOOMS[0]}
                >
                  <Minus />
                </StageButton>
                <button
                  type="button"
                  onClick={() => setZoom(null)}
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
                {!tall && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          )}
          <p aria-live="polite" className="sr-only">
            {ready ? `Page ${current} of ${numPages}` : ""}
          </p>
        </div>
      </div>
    </>
  );
}

/** An HTML page (DOCX section, text, sheet, image) laid out at its own size and scaled to the sheet. */
function ScaledHtml({
  page,
  width,
  label,
  quote,
  onHighlight,
}: {
  page: HtmlPage | undefined;
  width: number;
  label?: string;
  quote?: string | null;
  onHighlight?: (mark: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const notify = useRef(onHighlight);
  useEffect(() => {
    notify.current = onHighlight;
  });
  useEffect(() => {
    if (!ref.current || !quote) return;
    notify.current?.(highlightQuote(ref.current, quote));
  }, [quote, page]);
  if (!page) return null;
  const scale = width / page.w;
  return (
    <div role="img" aria-label={label} className="relative size-full overflow-hidden">
      <div
        ref={ref}
        className="absolute start-0 top-0 origin-top-left"
        style={{ width: page.w, height: page.h, transform: `scale(${scale})` }}
      >
        {page.render()}
      </div>
    </div>
  );
}

function Filmstrip({
  source,
  current,
  onSelect,
}: {
  source: ReadySource;
  current: number;
  onSelect: (page: number) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-page="${current}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [current]);
  const sizes = pageSizes(source);
  return (
    <nav aria-label="Pages" className="hidden w-32 shrink-0 border-e border-stage-line md:block">
      <ol
        ref={listRef}
        className="flex h-full [scrollbar-width:thin] flex-col items-center gap-4 overflow-y-auto overscroll-none px-3 py-5"
      >
        {sizes.map((s, i) => {
          const n = i + 1;
          const active = n === current;
          return (
            <li key={n} data-page={n} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelect(n)}
                aria-label={`Page ${n}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "overflow-hidden rounded-[2px] bg-white ring-offset-2 ring-offset-stage transition-[box-shadow,opacity,transform] duration-150 outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand",
                  active ? "ring-2 ring-brand" : "opacity-60 hover:opacity-100",
                )}
                style={{ width: 88, height: Math.min(260, Math.round((88 * s.h) / s.w)) }}
              >
                <LazyThumb>
                  {source.kind === "pdf" ? (
                    <PdfCanvas pdf={source.pdf} pageNumber={n} width={88} />
                  ) : (
                    <ScaledHtml page={source.pages[i]} width={88} />
                  )}
                </LazyThumb>
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

/** Renders its children only once scrolled into view. */
function LazyThumb({ children }: { children: React.ReactNode }) {
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
    <div ref={ref} className="pointer-events-none size-full" aria-hidden>
      {visible && children}
    </div>
  );
}

/** One tick per page (RDD §8.1). Mouse shortcut only; keyboard users have the page input. */
function Scrubber({
  numPages,
  current,
  onSelect,
}: {
  numPages: number;
  current: number;
  onSelect: (n: number) => void;
}) {
  return (
    <div
      aria-hidden
      // Same frosted surface as the toolbar: at 200 % the page runs under it.
      className="pointer-events-auto hidden max-w-[min(560px,80%)] items-end gap-[3px] rounded-full border border-stage-line bg-stage-raised/90 px-2.5 py-1.5 shadow-lg backdrop-blur-md sm:flex"
    >
      {Array.from({ length: numPages }, (_, i) => {
        const n = i + 1;
        const active = n === current;
        return (
          <button
            key={n}
            type="button"
            tabIndex={-1}
            onClick={() => onSelect(n)}
            title={`Page ${n}`}
            className={cn(
              "w-1.5 shrink rounded-full transition-[height,background-color] duration-150",
              active
                ? "h-3.5 bg-brand"
                : n < current
                  ? "h-2 bg-white/35 hover:h-3 hover:bg-white/60"
                  : "h-2 bg-white/15 hover:h-3 hover:bg-white/50",
            )}
          />
        );
      })}
    </div>
  );
}

function QuoteBanner({
  status,
  quote,
}: {
  status: "searching" | "found" | "missing";
  quote: string;
}) {
  const short = quote.length > 90 ? `${quote.slice(0, 90).trimEnd()}…` : quote;
  return (
    <div className="pointer-events-none sticky top-3 z-10 flex h-0 justify-center overflow-visible px-4">
      <div
        role="status"
        className={cn(
          "pointer-events-auto flex h-fit max-w-xl items-start gap-2 rounded-lg border bg-stage-raised/95 px-3 py-2 text-xs text-stage-ink shadow-lg backdrop-blur-md",
          status === "missing" ? "border-partial/40" : "border-brand/50",
        )}
      >
        {status === "missing" ? (
          <SearchX className="mt-px size-3.5 shrink-0 text-partial" aria-hidden />
        ) : status === "searching" ? (
          <Loader2 className="mt-px size-3.5 shrink-0 animate-spin text-stage-muted" aria-hidden />
        ) : (
          <Quote className="mt-px size-3.5 shrink-0 text-brand" aria-hidden />
        )}
        <span>
          <span className="font-semibold">
            {status === "missing"
              ? "Quote not found in this document: "
              : status === "searching"
                ? "Finding: "
                : "Evidence: "}
          </span>
          <span className="text-stage-muted">“{short}”</span>
        </span>
      </div>
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
