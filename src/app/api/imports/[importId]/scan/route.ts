import { json, withErrors } from "@/server/api";
import { previewOf } from "@/server/imports/tender";
import { scanImport } from "@/server/imports/staging";
import { getStorage } from "@/server/storage";

type Ctx = RouteContext<"/api/imports/[importId]/scan">;

/** What the uploaded folder holds: tender documents, rounds of bids, companies, the estimate. */
export const POST = withErrors(async (_req: Request, ctx: Ctx) => {
  const { importId } = await ctx.params;
  return json(previewOf(importId, await scanImport(getStorage(), importId)));
});
