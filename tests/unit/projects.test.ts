import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrateDb, openDb, type Db } from "@/server/db/connect";
import { proposals, vendors } from "@/server/db/schema";
import { ingestDocument } from "@/server/documents/ingest";
import {
  assertRfpRemovable,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  nextProjectCode,
  projectInputSchema,
  projectPatchSchema,
  setProjectStandards,
  updateProject,
} from "@/server/services/projects";
import { createStandard, standardInputSchema, updateStandard } from "@/server/services/standards";
import { createLocalStorage, type LocalStorage } from "@/server/storage/local";
import { newId } from "@/lib/ids";

let db: Db;
let storage: LocalStorage;
let tmp: string;

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "marsa-prj-"));
  storage = createLocalStorage(tmp);
});
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
beforeEach(() => {
  db = openDb(":memory:");
  migrateDb(db);
});

const year = new Date().getUTCFullYear();
const future = `${year + 1}-11-30`;
const mk = (name = "High-Energy Cargo X-Ray Inspection Systems", extra: object = {}) =>
  createProject(db, projectInputSchema.parse({ name, deadline: future, ...extra }));
const addRfp = (projectId: string, name = "rfp.pdf") =>
  ingestDocument(db, storage, {
    owner: { kind: "rfp", projectId },
    fileName: name,
    bytes: new TextEncoder().encode("%PDF-1.4\n%%EOF"),
    maxSizeMb: 5,
  });
const addProposal = (projectId: string) => {
  const vendorId = newId("vendor");
  db.insert(vendors).values({ id: vendorId, name: "Vendor A" }).run();
  db.insert(proposals)
    .values({ id: newId("proposal"), projectId, vendorId })
    .run();
};

describe("projects service", () => {
  it("validates input: trims name, defaults category, rejects bad dates", () => {
    const v = projectInputSchema.parse({ name: "  Cranes  " });
    expect(v).toMatchObject({ name: "Cranes", category: "General", deadline: null, notes: "" });
    expect(() => projectInputSchema.parse({ name: "ab" })).toThrow();
    expect(() => projectInputSchema.parse({ name: "Cranes", deadline: "30/11/2026" })).toThrow();
    expect(() => projectInputSchema.parse({ name: "Cranes", category: "equipment" })).toThrow();
  });

  it("assigns sequential PRJ-YYYY-NNN codes", () => {
    expect(nextProjectCode(db)).toBe(`PRJ-${year}-001`);
    const a = mk("Alpha project");
    const b = mk("Beta project");
    expect(a.code).toBe(`PRJ-${year}-001`);
    expect(b.code).toBe(`PRJ-${year}-002`);
    expect(nextProjectCode(db, 1999)).toBe("PRJ-1999-001");
  });

  it("starts as draft and pre-selects only active standards", () => {
    const s1 = createStandard(
      db,
      standardInputSchema.parse({
        code: "CITS-2026",
        title: "IT security",
        category: "IT & security",
      }),
    );
    const s2 = createStandard(
      db,
      standardInputSchema.parse({
        code: "PESE-03",
        title: "Safety",
        category: "Safety & environment",
      }),
    );
    updateStandard(db, s2.id, { isActive: false });
    const p = mk();
    expect(p.status).toBe("draft");
    expect(getProject(db, p.id).standards.map((s) => s.code)).toEqual([s1.code]);
  });

  it("rejects a past deadline on create and on change, but keeps an existing one", () => {
    expect(() => mk("Past project", { deadline: "2001-01-01" })).toThrow(/past/);
    const p = mk();
    expect(() =>
      updateProject(db, p.id, projectPatchSchema.parse({ deadline: "2001-01-01" })),
    ).toThrow(/past/);
    expect(updateProject(db, p.id, projectPatchSchema.parse({ deadline: future })).deadline).toBe(
      future,
    );
  });

  it("publishes only with an RFP document and stamps publishedAt once", () => {
    const p = mk();
    expect(() => updateProject(db, p.id, { status: "open" })).toThrow(/RFP document/);
    return addRfp(p.id).then(() => {
      const open = updateProject(db, p.id, { status: "open" });
      expect(open.status).toBe("open");
      expect(open.publishedAt).toBeTruthy();
      const first = open.publishedAt;
      updateProject(db, p.id, { status: "draft" });
      expect(updateProject(db, p.id, { status: "open" }).publishedAt).toBe(first);
    });
  });

  it("cannot unpublish once proposals exist; can archive and restore", async () => {
    const p = mk();
    await addRfp(p.id);
    updateProject(db, p.id, { status: "open" });
    addProposal(p.id);
    expect(() => updateProject(db, p.id, { status: "draft" })).toThrow(/already has proposals/);
    expect(updateProject(db, p.id, { status: "archived" }).status).toBe("archived");
    expect(updateProject(db, p.id, { status: "open" }).status).toBe("open");
  });

  it("guards RFP removal: open keeps one, archived is frozen, draft is free", async () => {
    const p = mk();
    await addRfp(p.id, "a.pdf");
    expect(() => assertRfpRemovable(db, p.id)).not.toThrow(); // draft
    updateProject(db, p.id, { status: "open" });
    expect(() => assertRfpRemovable(db, p.id)).toThrow(/at least one RFP/);
    await addRfp(p.id, "b.pdf");
    expect(() => assertRfpRemovable(db, p.id)).not.toThrow();
    updateProject(db, p.id, { status: "archived" });
    expect(() => assertRfpRemovable(db, p.id)).toThrow(/Restore/);
  });

  it("lists with counts, newest activity first", async () => {
    const a = mk("Alpha project");
    const b = mk("Beta project");
    await addRfp(a.id);
    await addRfp(a.id, "annex.pdf");
    addProposal(a.id);
    updateProject(db, b.id, { description: "touched later" });
    const list = listProjects(db);
    expect(list.map((p) => p.name)).toEqual(["Beta project", "Alpha project"]);
    expect(list.find((p) => p.id === a.id)).toMatchObject({
      rfpCount: 2,
      proposalCount: 1,
      standardCount: 0,
    });
  });

  it("replaces standards and rejects unknown ids", () => {
    const s = createStandard(
      db,
      standardInputSchema.parse({
        code: "CITS-2026",
        title: "IT security",
        category: "IT & security",
      }),
    );
    const p = mk();
    expect(setProjectStandards(db, p.id, [])).toEqual([]);
    expect(setProjectStandards(db, p.id, [s.id, s.id]).map((x) => x.code)).toEqual(["CITS-2026"]);
    expect(() => setProjectStandards(db, p.id, ["std_missing"])).toThrow(/no longer exist/);
  });

  it("deletes the project, its documents and files", async () => {
    const p = mk();
    const doc = await addRfp(p.id);
    expect(fs.existsSync(storage.resolve(doc.storagePath))).toBe(true);
    await deleteProject(db, storage, p.id);
    expect(() => getProject(db, p.id)).toThrow(/not found/i);
    expect(fs.existsSync(storage.resolve(doc.storagePath))).toBe(false);
  });
});

describe("project patch schema (G-42)", () => {
  it("publishing keeps deadline, description, notes and category", async () => {
    const p = mk("Cranes project", {
      description: "Two cranes",
      notes: "Night works only",
      category: "Quality",
    });
    await addRfp(p.id);
    expect(projectPatchSchema.parse({ status: "open" })).toEqual({ status: "open" });
    const open = updateProject(db, p.id, projectPatchSchema.parse({ status: "open" }));
    expect(open).toMatchObject({
      deadline: future,
      description: "Two cranes",
      notes: "Night works only",
      category: "Quality",
    });
  });
});

describe("project categories filter standards (user decision 2026-10-21)", () => {
  const std = (code: string, category: string, isActive = true) =>
    createStandard(
      db,
      standardInputSchema.parse({ code, title: `${code} title`, category, isActive }),
    );

  it("pre-selects only active standards of the same category or General", () => {
    std("CITS-2026", "IT & security");
    std("PESE-03", "Safety & environment");
    std("GEN-01", "General");
    std("OLD-IT", "IT & security", false);
    const it = mk("IT tender", { category: "IT & security" });
    expect(getProject(db, it.id).standards.map((s) => s.code)).toEqual(["CITS-2026", "GEN-01"]);
    const general = mk("Mixed tender", { category: "General" });
    expect(getProject(db, general.id).standards.map((s) => s.code)).toEqual([
      "CITS-2026",
      "GEN-01",
      "PESE-03",
    ]);
  });

  it("rejects a standard from another category unless the project is General", () => {
    const safety = std("PESE-03", "Safety & environment");
    const p = mk("IT tender", { category: "IT & security" });
    expect(() => setProjectStandards(db, p.id, [safety.id])).toThrow(/Safety & environment/);
    updateProject(db, p.id, projectPatchSchema.parse({ category: "General" }));
    expect(setProjectStandards(db, p.id, [safety.id]).map((s) => s.code)).toEqual(["PESE-03"]);
  });

  it("changing the category drops the standards that no longer fit", () => {
    std("CITS-2026", "IT & security");
    std("PESE-03", "Safety & environment");
    std("GEN-01", "General");
    const p = mk("Mixed tender", { category: "General" });
    updateProject(db, p.id, projectPatchSchema.parse({ category: "Safety & environment" }));
    expect(getProject(db, p.id).standards.map((s) => s.code)).toEqual(["GEN-01", "PESE-03"]);
  });
});

describe("migration 0002 (project categories)", () => {
  it("derives the category from the applied standards, else General", () => {
    const it = std0("CITS-2026", "IT & security");
    const safety = std0("PESE-03", "Safety & environment");
    const general = std0("GEN-01", "General");
    const legacy = (id: string, category: string, standardIds: string[]) => {
      db.$client
        .prepare("INSERT INTO projects (id, code, name, category) VALUES (?, ?, ?, ?)")
        .run(id, `PRJ-1999-${id}`, `Legacy ${id}`, category);
      for (const s of standardIds) {
        db.$client
          .prepare("INSERT INTO project_standards (project_id, standard_id) VALUES (?, ?)")
          .run(id, s);
      }
    };
    legacy("001", "equipment", [it.id]); // the user's case: only CITS-2026
    legacy("002", "software", [it.id, general.id]); // + a General standard: still IT
    legacy("003", "works", [it.id, safety.id]); // mixed → General
    legacy("004", "other", []); // none → General
    legacy("005", "Quality", []); // already new: untouched
    db.$client.exec(
      fs.readFileSync(path.join(process.cwd(), "drizzle/0002_project_categories.sql"), "utf8"),
    );
    expect(db.$client.prepare("SELECT id, category FROM projects ORDER BY id").all()).toEqual([
      { id: "001", category: "IT & security" },
      { id: "002", category: "IT & security" },
      { id: "003", category: "General" },
      { id: "004", category: "General" },
      { id: "005", category: "Quality" },
    ]);
  });
});

function std0(code: string, category: string) {
  return createStandard(db, standardInputSchema.parse({ code, title: `${code} title`, category }));
}
