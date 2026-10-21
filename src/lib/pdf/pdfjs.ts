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
  lib ??= import("pdfjs-dist").then((pdfjs) => {
    if (!pdfjs.GlobalWorkerOptions.workerPort) {
      pdfjs.GlobalWorkerOptions.workerPort = new Worker(
        new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
        { type: "module" },
      );
    }
    return pdfjs;
  });
  return lib;
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
