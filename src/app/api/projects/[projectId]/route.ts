import { connection } from "next/server";
import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { toDocumentDto } from "@/server/documents/dto";
import { getStorage } from "@/server/storage";
import {
  deleteProject,
  getProject,
  projectPatchSchema,
  updateProject,
} from "@/server/services/projects";

type Ctx = RouteContext<"/api/projects/[projectId]">;

export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { projectId } = await ctx.params;
  const p = getProject(getDb(), projectId);
  return json({ ...p, rfpDocuments: p.rfpDocuments.map(toDocumentDto) });
});

/** Edit fields and/or change status (publish = {status:"open"}, unpublish, archive, restore). */
export const PATCH = withErrors(async (req: Request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  const patch = await readJson(req, projectPatchSchema);
  return json(updateProject(getDb(), projectId, patch));
});

export const DELETE = withErrors(async (_req: Request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  await deleteProject(getDb(), getStorage(), projectId);
  return new Response(null, { status: 204 });
});
