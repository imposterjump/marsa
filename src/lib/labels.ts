/** Display labels. Values are English, msg()-marked: the UI shows them with t(label). */
import type {
  AiModel,
  ProposalSection,
  ProjectCategory,
  FindingStatus,
  Priority,
  ProjectStatus,
  ProposalSource,
  AspectRating,
  ReportVerdict,
  RiskSeverity,
  RunPhase,
  StepStatus,
} from "./domain";
import { msg } from "./i18n/core";

export const FINDING_STATUS_LABEL: Record<FindingStatus, string> = {
  compliant: msg("Compliant"),
  partial: msg("Partially compliant"),
  non_compliant: msg("Non-compliant"),
  not_addressed: msg("Not addressed"),
};

export const RISK_SEVERITY_LABEL: Record<RiskSeverity, string> = {
  low: msg("Low risk"),
  moderate: msg("Moderate risk"),
  high: msg("High risk"),
  critical: msg("Critical risk"),
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: msg("Draft"),
  open: msg("Open for proposals"),
  evaluating: msg("Evaluating"),
  evaluated: msg("Evaluated"),
  archived: msg("Archived"),
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  mandatory: msg("Mandatory"),
  important: msg("Important"),
  desirable: msg("Desirable"),
};

export const STEP_STATUS_LABEL: Record<StepStatus, string> = {
  queued: msg("Queued"),
  running: msg("Running"),
  done: msg("Done"),
  failed: msg("Failed"),
  skipped: msg("Skipped"),
  cancelled: msg("Cancelled"),
};

export const RUN_PHASE_LABEL: Record<RunPhase, string> = {
  checklist: msg("Checklist"),
  standards: msg("Standards"),
  analyze: msg("RFP"),
  compare: msg("Comparison"),
  risk: msg("Risk"),
  summary: msg("Recommendation"),
  report: msg("Reports"),
};

export const REPORT_VERDICT_LABEL: Record<ReportVerdict, string> = {
  preferred_bidder: msg("Preferred bidder"),
  acceptable_with_conditions: msg("Acceptable with conditions"),
  not_recommended: msg("Not recommended"),
};

export const ASPECT_RATING_LABEL: Record<AspectRating, string> = {
  strong: msg("Strong"),
  adequate: msg("Adequate"),
  weak: msg("Weak"),
};

export const PROJECT_CATEGORY_LABEL: Record<ProjectCategory, string> = {
  "IT & security": msg("IT & security"),
  "Safety & environment": msg("Safety & environment"),
  "Commercial & legal": msg("Commercial & legal"),
  Quality: msg("Quality"),
  General: msg("General"),
};

export const PROPOSAL_SOURCE_LABEL: Record<ProposalSource, string> = {
  seed: msg("Sample"),
  simulator: msg("Uploaded"),
  ai: msg("AI-generated"),
};

export const AI_MODEL_LABEL: Record<AiModel, string> = {
  "claude-opus-5-5": "Claude Opus 5.5",
  "claude-sonnet-5-5": "Claude Sonnet 5.5",
  "claude-haiku-5-5": "Claude Haiku 5.5",
};

export const PROPOSAL_SECTION_LABEL: Record<ProposalSection, string> = {
  company: msg("Company & references"),
  solution: msg("Technical solution"),
  security: msg("Security & data"),
  implementation: msg("Implementation & timeline"),
  support: msg("Support, warranty & SLA"),
  commercial: msg("Commercial offer & pricing"),
  terms: msg("Terms & deviations"),
};
