import { connection } from "next/server";
import { json, requestLanguage, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { getAnalysisResults } from "@/server/runs/analysis";
import { getStorage } from "@/server/storage";

type Ctx = RouteContext<"/api/runs/[runId]/analysis">;

/** Everything the AI analysis results page shows for one finished run (P8), in `?lang=`. */
export const GET = withErrors(async (req: Request, ctx: Ctx) => {
  await connection();
  const { runId } = await ctx.params;
  return json(await getAnalysisResults(getDb(), getStorage(), runId, requestLanguage(req)));
});
