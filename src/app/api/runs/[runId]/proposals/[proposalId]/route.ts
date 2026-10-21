import { connection } from "next/server";
import { json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { getProposalResult } from "@/server/runs/read";

type Ctx = RouteContext<"/api/runs/[runId]/proposals/[proposalId]">;

/** One vendor: evaluation + findings, comparison, risks. */
export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { runId, proposalId } = await ctx.params;
  return json(getProposalResult(getDb(), runId, proposalId));
});
