/**
 * Projects service (PRD FR-2, FR-3, FR-14 lifecycle). Takes `db`/`storage` for testability;
 * no `server-only` (HANDOFF G-08).
 *
 * Status lifecycle (REC-14):
 *   draft ──publish──▶ open ──(analysis, P6)──▶ evaluating ──▶ evaluated
 *     ▲                  │
 *     └──unpublish───────┘ (only while no proposals)      any ──archive──▶ archived ──restore──▶ draft/open
 */
import { and, asc, count, desc, eq, inArray, like, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/connect";
import { documents, projects, projectStandards, proposals, standards } from "../db/schema";
import type { LocalStorage } from "../storage/local";
import { ApiError, notFound } from "../api-errors";
import { PROJECT_CATEGORIES, type ProjectStatus } from "../../lib/domain";
import { newId } from "../../lib/ids";

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const todayIso = () => new Date().toISOString().slice(0, 10);

const deadline = z
  .string()
  .trim()
  .regex(DATE_RE, "Use the format YYYY-MM-DD.")
  .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)), "Not a valid date.")
  .nullable();

const projectFields = {
  name: z.string().trim().min(3, "Give the project a name of at least 3 characters.").max(160),
  description: z.string().trim().max(4000),
  category: z.enum(PROJECT_CATEGORIES),
  deadline,
  notes: z.string().trim().max(8000),
};

export const projectInputSchema = z
  .object({
    ...projectFields,
    description: projectFields.description.default(""),
    category: projectFields.category.default("equipment"),
    deadline: deadline.default(null),
    notes: projectFields.notes.default(""),
  })
  .strict();

// Built from the default-free fields: zod's .partial() still applies .default()s, so deriving
// it from projectInputSchema made every PATCH (e.g. publish) reset the deadline/notes (G-42).
export const projectPatchSchema = z
  .object(projectFields)
  .partial()
  .extend({ status: z.enum(["draft", "open", "archived"]).optional() })
  .strict();

export const projectStandardsSchema = z
  .object({ standardIds: z.array(z.string()).max(50) })
  .strict();

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectRow = typeof projects.$inferSelect;

// ─── Reads ───────────────────────────────────────────────────────────────────
export function listProjects(db: Db) {
  const rows = db.select().from(projects).orderBy(desc(projects.updatedAt)).all();
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const docCounts = new Map(
    db
      .select({ id: documents.projectId, n: count() })
      .from(documents)
      .where(and(inArray(documents.projectId, ids), eq(documents.kind, "rfp")))
      .groupBy(documents.projectId)
      .all()
      .map((r) => [r.id, r.n]),
  );
  const propCounts = new Map(
    db
      .select({ id: proposals.projectId, n: count() })
      .from(proposals)
      .where(and(inArray(proposals.projectId, ids), eq(proposals.status, "submitted")))
      .groupBy(proposals.projectId)
      .all()
      .map((r) => [r.id, r.n]),
  );
  const stdCounts = new Map(
    db
      .select({ id: projectStandards.projectId, n: count() })
      .from(projectStandards)
      .where(inArray(projectStandards.projectId, ids))
      .groupBy(projectStandards.projectId)
      .all()
      .map((r) => [r.id, r.n]),
  );
  return rows.map((r) => ({
    ...r,
    rfpCount: docCounts.get(r.id) ?? 0,
    proposalCount: propCounts.get(r.id) ?? 0,
    standardCount: stdCounts.get(r.id) ?? 0,
  }));
}

export function requireProject(db: Db, id: string): ProjectRow {
  const row = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!row) throw notFound("Project");
  return row;
}

export function getProject(db: Db, id: string) {
  const project = requireProject(db, id);
  const rfp = db
    .select()
    .from(documents)
    .where(and(eq(documents.projectId, id), eq(documents.kind, "rfp")))
    .orderBy(asc(documents.createdAt))
    .all();
  const stds = db
    .select({
      id: standards.id,
      code: standards.code,
      title: standards.title,
      category: standards.category,
      isActive: standards.isActive,
    })
    .from(projectStandards)
    .innerJoin(standards, eq(projectStandards.standardId, standards.id))
    .where(eq(projectStandards.projectId, id))
    .orderBy(asc(standards.code))
    .all();
  const proposalCount =
    db
      .select({ n: count() })
      .from(proposals)
      .where(and(eq(proposals.projectId, id), eq(proposals.status, "submitted")))
      .get()?.n ?? 0;
  return { ...project, rfpDocuments: rfp, standards: stds, proposalCount };
}

// ─── Writes ──────────────────────────────────────────────────────────────────
/** Next reference for the year: PRJ-2026-001, -002, … */
export function nextProjectCode(db: Db, year = new Date().getUTCFullYear()): string {
  const prefix = `PRJ-${year}-`;
  const last = db
    .select({ code: projects.code })
    .from(projects)
    .where(like(projects.code, `${prefix}%`))
    .orderBy(desc(projects.code))
    .get();
  const n = last ? Number(last.code.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
}

export function createProject(db: Db, input: ProjectInput): ProjectRow {
  if (input.deadline && input.deadline < todayIso()) {
    throw new ApiError(400, "validation_error", "The submission deadline can't be in the past.", [
      { path: "deadline", message: "Pick today or a later date." },
    ]);
  }
  const id = newId("project");
  // Retry once on the (unlikely) race for the same code.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      db.insert(projects)
        .values({ id, code: nextProjectCode(db), status: "draft", ...input })
        .run();
      break;
    } catch (err) {
      if (attempt === 1 || !String((err as { code?: string }).code).startsWith("SQLITE_CONSTRAINT"))
        throw err;
    }
  }
  // Pre-select all active standards (PRD FR-3.3); the wizard lets the user change them.
  const active = db
    .select({ id: standards.id })
    .from(standards)
    .where(eq(standards.isActive, true))
    .all();
  if (active.length) {
    db.insert(projectStandards)
      .values(active.map((s) => ({ projectId: id, standardId: s.id })))
      .run();
  }
  return requireProject(db, id);
}

function assertTransition(db: Db, p: ProjectRow, to: ProjectStatus) {
  if (p.status === to) return;
  const rfpCount =
    db
      .select({ n: count() })
      .from(documents)
      .where(and(eq(documents.projectId, p.id), eq(documents.kind, "rfp")))
      .get()?.n ?? 0;
  const proposalCount =
    db.select({ n: count() }).from(proposals).where(eq(proposals.projectId, p.id)).get()?.n ?? 0;
  const bad = (msg: string) => new ApiError(409, "invalid_transition", msg);

  if (to === "open") {
    if (!["draft", "archived"].includes(p.status))
      throw bad(`A project that is ${p.status} can't be published again.`);
    if (rfpCount === 0) throw bad("Upload at least one RFP document before publishing to vendors.");
  } else if (to === "draft") {
    if (p.status === "open" && proposalCount > 0)
      throw bad("This project already has proposals, so it can't go back to draft.");
    if (!["open", "archived"].includes(p.status))
      throw bad(`A project that is ${p.status} can't go back to draft.`);
  } else if (to === "archived") {
    if (p.status === "evaluating")
      throw bad("Wait for the running analysis to finish before archiving.");
  }
}

export function updateProject(
  db: Db,
  id: string,
  patch: z.infer<typeof projectPatchSchema>,
): ProjectRow {
  const p = requireProject(db, id);
  if (patch.deadline && patch.deadline !== p.deadline && patch.deadline < todayIso()) {
    throw new ApiError(400, "validation_error", "The submission deadline can't be in the past.", [
      { path: "deadline", message: "Pick today or a later date." },
    ]);
  }
  const { status, ...fields } = patch;
  if (status) assertTransition(db, p, status);
  const statusChange =
    status && status !== p.status
      ? { status, ...(status === "open" && !p.publishedAt ? { publishedAt: now } : {}) }
      : {};
  db.update(projects)
    .set({ ...fields, ...statusChange, updatedAt: now })
    .where(eq(projects.id, id))
    .run();
  return requireProject(db, id);
}

export function setProjectStandards(db: Db, id: string, standardIds: string[]) {
  requireProject(db, id);
  const unique = [...new Set(standardIds)];
  if (unique.length) {
    const found = db
      .select({ id: standards.id })
      .from(standards)
      .where(inArray(standards.id, unique))
      .all();
    if (found.length !== unique.length)
      throw new ApiError(400, "unknown_standard", "One or more standards no longer exist.");
  }
  db.transaction((tx) => {
    tx.delete(projectStandards).where(eq(projectStandards.projectId, id)).run();
    if (unique.length)
      tx.insert(projectStandards)
        .values(unique.map((standardId) => ({ projectId: id, standardId })))
        .run();
    tx.update(projects).set({ updatedAt: now }).where(eq(projects.id, id)).run();
  });
  return getProject(db, id).standards;
}

export async function deleteProject(db: Db, storage: LocalStorage, id: string) {
  const p = requireProject(db, id);
  if (p.status === "evaluating")
    throw new ApiError(
      409,
      "invalid_transition",
      "Wait for the running analysis to finish before deleting.",
    );
  const files = db
    .select({ path: documents.storagePath })
    .from(documents)
    .where(eq(documents.projectId, id))
    .all();
  db.delete(projects).where(eq(projects.id, id)).run(); // documents, proposals, standards links, runs cascade
  await Promise.all(files.map((f) => storage.delete(f.path).catch(() => {})));
}

/** Bump updatedAt after document changes so lists sort by real activity. */
export const touchProject = (db: Db, id: string) =>
  db.update(projects).set({ updatedAt: now }).where(eq(projects.id, id)).run();

/** Guards RFP removal: archived/analysed tenders are frozen, and an open tender keeps ≥1 RFP file. */
export function assertRfpRemovable(db: Db, projectId: string) {
  const p = requireProject(db, projectId);
  const bad = (msg: string) => new ApiError(409, "invalid_transition", msg);
  if (p.status === "archived") throw bad("Restore the project before changing its RFP documents.");
  if (p.status === "evaluating" || p.status === "evaluated") {
    throw bad("The RFP was already evaluated; its documents can't be removed.");
  }
  if (p.status === "open") {
    const n =
      db
        .select({ n: count() })
        .from(documents)
        .where(and(eq(documents.projectId, p.id), eq(documents.kind, "rfp")))
        .get()?.n ?? 0;
    if (n <= 1)
      throw bad(
        "A published tender needs at least one RFP document. Upload the replacement first.",
      );
  }
}
