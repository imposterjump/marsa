import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { bulkRulesSchema, createRulesBulk } from "@/server/services/standards";

export const POST = withErrors(
  async (req: Request, ctx: RouteContext<"/api/standards/[standardId]/rules/bulk">) => {
    const { standardId } = await ctx.params;
    const { rules } = await readJson(req, bulkRulesSchema);
    return json(createRulesBulk(getDb(), standardId, rules), { status: 201 });
  },
);
