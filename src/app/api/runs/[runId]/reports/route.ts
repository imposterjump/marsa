import { json, withErrors } from "@/server/api";
import { toRunDto } from "@/server/runs/read";
import { getRunner } from "@/server/runs/instance";

type Ctx = RouteContext<"/api/runs/[runId]/reports">;

/**
 * Add the consultant reports to an analysis that finished before reports existed (one-time
 * backfill, 2026-10-25; no button in the app). Runs only the missing or unfinished report steps.
 */
export const POST = withErrors(async (_req: Request, ctx: Ctx) => {
  const { runId } = await ctx.params;
  return json(toRunDto(getRunner().addReports(runId)));
});
