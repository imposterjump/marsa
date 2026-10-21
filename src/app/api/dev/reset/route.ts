import { z } from "zod";
import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { resetAllData } from "@/server/seed";
import { getStorage } from "@/server/storage";

const resetSchema = z
  .object({ confirm: z.literal("RESET", { message: 'Type "RESET" to confirm.' }) })
  .strict();

/** Delete every project, standard, vendor and file. Settings are kept. Requires {confirm:"RESET"}. */
export const POST = withErrors(async (req: Request) => {
  await readJson(req, resetSchema);
  return json(await resetAllData(getDb(), getStorage()));
});
