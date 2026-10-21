"use client";

import { useEffect, useRef } from "react";
import type { PDFDocumentProxy, TextLayer } from "pdfjs-dist";
import { loadPdfjs } from "@/lib/pdf/pdfjs";
import { highlightQuote } from "@/lib/quote";

/**
 * pdf.js text layer over a page canvas (P5.7): makes the text selectable and lets the reader
 * highlight an evidence quote. Styles: `.textLayer` in globals.css (trimmed from pdf_viewer.css).
 */
export function PdfTextLayer({
  pdf,
  pageNumber,
  width,
  quote,
  onHighlight,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  quote?: string | null;
  /** Called after each render with the first highlight (or null when the quote isn't on the page). */
  onHighlight?: (mark: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const notify = useRef(onHighlight);
  useEffect(() => {
    notify.current = onHighlight;
  });

  useEffect(() => {
    let layer: TextLayer | null = null;
    let cancelled = false;
    void (async () => {
      const [pdfjs, page] = await Promise.all([loadPdfjs(), pdf.getPage(pageNumber)]);
      const el = ref.current;
      if (cancelled || !el || width <= 0) return;
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: width / base.width });
      el.replaceChildren();
      el.style.setProperty("--total-scale-factor", String(viewport.scale));
      layer = new pdfjs.TextLayer({
        textContentSource: page.streamTextContent(),
        container: el,
        viewport,
      });
      try {
        await layer.render();
      } catch {
        return; // cancelled
      }
      if (cancelled) return;
      notify.current?.(quote ? highlightQuote(el, quote) : null);
    })();
    return () => {
      cancelled = true;
      layer?.cancel();
    };
  }, [pdf, pageNumber, width, quote]);

  return <div ref={ref} className="textLayer" />;
}
