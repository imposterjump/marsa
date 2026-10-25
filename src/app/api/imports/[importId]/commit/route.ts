import { z } from "zod";
import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { commitTender } from "@/server/imports/commit";
import { dropImport, scanImport } from "@/server/imports/staging";
import { getStorage } from "@/server/storage";
import { PROJECT_CATEGORIES } from "@/lib/domain";

type Ctx = RouteContext<"/api/imports/[importId]/commit">;

const schema = z
  .object({
    name: z.string().trim().min(3).max(160),
    category: z.enum(PROJECT_CATEGORIES),
    round: z.enum(["opening", "negotiation", "bids"]),
    estimateAmount: z.number().nonnegative().max(1e12).nullable(),
    estimateCurrency: z.string().trim().max(8).nullable(),
    include: z.array(z.string().max(1000)).max(2000).optional(),
    exclude: z.array(z.string().max(1000)).max(2000).optional(),
  })
  .strict();

/** Create the project from the uploaded tender; the upload area is emptied afterwards. */
export const POST = withErrors(async (req: Request, ctx: Ctx) => {
  const { importId } = await ctx.params;
  const input = await readJson(req, schema);
  const storage = getStorage();
  const scan = await scanImport(storage, importId);
  const result = await commitTender(getDb(), storage, scan, input);
  await dropImport(storage, importId);
  return json(result, { status: 201 });
});
