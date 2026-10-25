/**
 * Building works tenders (2026-10-25), end to end on the fictional tender in
 * test-inputs/works-tender (the portal's export layout, bids in a zip): upload → preview →
 * import → price comparison → an analysis with the demo engine, filed under the works sections.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateDb, openDb, type Db } from "@/server/db/connect";
import { projects, proposals } from "@/server/db/schema";
import { createMockEngine, createPageLoader } from "@/server/ai/mock";
import { getBoqComparison } from "@/server/boq/load";
import { commitTender } from "@/server/imports/commit";
import {
  addImportFile,
  createImport,
  dropImport,
  importEntries,
  scanImport,
} from "@/server/imports/staging";
import { previewOf, scanTender, type ImportEntry } from "@/server/imports/tender";
import { getAnalysisResults } from "@/server/runs/analysis";
import { createRunner } from "@/server/runs/runner";
import { getRun, listSteps } from "@/server/runs/store";
import { createLocalStorage, type LocalStorage } from "@/server/storage/local";
import { WORKS_CATEGORY, WORKS_SECTIONS } from "@/lib/domain";

const TENDER = path.join(
  process.cwd(),
  "test-inputs",
  "works-tender",
  "مناقصة صيانة مبنى مركز خدمات المتعاملين - تجريبية",
);

function folderEntries(root: string): ImportEntry[] {
  const base = path.dirname(root);
  const out: ImportEntry[] = [];
  const walk = (p: string) => {
    if (fs.statSync(p).isDirectory()) for (const e of fs.readdirSync(p)) walk(path.join(p, e));
    else
      out.push({
        path: path.relative(base, p).split(path.sep).join("/"),
        size: fs.statSync(p).size,
        read: async () => fs.readFileSync(p),
      });
  };
  walk(root);
  return out;
}

let tmp: string;
let storage: LocalStorage;
let db: Db;
beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "marsa-works-"));
  storage = createLocalStorage(tmp);
  db = openDb(":memory:");
  migrateDb(db);
});
afterAll(() => {
  db.$client.close();
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // Windows may still hold a handle for a moment.
  }
});

describe("a building works tender", () => {
  it("is read from the portal's export: tender documents, estimate, companies, envelopes", async () => {
    const scan = await scanTender(folderEntries(TENDER));
    expect(scan.name).toBe("مناقصة صيانة مبنى مركز خدمات المتعاملين - تجريبية");
    expect(scan.tenderDocs.map((d) => d.name).sort()).toEqual([
      "إقرار بمستندات العطاء.pdf",
      "جدول كميات المناقصة.pdf",
      "جدول كميات المناقصة.xlsx",
    ]);
    expect(scan.internalDocs).toHaveLength(1);
    expect(scan.estimate).toMatchObject({ amount: 310000, currency: "AED" });
    expect(scan.rounds.map((r) => r.key)).toEqual(["opening"]);
    const [wadi, reem, coast] = scan.rounds[0].vendors;
    expect(wadi.name).toBe("Al Wadi Building Contracting LLC");
    expect(reem.name).toBe("شركة الريم للمقاولات العامة ذ.م.م");
    expect(reem.files.map((f) => f.name)).not.toContain("001-التأمين_الابتدائي.pdf");
    expect(coast.duplicates).toBe(1);
    const kinds = Object.fromEntries(wadi.files.map((f) => [f.name, f.kind]));
    expect(kinds["005-جدول_الكميات(Excel).xlsx"]).toBe("commercial");
    expect(kinds["001-التأمين_الابتدائي.pdf"]).toBe("commercial");
    expect(kinds["002-رخصة_تجارية.pdf"]).toBe("technical");
    expect(previewOf("imp_x", scan).rounds[0].vendors[2].duplicates).toBe(1);
  });

  it("refuses a folder that holds two tenders", async () => {
    const two = [
      ...folderEntries(TENDER).map((e) => ({ ...e, path: `A/${e.path}` })),
      ...folderEntries(TENDER).map((e) => ({ ...e, path: `A/copy/${e.path}` })),
    ];
    await expect(scanTender(two)).rejects.toThrow(/2 tenders/);
  });

  it("imports through the upload area, compares the prices and is analysed under the works sections", async () => {
    // Upload area: what the browser does.
    const id = await createImport(storage);
    for (const e of folderEntries(TENDER)) await addImportFile(storage, id, e.path, await e.read());
    expect(await importEntries(storage, id)).toHaveLength(5); // 3 tender docs, 1 internal, the bids zip
    const scan = await scanImport(storage, id);
    const res = await commitTender(db, storage, scan, {
      name: scan.name,
      category: WORKS_CATEGORY,
      round: "opening",
      estimateAmount: scan.estimate!.amount,
      estimateCurrency: "AED",
    });
    await dropImport(storage, id);
    expect(fs.existsSync(path.join(tmp, "_imports", id))).toBe(false);
    expect(res).toMatchObject({ vendors: 3, skipped: [] });
    const project = db.select().from(projects).where(eq(projects.id, res.projectId)).get()!;
    expect(project).toMatchObject({
      category: WORKS_CATEGORY,
      status: "open",
      estimateAmount: 310000,
    });
    const props = db.select().from(proposals).where(eq(proposals.projectId, project.id)).all();
    expect(props.every((p) => p.source === "import")).toBe(true);

    // Prices, line by line.
    const prices = (await getBoqComparison(db, storage, project.id))!;
    expect(prices.items).toBe(14);
    const by = (name: string) => prices.vendors.find((v) => v.vendor.startsWith(name))!;
    expect(by("شركة الريم")).toMatchObject({ rank: 1, unpriced: 2, qtyChanged: 1 });
    expect(by("Al Wadi")).toMatchObject({ rank: 2, unpriced: 0, arithmetic: 0, extra: 0 });
    expect(by("Coastline")).toMatchObject({ rank: 3, arithmetic: 1, extra: 1 });
    expect(by("Coastline").vsEstimatePct).toBeGreaterThan(100);

    // An analysis with the demo engine: the tender's own conditions, the works sections.
    const runner = createRunner({
      db,
      engineFor: () => createMockEngine({ loadPages: createPageLoader(storage), stepMs: 0 }),
      mode: "mock",
      apiKeyConfigured: false,
      pricesFor: (run) => getBoqComparison(db, storage, run.projectId, run.config.proposalIds),
    });
    const run = runner.start(project.id);
    await runner.wait(run.id);
    expect(getRun(db, run.id).status).toBe("completed");
    expect(listSteps(db, run.id).every((s) => s.status === "done")).toBe(true);
    const results = await getAnalysisResults(db, storage, run.id, "en");
    expect(results.sections).toEqual([...WORKS_SECTIONS]);
    expect(results.requirements.every((r) => WORKS_SECTIONS.includes(r.section as never))).toBe(
      true,
    );
    const reem = results.vendors.find((v) => v.vendor.name.startsWith("شركة الريم"))!;
    const bond = reem.findings.find((f) =>
      /bid bond/i.test(results.requirements.find((r) => r.id === f.requirementId)!.title),
    )!;
    expect(bond.status).toBe("not_addressed");
    const pricing = reem.findings.find((f) =>
      /every item/i.test(results.requirements.find((r) => r.id === f.requirementId)!.title),
    )!;
    expect(pricing.status).toBe("non_compliant"); // 2 of 14 lines unpriced: more than 10 %
  }, 120_000);
});
