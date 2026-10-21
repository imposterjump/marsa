/**
 * P7.5 integration: the proposal generator with the mock bid writer and the real renderers
 * (DOCX via docx, PDF via Playwright's Chromium) on the PCS sample tender.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateDb, openDb, type Db } from "@/server/db/connect";
import { documents, projects, proposals } from "@/server/db/schema";
import { createPageLoader } from "@/server/ai/mock";
import { createGenerator, type GenJob } from "@/server/simulate/jobs";
import { mockBid } from "@/server/simulate/mock";
import { commercialPdf } from "@/server/simulate/render";
import { cleanBid } from "@/server/simulate/schema";
import { loadSampleData } from "@/server/seed";
import { createLocalStorage, type LocalStorage } from "@/server/storage/local";

let tmp: string;
let storage: LocalStorage;
let db: Db;

beforeAll(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "marsa-gen-"));
  storage = createLocalStorage(tmp);
  db = openDb(":memory:");
  migrateDb(db);
  await loadSampleData(db, storage, path.join(process.cwd(), "test-inputs"));
}, 120_000);
afterAll(() => {
  db.$client.close();
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // Windows may hold a handle briefly.
  }
});

const pcs = () =>
  db
    .select()
    .from(projects)
    .all()
    .find((p) => p.name.startsWith("Port Community System"))!;

async function waitFor(job: GenJob) {
  for (let i = 0; i < 300 && job.status === "running"; i++) {
    await new Promise((r) => setTimeout(r, 100));
  }
  return job;
}

describe("AI-generated proposals (mock writer)", () => {
  const loadPages = () => createPageLoader(storage);
  const generator = () =>
    createGenerator({
      db,
      storage,
      mode: "mock",
      maxUploadMb: 50,
      writeBid: async ({ ctx, vendorName, country, profile }) => ({
        bid: await mockBid({ ctx, vendorName, country, profile, loadPages: loadPages() }),
        costUsd: 0,
      }),
      renderPdf: commercialPdf,
    });

  it("writes, renders and submits one proposal per profile", async () => {
    const gen = generator();
    const job = await waitFor(gen.start(pcs().id, ["strong", "risky_cloud"]));
    expect(job.status).toBe("done");
    expect(job.items.map((i) => i.status)).toEqual(["done", "done"]);
    const rows = db.select().from(proposals).where(eq(proposals.projectId, pcs().id)).all();
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.source === "ai")).toBe(true);
    for (const item of job.items) {
      const docs = db
        .select()
        .from(documents)
        .where(eq(documents.proposalId, item.proposalId!))
        .all();
      const pdf = docs.find((d) => d.kind === "commercial")!;
      const docx = docs.find((d) => d.kind === "technical")!;
      expect(pdf.ext).toBe("pdf");
      expect(pdf.pageCount).toBeGreaterThanOrEqual(1);
      expect(docx.ext).toBe("docx");
      expect(docx.textContent).toContain("Technical proposal");
      if (item.profile === "risky_cloud") expect(docx.textContent).toMatch(/cloud service/);
      else expect(docx.textContent).toMatch(/activated offline/);
    }
    expect(gen.latest(pcs().id)?.id).toBe(job.id);
    // Names are never reused within a tender.
    const job2 = await waitFor(gen.start(pcs().id, ["incomplete"]));
    expect(job.items.map((i) => i.vendorName)).not.toContain(job2.items[0].vendorName);
  }, 120_000);

  it("validates profiles and the tender status", () => {
    const gen = generator();
    expect(() => gen.start(pcs().id, [])).toThrow(/between 1 and 4/);
    const xray = db
      .select()
      .from(projects)
      .all()
      .find((p) => p.name.startsWith("Cargo"))!;
    db.update(projects).set({ status: "evaluated" }).where(eq(projects.id, xray.id)).run();
    expect(() => gen.start(xray.id, ["strong"])).toThrow(/open tender/);
  });
});

describe("cleanBid", () => {
  it("drops duplicate numbering and placeholder price lines", () => {
    const bid = cleanBid({
      tenderReference: "NGPA/T/2026/021",
      vendor: {
        legalName: "A",
        address: "",
        contactName: "",
        contactEmail: "",
        signatoryName: "",
        signatoryTitle: "",
      },
      technical: {
        coverLetter: "",
        sections: [
          { title: "1. Company profile", paragraphs: ["x"], tableHead: [], tableRows: [] },
          { title: "2.1) Solution", paragraphs: ["y"], tableHead: [], tableRows: [] },
          { title: "Empty", paragraphs: [], tableHead: [], tableRows: [] },
        ],
        compliance: [],
      },
      commercial: {
        coverLetter: "",
        currency: "USD",
        lines: [
          { description: "Licences", amount: 10 },
          { description: "x", amount: 0 },
        ],
        recurring: [],
        notes: [],
        terms: [],
      },
    });
    expect(bid.technical.sections.map((s) => s.title)).toEqual(["Company profile", "Solution"]);
    expect(bid.commercial.lines).toHaveLength(1);
  });
});
