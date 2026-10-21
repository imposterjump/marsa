import { json, withErrors } from "@/server/api";
import { toRunDto } from "@/server/runs/read";
import { getRunner } from "@/server/runs/instance";

type Ctx = RouteContext<"/api/runs/[runId]/resume">;

export const POST = withErrors(async (_req: Request, ctx: Ctx) => {
  const { runId } = await ctx.params;
  return json(toRunDto(getRunner().resume(runId)));
});
