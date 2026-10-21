import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { projectStandardsSchema, setProjectStandards } from "@/server/services/projects";

/** Replace the set of standards applied to the project (PRD FR-3.3). */
export const PUT = withErrors(
  async (req: Request, ctx: RouteContext<"/api/projects/[projectId]/standards">) => {
    const { projectId } = await ctx.params;
    const { standardIds } = await readJson(req, projectStandardsSchema);
    return json(setProjectStandards(getDb(), projectId, standardIds));
  },
);
