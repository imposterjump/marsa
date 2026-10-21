import { connection } from "next/server";
import { json, notFound, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { getDocument } from "@/server/documents/ingest";
import { buildPreview } from "@/server/documents/preview";
import { getStorage } from "@/server/storage";

/** Reader preview for spreadsheets, CSV and text files (P5.6). PDFs/images/DOCX render in the browser. */
export const GET = withErrors(
  async (_req: Request, ctx: RouteContext<"/api/documents/[documentId]/preview">) => {
    await connection();
    const { documentId } = await ctx.params;
    const row = getDocument(getDb(), documentId);
    if (!row) throw notFound("Document");
    const bytes = new Uint8Array(await getStorage().read(row.storagePath));
    return json(await buildPreview(row.originalName, bytes));
  },
);
