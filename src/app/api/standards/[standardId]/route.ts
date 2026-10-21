import { connection } from "next/server";
import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { toDocumentDto } from "@/server/documents/dto";
import { getStorage } from "@/server/storage";
import {
  deleteStandard,
  getStandard,
  standardPatchSchema,
  updateStandard,
} from "@/server/services/standards";

type Ctx = RouteContext<"/api/standards/[standardId]">;

export const GET = withErrors(async (_req: Request, ctx: Ctx) => {
  await connection();
  const { standardId } = await ctx.params;
  const s = getStandard(getDb(), standardId);
  return json({ ...s, documents: s.documents.map(toDocumentDto) });
});

export const PATCH = withErrors(async (req: Request, ctx: Ctx) => {
  const { standardId } = await ctx.params;
  const patch = await readJson(req, standardPatchSchema);
  return json(updateStandard(getDb(), standardId, patch));
});

export const DELETE = withErrors(async (_req: Request, ctx: Ctx) => {
  const { standardId } = await ctx.params;
  await deleteStandard(getDb(), getStorage(), standardId);
  return new Response(null, { status: 204 });
});
