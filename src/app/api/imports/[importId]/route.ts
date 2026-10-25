import { withErrors } from "@/server/api";
import { dropImport } from "@/server/imports/staging";
import { getStorage } from "@/server/storage";

type Ctx = RouteContext<"/api/imports/[importId]">;

/** Drop an import that was not confirmed: its uploaded files are deleted. */
export const DELETE = withErrors(async (_req: Request, ctx: Ctx) => {
  const { importId } = await ctx.params;
  await dropImport(getStorage(), importId);
  return new Response(null, { status: 204 });
});
