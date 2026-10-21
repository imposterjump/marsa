/**
 * Human reviews of analysis runs (user request after P7): a person rates the AI's work; every
 * review is stored with a snapshot of the run's quality metrics so the ratings can be used later
 * to improve prompts, models and scoring (export: GET /api/reviews/export). No `server-only`.
 */
import { asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/connect";
import { analysisRuns, projects, runQuality, runReviews } from "../db/schema";
import type { LocalStorage } from "../storage/local";
import { REVIEW_VERDICTS } from "../../lib/domain";
import type { RunQualityDto, RunReviewDto } from "../../lib/api-types";
import { newId } from "../../lib/ids";
import { getRunQuality } from "./quality";
import { getRun } from "./store";
import { toRunDto } from "./read";

const stars = z.number().int().min(1, "Rate from 1 to 5.").max(5, "Rate from 1 to 5.");

export const reviewInputSchema = z
  .object({
    reviewer: z.string().trim().max(120).default(""),
    overall: stars,
    accuracy: stars.nullable().default(null),
    evidence: stars.nullable().default(null),
    completeness: stars.nullable().default(null),
    usefulness: stars.nullable().default(null),
    verdict: z.enum(REVIEW_VERDICTS),
    comment: z.string().trim().max(4_000).default(""),
  })
  .strict();
export type ReviewInput = z.infer<typeof reviewInputSchema>;

const toDto = (r: typeof runReviews.$inferSelect): RunReviewDto => ({
  id: r.id,
  runId: r.runId,
  reviewer: r.reviewer,
  overall: r.overall,
  accuracy: r.accuracy,
  evidence: r.evidence,
  completeness: r.completeness,
  usefulness: r.usefulness,
  verdict: r.verdict,
  comment: r.comment,
  createdAt: r.createdAt,
});

export async function createReview(
  db: Db,
  storage: LocalStorage,
  runId: string,
  input: ReviewInput,
): Promise<RunReviewDto> {
  getRun(db, runId);
  const metrics = await getRunQuality(db, storage, runId);
  const id = newId("review");
  db.insert(runReviews)
    .values({ id, runId, ...input, metricsSnapshot: metrics })
    .run();
  return toDto(db.select().from(runReviews).where(eq(runReviews.id, id)).get()!);
}

export function listReviews(db: Db, runId: string): RunReviewDto[] {
  getRun(db, runId);
  return db
    .select()
    .from(runReviews)
    .where(eq(runReviews.runId, runId))
    .orderBy(desc(runReviews.createdAt))
    .all()
    .map(toDto);
}

/** Every run of a project with its stored confidence score and its reviews' average rating. */
export function projectReviewSummary(db: Db, projectId: string) {
  const runs = db
    .select()
    .from(analysisRuns)
    .where(eq(analysisRuns.projectId, projectId))
    .orderBy(desc(analysisRuns.createdAt))
    .all();
  const ids = runs.map((r) => r.id);
  const quality = new Map(
    ids.length
      ? db
          .select()
          .from(runQuality)
          .where(inArray(runQuality.runId, ids))
          .all()
          .map((q) => [q.runId, q.metrics as RunQualityDto])
      : [],
  );
  const reviews = ids.length
    ? db.select().from(runReviews).where(inArray(runReviews.runId, ids)).all()
    : [];
  return runs.map((r) => {
    const mine = reviews.filter((x) => x.runId === r.id);
    return {
      run: toRunDto(r),
      confidence: quality.get(r.id)?.confidence.score ?? null,
      reviews: mine.length,
      rating: mine.length
        ? Math.round((mine.reduce((s, x) => s + x.overall, 0) / mine.length) * 10) / 10
        : null,
    };
  });
}

/** All reviews with their run, project and metrics snapshot, oldest first (for later analysis). */
export function exportReviews(db: Db) {
  return db
    .select({ review: runReviews, run: analysisRuns, code: projects.code, name: projects.name })
    .from(runReviews)
    .innerJoin(analysisRuns, eq(analysisRuns.id, runReviews.runId))
    .innerJoin(projects, eq(projects.id, analysisRuns.projectId))
    .orderBy(asc(runReviews.createdAt))
    .all()
    .map(({ review, run, code, name }) => ({
      ...toDto(review),
      project: { code, name },
      run: {
        id: run.id,
        model: run.model,
        mode: run.config.mode ?? "mock",
        status: run.status,
        costUsd: run.costUsd,
        createdAt: run.createdAt,
        config: { weights: run.config.weights, partialCredit: run.config.partialCredit },
      },
      metrics: review.metricsSnapshot,
    }));
}
