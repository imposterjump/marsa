/**
 * PDF metadata via pdf.js (legacy build runs in Node without a worker setup).
 * pdfjs-dist is in next.config `serverExternalPackages`, so it is loaded at runtime, not bundled.
 */
export interface PdfMeta {
  pageCount: number | null;
  encrypted: boolean;
}

export async function readPdfMeta(bytes: Uint8Array): Promise<PdfMeta> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = pdfjs.getDocument({
      data: bytes.slice(), // pdf.js may transfer/detach the buffer it receives
      verbosity: 0,
      disableFontFace: true,
      useSystemFonts: false,
    });
    const doc = await task.promise;
    const pageCount = doc.numPages;
    await task.destroy(); // pdf.js v6: destroy lives on the loading task
    return { pageCount, encrypted: false };
  } catch (err) {
    const name = (err as { name?: string })?.name;
    return { pageCount: null, encrypted: name === "PasswordException" };
  }
}
