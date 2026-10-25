import { ApiError, json, withErrors } from "@/server/api";
import { addImportFile } from "@/server/imports/staging";
import { getStorage } from "@/server/storage";

type Ctx = RouteContext<"/api/imports/[importId]/files">;

/** One file of the tender folder: multipart `file` + `path` (its path inside the folder). */
export const POST = withErrors(async (req: Request, ctx: Ctx) => {
  const { importId } = await ctx.params;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, "invalid_form", "Expected multipart/form-data with a 'file' field.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "missing_file", "No file was uploaded.");
  const path = String(form.get("path") ?? file.name);
  const count = await addImportFile(
    getStorage(),
    importId,
    path,
    new Uint8Array(await file.arrayBuffer()),
  );
  return json({ count });
});
