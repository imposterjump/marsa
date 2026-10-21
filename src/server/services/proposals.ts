/**
 * Vendors and proposals (PRD FR-4, RDD §4). Takes `db`/`storage` for testability; no
 * `server-only` (HANDOFF G-08).
 *
 * One proposal per vendor per project (DB unique index). Submitting again for the same vendor
 * is a resubmission: the old files are removed and `submittedAt` moves to now. Files are
 * uploaded one per request afterwards (G-39) as `commercial` or `technical` documents.
 */
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/connect";
import { documents, projects, proposals, vendors } from "../db/schema";
import type { LocalStorage } from "../storage/local";
import { ApiError, notFound } from "../api-errors";
import type { ProposalSource } from "../../lib/domain";
import { newId } from "../../lib/ids";
import { requireProject, touchProject } from "./projects";

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

// ─── Validation ──────────────────────────────────────────────────────────────
export const vendorInputSchema = z
  .object({
    name: z.string().trim().min(2, "Vendor name must be at least 2 characters.").max(120),
    country: z.string().trim().max(80).default(""),
    contactName: z.string().trim().max(120).default(""),
    contactEmail: z
      .union([z.literal(""), z.string().trim().email("Enter a valid email address.")])
      .default(""),
  })
  .strict();

export const proposalSubmitSchema = z.object({ vendorId: z.string().min(1) }).strict();

export const PROPOSAL_DOC_KINDS = ["commercial", "technical"] as const;
export type ProposalDocKind = (typeof PROPOSAL_DOC_KINDS)[number];

export type VendorInput = z.infer<typeof vendorInputSchema>;
export type VendorRow = typeof vendors.$inferSelect;
export type ProposalRow = typeof proposals.$inferSelect;

// ─── Vendors ─────────────────────────────────────────────────────────────────
export function listVendors(db: Db) {
  const rows = db.select().from(vendors).orderBy(asc(vendors.name)).all();
  const counts = new Map(
    db
      .select({ id: proposals.vendorId, n: count() })
      .from(proposals)
      .groupBy(proposals.vendorId)
      .all()
      .map((r) => [r.id, r.n]),
  );
  return rows.map((v) => ({ ...v, proposalCount: counts.get(v.id) ?? 0 }));
}

export function requireVendor(db: Db, id: string): VendorRow {
  const row = db.select().from(vendors).where(eq(vendors.id, id)).get();
  if (!row) throw notFound("Vendor");
  return row;
}

const findVendorByName = (db: Db, name: string) =>
  db
    .select()
    .from(vendors)
    .where(sql`lower(${vendors.name}) = lower(${name.trim()})`)
    .get();

/** Vendor names are unique, ignoring case (two "Harborline Systems" would confuse every table). */
export function createVendor(db: Db, input: VendorInput, { isSample = false } = {}): VendorRow {
  if (findVendorByName(db, input.name)) {
    throw new ApiError(409, "vendor_exists", `A vendor named “${input.name}” already exists.`, [
      { path: "name", message: "This vendor already exists. Pick it from the list instead." },
    ]);
  }
  const id = newId("vendor");
  db.insert(vendors)
    .values({ id, ...input, isSample })
    .run();
  return requireVendor(db, id);
}

/** Used by the seed: reuse a vendor with the same name, otherwise create it. */
export function ensureVendor(db: Db, input: VendorInput, opts: { isSample?: boolean } = {}) {
  return findVendorByName(db, input.name) ?? createVendor(db, input, opts);
}

// ─── Proposals ───────────────────────────────────────────────────────────────
function docCountsByProposal(db: Db, ids: string[]) {
  const map = new Map<string, { commercial: number; technical: number; pages: number }>();
  if (!ids.length) return map;
  const rows = db
    .select({
      id: documents.proposalId,
      kind: documents.kind,
      n: count(),
      pages: sql<number>`coalesce(sum(${documents.pageCount}), 0)`,
    })
    .from(documents)
    .where(inArray(documents.proposalId, ids))
    .groupBy(documents.proposalId, documents.kind)
    .all();
  for (const r of rows) {
    if (!r.id) continue;
    const entry = map.get(r.id) ?? { commercial: 0, technical: 0, pages: 0 };
    if (r.kind === "commercial" || r.kind === "technical") entry[r.kind] = r.n;
    entry.pages += Number(r.pages);
    map.set(r.id, entry);
  }
  return map;
}

export function listProposals(db: Db, projectId: string) {
  requireProject(db, projectId);
  const rows = db
    .select({ proposal: proposals, vendor: vendors })
    .from(proposals)
    .innerJoin(vendors, eq(proposals.vendorId, vendors.id))
    .where(eq(proposals.projectId, projectId))
    .orderBy(desc(proposals.submittedAt))
    .all();
  const counts = docCountsByProposal(
    db,
    rows.map((r) => r.proposal.id),
  );
  return rows.map(({ proposal, vendor }) => ({
    ...proposal,
    vendor,
    documentCounts: counts.get(proposal.id) ?? { commercial: 0, technical: 0, pages: 0 },
  }));
}

export function requireProposal(db: Db, id: string): ProposalRow {
  const row = db.select().from(proposals).where(eq(proposals.id, id)).get();
  if (!row) throw notFound("Proposal");
  return row;
}

export function getProposal(db: Db, id: string) {
  const proposal = requireProposal(db, id);
  const vendor = requireVendor(db, proposal.vendorId);
  const project = requireProject(db, proposal.projectId);
  const docs = db
    .select()
    .from(documents)
    .where(eq(documents.proposalId, id))
    .orderBy(asc(documents.createdAt))
    .all();
  return {
    ...proposal,
    vendor,
    project: { id: project.id, code: project.code, name: project.name, status: project.status },
    commercialDocuments: docs.filter((d) => d.kind === "commercial"),
    technicalDocuments: docs.filter((d) => d.kind === "technical"),
  };
}

/** Vendors can only respond to a published tender (and not while it is being evaluated). */
function assertAcceptsProposals(db: Db, projectId: string) {
  const p = requireProject(db, projectId);
  if (p.status !== "open") {
    const why =
      p.status === "draft"
        ? "This tender isn't published yet, so vendors can't see it."
        : p.status === "archived"
          ? "This tender is archived."
          : "This tender is being evaluated or already evaluated; it no longer accepts proposals.";
    throw new ApiError(409, "not_accepting_proposals", why);
  }
  return p;
}

/**
 * Create the vendor's proposal, or reset it for a resubmission (old files are deleted).
 * Returns the proposal and whether it replaced an earlier submission.
 */
export async function submitProposal(
  db: Db,
  storage: LocalStorage,
  projectId: string,
  vendorId: string,
  {
    source = "simulator" as ProposalSource,
    submittedAt,
  }: { source?: ProposalSource; submittedAt?: string } = {},
) {
  assertAcceptsProposals(db, projectId);
  requireVendor(db, vendorId);
  const existing = db
    .select()
    .from(proposals)
    .where(and(eq(proposals.projectId, projectId), eq(proposals.vendorId, vendorId)))
    .get();

  let id: string;
  if (existing) {
    id = existing.id;
    const files = db
      .select({ path: documents.storagePath })
      .from(documents)
      .where(eq(documents.proposalId, id))
      .all();
    db.transaction((tx) => {
      tx.delete(documents).where(eq(documents.proposalId, id)).run();
      tx.update(proposals)
        .set({ submittedAt: submittedAt ?? now, status: "submitted", source })
        .where(eq(proposals.id, id))
        .run();
    });
    await Promise.all(files.map((f) => storage.delete(f.path).catch(() => {})));
  } else {
    id = newId("proposal");
    db.insert(proposals)
      .values({ id, projectId, vendorId, source, ...(submittedAt ? { submittedAt } : {}) })
      .run();
  }
  touchProject(db, projectId);
  return { proposal: requireProposal(db, id), replaced: !!existing };
}

/** Uploads are only accepted while the tender is open (same rule as submitting). */
export function assertProposalAcceptsFiles(db: Db, proposalId: string) {
  const p = requireProposal(db, proposalId);
  assertAcceptsProposals(db, p.projectId);
  return p;
}

export async function deleteProposal(db: Db, storage: LocalStorage, id: string) {
  const p = requireProposal(db, id);
  const project = db.select().from(projects).where(eq(projects.id, p.projectId)).get();
  if (project?.status === "evaluating") {
    throw new ApiError(
      409,
      "invalid_transition",
      "Wait for the running analysis to finish before removing proposals.",
    );
  }
  const files = db
    .select({ path: documents.storagePath })
    .from(documents)
    .where(eq(documents.proposalId, id))
    .all();
  db.delete(proposals).where(eq(proposals.id, id)).run(); // documents cascade
  await Promise.all(files.map((f) => storage.delete(f.path).catch(() => {})));
  touchProject(db, p.projectId);
}
