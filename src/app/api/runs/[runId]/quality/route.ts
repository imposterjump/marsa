import { connection } from "next/server";
import { json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { getRunQuality } from "@/server/runs/quality";
import { getStorage } from "@/server/storage";

type Ctx = RouteContext<"/api/runs/[runId]/quality">;

/** Quality metrics of one run (stored; computed on first use for older runs). */
export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { runId } = await ctx.params;
  return json(await getRunQuality(getDb(), getStorage(), runId));
});
