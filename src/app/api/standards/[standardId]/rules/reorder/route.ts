import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { reorderRules, reorderSchema } from "@/server/services/standards";

export const POST = withErrors(
  async (req: Request, ctx: RouteContext<"/api/standards/[standardId]/rules/reorder">) => {
    const { standardId } = await ctx.params;
    const { ids } = await readJson(req, reorderSchema);
    return json(reorderRules(getDb(), standardId, ids));
  },
);
