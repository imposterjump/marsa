import type {
  AiModel,
  ProposalSection,
  ProjectCategory,
  FindingStatus,
  Priority,
  ProjectStatus,
  ProposalSource,
  RiskSeverity,
  RunPhase,
  StepStatus,
} from "./domain";

export const FINDING_STATUS_LABEL: Record<FindingStatus, string> = {
  compliant: "Compliant",
  partial: "Partially compliant",
  non_compliant: "Non-compliant",
  not_addressed: "Not addressed",
};

export const RISK_SEVERITY_LABEL: Record<RiskSeverity, string> = {
  low: "Low risk",
  moderate: "Moderate risk",
  high: "High risk",
  critical: "Critical risk",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "Draft",
  open: "Open for proposals",
  evaluating: "Evaluating",
  evaluated: "Evaluated",
  archived: "Archived",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  mandatory: "Mandatory",
  important: "Important",
  desirable: "Desirable",
};

export const STEP_STATUS_LABEL: Record<StepStatus, string> = {
  queued: "Queued",
  running: "Running",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped",
  cancelled: "Cancelled",
};

export const RUN_PHASE_LABEL: Record<RunPhase, string> = {
  checklist: "Checklist",
  standards: "Standards",
  analyze: "RFP",
  compare: "Comparison",
  risk: "Risk",
  summary: "Recommendation",
};

export const PROJECT_CATEGORY_LABEL: Record<ProjectCategory, string> = {
  "IT & security": "IT & security",
  "Safety & environment": "Safety & environment",
  "Commercial & legal": "Commercial & legal",
  Quality: "Quality",
  General: "General",
};

export const PROPOSAL_SOURCE_LABEL: Record<ProposalSource, string> = {
  seed: "Sample",
  simulator: "Simulator",
  ai: "AI-generated",
};

export const AI_MODEL_LABEL: Record<AiModel, string> = {
  "claude-opus-5-5": "Claude Opus 5.5",
  "claude-sonnet-5-5": "Claude Sonnet 5.5",
  "claude-haiku-5-5": "Claude Haiku 5.5",
};

export const PROPOSAL_SECTION_LABEL: Record<ProposalSection, string> = {
  company: "Company & references",
  solution: "Technical solution",
  security: "Security & data",
  implementation: "Implementation & timeline",
  support: "Support, warranty & SLA",
  commercial: "Commercial offer & pricing",
  terms: "Terms & deviations",
};
