import { connection } from "next/server";
import { json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { toDocumentDto } from "@/server/documents/dto";
import { deleteProposal, getProposal } from "@/server/services/proposals";
import { getStorage } from "@/server/storage";

type Ctx = RouteContext<"/api/proposals/[proposalId]">;

export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { proposalId } = await ctx.params;
  const p = getProposal(getDb(), proposalId);
  return json({
    ...p,
    commercialDocuments: p.commercialDocuments.map(toDocumentDto),
    technicalDocuments: p.technicalDocuments.map(toDocumentDto),
  });
});

export const DELETE = withErrors(async (_req: Request, ctx: Ctx) => {
  const { proposalId } = await ctx.params;
  await deleteProposal(getDb(), getStorage(), proposalId);
  return new Response(null, { status: 204 });
});
