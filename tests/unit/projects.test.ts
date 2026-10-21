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
    expect(v).toMatchObject({ name: "Cranes", category: "equipment", deadline: null, notes: "" });
    expect(() => projectInputSchema.parse({ name: "ab" })).toThrow();
    expect(() => projectInputSchema.parse({ name: "Cranes", deadline: "30/11/2026" })).toThrow();
    expect(() => projectInputSchema.parse({ name: "Cranes", category: "ships" })).toThrow();
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
      category: "works",
    });
    await addRfp(p.id);
    expect(projectPatchSchema.parse({ status: "open" })).toEqual({ status: "open" });
    const open = updateProject(db, p.id, projectPatchSchema.parse({ status: "open" }));
    expect(open).toMatchObject({
      deadline: future,
      description: "Two cranes",
      notes: "Night works only",
      category: "works",
    });
  });
});
