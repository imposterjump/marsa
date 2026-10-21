/**
 * AI review: quality metrics of a finished run (computed from stored results, evidence checked
 * against the real PDF text) and human reviews saved with a metrics snapshot.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateDb, openDb, type Db } from "@/server/db/connect";
import { projects, runQuality, runReviews } from "@/server/db/schema";
import { createMockEngine, createPageLoader } from "@/server/ai/mock";
import { getRunQuality, saveRunQuality } from "@/server/runs/quality";
import {
  createReview,
  exportReviews,
  listReviews,
  projectReviewSummary,
  reviewInputSchema,
} from "@/server/runs/reviews";
import { createRunner } from "@/server/runs/runner";
import { loadSampleData } from "@/server/seed";
import { createLocalStorage, type LocalStorage } from "@/server/storage/local";

let tmp: string;
let storage: LocalStorage;
let db: Db;
let runId: string;
let projectId: string;

beforeAll(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "marsa-review-"));
  storage = createLocalStorage(tmp);
  db = openDb(":memory:");
  migrateDb(db);
  await loadSampleData(db, storage, path.join(process.cwd(), "test-inputs"));
  projectId = db
    .select()
    .from(projects)
    .all()
    .find((p) => p.name.startsWith("Cargo X-Ray"))!.id;
  const runner = createRunner({
    db,
    engineFor: () => createMockEngine({ loadPages: createPageLoader(storage), stepMs: 0 }),
    mode: "mock",
    apiKeyConfigured: false,
    onFinished: (id) => saveRunQuality(db, storage, id),
  });
  const run = runner.start(projectId);
  runId = run.id;
  await runner.wait(run.id);
}, 120_000);

afterAll(() => {
  db.$client.close();
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // Windows may hold a handle briefly.
  }
});

describe("run quality metrics", () => {
  it("are stored when the run finishes and describe files, calls, findings and evidence", async () => {
    expect(db.select().from(runQuality).where(eq(runQuality.runId, runId)).get()).toBeTruthy();
    const q = await getRunQuality(db, storage, runId);
    // 5 RFP files + 3 standard PDFs + 4 vendors × 2 PDFs
    expect(q.files.total).toBe(16);
    expect(q.files.processed).toBe(16);
    expect(q.files.skipped).toBe(0);
    expect(q.files.list.find((f) => f.name.endsWith(".xlsx"))?.sentAs).toBe("text");
    expect(q.files.list.find((f) => f.name.endsWith(".png"))?.sentAs).toBe("image");
    expect(q.steps).toMatchObject({ total: 14, done: 14, failed: 0, attempts: 14, retries: 0 });
    expect(q.status).toBe("completed");
    expect(q.findings.total).toBeGreaterThan(100);
    expect(Object.values(q.findings.byStatus).reduce((a, b) => a + b, 0)).toBe(q.findings.total);
    // Mock quotes are real sentences with real page numbers: the check must confirm them.
    expect(q.evidence.quoted).toBeGreaterThan(0);
    expect(q.evidence.verified / q.evidence.quoted).toBeGreaterThan(0.9);
    expect(q.vendors).toHaveLength(4);
    expect(q.vendors.every((v) => v.analysisStatus === "done" && v.findings > 0)).toBe(true);
    expect(q.confidence.score).toBeGreaterThan(0);
    expect(q.confidence.score).toBeLessThanOrEqual(100);
    expect(q.confidence.parts.completion).toBe(100);
    expect(q.costUsd).toBe(0);
  }, 60_000);
});

describe("human reviews", () => {
  it("validate ratings and verdicts", () => {
    expect(reviewInputSchema.safeParse({ overall: 6, verdict: "trust" }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ overall: 4, verdict: "maybe" }).success).toBe(false);
    expect(reviewInputSchema.parse({ overall: 4, verdict: "trust" })).toMatchObject({
      accuracy: null,
      comment: "",
    });
  });

  it("are saved with a metrics snapshot, listed newest first and exported", async () => {
    await createReview(
      db,
      storage,
      runId,
      reviewInputSchema.parse({
        reviewer: "Layla Mansour",
        overall: 3,
        verdict: "trust_with_edits",
        accuracy: 3,
        comment: "Two partial findings were wrong.",
      }),
    );
    await new Promise((r) => setTimeout(r, 5));
    await createReview(
      db,
      storage,
      runId,
      reviewInputSchema.parse({ overall: 5, verdict: "trust" }),
    );

    const list = listReviews(db, runId);
    expect(list.map((r) => r.overall)).toEqual([5, 3]);
    const row = db.select().from(runReviews).where(eq(runReviews.id, list[1].id)).get()!;
    expect(
      (row.metricsSnapshot as { confidence: { score: number } }).confidence.score,
    ).toBeGreaterThan(0);

    const summary = projectReviewSummary(db, projectId);
    expect(summary[0]).toMatchObject({ reviews: 2, rating: 4 });
    expect(summary[0].confidence).toBeGreaterThan(0);

    const exported = exportReviews(db);
    expect(exported).toHaveLength(2);
    expect(exported[0]).toMatchObject({
      reviewer: "Layla Mansour",
      run: { id: runId, mode: "mock" },
    });
    expect(exported[0].project.name).toContain("Cargo X-Ray");
    expect(exported[0].metrics).toBeTruthy();
  });
});
