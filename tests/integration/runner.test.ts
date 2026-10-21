/**
 * P6.7 / P6.9 integration: the runner with the mock engine on the real sample tender (4 vendor
 * PDFs, RFP pack, 3 standards). Covers a full run, determinism, a simulated crash + resume, a
 * failed step + retry, cancel, and the one-vendor edge case.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateDb, openDb, type Db } from "@/server/db/connect";
import {
  evaluations,
  findings,
  projects,
  proposals,
  requirements,
  risks,
} from "@/server/db/schema";
import { createMockEngine, createPageLoader } from "@/server/ai/mock";
import { AiError } from "@/server/ai/result";
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
    expect(run.totalSteps).toBe(14); // 3 × 4 + 2
    expect(db.select().from(projects).where(eq(projects.id, project.id)).get()!.status).toBe(
      "evaluating",
    );
    await r.wait(run.id);

    const done = getRun(db, run.id);
    expect(done.status).toBe("completed");
    expect(done.doneSteps).toBe(14);
    expect(calls).toHaveLength(14);
    expect(calls[0]).toBe("checklist");
    expect(calls.at(-1)).toBe("summary");
    expect(listSteps(db, run.id).every((s) => s.status === "done")).toBe(true);
    expect(db.select().from(projects).where(eq(projects.id, project.id)).get()!.status).toBe(
      "evaluated",
    );

    // Checklist: RFP requirements + every applied standard rule.
    const reqs = db.select().from(requirements).where(eq(requirements.runId, run.id)).all();
    expect(reqs.length).toBeGreaterThan(40);
    expect(reqs.filter((q) => q.sourceType === "standard" && q.standardId)).not.toHaveLength(0);
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

    const results = getRunResults(db, run.id);
    expect(results.summary?.ranking).toHaveLength(4);
    expect(results.comparisons).toHaveLength(4);
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
    expect(second.calls.length).toBe(14 - doneBefore);
    expect(xray(db).status).toBe("evaluated");
  }, 120_000);

  it("retries a parse failure once, fails other errors, and Retry re-runs the step and what it unblocked", async () => {
    const db = freshDb();
    let atlasCalls = 0;
    const { engine: e, calls } = engine((phase, vendor) => {
      if (phase === "analyze" && vendor?.startsWith("Nile")) return new Error("Network down");
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
    expect(nile.error).toContain("Network down");
    expect(
      steps.filter((s) => s.proposalId === nile.proposalId && s.status === "skipped"),
    ).toHaveLength(2);
    expect(getRun(db, run.id).status).toBe("completed_with_errors");
    expect(getRunResults(db, run.id).summary?.ranking).toHaveLength(3);

    // Fix the "network" and retry: analyse + compare + risk for Nile Gate, then the summary again.
    const before = calls.length;
    const fixed = runner(db, engine().engine);
    fixed.retryStep(run.id, nile.id);
    await fixed.wait(run.id);
    expect(getRun(db, run.id).status).toBe("completed");
    expect(listSteps(db, run.id).every((s) => s.status === "done")).toBe(true);
    expect(calls.length).toBe(before); // the old engine was not called again
    expect(getRunResults(db, run.id).summary?.ranking).toHaveLength(4);
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

  it("one proposal: the comparison is skipped and the run still completes", async () => {
    const db = freshDb();
    const p = xray(db);
    const ids = db.select().from(proposals).where(eq(proposals.projectId, p.id)).all();
    for (const x of ids.slice(1))
      db.update(proposals).set({ status: "withdrawn" }).where(eq(proposals.id, x.id)).run();
    const r = runner(db, engine().engine);
    const run = r.start(p.id);
    expect(run.totalSteps).toBe(5);
    await r.wait(run.id);
    const steps = listSteps(db, run.id);
    expect(steps.find((s) => s.phase === "compare")!.status).toBe("skipped");
    expect(getRun(db, run.id).status).toBe("completed");
  }, 60_000);
});
