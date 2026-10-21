import { connection } from "next/server";
import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { listProposals, proposalSubmitSchema, submitProposal } from "@/server/services/proposals";
import { getStorage } from "@/server/storage";

type Ctx = RouteContext<"/api/projects/[projectId]/proposals">;

export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { projectId } = await ctx.params;
  return json(listProposals(getDb(), projectId));
});

/**
 * Start (or restart) a vendor's submission. Files follow one per request on
 * POST /api/proposals/:id/documents (HANDOFF G-39). 201 = new, 200 = resubmission.
 */
export const POST = withErrors(async (req: Request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  const { vendorId } = await readJson(req, proposalSubmitSchema);
  const { proposal, replaced } = await submitProposal(getDb(), getStorage(), projectId, vendorId);
  return json({ ...proposal, replaced }, { status: replaced ? 200 : 201 });
});
