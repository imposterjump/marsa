/**
 * Read model of the AI analysis results page (P8): every vendor's scores (Marsa's: standards %,
 * RFP %, risk score, rank), findings with their one-line summaries, risks with their proposal
 * section, documents for the evidence links, and the recommendation. One request feeds all tabs;
 * section, comparison and chart views are computed in the browser from it. No `server-only`.
 */
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/connect";
import {
  analysisMeta,
  documents,
  findings,
  projects,
  risks,
  runSummaries,
  standards,
} from "../db/schema";
import type {
  AnalysisResultsDto,
  FindingResultDto,
  RiskResultDto,
  VendorResultDto,
} from "../../lib/api-types";
import {
  sectionsFor,
  type ProposalSection,
  type ReportLanguage,
  type RiskSeverity,
} from "../../lib/domain";
import { emptyCounts } from "../../lib/scoring";
import { toDocumentDto } from "../documents/dto";
import type { LocalStorage } from "../storage/local";
import { evaluationDtos, proposalVendors, requirementDtos, toRunDto } from "./read";
import { computeVendorScores } from "./scores";
import { resolveSources } from "./sources";
import { getRun, listSteps, readChecklist } from "./store";
import { localizer, textKey, type Localizer } from "./texts";
import type { ReportOutput } from "../ai/schemas";

/** `lang`: the reader's language; the AI's texts come from the run's translation when it has one. */
export async function getAnalysisResults(
  db: Db,
  storage: LocalStorage,
  runId: string,
  lang?: ReportLanguage,
): Promise<AnalysisResultsDto> {
  const run = getRun(db, runId);
  const L = localizer(db, run, lang);
  const project = db.select().from(projects).where(eq(projects.id, run.projectId)).get()!;
  const meta = db.select().from(analysisMeta).where(eq(analysisMeta.runId, run.id)).all();
  const metaOf = new Map(meta.map((m) => [m.itemId, m]));

  const reqs = requirementDtos(db, run.id, L).map((r) => ({
    ...r,
    section: (metaOf.get(r.id)?.section ?? null) as ProposalSection | null,
    scope: r.sourceType === "standard" ? ("standard" as const) : ("rfp" as const),
  }));
  const reqById = new Map(reqs.map((r) => [r.id, r]));
  const vendorsById = proposalVendors(db, run.config.proposalIds);
  const names = new Map([...vendorsById].map(([id, v]) => [id, v.name]));
  const scores = computeVendorScores(db, run, names);
  const evs = evaluationDtos(db, run, undefined, L);

  const docs = run.config.proposalIds.length
    ? db
        .select()
        .from(documents)
        .where(inArray(documents.proposalId, run.config.proposalIds))
        .orderBy(asc(documents.createdAt))
        .all()
    : [];

  const vendors: VendorResultDto[] = run.config.proposalIds
    .filter((id) => vendorsById.has(id))
    .map((proposalId) => {
      const ev = evs.find((e) => e.proposalId === proposalId);
      const s = scores.find((x) => x.proposalId === proposalId);
      const rows = ev
        ? db.select().from(findings).where(eq(findings.evaluationId, ev.id)).all()
        : [];
      const list: FindingResultDto[] = rows
        .filter((f) => reqById.has(f.requirementId))
        .sort(
          (a, b) =>
            reqs.indexOf(reqById.get(a.requirementId)!) -
            reqs.indexOf(reqById.get(b.requirementId)!),
        )
        .map((f) => ({
          id: f.id,
          requirementId: f.requirementId,
          code: reqById.get(f.requirementId)!.code,
          status: f.overrideStatus ?? f.status,
          aiStatus: f.status,
          vendorResponse: L.text(textKey("finding", f.id, "vendorResponse"), f.vendorResponse),
          evidenceQuote: f.evidenceQuote,
          evidenceDocId: f.evidenceDocId,
          evidencePage: f.evidencePage,
          evidenceSection: f.evidenceSection,
          assessment: L.text(textKey("finding", f.id, "assessment"), f.assessment),
          gap: L.maybe(textKey("finding", f.id, "gap"), f.gap),
          confidence: f.confidence,
          headline:
            L.text(textKey("meta", f.id, "headline"), metaOf.get(f.id)?.headline ?? "") ||
            reqById.get(f.requirementId)!.title,
        }));
      const standardsCounts = emptyCounts();
      const rfpCounts = emptyCounts();
      for (const f of list) {
        (reqById.get(f.requirementId)!.scope === "standard" ? standardsCounts : rfpCounts)[
          f.status
        ]++;
      }
      const riskRows: RiskResultDto[] = db
        .select()
        .from(risks)
        .where(and(eq(risks.runId, run.id), eq(risks.proposalId, proposalId)))
        .all()
        .map((r) => ({
          id: r.id,
          title: L.text(textKey("risk", r.id, "title"), r.title),
          category: r.category,
          likelihood: r.likelihood,
          impact: r.impact,
          severity: r.severity,
          description: L.text(textKey("risk", r.id, "description"), r.description),
          consequence: L.text(textKey("risk", r.id, "consequence"), r.consequence),
          mitigation: L.text(textKey("risk", r.id, "mitigation"), r.mitigation),
          evidence: r.evidence,
          requirementCodes: r.requirementCodes,
          section: (metaOf.get(r.id)?.section ?? null) as ProposalSection | null,
        }))
        .sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact);
      const riskCounts: Record<RiskSeverity, number> = {
        low: 0,
        moderate: 0,
        high: 0,
        critical: 0,
      };
      for (const r of riskRows) riskCounts[r.severity]++;
      const own = docs.filter((d) => d.proposalId === proposalId);
      return {
        proposalId,
        vendor: vendorsById.get(proposalId)!,
        analysed: Boolean(s),
        scores: s
          ? {
              standardsPct: s.standardsPct,
              rfpPct: s.rfpPct,
              mandatoryNotMet: s.mandatoryNotMet,
              riskScore: s.riskScore,
              riskLevel: s.riskLevel,
              overall: s.overall,
              rank: s.rank,
            }
          : null,
        standardsCounts,
        rfpCounts,
        riskCounts,
        summary: ev?.summary ?? "",
        strengths: ev?.strengths ?? [],
        weaknesses: ev?.weaknesses ?? [],
        commercial: ev?.commercial ?? {},
        findings: list,
        risks: riskRows,
        commercialDocuments: own.filter((d) => d.kind === "commercial").map(toDocumentDto),
        technicalDocuments: own.filter((d) => d.kind === "technical").map(toDocumentDto),
      };
    })
    .sort(
      (a, b) =>
        (a.scores?.rank ?? Number.MAX_SAFE_INTEGER) - (b.scores?.rank ?? Number.MAX_SAFE_INTEGER),
    );

  const summary = db.select().from(runSummaries).where(eq(runSummaries.runId, run.id)).get();
  const stds = run.config.standardIds.length
    ? db
        .select({ id: standards.id, code: standards.code, title: standards.title })
        .from(standards)
        .where(inArray(standards.id, run.config.standardIds))
        .orderBy(asc(standards.code))
        .all()
    : [];
  const sources = await resolveSources(db, storage, run, reqs);

  return {
    run: toRunDto(run),
    project: { id: project.id, code: project.code, name: project.name },
    weights: run.config.weights,
    partialCredit: run.config.partialCredit,
    hasStandards: reqs.some((r) => r.scope === "standard"),
    standards: stds,
    requirements: reqs,
    sources: Object.fromEntries(sources),
    vendors,
    recommendation: summary
      ? {
          // Runs since P8 store Marsa's pick; older ones the model's.
          proposalId: summary.recommendedProposalId ?? scores[0]?.proposalId ?? null,
          summary: L.text(textKey("summary", run.id, "executiveSummary"), summary.executiveSummary),
          conditions: L.list("summary", run.id, "conditions", summary.conditions),
          negotiationPoints: L.list(
            "summary",
            run.id,
            "negotiationPoints",
            summary.negotiationPoints,
          ),
        }
      : null,
    keyConstraints: (readChecklist(db, run.id)?.keyConstraints ?? []).map((c, i) => ({
      label: L.text(textKey("constraint", run.id, "label", i), c.label),
      value: L.text(textKey("constraint", run.id, "value", i), c.value),
    })),
    reports: reportSummaries(db, run.id, vendors, L),
    textLanguage: L.language,
    sections: [...sectionsFor(project.category)],
  };
}

function reportSummaries(db: Db, runId: string, vendors: VendorResultDto[], L: Localizer) {
  const steps = listSteps(db, runId).filter((s) => s.phase === "report");
  return vendors.map((v) => {
    const step = steps.find((s) => s.proposalId === v.proposalId);
    const out = step?.status === "done" ? (step.output as ReportOutput) : null;
    return {
      proposalId: v.proposalId,
      status: step?.status ?? ("none" as const),
      verdict: out?.verdict ?? null,
      headline: out ? L.text(textKey("report", v.proposalId, "headline"), out.headline) : null,
      generatedAt: out ? step!.finishedAt : null,
      error: step?.status === "failed" || step?.status === "skipped" ? step.error : null,
      url: `/api/runs/${runId}/reports/${v.proposalId}`,
    };
  });
}
