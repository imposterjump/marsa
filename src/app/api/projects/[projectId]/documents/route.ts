import { ApiError, json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { toDocumentDto } from "@/server/documents/dto";
import { ingestDocument } from "@/server/documents/ingest";
import { env } from "@/server/env";
import { requireProject, touchProject } from "@/server/services/projects";
import { getStorage } from "@/server/storage";

/** Upload ONE RFP document (multipart field "file"). One request per file for per-file progress (G-39). */
export const POST = withErrors(
  async (req: Request, ctx: RouteContext<"/api/projects/[projectId]/documents">) => {
    const { projectId } = await ctx.params;
    const db = getDb();
    const project = requireProject(db, projectId);
    if (project.status === "archived") {
      throw new ApiError(409, "project_archived", "Restore the project before adding documents.");
    }
    if (project.status === "evaluating") {
      throw new ApiError(409, "invalid_transition", "Wait for the running analysis to finish.");
    }
    const form = await req.formData().catch(() => {
      throw new ApiError(400, "invalid_form", "Expected multipart/form-data with a 'file' field.");
    });
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "missing_file", "No file was uploaded.");
    const row = await ingestDocument(db, getStorage(), {
      owner: { kind: "rfp", projectId },
      fileName: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
      maxSizeMb: env.MAX_UPLOAD_MB,
    });
    touchProject(db, projectId);
    return json(toDocumentDto(row), { status: 201 });
  },
);
