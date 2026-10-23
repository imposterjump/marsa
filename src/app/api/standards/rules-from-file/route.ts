import { ApiError, json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { getSettings } from "@/server/services/settings";
import { extractRulesWithAi } from "@/server/standards/extract-rules-ai";
import { rulesFromFile } from "@/server/standards/rules-file";

/**
 * Rules from a dropped file (P8 guided form). multipart: "file", optional "ai" = "1" to let
 * Claude read a free-text standard (paid; the UI asks first). Nothing is saved here: the client
 * shows the rules and creates the standard with them.
 */
export const POST = withErrors(async (req: Request) => {
  const form = await req.formData().catch(() => {
    throw new ApiError(400, "invalid_form", "Expected multipart/form-data with 'file'.");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "missing_file", "No file was uploaded.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (form.get("ai") === "1") {
    const out = await extractRulesWithAi({
      name: file.name,
      bytes,
      mimeType: file.type || "application/pdf",
      model: getSettings(getDb()).aiModel,
    });
    return json({ ...out, errors: [], needsAi: false, usedAi: true });
  }
  return json({ ...(await rulesFromFile(file.name, bytes)), usedAi: false, costUsd: 0 });
});
