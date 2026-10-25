/**
 * What a consultant report PDF shows (2026-10-25): the report the model wrote (on its step) plus
 * Marsa's numbers, the tender and the vendor. No `server-only`: tests build views directly.
 */
import { eq } from "drizzle-orm";
import type { Db } from "../db/connect";
import { projects } from "../db/schema";
import { notFound } from "../api-errors";
import type { AiModel } from "../../lib/domain";
import { AI_MODEL_LABEL } from "../../lib/labels";
import type { ReportOutput } from "../ai/schemas";
import { proposalVendors } from "../runs/read";
import { computeVendorScores } from "../runs/scores";
import { getRun, listSteps } from "../runs/store";
import type { ReportView } from "./html";

export function buildReportView(
  db: Db,
  runId: string,
  proposalId: string,
): { view: ReportView; stamp: string } {
  const run = getRun(db, runId);
  const step = listSteps(db, runId).find(
    (s) => s.phase === "report" && s.proposalId === proposalId,
  );
  if (!step || step.status !== "done" || !step.output) throw notFound("Report");
  const project = db
    .select({ code: projects.code, name: projects.name })
    .from(projects)
    .where(eq(projects.id, run.projectId))
    .get();
  const vendors = proposalVendors(db, run.config.proposalIds);
  const scores = computeVendorScores(db, run, new Map([...vendors].map(([id, v]) => [id, v.name])));
  const own = scores.find((s) => s.proposalId === proposalId);
  if (!project || !own) throw notFound("Report");
  const language = run.config.reportLanguage;
  const vendor = vendors.get(proposalId);
  return {
    stamp: step.finishedAt ?? step.id,
    view: {
      language,
      project,
      vendor: { name: vendor?.name ?? own.vendor, country: vendor?.country || null },
      generatedAt: step.finishedAt ?? run.createdAt,
      author:
        run.config.mode === "mock"
          ? language === "ar"
            ? "المحرك التجريبي"
            : "the demo engine"
          : (AI_MODEL_LABEL[run.model as AiModel] ?? run.model),
      scores: {
        overall: own.overall,
        rfpPct: own.rfpPct,
        standardsPct: own.standardsPct,
        riskScore: own.riskScore,
        riskLevel: own.riskLevel,
        rank: own.rank,
        ranked: scores.length,
      },
      report: step.output as ReportOutput,
    },
  };
}
