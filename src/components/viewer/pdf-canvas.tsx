"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { cn } from "cn";
import { useT } from "@/components/i18n-provider";

/**
 * One PDF page rendered to a canvas `width` CSS pixels wide, sharp on high-DPI screens.
 * Renders off-screen and swaps in one frame, so zooming never flashes a blank page; fades in
 * the first time a page appears. The caller sizes the surrounding sheet (see usePageSizes).
 */
export function PdfCanvas({
  pdf,
  pageNumber,
  width,
  className,
  label,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  className?: string;
  label?: string;
}) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState<number | null>(null); // page currently painted

  useEffect(() => {
    let task: RenderTask | null = null;
    let cancelled = false;
    void (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled || width <= 0) return;
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: width / base.width });
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const off = document.createElement("canvas");
      off.width = Math.floor(viewport.width * dpr);
      off.height = Math.floor(viewport.height * dpr);
      task = page.render({
        canvas: off,
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      });
      try {
        await task.promise;
      } catch {
        return; // cancelled by fast paging/zooming: expected
      }
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      canvas.width = off.width;
      canvas.height = off.height;
      canvas.getContext("2d")?.drawImage(off, 0, 0);
      setShown(pageNumber);
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, pageNumber, width]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label ?? t("Page {n}", { n: pageNumber })}
      className={cn(
        "block size-full bg-white transition-opacity duration-300",
        shown === pageNumber ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}

/** Page sizes (PDF points) of a document, loaded once per document. */
export function usePageSizes(pdf: PDFDocumentProxy | null) {
  const [sizes, setSizes] = useState<{
    pdf: PDFDocumentProxy | null;
    list: { w: number; h: number }[];
  }>({
    pdf: null,
    list: [],
  });
  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    void (async () => {
      const list: { w: number; h: number }[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const vp = (await pdf.getPage(i)).getViewport({ scale: 1 });
        list.push({ w: vp.width, h: vp.height });
      }
      if (!cancelled) setSizes({ pdf, list });
    })();
    return () => {
      cancelled = true;
    };
  }, [pdf]);
  return sizes.pdf === pdf ? sizes.list : [];
}
