"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getPdf } from "@/lib/pdf/pdfjs";

/** Load a PDF by URL (cached across components, see getPdf). Pass null to skip. */
export function usePdf(url: string | null) {
  const [state, setState] = useState<{
    url: string | null;
    pdf: PDFDocumentProxy | null;
    error: boolean;
  }>({ url: null, pdf: null, error: false });
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    getPdf(url).then(
      (pdf) => !cancelled && setState({ url, pdf, error: false }),
      () => !cancelled && setState({ url, pdf: null, error: true }),
    );
    return () => {
      cancelled = true;
    };
  }, [url]);
  return state.url === url ? state : { url, pdf: null, error: false };
}
