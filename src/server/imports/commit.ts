/**
 * Turns a scanned tender into a project (2026-10-25): the tender documents become its RFP, each
 * company of the chosen round a vendor with a proposal, each of its files a commercial or
 * technical document. Files are read, never changed. A file the app can't take (wrong content
 * for its extension, too large…) is skipped and reported. Internal papers are never imported:
 * only the estimate read from them is stored, on the project.
 */
import type { Db } from "../db/connect";
import { ApiError } from "../api-errors";
import { ingestDocument } from "../documents/ingest";
import { createProject, updateProject } from "../services/projects";
import { ensureVendor, submitProposal, vendorInputSchema } from "../services/proposals";
import type { LocalStorage } from "../storage/local";
import type { ProjectCategory } from "../../lib/domain";
import type { TenderImportResultDto } from "../../lib/api-types";
import type { RoundKey, TenderScan } from "./tender";

export interface CommitInput {
  name: string;
  category: ProjectCategory;
  round: RoundKey;
  estimateAmount: number | null;
  estimateCurrency: string | null;
  /** Paths left out by default that the user took anyway. */
  include?: string[];
  /** Paths imported by default that the user left out. */
  exclude?: string[];
}

/** Large drawings and scans are common in building tenders. */
const MAX_FILE_MB = 200;

export async function commitTender(
  db: Db,
  storage: LocalStorage,
  scan: TenderScan,
  input: CommitInput,
): Promise<TenderImportResultDto> {
  const round = scan.rounds.find((r) => r.key === input.round);
  if (!round) throw new ApiError(400, "validation_error", "This tender has no such round of bids.");
  const skipped: TenderImportResultDto["skipped"] = [];
  const taken = new Set(input.include ?? []);
  const dropped = new Set(input.exclude ?? []);
  const wanted = (path: string, leftOut: string | null) =>
    taken.has(path) || (leftOut === null && !dropped.has(path));
  const docs = scan.tenderDocs.filter((d) => wanted(d.entry.path, d.leftOut));
  if (!docs.length)
    throw new ApiError(400, "validation_error", "The folder has no tender documents.");
  const reason = (err: unknown) => (err instanceof Error ? err.message : String(err));

  const project = createProject(db, {
    name: input.name.trim().slice(0, 160),
    // In the tender's own language: an Arabic tender gets an Arabic description.
    description: scan.reference
      ? /[؀-ۿ]/.test(input.name)
        ? `مرجع المناقصة: ${scan.reference}`
        : `Tender ${scan.reference}`
      : "",
    category: input.category,
    deadline: null,
    notes: "",
    estimateAmount: input.estimateAmount,
    estimateCurrency: input.estimateAmount ? (input.estimateCurrency ?? "AED") : null,
  });
  let documents = 0;
  for (const d of docs) {
    try {
      await ingestDocument(db, storage, {
        owner: { kind: "rfp", projectId: project.id },
        fileName: d.name,
        bytes: await d.entry.read(),
        maxSizeMb: MAX_FILE_MB,
      });
      documents++;
    } catch (err) {
      skipped.push({ name: d.name, reason: reason(err) });
    }
  }
  if (!documents) throw new ApiError(400, "validation_error", "No tender document could be read.");
  updateProject(db, project.id, { status: "open" });

  let vendors = 0;
  for (const v of round.vendors) {
    const vendor = ensureVendor(db, vendorInputSchema.parse({ name: v.name }));
    const { proposal } = await submitProposal(db, storage, project.id, vendor.id, {
      source: "import",
    });
    vendors++;
    for (const f of v.files.filter((x) => wanted(x.entry.path, x.leftOut))) {
      try {
        await ingestDocument(db, storage, {
          owner: { kind: f.kind, projectId: project.id, proposalId: proposal.id },
          fileName: f.name,
          bytes: await f.entry.read(),
          maxSizeMb: MAX_FILE_MB,
        });
        documents++;
      } catch (err) {
        skipped.push({ name: `${v.name}: ${f.name}`, reason: reason(err) });
      }
    }
  }
  return { projectId: project.id, vendors, documents, skipped };
}
