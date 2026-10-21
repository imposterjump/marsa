import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { deleteRule, rulePatchSchema, updateRule } from "@/server/services/standards";

type Ctx = RouteContext<"/api/standards/[standardId]/rules/[ruleId]">;

export const PATCH = withErrors(async (req: Request, ctx: Ctx) => {
  const { standardId, ruleId } = await ctx.params;
  const patch = await readJson(req, rulePatchSchema);
  return json(updateRule(getDb(), standardId, ruleId, patch));
});

/** Returns the deleted rule so the UI can offer Undo (re-create at the same sortOrder). */
export const DELETE = withErrors(async (_req: Request, ctx: Ctx) => {
  const { standardId, ruleId } = await ctx.params;
  return json(deleteRule(getDb(), standardId, ruleId));
});
