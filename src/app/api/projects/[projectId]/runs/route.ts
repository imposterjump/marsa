import { connection } from "next/server";
import { json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { requireProject } from "@/server/services/projects";
import { listRunsDto, toRunDto } from "@/server/runs/read";
import { getRunner } from "@/server/runs/instance";

type Ctx = RouteContext<"/api/projects/[projectId]/runs">;

/** Run history, newest first. */
export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { projectId } = await ctx.params;
  requireProject(getDb(), projectId);
  return json(listRunsDto(getDb(), projectId));
});

/** Start an analysis of every submitted proposal (409 if one is already running). */
export const POST = withErrors(async (_req: Request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  const run = getRunner().start(projectId);
  return json(toRunDto(run), { status: 201 });
});
