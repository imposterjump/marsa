import type {
  ProjectCategory,
  FindingStatus,
  Priority,
  ProjectStatus,
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
  analyze: "Analysis",
  compare: "Comparison",
  risk: "Risk",
  summary: "Summary",
};

export const PROJECT_CATEGORY_LABEL: Record<ProjectCategory, string> = {
  equipment: "Equipment",
  software: "Software",
  services: "Services",
  works: "Works",
  other: "Other",
};
