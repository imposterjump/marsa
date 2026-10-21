import { connection } from "next/server";
import { json, notFound, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { toDocumentDto } from "@/server/documents/dto";
import { deleteDocument, getDocument } from "@/server/documents/ingest";
import { getStorage } from "@/server/storage";

type Ctx = RouteContext<"/api/documents/[documentId]">;

export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { documentId } = await ctx.params;
  const row = getDocument(getDb(), documentId);
  if (!row) throw notFound("Document");
  return json(toDocumentDto(row));
});

export const DELETE = withErrors(async (_req: Request, ctx: Ctx) => {
  const { documentId } = await ctx.params;
  await deleteDocument(getDb(), getStorage(), documentId);
  return new Response(null, { status: 204 });
});
