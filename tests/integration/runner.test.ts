/**
 * P6.7 / P6.9 integration: the runner with the mock engine on the real sample tender (4 vendor
 * PDFs, RFP pack, 3 standards). Covers a full run, determinism, a simulated crash + resume, a
 * failed step + retry, cancel, and the one-vendor edge case.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateDb, openDb, type Db } from "@/server/db/connect";
import {
  analysisMeta,
  analysisRuns,
  analysisSteps,
  evaluations,
  findings,
  projects,
  proposals,
  requirements,
  risks,
  runSummaries,
} from "@/server/db/schema";
import { computeVendorScores } from "@/server/runs/scores";
import { createMockEngine, createPageLoader } from "@/server/ai/mock";
import Anthropic from "@anthropic-ai/sdk";
import { AiError } from "@/server/ai/result";
import type { ReportOutput } from "@/server/ai/schemas";
import type { AiEngine } from "@/server/ai/types";
import { getProposalResult, getRunResults, getRunStatus } from "@/server/runs/read";
import { createRunner } from "@/server/runs/runner";
import { getRun, listSteps } from "@/server/runs/store";
import { loadSampleData } from "@/server/seed";
import { createLocalStorage, type LocalStorage } from "@/server/storage/local";

const SEED_DIR = path.join(process.cwd(), "test-inputs");
let tmp: string;
let storage: LocalStorage;
let template: Buffer; // serialized DB with the sample data, cloned per test

beforeAll(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "marsa-run-"));
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
    // Windows may still hold a handle for a moment; the OS cleans the temp folder.
  }
});

function freshDb(): Db {
  const file = path.join(tmp, `db-${Math.random().toString(36).slice(2)}.sqlite`);
  fs.writeFileSync(file, template);
  const db = openDb(file);
  opened.push(db);
  return db;
}

const xray = (db: Db) =>
  db
    .select()
    .from(projects)
    .all()
    .find((p) => p.name.startsWith("Cargo X-Ray"))!;

/** Mock engine with call counting and optional fault injection per call. */
function engine(
  faults: (phase: string, vendor: string | undefined, call: number) => "hang" | Error | null = () =>
    null,
) {
  const base = createMockEngine({ loadPages: createPageLoader(storage), stepMs: 0 });
  const calls: string[] = [];
  const e: AiEngine = {
    mode: "mock",
    runStep(input, hooks) {
      const vendor = "vendor" in input ? input.vendor.name : undefined;
      calls.push(`${input.phase}${vendor ? `:${vendor}` : ""}`);
      const f = faults(input.phase, vendor, calls.length);
      if (f === "hang") return new Promise(() => {});
      if (f) return Promise.reject(f);
      return base.runStep(input, hooks);
    },
  };
  return { engine: e, calls };
}

function runner(db: Db, e: AiEngine) {
  return createRunner({ db, engineFor: () => e, mode: "mock", apiKeyConfigured: false });
}

describe("analysis runner (mock engine)", () => {
  it("runs the whole pipeline and persists normalized results", async () => {
    const db = freshDb();
    const { engine: e, calls } = engine();
    const r = runner(db, e);
    const project = xray(db);
    const run = r.start(project.id);
    // P8: checklist + 4 × (standards, RFP, risk) + recommendation + 4 consultant reports +
    // the Translator
    expect(run.totalSteps).toBe(19);
    expect(db.select().from(projects).where(eq(projects.id, project.id)).get()!.status).toBe(
      "evaluating",
    );
    await r.wait(run.id);

    const done = getRun(db, run.id);
    expect(done.status).toBe("completed");
    expect(done.doneSteps).toBe(19);
    expect(calls).toHaveLength(19);
    expect(calls[0]).toBe("checklist");
    expect(calls.slice(1, 5).every((c) => c.startsWith("standards:"))).toBe(true);
    expect(calls.slice(5, 9).every((c) => c.startsWith("analyze:"))).toBe(true);
    expect(calls[13]).toBe("summary");
    expect(calls.slice(14, 18).every((c) => c.startsWith("report:"))).toBe(true);
    expect(calls[18]).toBe("translate");
    expect(listSteps(db, run.id).every((s) => s.status === "done")).toBe(true);
    expect(db.select().from(projects).where(eq(projects.id, project.id)).get()!.status).toBe(
      "evaluated",
    );

    // Checklist: RFP requirements + every applied standard rule as its own requirement, each
    // filed under a proposal section.
    const reqs = db.select().from(requirements).where(eq(requirements.runId, run.id)).all();
    expect(reqs.length).toBeGreaterThan(40);
    const rules = reqs.filter((q) => q.sourceType === "standard");
    expect(rules.length).toBe(38); // CITS-2026 14 + PESE-03 12 + PCT-07 12
    expect(rules.every((q) => q.standardId && q.code === q.sourceRef)).toBe(true);
    const meta = db.select().from(analysisMeta).where(eq(analysisMeta.runId, run.id)).all();
    const reqMeta = meta.filter((m) => m.kind === "requirement");
    expect(reqMeta).toHaveLength(reqs.length);
    expect(reqMeta.every((m) => m.section)).toBe(true);
    expect(new Set(reqMeta.map((m) => m.section)).size).toBeGreaterThan(3);
    // Every finding has a one-line summary; every risk a section.
    const findingMeta = meta.filter((m) => m.kind === "finding");
    expect(findingMeta.length).toBe(reqs.length * 4);
    expect(findingMeta.every((m) => m.headline.length > 0)).toBe(true);
    expect(meta.filter((m) => m.kind === "risk").every((m) => m.section)).toBe(true);
    // One finding per requirement per vendor.
    const evs = db.select().from(evaluations).where(eq(evaluations.runId, run.id)).all();
    expect(evs).toHaveLength(4);
    for (const ev of evs) {
      expect(db.select().from(findings).where(eq(findings.evaluationId, ev.id)).all()).toHaveLength(
        reqs.length,
      );
      expect(ev.scorePct).toBeGreaterThan(0);
    }
    expect(
      db.select().from(risks).where(eq(risks.runId, run.id)).all().length,
    ).toBeGreaterThanOrEqual(12);

    // The cloud-dependent vendor is non-compliant on hosting rules, with a real page reference.
    const meridian = db
      .select()
      .from(proposals)
      .all()
      .find((p) =>
        getRunStatus(db, run.id, false)
          .chips.find((c) => c.proposalId === p.id)
          ?.vendor.startsWith("Meridian"),
      )!;
    const detail = getProposalResult(db, run.id, meridian.id);
    const hosting = detail.findings.filter(
      (f) => f.status === "non_compliant" && /cloud/i.test(f.evidenceQuote ?? ""),
    );
    expect(hosting.length).toBeGreaterThan(0);
    expect(hosting[0].evidencePage).toBeGreaterThan(0);
    expect(hosting[0].evidenceDocId).toBeTruthy();

    // Marsa ranks and recommends; the model only explains.
    const results = getRunResults(db, run.id);
    expect(results.summary?.ranking).toHaveLength(4);
    expect(results.comparisons).toHaveLength(0);
    const scores = computeVendorScores(db, getRun(db, run.id));
    expect(scores.map((x) => x.rank)).toEqual([1, 2, 3, 4]);
    expect(scores.every((x) => x.standardsPct !== null && x.riskScore >= 0)).toBe(true);
    const summary = db.select().from(runSummaries).where(eq(runSummaries.runId, run.id)).get()!;
    expect(summary.recommendedProposalId).toBe(scores[0].proposalId);

    // One consultant report per vendor; only Marsa's pick is the preferred bidder.
    const reports = listSteps(db, run.id).filter((s) => s.phase === "report");
    expect(reports).toHaveLength(4);
    const verdicts = new Map(
      reports.map((s) => [s.proposalId, (s.output as ReportOutput).verdict]),
    );
    expect(verdicts.get(scores[0].proposalId)).toBe("preferred_bidder");
    expect([...verdicts.values()].filter((v) => v === "preferred_bidder")).toHaveLength(1);
    const first = reports[0].output as ReportOutput;
    expect(first.technical.strengths.length + first.technical.weaknesses.length).toBeGreaterThan(0);
    expect(first.recommendation.opinion).toBeTruthy();
    expect(
      getRunStatus(db, run.id, false).chips.every((c) => c.scorePct !== null && c.overallRisk),
    ).toBe(true);
  }, 120_000);

  it("gives the same scores on every run (deterministic mock)", async () => {
    const scores = async () => {
      const db = freshDb();
      const r = runner(db, engine().engine);
      const run = r.start(xray(db).id);
      await r.wait(run.id);
      return getRunResults(db, run.id)
        .evaluations.map((e) => `${e.vendor.name}:${e.scorePct}:${e.mandatoryFailures}`)
        .join("|");
    };
    expect(await scores()).toBe(await scores());
  }, 120_000);

  it("survives a crash: the run is interrupted on restart and resumes without re-running finished steps", async () => {
    const db = freshDb();
    // Process 1 hangs on the third call (the second analysis) and "crashes".
    const first = engine((_p, _v, n) => (n === 3 ? "hang" : null));
    const r1 = runner(db, first.engine);
    const run = r1.start(xray(db).id);
    await new Promise((res) => setTimeout(res, 300));
    const doneBefore = listSteps(db, run.id).filter((s) => s.status === "done").length;
    expect(doneBefore).toBeGreaterThanOrEqual(2);

    // Process 2 starts: the stale run is interrupted.
    const second = engine();
    const r2 = runner(db, second.engine);
    expect(getRun(db, run.id).status).toBe("interrupted");
    expect(listSteps(db, run.id).some((s) => s.status === "running")).toBe(false);
    expect(xray(db).status).toBe("open");

    r2.resume(run.id);
    await r2.wait(run.id);
    expect(getRun(db, run.id).status).toBe("completed");
    expect(second.calls).not.toContain("checklist"); // finished work is never re-billed
    expect(second.calls.length).toBe(19 - doneBefore);
    expect(xray(db).status).toBe("evaluated");
  }, 120_000);

  it("retries a parse failure once; a failed check holds the run before the recommendation, and Retry finishes it with every vendor", async () => {
    const db = freshDb();
    let atlasCalls = 0;
    const { engine: e, calls } = engine((phase, vendor) => {
      if (phase === "analyze" && vendor?.startsWith("Nile")) return new Error("Model said no");
      if (phase === "analyze" && vendor?.startsWith("Atlas") && ++atlasCalls === 1) {
        return new AiError("invalid_output", "bad json");
      }
      return null;
    });
    const r = runner(db, e);
    const run = r.start(xray(db).id);
    await r.wait(run.id);

    const steps = listSteps(db, run.id);
    const nile = steps.find((s) => s.phase === "analyze" && s.label.includes("Nile"))!;
    const atlas = steps.find((s) => s.phase === "analyze" && s.label.includes("Atlas"))!;
    expect(atlas.status).toBe("done");
    expect(atlas.attempt).toBe(2);
    expect(nile.status).toBe("failed");
    expect(nile.error).toContain("Model said no");
    // Its standards check succeeded; its risk step had to be skipped.
    expect(
      steps
        .filter((s) => s.proposalId === nile.proposalId && s.status === "skipped")
        .map((s) => s.phase),
    ).toEqual(["risk"]);
    // Held (2026-10-26): no recommendation or report is written without Nile Gate, which would
    // have to be paid for again after its Retry.
    const held = getRun(db, run.id);
    expect(held.status).toBe("interrupted");
    expect(held.error).toMatch(/^Checking Nile.* failed\. Retry it so the recommendation/);
    expect(calls.some((c) => c === "summary" || c.startsWith("report:"))).toBe(false);
    expect(
      steps
        .filter((s) => ["summary", "report", "translate"].includes(s.phase))
        .every((s) => s.status === "queued"),
    ).toBe(true);
    expect(xray(db).status).toBe("open");

    // Fix it and retry: the RFP check + risk for Nile Gate, then the summary and every report,
    // once each.
    const before = calls.length;
    const fixed = engine();
    const retried = runner(db, fixed.engine);
    retried.retryStep(run.id, nile.id);
    await retried.wait(run.id);
    expect(getRun(db, run.id).status).toBe("completed");
    expect(listSteps(db, run.id).every((s) => s.status === "done")).toBe(true);
    expect(calls.length).toBe(before); // the old engine was not called again
    expect(fixed.calls.filter((c) => c === "summary")).toHaveLength(1);
    expect(fixed.calls.filter((c) => c.startsWith("report:"))).toHaveLength(4);
    expect(getRunResults(db, run.id).summary?.ranking).toHaveLength(4);

    // A failed report retries alone (and the Translator after it, so both languages agree).
    const report = listSteps(db, run.id).find((s) => s.phase === "report")!;
    db.update(analysisSteps)
      .set({ status: "failed", error: "Overloaded" })
      .where(eq(analysisSteps.id, report.id))
      .run();
    const counted = engine();
    const again = runner(db, counted.engine);
    again.retryStep(run.id, report.id);
    await again.wait(run.id);
    expect(counted.calls).toHaveLength(2);
    expect(counted.calls[0]).toMatch(/^report:/);
    expect(counted.calls[1]).toBe("translate");
  }, 120_000);

  it("finishes without the failed vendor when a held run is resumed", async () => {
    const db = freshDb();
    const { engine: e } = engine((phase, vendor) =>
      phase === "analyze" && vendor?.startsWith("Nile") ? new Error("Model said no") : null,
    );
    const r = runner(db, e);
    const run = r.start(xray(db).id);
    await r.wait(run.id);
    expect(getRun(db, run.id).status).toBe("interrupted");

    r.resume(run.id);
    await r.wait(run.id);
    expect(getRun(db, run.id).status).toBe("completed_with_errors");
    expect(getRunResults(db, run.id).summary?.ranking).toHaveLength(3);
    const nile = listSteps(db, run.id).filter((s) => s.label.includes("Nile"));
    expect(nile.find((s) => s.phase === "analyze")!.status).toBe("failed");
    expect(nile.filter((s) => s.status === "skipped").map((s) => s.phase)).toEqual([
      "risk",
      "report",
    ]);
  }, 120_000);

  it("pauses when the credit runs out and resumes without paying twice", async () => {
    const db = freshDb();
    const credit = () =>
      Anthropic.APIError.generate(
        400,
        {
          type: "error",
          error: {
            type: "invalid_request_error",
            message: "Your credit balance is too low to access the Anthropic API.",
          },
        },
        undefined,
        new Headers(),
      );
    const first = engine((phase) => (phase === "analyze" ? credit() : null));
    const r1 = runner(db, first.engine);
    const run = r1.start(xray(db).id);
    await r1.wait(run.id);

    const paused = getRun(db, run.id);
    expect(paused.status).toBe("interrupted");
    expect(paused.error).toMatch(/credit ran out.*Resume/);
    const steps = listSteps(db, run.id);
    // Nothing failed: the RFP checks went back to the queue, and nothing after them started.
    expect(steps.some((s) => s.status === "failed")).toBe(false);
    expect(steps.filter((s) => s.phase === "analyze").every((s) => s.status === "queued")).toBe(
      true,
    );
    expect(first.calls.some((c) => c.startsWith("risk:") || c === "summary")).toBe(false);
    const doneBefore = steps.filter((s) => s.status === "done").length;
    expect(doneBefore).toBe(5); // the checklist and the four standards checks
    expect(xray(db).status).toBe("open");

    // Credit added: Resume runs only what is left.
    const second = engine();
    const r2 = runner(db, second.engine);
    r2.resume(run.id);
    await r2.wait(run.id);
    expect(getRun(db, run.id).status).toBe("completed");
    expect(second.calls).toHaveLength(19 - doneBefore);
    expect(second.calls.some((c) => c === "checklist" || c.startsWith("standards:"))).toBe(false);
  }, 120_000);

  it("pauses on a lost connection and keeps the steps that finished meanwhile", async () => {
    const db = freshDb();
    let analyses = 0;
    const first = engine((phase) =>
      phase === "analyze" && ++analyses === 2
        ? new Anthropic.APIConnectionError({ message: "Connection error." })
        : null,
    );
    const r1 = runner(db, first.engine);
    const run = r1.start(xray(db).id);
    await r1.wait(run.id);
    const paused = getRun(db, run.id);
    expect(paused.status).toBe("interrupted");
    expect(paused.error).toMatch(/^Could not reach the Anthropic API/);
    const steps = listSteps(db, run.id);
    expect(steps.some((s) => s.status === "failed")).toBe(false);
    const doneBefore = steps.filter((s) => s.status === "done").length;
    expect(
      steps.filter((s) => s.phase === "analyze" && s.status === "done").length,
    ).toBeGreaterThan(0);

    const second = engine();
    const r2 = runner(db, second.engine);
    r2.resume(run.id);
    await r2.wait(run.id);
    expect(getRun(db, run.id).status).toBe("completed");
    expect(second.calls).toHaveLength(19 - doneBefore);
  }, 120_000);

  it("adds the reports to a run that finished without them, once", async () => {
    const db = freshDb();
    const r = runner(db, engine().engine);
    const run = r.start(xray(db).id);
    await r.wait(run.id);
    // As in a run from before reports existed.
    db.delete(analysisSteps)
      .where(and(eq(analysisSteps.runId, run.id), eq(analysisSteps.phase, "report")))
      .run();
    db.update(analysisRuns).set({ totalSteps: 15 }).where(eq(analysisRuns.id, run.id)).run();

    const counted = engine();
    const backfill = runner(db, counted.engine);
    backfill.addReports(run.id);
    await backfill.wait(run.id);
    // The new reports, then the Translator again for them.
    expect(counted.calls).toHaveLength(5);
    expect(counted.calls.slice(0, 4).every((c) => c.startsWith("report:"))).toBe(true);
    expect(counted.calls[4]).toBe("translate");
    const after = getRun(db, run.id);
    expect(after).toMatchObject({ status: "completed", totalSteps: 19, doneSteps: 19 });
    // Nothing left to add: a second call runs nothing.
    backfill.addReports(run.id);
    await backfill.wait(run.id);
    expect(counted.calls).toHaveLength(5);
  }, 120_000);

  it("cancels a running analysis and can resume it", async () => {
    const db = freshDb();
    const slow = createMockEngine({ loadPages: createPageLoader(storage), stepMs: 150 });
    const r = runner(db, slow);
    const run = r.start(xray(db).id);
    await new Promise((res) => setTimeout(res, 250));
    r.cancel(run.id);
    await r.wait(run.id);
    expect(getRun(db, run.id).status).toBe("cancelled");
    expect(listSteps(db, run.id).some((s) => s.status === "cancelled")).toBe(true);
    expect(xray(db).status).toBe("open");

    r.resume(run.id);
    await r.wait(run.id);
    expect(getRun(db, run.id).status).toBe("completed");
  }, 120_000);

  it("refuses a second run while one is active", async () => {
    const db = freshDb();
    const r = runner(db, createMockEngine({ loadPages: createPageLoader(storage), stepMs: 50 }));
    const run = r.start(xray(db).id);
    expect(() => r.start(xray(db).id)).toThrow(/already running/);
    r.cancel(run.id);
    await r.wait(run.id);
  }, 60_000);

  it("one proposal: checklist, its three checks and the recommendation", async () => {
    const db = freshDb();
    const p = xray(db);
    const ids = db.select().from(proposals).where(eq(proposals.projectId, p.id)).all();
    for (const x of ids.slice(1))
      db.update(proposals).set({ status: "withdrawn" }).where(eq(proposals.id, x.id)).run();
    const r = runner(db, engine().engine);
    const run = r.start(p.id);
    expect(run.totalSteps).toBe(7);
    await r.wait(run.id);
    const steps = listSteps(db, run.id);
    expect(steps.map((s) => s.phase)).toEqual([
      "checklist",
      "standards",
      "analyze",
      "risk",
      "summary",
      "report",
      "translate",
    ]);
    expect(getRun(db, run.id).status).toBe("completed");
  }, 60_000);
});
