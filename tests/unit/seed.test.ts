import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrateDb, openDb, type Db } from "@/server/db/connect";
import { documents } from "@/server/db/schema";
import { loadSampleData, readManifest, removeSampleData, resetAllData } from "@/server/seed";
import {
  createProject,
  getProject,
  listProjects,
  projectInputSchema,
} from "@/server/services/projects";
import { listProposals, listVendors } from "@/server/services/proposals";
import {
  createStandard,
  getStandard,
  listStandards,
  standardInputSchema,
} from "@/server/services/standards";
import { createLocalStorage, type LocalStorage } from "@/server/storage/local";

const SEED_DIR = path.join(process.cwd(), "test-inputs");
let db: Db;
let storage: LocalStorage;
let tmp: string;

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "marsa-seed-"));
  storage = createLocalStorage(tmp);
});
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
beforeEach(() => {
  db = openDb(":memory:");
  migrateDb(db);
});

describe("sample data (P4.1–P4.3)", () => {
  it("the manifest lists files that exist", () => {
    const m = readManifest(SEED_DIR);
    expect(m.projects.map((p) => p.key)).toEqual(["xray", "pcs"]);
    expect(m.projects[0].proposals).toHaveLength(4);
    const files = [
      ...m.standards.map((s) => s.file),
      ...m.projects.flatMap((p) => [
        ...p.rfp,
        ...p.proposals.flatMap((x) => [...x.commercial, ...x.technical]),
      ]),
    ];
    for (const f of files) expect(fs.existsSync(path.join(SEED_DIR, f)), f).toBe(true);
  });

  it("loads open sample projects with proposals, reuses existing standards and reloads idempotently", async () => {
    // The user's own standard and project must survive everything below.
    const mine = createStandard(
      db,
      standardInputSchema.parse({ code: "CITS-2026", title: "My CITS", category: "IT & security" }),
    );
    const myProject = createProject(db, projectInputSchema.parse({ name: "My own tender" }));

    const s = await loadSampleData(db, storage, SEED_DIR);
    expect(s).toMatchObject({
      projects: 2,
      proposals: 4,
      standardsReused: 1,
      standardsCreated: 2,
      vendors: 4,
    });

    const samples = listProjects(db).filter((p) => p.isSample);
    expect(samples.map((p) => p.status)).toEqual(["open", "open"]);
    const xray = samples.find((p) => p.name.startsWith("Cargo X-Ray"))!;
    expect(xray).toMatchObject({ rfpCount: 5, proposalCount: 4, standardCount: 3 });
    const detail = getProject(db, xray.id);
    expect(detail.standards.map((x) => x.id)).toContain(mine.id);
    expect(detail.rfpDocuments.find((d) => d.ext === "xlsx")?.textContent).toContain("TB-01");

    const props = listProposals(db, xray.id);
    expect(props.map((p) => p.vendor.name).sort()).toEqual([
      "Atlas Port Technologies",
      "Harborline Systems",
      "Meridian Scan Technologies",
      "Nile Gate Solutions",
    ]);
    for (const p of props) {
      expect(p.source).toBe("seed");
      expect(p.documentCounts).toMatchObject({ commercial: 1, technical: 1 });
      expect(Date.parse(p.submittedAt)).toBeLessThan(Date.now());
    }
    expect(getStandard(db, mine.id).title).toBe("My CITS"); // reused, not overwritten
    expect(listStandards(db).find((x) => x.code === "PESE-03")).toMatchObject({
      isSample: true,
      rulesCount: 12,
    });

    // Reload replaces the sample projects instead of duplicating them.
    await loadSampleData(db, storage, SEED_DIR);
    expect(listProjects(db).filter((p) => p.isSample)).toHaveLength(2);
    expect(listVendors(db)).toHaveLength(4);

    // Remove: sample data goes, the user's data stays.
    const removed = await removeSampleData(db, storage);
    expect(removed).toMatchObject({ projects: 2, standards: 2, vendors: 4 });
    expect(listProjects(db).map((p) => p.id)).toEqual([myProject.id]);
    expect(listStandards(db).map((x) => x.code)).toEqual(["CITS-2026"]);

    // Reset: everything goes.
    await loadSampleData(db, storage, SEED_DIR);
    const files = db.select({ path: documents.storagePath }).from(documents).all();
    await resetAllData(db, storage);
    expect(listProjects(db)).toHaveLength(0);
    expect(listStandards(db)).toHaveLength(0);
    expect(listVendors(db)).toHaveLength(0);
    expect(files.some((f) => fs.existsSync(storage.resolve(f.path)))).toBe(false);
  }, 60_000);
});
