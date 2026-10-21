import { connection } from "next/server";
import { json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { getRunStatus } from "@/server/runs/read";
import { getRunner } from "@/server/runs/instance";

type Ctx = RouteContext<"/api/runs/[runId]">;

/** Polling endpoint: run, steps (no outputs), live result chips, ETA. */
export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { runId } = await ctx.params;
  const runner = getRunner();
  return json(getRunStatus(getDb(), runId, runner.isLive(runId)));
});
