/**
 * Structured-output schemas for the pipeline steps (RDD §7.5, P6.2; P8: standards step, proposal
 * sections, one-line finding summaries).
 * Sent to Claude through `betaZodOutputFormat` (output_config.format) and validated again on
 * receipt. Shape rules for the JSON Schema the API accepts: every field is present
 * (optional values are `nullable`, not `optional`), and numeric ranges are not expressed in the
 * schema; `normalize*` clamps them after parsing.
 */
import { z } from "zod";
import { toSection } from "../../lib/sections";
import {
  ASPECT_RATINGS,
  CONFIDENCE_LEVELS,
  FINDING_STATUSES,
  PRIORITIES,
  REPORT_VERDICTS,
  REQUIREMENT_CATEGORIES,
  REQUIREMENT_SOURCES,
  RISK_CATEGORIES,
  RISK_SEVERITIES,
  type Priority,
  type RequirementCategory,
  type SectionTemplate,
} from "../../lib/domain";

export const ChecklistSchema = z.object({
  requirements: z.array(
    z.object({
      code: z.string().describe("REQ-001, REQ-002, … in order"),
      title: z.string().describe("Short name of the requirement"),
      description: z.string().describe("What exactly is required, with numbers and units"),
      category: z.enum(REQUIREMENT_CATEGORIES),
      priority: z.enum(PRIORITIES),
      sourceType: z.enum(REQUIREMENT_SOURCES),
      sourceRef: z
        .string()
        .describe('Where it comes from, e.g. "RFP §4.1.1", "Annex B TB-07", "Addendum 1 Q3"'),
      acceptance: z.string().describe("How compliance is verified or what evidence is acceptable"),
      section: z.string().describe("Proposal section key where a vendor answers it"),
    }),
  ),
  ruleSections: z.array(
    z.object({
      code: z.string().describe("Standard rule code"),
      section: z.string().describe("Proposal section key where a vendor answers the rule"),
    }),
  ),
  keyConstraints: z.array(
    z.object({
      label: z.string().describe('e.g. "Deployment"'),
      value: z.string().describe('e.g. "On-premise only, including licensing and updates"'),
    }),
  ),
});
export type ChecklistOutput = z.infer<typeof ChecklistSchema>;

export const AnalysisSchema = z.object({
  findings: z.array(
    z.object({
      code: z.string().describe("Requirement code from the checklist"),
      status: z.enum(FINDING_STATUSES),
      headline: z.string().describe("The finding in one short phrase (at most 15 words)"),
      vendorResponse: z.string().describe("What the vendor states or offers for this requirement"),
      evidenceQuote: z
        .string()
        .nullable()
        .describe("Short verbatim quote from the vendor document"),
      evidenceDocument: z.string().nullable().describe("Exact title of the document block quoted"),
      evidencePage: z.number().int().nullable().describe("1-based page number for PDFs"),
      evidenceSection: z.string().nullable().describe("Section heading for text documents"),
      assessment: z.string().describe("Why this status: what is met and what is missing"),
      gap: z.string().nullable().describe("The shortfall, for partial / non_compliant"),
      confidence: z.enum(CONFIDENCE_LEVELS),
    }),
  ),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  commercial: z.object({
    totalPrice: z.string().nullable(),
    currency: z.string().nullable(),
    paymentTerms: z.string().nullable(),
    deliveryTime: z.string().nullable(),
    warranty: z.string().nullable(),
    validity: z.string().nullable(),
    exclusions: z.array(z.string()),
  }),
});
export type AnalysisOutput = z.infer<typeof AnalysisSchema>;

export const ComparisonSchema = z.object({
  advantages: z.array(z.object({ point: z.string(), versus: z.array(z.string()) })),
  disadvantages: z.array(z.object({ point: z.string(), betterVendors: z.array(z.string()) })),
  uniqueOffers: z.array(z.string()),
  pricePosition: z.enum(["lowest", "mid", "highest", "unknown"]),
  positionStatement: z.string(),
});
export type ComparisonOutput = z.infer<typeof ComparisonSchema>;

export const RiskSchema = z.object({
  overall: z.enum(RISK_SEVERITIES),
  risks: z.array(
    z.object({
      title: z.string(),
      category: z.enum(RISK_CATEGORIES),
      likelihood: z.number().int().describe("1 (rare) to 5 (almost certain)"),
      impact: z.number().int().describe("1 (minor) to 5 (severe)"),
      description: z.string(),
      consequence: z.string().describe("What happens if we go with this proposal"),
      mitigation: z.string(),
      evidence: z.string().nullable(),
      requirementCodes: z.array(z.string()),
      section: z.string().describe("Proposal section key the risk relates to"),
    }),
  ),
});
export type RiskOutput = z.infer<typeof RiskSchema>;

export const SummarySchema = z.object({
  ranking: z.array(z.object({ vendor: z.string(), rank: z.number().int(), rationale: z.string() })),
  recommendedVendor: z.string().nullable(),
  executiveSummary: z.string(),
  conditions: z.array(z.string()),
  negotiationPoints: z.array(z.string()),
});
export type SummaryOutput = z.infer<typeof SummarySchema>;

/**
 * The consultant report on one vendor (2026-10-25): the client's 2-page PDF. The model writes the
 * judgement only; Marsa adds the scores, the vendor and the tender when it lays the PDF out.
 */
const ReportPoint = z.object({
  point: z.string().describe("One specific strength or weakness, in one or two sentences"),
  reference: z
    .string()
    .describe(
      'Where it shows, e.g. "REQ-014 · Technical proposal p. 6" or "Commercial proposal p. 2"; "" when general',
    ),
});
const ReportAspect = z.object({
  rating: z.enum(ASPECT_RATINGS),
  assessment: z.string().describe("The consultant's assessment in 3–5 sentences"),
  strengths: z.array(ReportPoint),
  weaknesses: z.array(ReportPoint),
});
export const ReportSchema = z.object({
  verdict: z.enum(REPORT_VERDICTS),
  headline: z.string().describe("The verdict in one sentence"),
  executiveSummary: z.string().describe("4–6 sentences for a busy decision maker"),
  technical: ReportAspect,
  commercial: ReportAspect,
  balance: z.object({
    assessment: z
      .string()
      .describe("How the technical and the commercial proposal weigh against each other"),
    valueForMoney: z.string().describe("What the client gets for the money, in 1–2 sentences"),
  }),
  concerns: z.array(
    z.object({
      title: z.string().describe("The concern in a few words"),
      detail: z.string().describe("Why it matters to the client after award"),
    }),
  ),
  recommendation: z.object({
    opinion: z.string().describe("The consultant's advice to the client, 3–5 sentences"),
    conditions: z.array(z.string()),
    negotiationPoints: z.array(z.string()),
    clarifications: z.array(z.string()),
  }),
});
export type ReportOutput = z.infer<typeof ReportSchema>;

export const STEP_SCHEMAS = {
  checklist: ChecklistSchema,
  standards: AnalysisSchema,
  analyze: AnalysisSchema,
  compare: ComparisonSchema,
  risk: RiskSchema,
  summary: SummarySchema,
  report: ReportSchema,
} as const;

// ─── Wire format (what live steps return) ────────────────────────────────────
/*
 * The API allows at most 16 nullable/union fields per output schema, so inside the shared format
 * "not stated" is "" (text) or 0 (page) instead of null; fromWire() turns them back into null.
 */
const blank = (what: string) => z.string().describe(`${what}; "" when not stated`);

export const AnalysisWire = AnalysisSchema.extend({
  findings: z.array(
    z.object({
      code: z.string().describe("Requirement code from the checklist"),
      status: z.enum(FINDING_STATUSES),
      headline: z.string().describe("The finding in one short phrase (at most 15 words)"),
      vendorResponse: z.string().describe("What the vendor states or offers for this requirement"),
      evidenceQuote: z
        .string()
        .describe('Short verbatim quote from the vendor document; "" for not_addressed'),
      evidenceDocument: z
        .string()
        .describe('Exact title of the document quoted; "" when there is no quote'),
      evidencePage: z
        .number()
        .int()
        .describe("1-based page of the quote in a PDF; 0 for other formats or no quote"),
      evidenceSection: z
        .string()
        .describe('Nearest section heading for non-PDF documents; "" otherwise'),
      assessment: z.string().describe("Why this status: what is met and what is missing"),
      gap: z.string().describe('The shortfall for partial / non_compliant; "" otherwise'),
      confidence: z.enum(CONFIDENCE_LEVELS),
    }),
  ),
  commercial: z.object({
    totalPrice: blank("Total price as stated"),
    currency: blank("Currency"),
    paymentTerms: blank("Payment terms"),
    deliveryTime: blank("Delivery or implementation time"),
    warranty: blank("Warranty"),
    validity: blank("Offer validity"),
    exclusions: z.array(z.string()),
  }),
});

export const RiskWire = RiskSchema.extend({
  risks: z.array(
    RiskSchema.shape.risks.element.extend({
      evidence: blank("Short quote or document reference"),
    }),
  ),
});

export const SummaryWire = SummarySchema.extend({
  recommendedVendor: z
    .string()
    .describe('Name of the recommended vendor; "" when no proposal is acceptable'),
});

/*
 * Output formats live steps send (HANDOFF G-58). The format is part of the cached prompt prefix:
 * a different schema per step made every phase re-write the RFP + standards cache (P6.10: 0 cache
 * reads across phases, ~90k reads within one). One schema for all five steps is rejected ("compiled
 * grammar is too large"), so steps share two formats, grouped by what they re-read:
 *   checklist → analyze → risk   (analysis reads ①; risk reads ① ② ③ of its vendor)
 *   compare → summary            (only the first comparison re-writes ① ②)
 * Each step fills its own field and sets the others to null.
 */
export const EvaluateOutputSchema = z.object({
  checklist: ChecklistSchema.nullable(),
  analysis: AnalysisWire.nullable(),
  riskRegister: RiskWire.nullable(),
});
export const RankOutputSchema = z.object({
  comparison: ComparisonSchema.nullable(),
  summary: SummaryWire.nullable(),
});
/** Reports have their own format: they come last, after every cache entry they could share. */
export const ReportOutputSchema = z.object({ report: ReportSchema.nullable() });

export type StepOutput = z.infer<typeof EvaluateOutputSchema> &
  z.infer<typeof RankOutputSchema> &
  z.infer<typeof ReportOutputSchema>;

/** The output format each phase sends. */
export const OUTPUT_SCHEMA = {
  checklist: EvaluateOutputSchema,
  standards: EvaluateOutputSchema,
  analyze: EvaluateOutputSchema,
  risk: EvaluateOutputSchema,
  compare: RankOutputSchema,
  summary: RankOutputSchema,
  report: ReportOutputSchema,
} as const;

const orNull = (s: string) => (s.trim() ? s : null);

/** Wire answer of one phase → the pipeline's own types ("" / 0 → null). */
export function fromWire(field: keyof StepOutput, data: NonNullable<StepOutput[keyof StepOutput]>) {
  if (field === "analysis") {
    const a = data as z.infer<typeof AnalysisWire>;
    const c = a.commercial;
    return {
      ...a,
      findings: a.findings.map((f) => ({
        ...f,
        evidenceQuote: orNull(f.evidenceQuote),
        evidenceDocument: orNull(f.evidenceDocument),
        evidencePage: f.evidencePage > 0 ? f.evidencePage : null,
        evidenceSection: orNull(f.evidenceSection),
        gap: orNull(f.gap),
      })),
      commercial: {
        totalPrice: orNull(c.totalPrice),
        currency: orNull(c.currency),
        paymentTerms: orNull(c.paymentTerms),
        deliveryTime: orNull(c.deliveryTime),
        warranty: orNull(c.warranty),
        validity: orNull(c.validity),
        exclusions: c.exclusions,
      },
    } satisfies AnalysisOutput;
  }
  if (field === "riskRegister") {
    const r = data as z.infer<typeof RiskWire>;
    return {
      ...r,
      risks: r.risks.map((x) => ({ ...x, evidence: orNull(x.evidence) })),
    } satisfies RiskOutput;
  }
  if (field === "summary") {
    const s = data as z.infer<typeof SummaryWire>;
    return { ...s, recommendedVendor: orNull(s.recommendedVendor) } satisfies SummaryOutput;
  }
  return data;
}

/** The field of StepOutputSchema each phase answers in. */
export const OUTPUT_FIELD = {
  checklist: "checklist",
  standards: "analysis",
  analyze: "analysis",
  compare: "comparison",
  risk: "riskRegister",
  summary: "summary",
  report: "report",
} as const satisfies Record<keyof typeof STEP_SCHEMAS, keyof StepOutput>;

// ─── Post-parse normalisation ────────────────────────────────────────────────
const clamp15 = (n: number) => Math.min(5, Math.max(1, Math.round(Number.isFinite(n) ? n : 3)));

export function normalizeRisks(
  out: RiskOutput,
  template: SectionTemplate = "services",
): RiskOutput {
  return {
    ...out,
    risks: out.risks.map((r) => ({
      ...r,
      likelihood: clamp15(r.likelihood),
      impact: clamp15(r.impact),
      section: toSection(r.section, `${r.title} ${r.description}`, template),
    })),
  };
}

const REPORT_LIMITS = { points: 5, concerns: 4, actions: 5 } as const;
const tidy = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * A report as the client sees it: the verdict agrees with Marsa's pick (only the recommended
 * vendor is the preferred bidder, and it always is), lists are capped so the PDF keeps to two
 * pages, and blank entries are dropped.
 */
export function normalizeReport(out: ReportOutput, { recommended }: { recommended: boolean }) {
  const points = (list: ReportOutput["technical"]["strengths"]) =>
    list
      .map((p) => ({ point: tidy(p.point), reference: tidy(p.reference) }))
      .filter((p) => p.point)
      .slice(0, REPORT_LIMITS.points);
  const aspect = (a: ReportOutput["technical"]) => ({
    ...a,
    assessment: a.assessment.trim(),
    strengths: points(a.strengths),
    weaknesses: points(a.weaknesses),
  });
  const items = (list: string[]) => list.map(tidy).filter(Boolean).slice(0, REPORT_LIMITS.actions);
  return {
    ...out,
    verdict: recommended
      ? "preferred_bidder"
      : out.verdict === "preferred_bidder"
        ? "acceptable_with_conditions"
        : out.verdict,
    headline: tidy(out.headline),
    executiveSummary: out.executiveSummary.trim(),
    technical: aspect(out.technical),
    commercial: aspect(out.commercial),
    concerns: out.concerns
      .map((c) => ({ title: tidy(c.title), detail: tidy(c.detail) }))
      .filter((c) => c.title || c.detail)
      .slice(0, REPORT_LIMITS.concerns),
    recommendation: {
      opinion: out.recommendation.opinion.trim(),
      conditions: items(out.recommendation.conditions),
      negotiationPoints: items(out.recommendation.negotiationPoints),
      clarifications: items(out.recommendation.clarifications),
    },
  } satisfies ReportOutput;
}

/** Findings: a short, single-line summary phrase. */
export function normalizeAnalysis(out: AnalysisOutput): AnalysisOutput {
  return {
    ...out,
    findings: out.findings.map((f) => {
      const h = (f.headline ?? "").replace(/\s+/g, " ").trim();
      return { ...f, headline: h.length > 160 ? `${h.slice(0, 157)}…` : h };
    }),
  };
}

/**
 * The RFP part of the checklist: codes uppercase, unique, REQ-### when the model drifts from the
 * format; sections normalised to keys. Standard rules are added separately (withStandardRules),
 * so anything the model labelled "standard" is dropped here.
 */
export function normalizeChecklist(
  out: ChecklistOutput,
  template: SectionTemplate = "services",
): ChecklistOutput {
  const seen = new Set<string>();
  const requirements = out.requirements
    .filter((r) => r.sourceType !== "standard")
    .map((r, i) => {
      let code = r.code.trim().toUpperCase();
      if (!/^REQ-\d{3,}$/.test(code) || seen.has(code))
        code = `REQ-${String(i + 1).padStart(3, "0")}`;
      while (seen.has(code)) code = `${code}A`;
      seen.add(code);
      return {
        ...r,
        code,
        title: r.title.trim(),
        sourceRef: r.sourceRef.trim(),
        section: toSection(r.section, `${r.title} ${r.description}`, template),
      };
    });
  return { ...out, requirements };
}

/** Requirement category for a standard rule, from the standard's category. */
export function categoryForStandard(standardCategory: string): RequirementCategory {
  if (standardCategory === "IT & security") return "security";
  if (standardCategory === "Commercial & legal") return "commercial";
  return "compliance";
}

/**
 * P8: every applied standard rule is its own requirement (sourceType "standard", code and
 * sourceRef = the rule code, priority from the rule), appended after the RFP requirements, so a
 * vendor is checked against the standards rule by rule, separately from the RFP. A rule code used
 * by two standards gets its standard's code as a prefix.
 */
/** A rule's own words as its title (the code is shown beside it): first sentence, ≤ 90 chars. */
export function ruleTitle(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  const first = t.match(/^.+?[.;:](?=\s|$)/)?.[0] ?? t;
  const s = first.replace(/[.;:]$/, "");
  if (s.length <= 90) return s;
  const cut = s.slice(0, 88);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 60))}…`;
}

export function withStandardRules(
  out: ChecklistOutput,
  standards: {
    code: string;
    category: string;
    rules: { code: string; text: string; priority: Priority }[];
  }[],
  template: SectionTemplate = "services",
): ChecklistOutput {
  const sectionOf = new Map(
    (out.ruleSections ?? []).map((r) => [r.code.trim().toUpperCase(), r.section]),
  );
  const taken = new Set(out.requirements.map((r) => r.code));
  const requirements = [...out.requirements];
  for (const s of standards) {
    for (const rule of s.rules) {
      let code = rule.code.trim().toUpperCase();
      if (taken.has(code)) code = `${s.code.toUpperCase()}-${code}`;
      taken.add(code);
      requirements.push({
        code,
        title: ruleTitle(rule.text),
        description: rule.text,
        category: categoryForStandard(s.category),
        priority: rule.priority,
        sourceType: "standard",
        sourceRef: rule.code,
        acceptance: "The proposal shows how this rule is met.",
        section: toSection(sectionOf.get(rule.code.toUpperCase()), rule.text, template),
      });
    }
  }
  return { ...out, requirements };
}

/** Checklist requirements a step checks: the standard rules, or the RFP (and notes) ones. */
export const requirementsFor = (checklist: ChecklistOutput, scope: "standards" | "rfp") =>
  checklist.requirements.filter((r) =>
    scope === "standards" ? r.sourceType === "standard" : r.sourceType !== "standard",
  );
