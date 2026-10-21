import { connection } from "next/server";
import { errorResponse, notFound, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { getDocument } from "@/server/documents/ingest";
import { getStorage } from "@/server/storage";

/**
 * Stream a stored file. Inline by default (viewer, new tab); `?download=1` forces download.
 * Supports single HTTP Range requests (pdf.js loads large PDFs in chunks).
 */
export const GET = withErrors(
  async (req: Request, ctx: RouteContext<"/api/documents/[documentId]/file">) => {
    await connection();
    const { documentId } = await ctx.params;
    const doc = getDocument(getDb(), documentId);
    if (!doc) throw notFound("Document");

    const storage = getStorage();
    if (!(await storage.exists(doc.storagePath))) throw notFound("File");
    const size = await storage.size(doc.storagePath);

    const download = new URL(req.url).searchParams.get("download") === "1";
    const ascii = doc.originalName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
    const disposition = `${download ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`;
    const base = {
      "Content-Type": doc.mimeType,
      "Content-Disposition": disposition,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-cache",
      "X-Content-Type-Options": "nosniff",
    };

    const range = req.headers.get("range");
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (!m || (!m[1] && !m[2]))
        return errorResponse(416, "range_invalid", "Invalid Range header.");
      let start = m[1] ? Number(m[1]) : size - Number(m[2]);
      let end = m[1] && m[2] ? Number(m[2]) : size - 1;
      start = Math.max(0, start);
      end = Math.min(end, size - 1);
      if (start > end || start >= size) {
        return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      }
      return new Response(storage.stream(doc.storagePath, { start, end }), {
        status: 206,
        headers: {
          ...base,
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Content-Length": String(end - start + 1),
        },
      });
    }
    return new Response(storage.stream(doc.storagePath), {
      headers: { ...base, "Content-Length": String(size) },
    });
  },
);
