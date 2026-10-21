import { connection } from "next/server";
import { json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { runEstimateInput } from "@/server/runs/estimate";

type Ctx = RouteContext<"/api/projects/[projectId]/estimate">;

/** Document sizes for the run / bid cost estimate (the client prices them for the chosen model). */
export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { projectId } = await ctx.params;
  return json(runEstimateInput(getDb(), projectId));
});
