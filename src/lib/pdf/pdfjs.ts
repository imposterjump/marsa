/**
 * Browser-side pdf.js (P5.4). Loaded lazily from client effects only: pdf.js touches DOM APIs at
 * import time, so it must never run during SSR. The worker is created with
 * `new Worker(new URL(…, import.meta.url))`, which Turbopack bundles as its own chunk.
 * The server uses the legacy build separately (src/server/documents/pdf-meta.ts).
 */
import type { PDFDocumentProxy } from "pdfjs-dist";

type PdfJs = typeof import("pdfjs-dist");

let lib: Promise<PdfJs> | null = null;

export function loadPdfjs(): Promise<PdfJs> {
  lib ??= import("pdfjs-dist").then(
    (pdfjs) => {
      if (!pdfjs.GlobalWorkerOptions.workerPort) {
        pdfjs.GlobalWorkerOptions.workerPort = new Worker(
          new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
          { type: "module" },
        );
      }
      return pdfjs;
    },
    (err) => {
      lib = null; // a failed download (e.g. offline) is retried on the next call
      throw err;
    },
  );
  return lib;
}

/**
 * Warm pdf.js and its worker while the browser is idle (user, 2026-10-25: the first evidence
 * link was slow). Measured on the production build: a cold first open took 0.4–0.9 s to the
 * highlight, a new document with pdf.js warm 0.16 s. Nothing else changes. Returns a cancel.
 */
export function preloadPdfjs(): () => void {
  const run = () => void loadPdfjs().catch(() => {});
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, 1500);
  return () => window.clearTimeout(id);
}

// Small LRU of open documents: switching Commercial ↔ Technical or between vendors is instant.
// pdf.js 6 destroys through the loading task, not the document (HANDOFF G-38).
const MAX_OPEN = 8;
const cache = new Map<string, { promise: Promise<PDFDocumentProxy>; destroy: () => void }>();

export function getPdf(url: string): Promise<PDFDocumentProxy> {
  const hit = cache.get(url);
  if (hit) {
    cache.delete(url);
    cache.set(url, hit); // most recently used last
    return hit.promise;
  }
  let destroy = () => {};
  const promise = loadPdfjs().then((pdfjs) => {
    const task = pdfjs.getDocument({ url });
    destroy = () => void task.destroy().catch(() => {});
    return task.promise;
  });
  const entry = { promise, destroy: () => destroy() };
  promise.catch(() => cache.delete(url));
  cache.set(url, entry);
  while (cache.size > MAX_OPEN) {
    const [oldest, e] = cache.entries().next().value!;
    cache.delete(oldest);
    e.destroy();
  }
  return promise;
}
