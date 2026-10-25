/**
 * The Translator (2026-10-25): every AI-written text of a run is collected, translated in one
 * step, stored, and swapped in when the results (the page, a vendor's results, the report PDF)
 * are read in the other language. Data never changes: quotes, codes, the customer's own rules.
 * A fake translator prefixes "AR " so every swapped text can be seen.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateDb, openDb, type Db } from "@/server/db/connect";
import { projects, runTranslations } from "@/server/db/schema";
import { createMockEngine, createPageLoader } from "@/server/ai/mock";
import type { AiEngine, StepInput } from "@/server/ai/types";
import { batches, dedupeTexts } from "@/server/ai/translate";
import { getAnalysisResults } from "@/server/runs/analysis";
import { getProposalResult } from "@/server/runs/read";
import { createRunner } from "@/server/runs/runner";
import { getRun, listSteps } from "@/server/runs/store";
import { collectRunTexts } from "@/server/runs/texts";
import { buildReportView } from "@/server/reports/view";
import { loadSampleData } from "@/server/seed";
import { createLocalStorage, type LocalStorage } from "@/server/storage/local";

const SEED_DIR = path.join(process.cwd(), "test-inputs");
let tmp: string;
let storage: LocalStorage;
let template: Buffer;

beforeAll(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "marsa-translate-"));
  storage = createLocalStorage(tmp);
  const db = openDb(":memory:");
  migrateDb(db);
  await loadSampleData(db, storage, SEED_DIR);
  template = db.$client.serialize();
}, 120_000);
const opened: Db[] = [];
afterAll(() => {
  for (const db of opened) db.$client.close();
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // Windows may still hold a handle for a moment.
  }
});

function freshDb(): Db {
  const file = path.join(tmp, `db-${Math.random().toString(36).slice(2)}.sqlite`);
  fs.writeFileSync(file, template);
  const db = openDb(file);
  opened.push(db);
  return db;
}

/** The demo engine, with a translator that writes "AR " before every text. */
function engine() {
  const base = createMockEngine({ loadPages: createPageLoader(storage), stepMs: 0 });
  const translated: number[] = [];
  const e: AiEngine = {
    mode: "mock",
    runStep(input, hooks) {
      const i = input as StepInput;
      if (i.phase === "translate") {
        translated.push(i.texts.length);
        const texts = Object.fromEntries(i.texts.map((t) => [t.key, `AR ${t.text}`]));
        return Promise.resolve({
          data: { target: i.target, texts },
          usage: { inputTokens: 10, outputTokens: 20, cacheReadTokens: 0, cacheWriteTokens: 0 },
          model: "fake",
          stopReason: "end_turn",
        }) as never;
      }
      return base.runStep(input, hooks);
    },
  };
  return { engine: e, translated };
}

async function analysedRun(db: Db, e: AiEngine) {
  const runner = createRunner({ db, engineFor: () => e, mode: "mock", apiKeyConfigured: false });
  const project = db
    .select()
    .from(projects)
    .all()
    .find((p) => p.name.startsWith("Cargo X-Ray"))!;
  const run = runner.start(project.id);
  await runner.wait(run.id);
  return { runner, run: getRun(db, run.id) };
}

const ar = (s: string | null | undefined) => !!s && s.startsWith("AR ");

describe("the Translator", () => {
  it("translates every AI text once, at the end of the run, and the results read in Arabic", async () => {
    const db = freshDb();
    const { engine: e, translated } = engine();
    const { run } = await analysedRun(db, e);
    expect(run.status).toBe("completed");
    expect(run.config.reportLanguage).toBe("en");
    const last = listSteps(db, run.id).at(-1)!;
    expect(last).toMatchObject({ phase: "translate", status: "done" });
    expect(translated).toHaveLength(1);

    const texts = collectRunTexts(db, run.id);
    expect(translated[0]).toBe(texts.length);
    const kinds = new Set(texts.map((t) => t.key.split(":")[0]));
    for (const k of ["req", "eval", "finding", "meta", "risk", "summary", "report", "constraint"])
      expect(kinds, k).toContain(k);
    const row = db.select().from(runTranslations).where(eq(runTranslations.runId, run.id)).get();
    expect(row?.locale).toBe("ar");
    expect(Object.keys(row!.texts)).toHaveLength(texts.length);

    // English: the run as written.
    const en = await getAnalysisResults(db, storage, run.id, "en");
    expect(en.textLanguage).toBe("en");
    expect(en.vendors.flatMap((v) => v.findings).some((f) => ar(f.assessment))).toBe(false);

    // Arabic: every AI text swapped in; data untouched.
    const res = await getAnalysisResults(db, storage, run.id, "ar");
    expect(res.textLanguage).toBe("ar");
    expect(ar(res.recommendation?.summary)).toBe(true);
    expect(res.keyConstraints.every((c) => ar(c.label) && ar(c.value))).toBe(true);
    for (const r of res.requirements) {
      // The customer's own standard rules stay as written.
      expect(ar(r.title), r.code).toBe(r.scope === "rfp");
    }
    for (const v of res.vendors) {
      expect(ar(v.summary)).toBe(true);
      expect(v.strengths.every(ar)).toBe(true);
      for (const f of v.findings) {
        expect(ar(f.assessment)).toBe(true);
        expect(ar(f.headline)).toBe(true);
        if (f.gap) expect(ar(f.gap)).toBe(true);
        if (f.evidenceQuote) expect(ar(f.evidenceQuote)).toBe(false);
      }
      for (const r of v.risks) {
        expect(ar(r.title) && ar(r.consequence) && ar(r.mitigation)).toBe(true);
        if (r.evidence) expect(ar(r.evidence)).toBe(false);
      }
      expect(v.vendor.name.startsWith("AR ")).toBe(false);
    }
    expect(res.reports.filter((r) => r.headline).every((r) => ar(r.headline))).toBe(true);

    // One vendor's results (the project page) and its report PDF follow too.
    const pid = res.vendors[0].proposalId;
    const one = getProposalResult(db, run.id, pid, "ar");
    expect(one.findings.every((f) => ar(f.assessment))).toBe(true);
    expect(ar(one.evaluation?.summary)).toBe(true);
    const { view } = buildReportView(db, run.id, pid, "ar");
    expect(view.language).toBe("ar");
    expect(ar(view.report.headline)).toBe(true);
    expect(view.report.technical.strengths.every((p) => ar(p.point))).toBe(true);
    expect(["preferred_bidder", "acceptable_with_conditions", "not_recommended"]).toContain(
      view.report.verdict,
    );
    expect(buildReportView(db, run.id, pid, "en").view.language).toBe("en");
  }, 120_000);

  it("the demo AI stores no translation: the Arabic view shows the original texts", async () => {
    const db = freshDb();
    const demo = createMockEngine({ loadPages: createPageLoader(storage), stepMs: 0 });
    const { run } = await analysedRun(db, demo);
    expect(listSteps(db, run.id).at(-1)).toMatchObject({ phase: "translate", status: "done" });
    expect(db.select().from(runTranslations).all()).toHaveLength(0);
    expect((await getAnalysisResults(db, storage, run.id, "ar")).textLanguage).toBe("en");
  }, 120_000);

  it("adds the translation to a run that finished without it (one-time backfill)", async () => {
    const db = freshDb();
    const demo = createMockEngine({ loadPages: createPageLoader(storage), stepMs: 0 });
    const { run } = await analysedRun(db, demo);
    const { engine: e, translated } = engine();
    const backfill = createRunner({
      db,
      engineFor: () => e,
      mode: "mock",
      apiKeyConfigured: false,
    });
    backfill.addTranslation(run.id);
    await backfill.wait(run.id);
    expect(translated).toHaveLength(1);
    expect(getRun(db, run.id).status).toBe("completed");
    expect((await getAnalysisResults(db, storage, run.id, "ar")).textLanguage).toBe("ar");
  }, 120_000);

  it("sends identical texts once, in batches", () => {
    const { unique, keysOf } = dedupeTexts([
      { key: "a", text: "Same" },
      { key: "b", text: "Other" },
      { key: "c", text: "Same" },
    ]);
    expect(unique).toHaveLength(2);
    expect(keysOf.get(unique[0].id)).toEqual(["a", "c"]);
    const many = Array.from({ length: 300 }, (_, i) => ({ id: String(i), text: "x".repeat(100) }));
    const parts = batches(many);
    expect(parts.length).toBeGreaterThan(2);
    expect(parts.flat()).toHaveLength(300);
  });
});
