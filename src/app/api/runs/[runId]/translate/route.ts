import { json, withErrors } from "@/server/api";
import { toRunDto } from "@/server/runs/read";
import { getRunner } from "@/server/runs/instance";

type Ctx = RouteContext<"/api/runs/[runId]/translate">;

/**
 * Translate the AI's results of an analysis that finished before the Translator existed
 * (one-time backfill, 2026-10-25; no button in the app). Runs only the Translator step.
 */
export const POST = withErrors(async (_req: Request, ctx: Ctx) => {
  const { runId } = await ctx.params;
  return json(toRunDto(getRunner().addTranslation(runId)));
});
