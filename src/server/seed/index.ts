/**
 * Sample data (PRD FR-4.1, P4.1–P4.3). Reads test-inputs/seed/manifest.json, written by
 * scripts/test-inputs/build-phase-4.ts, and ingests the files it lists from test-inputs/,
 * so the demo data and the user's test inputs are the same documents (HANDOFF G-47).
 *
 * Takes `db`/`storage`/`seedDir` so the API routes, `npm run seed` and tests share it.
 * No `server-only` (G-08).
 */
import fs from "node:fs";
import path from "node:path";
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/connect";
import { documents, projects, projectStandards, proposals, standards, vendors } from "../db/schema";
import { ingestDocument } from "../documents/ingest";
import type { LocalStorage } from "../storage/local";
import { ApiError } from "../api-errors";
import { PRIORITIES, PROJECT_CATEGORIES, STANDARD_CATEGORIES } from "../../lib/domain";
import {
  createProject,
  deleteProject,
  projectInputSchema,
  setProjectStandards,
  updateProject,
} from "../services/projects";
import { ensureVendor, submitProposal, vendorInputSchema } from "../services/proposals";
import {
  createRulesBulk,
  createStandard,
  deleteStandard,
  standardInputSchema,
} from "../services/standards";

const manifestSchema = z.object({
  version: z.literal(1),
  standards: z.array(
    z.object({
      code: z.string(),
      title: z.string(),
      category: z.enum(STANDARD_CATEGORIES),
      description: z.string(),
      file: z.string(),
      rules: z.array(
        z.object({ code: z.string(), text: z.string(), priority: z.enum(PRIORITIES) }),
      ),
    }),
  ),
  projects: z.array(
    z.object({
      key: z.string(),
      name: z.string(),
      description: z.string(),
      category: z.enum(PROJECT_CATEGORIES),
      deadlineInDays: z.number().int().positive(),
      standards: z.array(z.string()),
      rfp: z.array(z.string()),
      proposals: z.array(
        z.object({
          vendor: z.object({
            name: z.string(),
            country: z.string(),
            contactName: z.string(),
            contactEmail: z.string(),
          }),
          submittedHoursAgo: z.number().nonnegative(),
          commercial: z.array(z.string()),
          technical: z.array(z.string()),
        }),
      ),
    }),
  ),
});
export type SeedManifest = z.infer<typeof manifestSchema>;

const MAX_MB = 100;

export function readManifest(seedDir: string): SeedManifest {
  const file = path.join(/*turbopackIgnore: true*/ seedDir, "seed", "manifest.json");
  if (!fs.existsSync(file)) {
    throw new ApiError(
      503,
      "seed_missing",
      "Sample files are missing. Run `npx tsx scripts/test-inputs/build-phase-4.ts` (needs test-inputs/).",
    );
  }
  return manifestSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
}

const readFile = (seedDir: string, rel: string) => {
  const abs = path.join(/*turbopackIgnore: true*/ seedDir, rel);
  if (!fs.existsSync(abs)) throw new ApiError(503, "seed_missing", `Sample file missing: ${rel}`);
  return { fileName: path.basename(rel), bytes: new Uint8Array(fs.readFileSync(abs)) };
};

const ymdIn = (days: number) => {
  const d = new Date(Date.now() + days * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export interface SeedSummary {
  projects: number;
  proposals: number;
  standardsCreated: number;
  standardsReused: number;
  vendors: number;
  documents: number;
}

/**
 * Load (or reload) the sample data. Previous sample projects are replaced; the user's own
 * projects are never touched. Standards whose code already exists (e.g. the user's CITS-2026)
 * are reused as they are, not duplicated.
 */
export async function loadSampleData(
  db: Db,
  storage: LocalStorage,
  seedDir: string,
): Promise<SeedSummary> {
  const m = readManifest(seedDir);
  // Fail before changing anything if a listed file is missing.
  for (const rel of [
    ...m.standards.map((s) => s.file),
    ...m.projects.flatMap((p) => [
      ...p.rfp,
      ...p.proposals.flatMap((x) => [...x.commercial, ...x.technical]),
    ]),
  ]) {
    readFile(seedDir, rel);
  }

  for (const p of db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.isSample, true))
    .all()) {
    await deleteProject(db, storage, p.id);
  }

  const summary: SeedSummary = {
    projects: 0,
    proposals: 0,
    standardsCreated: 0,
    standardsReused: 0,
    vendors: 0,
    documents: 0,
  };
  const stdIds = new Map<string, string>();
  for (const s of m.standards) {
    const existing = db
      .select({ id: standards.id })
      .from(standards)
      .where(sql`upper(${standards.code}) = upper(${s.code})`)
      .get();
    if (existing) {
      stdIds.set(s.code, existing.id);
      summary.standardsReused++;
      continue;
    }
    const created = createStandard(
      db,
      standardInputSchema.parse({
        code: s.code,
        title: s.title,
        category: s.category,
        description: s.description,
      }),
    );
    db.update(standards).set({ isSample: true }).where(eq(standards.id, created.id)).run();
    createRulesBulk(db, created.id, s.rules);
    await ingestDocument(db, storage, {
      owner: { kind: "standard", standardId: created.id },
      ...readFile(seedDir, s.file),
      maxSizeMb: MAX_MB,
    });
    stdIds.set(s.code, created.id);
    summary.standardsCreated++;
    summary.documents++;
  }

  const vendorIds = new Set<string>();
  for (const p of m.projects) {
    const project = createProject(
      db,
      projectInputSchema.parse({
        name: p.name,
        description: p.description,
        category: p.category,
        deadline: ymdIn(p.deadlineInDays),
      }),
    );
    db.update(projects).set({ isSample: true }).where(eq(projects.id, project.id)).run();
    setProjectStandards(
      db,
      project.id,
      p.standards.map((code) => stdIds.get(code)).filter((x): x is string => !!x),
    );
    for (const rel of p.rfp) {
      await ingestDocument(db, storage, {
        owner: { kind: "rfp", projectId: project.id },
        ...readFile(seedDir, rel),
        maxSizeMb: MAX_MB,
      });
      summary.documents++;
    }
    updateProject(db, project.id, { status: "open" });
    summary.projects++;

    for (const x of p.proposals) {
      const vendor = ensureVendor(db, vendorInputSchema.parse(x.vendor), { isSample: true });
      vendorIds.add(vendor.id);
      const submittedAt = new Date(Date.now() - x.submittedHoursAgo * 3_600_000).toISOString();
      const { proposal } = await submitProposal(db, storage, project.id, vendor.id, {
        source: "seed",
        submittedAt,
      });
      for (const [kind, files] of [
        ["commercial", x.commercial],
        ["technical", x.technical],
      ] as const) {
        for (const rel of files) {
          await ingestDocument(db, storage, {
            owner: { kind, projectId: project.id, proposalId: proposal.id },
            ...readFile(seedDir, rel),
            maxSizeMb: MAX_MB,
          });
          summary.documents++;
        }
      }
      summary.proposals++;
    }
  }
  summary.vendors = vendorIds.size;
  return summary;
}

/** Remove sample projects, then sample standards and vendors nothing else uses any more. */
export async function removeSampleData(db: Db, storage: LocalStorage) {
  const sampleProjects = db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.isSample, true))
    .all();
  for (const p of sampleProjects) await deleteProject(db, storage, p.id);

  const usedStandards = db
    .selectDistinct({ id: projectStandards.standardId })
    .from(projectStandards)
    .all()
    .map((r) => r.id);
  const sampleStandards = db
    .select({ id: standards.id })
    .from(standards)
    .where(
      and(
        eq(standards.isSample, true),
        usedStandards.length ? notInArray(standards.id, usedStandards) : undefined,
      ),
    )
    .all();
  for (const s of sampleStandards) await deleteStandard(db, storage, s.id);

  const usedVendors = db
    .selectDistinct({ id: proposals.vendorId })
    .from(proposals)
    .all()
    .map((r) => r.id);
  const unusedSampleVendors = db
    .select({ id: vendors.id })
    .from(vendors)
    .where(
      and(
        eq(vendors.isSample, true),
        usedVendors.length ? notInArray(vendors.id, usedVendors) : undefined,
      ),
    )
    .all()
    .map((v) => v.id);
  if (unusedSampleVendors.length)
    db.delete(vendors).where(inArray(vendors.id, unusedSampleVendors)).run();

  return {
    projects: sampleProjects.length,
    standards: sampleStandards.length,
    vendors: unusedSampleVendors.length,
  };
}

/** Delete every project, standard, vendor and stored file. Settings (profile, theme, AI) are kept. */
export async function resetAllData(db: Db, storage: LocalStorage) {
  const files = db.select({ path: documents.storagePath }).from(documents).all();
  const counts = {
    projects: db.select({ id: projects.id }).from(projects).all().length,
    standards: db.select({ id: standards.id }).from(standards).all().length,
    vendors: db.select({ id: vendors.id }).from(vendors).all().length,
    documents: files.length,
  };
  db.transaction((tx) => {
    tx.delete(projects).run(); // proposals, documents, project standards, runs cascade
    tx.delete(standards).run(); // rules + standard documents cascade
    tx.delete(vendors).run();
    tx.delete(documents).run(); // anything left (none expected)
  });
  await Promise.all(files.map((f) => storage.delete(f.path).catch(() => {})));
  return counts;
}
