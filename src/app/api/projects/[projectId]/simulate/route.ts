import { connection } from "next/server";
import { z } from "zod";
import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { requireProject } from "@/server/services/projects";
import { getGenerator } from "@/server/simulate/instance";
import { BID_PROFILES } from "@/server/simulate/schema";

type Ctx = RouteContext<"/api/projects/[projectId]/simulate">;

const bodySchema = z.object({ profiles: z.array(z.enum(BID_PROFILES)).min(1).max(4) }).strict();

/** The latest proposal-generation job of this project (or null). */
export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { projectId } = await ctx.params;
  requireProject(getDb(), projectId);
  return json(getGenerator().latest(projectId));
});

/** Generate AI proposals (RDD §7.9): one per profile, as a background job with progress. */
export const POST = withErrors(async (req: Request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  const { profiles } = await readJson(req, bodySchema);
  return json(getGenerator().start(projectId, profiles), { status: 201 });
});
