import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { createRule, ruleInputSchema } from "@/server/services/standards";

export const POST = withErrors(
  async (req: Request, ctx: RouteContext<"/api/standards/[standardId]/rules">) => {
    const { standardId } = await ctx.params;
    const input = await readJson(req, ruleInputSchema);
    return json(createRule(getDb(), standardId, input), { status: 201 });
  },
);
