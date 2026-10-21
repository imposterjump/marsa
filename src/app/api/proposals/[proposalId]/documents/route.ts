import { ApiError, json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { toDocumentDto } from "@/server/documents/dto";
import { ingestDocument } from "@/server/documents/ingest";
import { env } from "@/server/env";
import { touchProject } from "@/server/services/projects";
import {
  assertProposalAcceptsFiles,
  PROPOSAL_DOC_KINDS,
  type ProposalDocKind,
} from "@/server/services/proposals";
import { getStorage } from "@/server/storage";

/** Upload ONE proposal file (multipart: "file" + "kind" = commercial | technical). G-39. */
export const POST = withErrors(
  async (req: Request, ctx: RouteContext<"/api/proposals/[proposalId]/documents">) => {
    const { proposalId } = await ctx.params;
    const db = getDb();
    const proposal = assertProposalAcceptsFiles(db, proposalId);
    const form = await req.formData().catch(() => {
      throw new ApiError(
        400,
        "invalid_form",
        "Expected multipart/form-data with 'file' and 'kind'.",
      );
    });
    const kind = form.get("kind");
    if (!PROPOSAL_DOC_KINDS.includes(kind as ProposalDocKind)) {
      throw new ApiError(400, "invalid_kind", "kind must be 'commercial' or 'technical'.");
    }
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "missing_file", "No file was uploaded.");
    const row = await ingestDocument(db, getStorage(), {
      owner: { kind: kind as ProposalDocKind, projectId: proposal.projectId, proposalId },
      fileName: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
      maxSizeMb: env.MAX_UPLOAD_MB,
    });
    touchProject(db, proposal.projectId);
    return json(toDocumentDto(row), { status: 201 });
  },
);
