import { json, withErrors } from "@/server/api";
import { toRunDto } from "@/server/runs/read";
import { getRunner } from "@/server/runs/instance";

type Ctx = RouteContext<"/api/runs/[runId]/steps/[stepId]/retry">;

export const POST = withErrors(async (_req: Request, ctx: Ctx) => {
  const { runId, stepId } = await ctx.params;
  return json(toRunDto(getRunner().retryStep(runId, stepId)));
});
