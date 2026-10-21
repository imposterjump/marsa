import { connection } from "next/server";
import { json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { getRunResults } from "@/server/runs/read";

type Ctx = RouteContext<"/api/runs/[runId]/results">;

/** Requirements, scores per vendor, comparisons, ranking and executive summary. */
export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { runId } = await ctx.params;
  return json(getRunResults(getDb(), runId));
});
