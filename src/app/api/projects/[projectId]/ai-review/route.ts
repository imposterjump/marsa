import { connection } from "next/server";
import { json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { requireProject } from "@/server/services/projects";
import { projectReviewSummary } from "@/server/runs/reviews";

type Ctx = RouteContext<"/api/projects/[projectId]/ai-review">;

/** Every analysis run of the project with its confidence score and average human rating. */
export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { projectId } = await ctx.params;
  requireProject(getDb(), projectId);
  return json(projectReviewSummary(getDb(), projectId));
});
