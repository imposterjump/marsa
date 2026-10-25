import { connection } from "next/server";
import { json, requestLanguage, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { getProposalResultWithSources } from "@/server/runs/read";
import { getStorage } from "@/server/storage";

type Ctx = RouteContext<"/api/runs/[runId]/proposals/[proposalId]">;

/** One vendor: evaluation + findings (with resolved requirement sources), comparison, risks. */
export const GET = withErrors(async (req: Request, ctx: Ctx) => {
  await connection();
  const { runId, proposalId } = await ctx.params;
  return json(
    await getProposalResultWithSources(
      getDb(),
      getStorage(),
      runId,
      proposalId,
      requestLanguage(req),
    ),
  );
});
