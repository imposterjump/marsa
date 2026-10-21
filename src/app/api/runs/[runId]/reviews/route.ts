import { connection } from "next/server";
import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { createReview, listReviews, reviewInputSchema } from "@/server/runs/reviews";
import { getStorage } from "@/server/storage";

type Ctx = RouteContext<"/api/runs/[runId]/reviews">;

export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { runId } = await ctx.params;
  return json(listReviews(getDb(), runId));
});

/** Save a human review of the run (stored with a snapshot of the run's quality metrics). */
export const POST = withErrors(async (req: Request, ctx: Ctx) => {
  const { runId } = await ctx.params;
  const input = await readJson(req, reviewInputSchema);
  return json(await createReview(getDb(), getStorage(), runId, input), { status: 201 });
});
