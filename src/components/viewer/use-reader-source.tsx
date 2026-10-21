"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { api } from "@/lib/api-client";
import type { DocumentDto } from "@/lib/api-types";
import { extensionOf, fileKind } from "@/lib/files";
import { paginate } from "@/lib/paginate";
import { usePageSizes } from "./pdf-canvas";
import { usePdf } from "./use-pdf";

/** A page the reader lays out at w × h (CSS px at 100 %) and scales to the sheet size. */
export interface HtmlPage {
  w: number;
  h: number;
  /** Plain text, used to find evidence quotes. */
  text: string;
  render: () => React.ReactNode;
}

export type ReaderSource =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "none" }
  | { status: "ready"; kind: "pdf"; pdf: PDFDocumentProxy; sizes: { w: number; h: number }[] }
  | { status: "ready"; kind: "html"; pages: HtmlPage[]; css?: string };

interface SheetPreview {
  name: string;
  rows: string[][];
  truncated: boolean;
}
type PreviewDto =
  | { kind: "sheets"; sheets: SheetPreview[] }
  | { kind: "text"; text: string; truncated: boolean }
  | { kind: "none" };

const A4 = { w: 595, h: 842 };
const A4_LANDSCAPE = { w: 842, h: 595 };

/**
 * One adapter per format (RDD §8.3): PDF (pdf.js), image, DOCX (docx-preview, in the browser),
 * XLSX/CSV (one sheet per page) and TXT/MD/JSON (paged text) via /api/documents/:id/preview.
 * Everything else → "none" (download card).
 */
export function useReaderSource(doc: DocumentDto | undefined): ReaderSource {
  const kind = doc ? fileKind(doc.originalName) : "other";
  const ext = doc ? extensionOf(doc.originalName) : "";
  const isDocx = ext === "docx";
  const wantsPreview = !!doc && (kind === "sheet" || kind === "text") && ext !== "ods";

  const pdfState = usePdf(doc && kind === "pdf" ? doc.url : null);
  const sizes = usePageSizes(pdfState.pdf);
  const image = useImageSize(doc && kind === "image" ? doc.url : null);
  const docx = useDocx(doc && isDocx ? doc.url : null);
  const preview = useQuery({
    queryKey: ["documents", doc?.id, "preview"],
    queryFn: () => api<PreviewDto>(`/api/documents/${doc!.id}/preview`),
    enabled: wantsPreview,
    staleTime: Infinity,
  });

  if (!doc) return { status: "none" };
  if (kind === "pdf") {
    if (pdfState.error)
      return {
        status: "error",
        message: "This PDF couldn't be opened. It may be damaged or password-protected.",
      };
    if (!pdfState.pdf || sizes.length === 0) return { status: "loading" };
    return { status: "ready", kind: "pdf", pdf: pdfState.pdf, sizes };
  }
  if (kind === "image") {
    if (image.error) return { status: "error", message: "This image couldn't be loaded." };
    if (!image.size) return { status: "loading" };
    const { w, h } = image.size;
    return {
      status: "ready",
      kind: "html",
      pages: [
        {
          w,
          h,
          text: "",
          render: () => (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded file served by our API
            <img src={doc.url} alt={doc.originalName} className="block size-full object-contain" />
          ),
        },
      ],
    };
  }
  if (isDocx) {
    if (docx.error)
      return {
        status: "error",
        message: "This Word document couldn't be displayed. Download it to open it locally.",
      };
    if (!docx.pages) return { status: "loading" };
    return { status: "ready", kind: "html", pages: docx.pages, css: docx.css };
  }
  if (wantsPreview) {
    if (preview.isError) return { status: "error", message: "This file couldn't be previewed." };
    if (!preview.data) return { status: "loading" };
    const p = preview.data;
    if (p.kind === "sheets") {
      return {
        status: "ready",
        kind: "html",
        pages: p.sheets.map((s) => ({
          ...A4_LANDSCAPE,
          text: s.rows.map((r) => r.join(" ")).join("\n"),
          render: () => <SheetPage sheet={s} />,
        })),
      };
    }
    if (p.kind === "text") {
      const mono = ["json", "xml", "csv", "log"].includes(ext);
      return {
        status: "ready",
        kind: "html",
        pages: paginate(p.text).map((chunk) => ({
          ...A4,
          text: chunk,
          render: () => <TextPage text={chunk} mono={mono} />,
        })),
      };
    }
  }
  return { status: "none" };
}

function TextPage({ text, mono }: { text: string; mono: boolean }) {
  return (
    <div
      className={
        mono
          ? "size-full overflow-hidden bg-white px-12 py-12 font-mono text-[9.5px] leading-[1.55] whitespace-pre-wrap text-[#1b2733]"
          : "size-full overflow-hidden bg-white px-14 py-14 text-[11px] leading-[1.65] whitespace-pre-wrap text-[#1b2733]"
      }
      dir="auto"
    >
      {text}
    </div>
  );
}

function SheetPage({ sheet }: { sheet: SheetPreview }) {
  const cols = Math.max(1, ...sheet.rows.map((r) => r.length));
  return (
    <div className="flex size-full flex-col bg-white text-[#1b2733]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#d6d1c6] bg-[#f7f6f3] px-5 py-2.5">
        <span className="text-[11px] font-semibold">Sheet: {sheet.name}</span>
        <span className="text-[9px] text-[#5c6774]">
          {sheet.rows.length} rows{sheet.truncated ? " · preview truncated" : ""}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto overscroll-none">
        <table className="border-separate border-spacing-0 text-[9px] leading-snug">
          <tbody>
            {sheet.rows.map((row, i) => (
              <tr key={i} className={i % 2 ? "bg-[#fbfaf8]" : undefined}>
                <th className="sticky start-0 border-e border-b border-[#e6e2da] bg-[#f2f0eb] px-1.5 py-1 text-end font-normal text-[#848d98] tabular-nums">
                  {i + 1}
                </th>
                {Array.from({ length: cols }, (_, c) => (
                  <td
                    key={c}
                    className="max-w-[220px] border-e border-b border-[#eeebe5] px-2 py-1 align-top"
                    dir="auto"
                  >
                    {row[c] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function useImageSize(url: string | null) {
  const [state, setState] = useState<{
    url: string | null;
    size: { w: number; h: number } | null;
    error: boolean;
  }>({
    url: null,
    size: null,
    error: false,
  });
  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.onload = () =>
      setState({
        url,
        size: { w: img.naturalWidth || 800, h: img.naturalHeight || 600 },
        error: false,
      });
    img.onerror = () => setState({ url, size: null, error: true });
    img.src = url;
  }, [url]);
  return state.url === url ? state : { url, size: null, error: false };
}

/** Make docx-preview output safe to inject: no scripts, no inline handlers, no javascript: links. */
function sanitize(root: HTMLElement) {
  root
    .querySelectorAll("script, iframe, object, embed, link, meta, base, form")
    .forEach((el) => el.remove());
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.toLowerCase().startsWith("on")) el.removeAttribute(attr.name);
    }
    if (el instanceof HTMLAnchorElement) {
      const href = el.getAttribute("href") ?? "";
      if (!/^(https?:|mailto:|#)/i.test(href)) el.removeAttribute("href");
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
  });
}

const PT_TO_PX = 96 / 72;

/** Render a DOCX with docx-preview off-screen, then keep each page (section) as sanitized HTML. */
function useDocx(url: string | null) {
  const [state, setState] = useState<{
    url: string | null;
    pages: HtmlPage[] | null;
    css?: string;
    error: boolean;
  }>({ url: null, pages: null, error: false });
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText =
      "position:absolute;left:-100000px;top:0;visibility:hidden;pointer-events:none;";
    document.body.appendChild(host);
    void (async () => {
      try {
        const [{ renderAsync }, blob] = await Promise.all([
          import("docx-preview"),
          fetch(url).then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status))))),
        ]);
        const body = document.createElement("div");
        const styles = document.createElement("div");
        host.append(styles, body);
        await renderAsync(blob, body, styles, {
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          useBase64URL: true,
          renderComments: false,
          renderChanges: false,
          experimental: false,
        });
        if (cancelled) return;
        sanitize(body);
        const sections = Array.from(body.querySelectorAll<HTMLElement>("section.docx"));
        const pages: HtmlPage[] = sections.map((s) => {
          const minH = parseFloat(s.style.minHeight) || A4.h / PT_TO_PX;
          const w =
            Math.ceil(s.offsetWidth) || Math.round((parseFloat(s.style.width) || 595) * PT_TO_PX);
          const h = Math.max(Math.ceil(s.offsetHeight), Math.round(minH * PT_TO_PX));
          const html = s.outerHTML;
          return {
            w,
            h,
            text: s.textContent ?? "",
            render: () => (
              <div className="marsa-docx size-full" dangerouslySetInnerHTML={{ __html: html }} />
            ),
          };
        });
        const css = Array.from(styles.querySelectorAll("style"))
          .map((st) => st.textContent ?? "")
          .join("\n");
        setState({ url, pages, css, error: false });
      } catch {
        if (!cancelled) setState({ url, pages: null, error: true });
      } finally {
        host.remove();
      }
    })();
    return () => {
      cancelled = true;
      host.remove();
    };
  }, [url]);
  return state.url === url ? state : { url, pages: null, css: undefined, error: false };
}
