import { ApiError, json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { toDocumentDto } from "@/server/documents/dto";
import { ingestDocument } from "@/server/documents/ingest";
import { env } from "@/server/env";
import { getStandard } from "@/server/services/standards";
import { getStorage } from "@/server/storage";

/** Upload ONE file (multipart field "file") to a standard. The UI sends one request per file for per-file progress. */
export const POST = withErrors(
  async (req: Request, ctx: RouteContext<"/api/standards/[standardId]/documents">) => {
    const { standardId } = await ctx.params;
    getStandard(getDb(), standardId); // 404 if missing
    const form = await req.formData().catch(() => {
      throw new ApiError(400, "invalid_form", "Expected multipart/form-data with a 'file' field.");
    });
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "missing_file", "No file was uploaded.");
    const row = await ingestDocument(getDb(), getStorage(), {
      owner: { kind: "standard", standardId },
      fileName: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
      maxSizeMb: env.MAX_UPLOAD_MB,
    });
    return json(toDocumentDto(row), { status: 201 });
  },
);
