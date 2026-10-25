import { connection } from "next/server";
import { json, withErrors } from "@/server/api";
import { getBoqComparison } from "@/server/boq/load";
import { getDb } from "@/server/db/client";
import { getRun } from "@/server/runs/store";
import { getStorage } from "@/server/storage";

type Ctx = RouteContext<"/api/projects/[projectId]/boq">;

/**
 * The price comparison of a building works tender (2026-10-25): the bidders' priced bills of
 * quantities against the client's, item by item. `?run=` compares the bids of that analysis.
 * `{ comparison: null }` when the tender has no Excel bill of quantities.
 */
export const GET = withErrors(async (req: Request, ctx: Ctx) => {
  await connection();
  const { projectId } = await ctx.params;
  const db = getDb();
  const runId = new URL(req.url).searchParams.get("run");
  const proposalIds = runId ? getRun(db, runId).config.proposalIds : undefined;
  return json({ comparison: await getBoqComparison(db, getStorage(), projectId, proposalIds) });
});
