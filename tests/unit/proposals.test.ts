import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrateDb, openDb, type Db } from "@/server/db/connect";
import { ingestDocument } from "@/server/documents/ingest";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  projectInputSchema,
  updateProject,
} from "@/server/services/projects";
import {
  assertProposalAcceptsFiles,
  createVendor,
  deleteProposal,
  ensureVendor,
  getProposal,
  listProposals,
  listVendors,
  submitProposal,
  vendorInputSchema,
} from "@/server/services/proposals";
import { createLocalStorage, type LocalStorage } from "@/server/storage/local";

let db: Db;
let storage: LocalStorage;
let tmp: string;

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "marsa-prp-"));
  storage = createLocalStorage(tmp);
});
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
beforeEach(() => {
  db = openDb(":memory:");
  migrateDb(db);
});

const pdf = new TextEncoder().encode("%PDF-1.4\n%%EOF");
const vendor = (name: string) => createVendor(db, vendorInputSchema.parse({ name }));

/** An open project with one RFP document. */
async function openProject(name = "Cargo X-Ray Systems") {
  const p = createProject(db, projectInputSchema.parse({ name }));
  await ingestDocument(db, storage, {
    owner: { kind: "rfp", projectId: p.id },
    fileName: "rfp.pdf",
    bytes: pdf,
    maxSizeMb: 5,
  });
  updateProject(db, p.id, { status: "open" });
  return p;
}
const addFile = (
  projectId: string,
  proposalId: string,
  kind: "commercial" | "technical",
  name: string,
) =>
  ingestDocument(db, storage, {
    owner: { kind, projectId, proposalId },
    fileName: name,
    bytes: pdf,
    maxSizeMb: 5,
  });

describe("vendors", () => {
  it("validates input and rejects duplicate names ignoring case", () => {
    expect(() => vendorInputSchema.parse({ name: "A" })).toThrow();
    expect(() => vendorInputSchema.parse({ name: "Atlas", contactEmail: "nope" })).toThrow();
    expect(
      vendorInputSchema.parse({ name: " Atlas Port Technologies ", contactEmail: "" }),
    ).toMatchObject({
      name: "Atlas Port Technologies",
      country: "",
    });
    vendor("Harborline Systems");
    expect(() => vendor("harborline systems")).toThrow(/already exists/);
  });

  it("ensureVendor reuses an existing vendor", () => {
    const a = vendor("Nile Gate Solutions");
    expect(ensureVendor(db, vendorInputSchema.parse({ name: "NILE GATE SOLUTIONS" })).id).toBe(
      a.id,
    );
    expect(listVendors(db)).toHaveLength(1);
  });
});

describe("proposals", () => {
  it("drafts and open tenders accept vendors; archived ones don't (P8 guided form)", async () => {
    const v = vendor("Meridian Scan Technologies");
    const draft = createProject(db, projectInputSchema.parse({ name: "Draft tender" }));
    // The guided form adds vendors before the project is created (published).
    expect((await submitProposal(db, storage, draft.id, v.id)).proposal.status).toBe("submitted");
    updateProject(db, draft.id, { status: "archived" });
    await expect(submitProposal(db, storage, draft.id, v.id)).rejects.toThrow(/archived/);
    const p = await openProject();
    const { proposal, replaced } = await submitProposal(db, storage, p.id, v.id);
    expect(replaced).toBe(false);
    expect(proposal).toMatchObject({ status: "submitted", source: "simulator" });
    updateProject(db, p.id, { status: "archived" });
    expect(() => assertProposalAcceptsFiles(db, proposal.id)).toThrow(/archived/);
  });

  it("lists proposals with vendor and per-kind file counts; counts appear on the project", async () => {
    const p = await openProject();
    const a = vendor("Harborline Systems");
    const b = vendor("Atlas Port Technologies");
    const pa = (await submitProposal(db, storage, p.id, a.id)).proposal;
    await addFile(p.id, pa.id, "commercial", "commercial.pdf");
    await addFile(p.id, pa.id, "technical", "technical.pdf");
    await addFile(p.id, pa.id, "technical", "annex.pdf");
    await submitProposal(db, storage, p.id, b.id);

    const list = listProposals(db, p.id);
    expect(list).toHaveLength(2);
    const row = list.find((x) => x.vendor.name === "Harborline Systems")!;
    expect(row.documentCounts).toMatchObject({ commercial: 1, technical: 2 });
    expect(getProject(db, p.id).proposalCount).toBe(2);
    expect(listProjects(db)[0].proposalCount).toBe(2);
    expect(listVendors(db).find((v) => v.id === a.id)?.proposalCount).toBe(1);

    const detail = getProposal(db, pa.id);
    expect(detail.commercialDocuments.map((d) => d.originalName)).toEqual(["commercial.pdf"]);
    expect(detail.technicalDocuments).toHaveLength(2);
    expect(detail.project.code).toBe(p.code);
  });

  it("a resubmission replaces the old files and keeps one proposal per vendor", async () => {
    const p = await openProject();
    const v = vendor("Nile Gate Solutions");
    const first = (await submitProposal(db, storage, p.id, v.id)).proposal;
    const old = await addFile(p.id, first.id, "commercial", "v1.pdf");
    const again = await submitProposal(db, storage, p.id, v.id);
    expect(again.replaced).toBe(true);
    expect(again.proposal.id).toBe(first.id);
    expect(getProposal(db, first.id).commercialDocuments).toHaveLength(0);
    expect(fs.existsSync(storage.resolve(old.storagePath))).toBe(false);
    expect(listProposals(db, p.id)).toHaveLength(1);
  });

  it("deletes a proposal with its files; deleting the project cascades", async () => {
    const p = await openProject();
    const v = vendor("Atlas Port Technologies");
    const prop = (await submitProposal(db, storage, p.id, v.id)).proposal;
    const doc = await addFile(p.id, prop.id, "technical", "tech.pdf");
    await deleteProposal(db, storage, prop.id);
    expect(listProposals(db, p.id)).toHaveLength(0);
    expect(fs.existsSync(storage.resolve(doc.storagePath))).toBe(false);

    const prop2 = (await submitProposal(db, storage, p.id, v.id)).proposal;
    await addFile(p.id, prop2.id, "commercial", "c.pdf");
    await deleteProject(db, storage, p.id);
    expect(() => getProposal(db, prop2.id)).toThrow(/not found/i);
    expect(listVendors(db)).toHaveLength(1); // vendors outlive projects
  });

  it("a project with proposals can't go back to draft", async () => {
    const p = await openProject();
    await submitProposal(db, storage, p.id, vendor("Harborline Systems").id);
    expect(() => updateProject(db, p.id, { status: "draft" })).toThrow(/already has proposals/);
  });
});
