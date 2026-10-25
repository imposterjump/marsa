/**
 * Shared domain vocabulary — used by the DB schema, API validation, AI schemas and the UI.
 * Keep these lists in sync with docs/RDD.md §4 and §7.5.
 */

export const PROJECT_STATUSES = ["draft", "open", "evaluating", "evaluated", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const DOCUMENT_KINDS = ["rfp", "commercial", "technical", "standard"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const STANDARD_CATEGORIES = [
  "IT & security",
  "Safety & environment",
  "Commercial & legal",
  "Quality",
  "General",
] as const;
export type StandardCategory = (typeof STANDARD_CATEGORIES)[number];

/**
 * Projects use the standards' categories (user decision, 2026-10-21): a project only offers the
 * standards of its own category plus "General" ones; a "General" project offers every standard.
 */
export const PROJECT_CATEGORIES = STANDARD_CATEGORIES;
export type ProjectCategory = StandardCategory;
export const GENERAL_CATEGORY = "General" satisfies StandardCategory;

/** Can a standard of `standardCategory` apply to a project of `projectCategory`? */
export function standardFitsProject(standardCategory: string, projectCategory: string): boolean {
  return (
    projectCategory === GENERAL_CATEGORY ||
    standardCategory === GENERAL_CATEGORY ||
    standardCategory === projectCategory
  );
}

export const PRIORITIES = ["mandatory", "important", "desirable"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const REQUIREMENT_CATEGORIES = [
  "technical",
  "functional",
  "infrastructure",
  "security",
  "commercial",
  "delivery",
  "support",
  "legal",
  "compliance",
] as const;
export type RequirementCategory = (typeof REQUIREMENT_CATEGORIES)[number];

export const REQUIREMENT_SOURCES = ["rfp", "standard", "notes"] as const;
export type RequirementSource = (typeof REQUIREMENT_SOURCES)[number];

export const FINDING_STATUSES = ["compliant", "partial", "non_compliant", "not_addressed"] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export const RISK_CATEGORIES = [
  "technical",
  "infrastructure",
  "security",
  "commercial",
  "legal",
  "schedule",
  "operational",
  "vendor_capability",
  "compliance",
] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export const RISK_SEVERITIES = ["low", "moderate", "high", "critical"] as const;
export type RiskSeverity = (typeof RISK_SEVERITIES)[number];

export const RUN_STATUSES = [
  "queued",
  "running",
  "completed",
  "completed_with_errors",
  "failed",
  "cancelled",
  "interrupted",
] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const STEP_STATUSES = [
  "queued",
  "running",
  "done",
  "failed",
  "skipped",
  "cancelled",
] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];

/**
 * Run phases in execution order. Since P8: checklist (RFP requirements + rule sections) →
 * standards (each vendor against every standard rule) → analyze (each vendor against the RFP) →
 * risk → summary (Marsa's scores and recommendation, with a short AI reason) → report (one
 * consultant report per vendor, 2026-10-25). `compare` only exists in runs from before P8. Stored
 * as text: no DB constraint to change.
 */
export const RUN_PHASES = [
  "checklist",
  "standards",
  "analyze",
  "compare",
  "risk",
  "summary",
  "report",
] as const;
export type RunPhase = (typeof RUN_PHASES)[number];

export const PROPOSAL_STATUSES = ["submitted", "withdrawn"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const PROPOSAL_SOURCES = ["seed", "simulator", "ai"] as const;
export type ProposalSource = (typeof PROPOSAL_SOURCES)[number];

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const REPORT_LANGUAGES = ["en", "ar"] as const;

/** The consultant report's verdict on a vendor; only Marsa's pick can be the preferred bidder. */
export const REPORT_VERDICTS = [
  "preferred_bidder",
  "acceptable_with_conditions",
  "not_recommended",
] as const;
export type ReportVerdict = (typeof REPORT_VERDICTS)[number];

/** The consultant's rating of the technical and of the commercial proposal. */
export const ASPECT_RATINGS = ["strong", "adequate", "weak"] as const;
export type AspectRating = (typeof ASPECT_RATINGS)[number];
export type ReportLanguage = (typeof REPORT_LANGUAGES)[number];

export const AI_MODELS = ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"] as const;
export type AiModel = (typeof AI_MODELS)[number];
export const DEFAULT_AI_MODEL: AiModel = "claude-opus-5-5";

export type Weights = Record<Priority, number>;
export const DEFAULT_WEIGHTS: Weights = { mandatory: 3, important: 2, desirable: 1 };
export const DEFAULT_PARTIAL_CREDIT = 0.5;
export const DEFAULT_CONCURRENCY = 3;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}
export const EMPTY_USAGE: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};

export type StatusCounts = Record<FindingStatus, number>;

export interface CommercialSnapshot {
  totalPrice?: string;
  currency?: string;
  paymentTerms?: string;
  deliveryTime?: string;
  warranty?: string;
  validity?: string;
  exclusions?: string[];
}

/** Settings frozen into a run when it starts, so later edits don't change its results. */
export interface RunConfig {
  weights: Weights;
  partialCredit: number;
  standardIds: string[];
  proposalIds: string[];
  reportLanguage: ReportLanguage;
  concurrency: number;
  /** Engine used for the run (AI_MODE when it started). */
  mode: "mock" | "live";
}

/** Human verdict on an analysis run (AI review, saved for improving the system). */
export const REVIEW_VERDICTS = ["trust", "trust_with_edits", "do_not_trust"] as const;
export type ReviewVerdict = (typeof REVIEW_VERDICTS)[number];

/**
 * The proposal template (P8): every vendor proposal follows these sections, and every checklist
 * requirement, standard rule and risk is filed under one, so vendors can be compared section by
 * section. Technical proposal = company … support; commercial proposal = commercial and terms.
 */
export const PROPOSAL_SECTIONS = [
  "company",
  "solution",
  "security",
  "implementation",
  "support",
  "commercial",
  "terms",
] as const;
export type ProposalSection = (typeof PROPOSAL_SECTIONS)[number];

/** What an analysis_meta row describes. */
export const META_KINDS = ["requirement", "finding", "risk"] as const;
export type MetaKind = (typeof META_KINDS)[number];
