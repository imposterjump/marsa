/**
 * Per-page plain text of a PDF via pdf.js (legacy build, Node). Used by the mock engine to quote
 * real sentences with real page numbers, and to check evidence pages. Never fatal: [] on failure.
 */
export async function readPdfPages(bytes: Uint8Array): Promise<string[]> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = pdfjs.getDocument({
      // A plain Uint8Array copy: pdf.js rejects Node Buffers and may detach what it receives.
      data: new Uint8Array(bytes),
      verbosity: 0,
      disableFontFace: true,
      useSystemFonts: false,
    });
    const doc = await task.promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let out = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        out += item.str;
        out += item.hasEOL ? "\n" : "";
      }
      pages.push(out.replace(/[ \t]+/g, " ").trim());
      page.cleanup();
    }
    await task.destroy(); // pdf.js v6: destroy lives on the loading task
    return pages;
  } catch {
    return [];
  }
}
