/**
 * Marsa database schema (SQLite via Drizzle). Source of truth: docs/RDD.md §4.
 * Conventions: string IDs with type prefix (src/lib/ids.ts), ISO-8601 text timestamps,
 * JSON stored as text with `mode: "json"`. No `server-only` import here — drizzle-kit loads this file.
 */
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  AI_MODELS,
  CONFIDENCE_LEVELS,
  DEFAULT_AI_MODEL,
  DEFAULT_CONCURRENCY,
  DEFAULT_PARTIAL_CREDIT,
  DEFAULT_WEIGHTS,
  DOCUMENT_KINDS,
  FINDING_STATUSES,
  PRIORITIES,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  PROPOSAL_SOURCES,
  PROPOSAL_STATUSES,
  REPORT_LANGUAGES,
  REQUIREMENT_CATEGORIES,
  REQUIREMENT_SOURCES,
  RISK_CATEGORIES,
  RISK_SEVERITIES,
  RUN_PHASES,
  RUN_STATUSES,
  STEP_STATUSES,
  THEMES,
  type CommercialSnapshot,
  type RunConfig,
  type StatusCounts,
  type TokenUsage,
  type Weights,
} from "../../lib/domain";

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;
const createdAt = () => text("created_at").notNull().default(now);
const updatedAt = () => text("updated_at").notNull().default(now);
const bool = (name: string) => integer(name, { mode: "boolean" });

// ─── Settings (single row, id = 1) ────────────────────────────────────────────
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  customerName: text("customer_name").notNull().default(""),
  organization: text("organization").notNull().default(""),
  appName: text("app_name").notNull().default("Marsa"),
  theme: text("theme", { enum: THEMES }).notNull().default("system"),
  sidebarCollapsed: bool("sidebar_collapsed").notNull().default(false),
  aiModel: text("ai_model", { enum: AI_MODELS }).notNull().default(DEFAULT_AI_MODEL),
  reportLanguage: text("report_language", { enum: REPORT_LANGUAGES }).notNull().default("en"),
  weights: text("weights", { mode: "json" })
    .$type<Weights>()
    .notNull()
    .$defaultFn(() => ({ ...DEFAULT_WEIGHTS })),
  partialCredit: real("partial_credit").notNull().default(DEFAULT_PARTIAL_CREDIT),
  concurrency: integer("concurrency").notNull().default(DEFAULT_CONCURRENCY),
  onboarded: bool("onboarded").notNull().default(false),
  updatedAt: updatedAt(),
});

// ─── Projects & RFP ───────────────────────────────────────────────────────────
export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    category: text("category", { enum: PROJECT_CATEGORIES }).notNull().default("other"),
    notes: text("notes").notNull().default(""),
    deadline: text("deadline"),
    status: text("status", { enum: PROJECT_STATUSES }).notNull().default("draft"),
    isSample: bool("is_sample").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    publishedAt: text("published_at"),
  },
  (t) => [uniqueIndex("projects_code_uq").on(t.code), index("projects_status_idx").on(t.status)],
);

// ─── Standards ────────────────────────────────────────────────────────────────
export const standards = sqliteTable(
  "standards",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull().default("general"),
    description: text("description").notNull().default(""),
    isActive: bool("is_active").notNull().default(true),
    isSample: bool("is_sample").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("standards_code_uq").on(t.code)],
);

export const standardRules = sqliteTable(
  "standard_rules",
  {
    id: text("id").primaryKey(),
    standardId: text("standard_id")
      .notNull()
      .references(() => standards.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    text: text("text").notNull(),
    priority: text("priority", { enum: PRIORITIES }).notNull().default("important"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index("standard_rules_standard_idx").on(t.standardId, t.sortOrder),
    uniqueIndex("standard_rules_code_uq").on(t.standardId, t.code),
  ],
);

export const projectStandards = sqliteTable(
  "project_standards",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    standardId: text("standard_id")
      .notNull()
      .references(() => standards.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.standardId] })],
);

// ─── Vendors & proposals ──────────────────────────────────────────────────────
export const vendors = sqliteTable("vendors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull().default(""),
  contactName: text("contact_name").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  color: text("color").notNull().default("teal"),
  isSample: bool("is_sample").notNull().default(false),
  createdAt: createdAt(),
});

export const proposals = sqliteTable(
  "proposals",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    submittedAt: text("submitted_at").notNull().default(now),
    status: text("status", { enum: PROPOSAL_STATUSES }).notNull().default("submitted"),
    source: text("source", { enum: PROPOSAL_SOURCES }).notNull().default("simulator"),
  },
  (t) => [
    uniqueIndex("proposals_project_vendor_uq").on(t.projectId, t.vendorId),
    index("proposals_project_idx").on(t.projectId),
  ],
);

// ─── Documents (all uploaded files) ───────────────────────────────────────────
export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey(),
    kind: text("kind", { enum: DOCUMENT_KINDS }).notNull(),
    projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
    proposalId: text("proposal_id").references(() => proposals.id, { onDelete: "cascade" }),
    standardId: text("standard_id").references(() => standards.id, { onDelete: "cascade" }),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    ext: text("ext").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    storagePath: text("storage_path").notNull(),
    pageCount: integer("page_count"),
    textContent: text("text_content"),
    aiReadable: bool("ai_readable").notNull().default(true),
    anthropicFileId: text("anthropic_file_id"),
    createdAt: createdAt(),
  },
  (t) => [
    index("documents_project_idx").on(t.projectId, t.kind),
    index("documents_proposal_idx").on(t.proposalId, t.kind),
    index("documents_standard_idx").on(t.standardId),
  ],
);

// ─── Analysis runs & steps ────────────────────────────────────────────────────
export const analysisRuns = sqliteTable(
  "analysis_runs",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    status: text("status", { enum: RUN_STATUSES }).notNull().default("queued"),
    model: text("model").notNull(),
    totalSteps: integer("total_steps").notNull(),
    doneSteps: integer("done_steps").notNull().default(0),
    config: text("config", { mode: "json" }).$type<RunConfig>().notNull(),
    usage: text("usage", { mode: "json" }).$type<TokenUsage>(),
    costUsd: real("cost_usd").notNull().default(0),
    error: text("error"),
    createdAt: createdAt(),
    startedAt: text("started_at"),
    finishedAt: text("finished_at"),
  },
  (t) => [index("analysis_runs_project_idx").on(t.projectId, t.createdAt)],
);

export const analysisSteps = sqliteTable(
  "analysis_steps",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => analysisRuns.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    phase: text("phase", { enum: RUN_PHASES }).notNull(),
    proposalId: text("proposal_id").references(() => proposals.id, { onDelete: "set null" }),
    label: text("label").notNull(),
    status: text("status", { enum: STEP_STATUSES }).notNull().default("queued"),
    attempt: integer("attempt").notNull().default(0),
    startedAt: text("started_at"),
    finishedAt: text("finished_at"),
    durationMs: integer("duration_ms"),
    error: text("error"),
    output: text("output", { mode: "json" }).$type<unknown>(),
    usage: text("usage", { mode: "json" }).$type<TokenUsage>(),
  },
  (t) => [uniqueIndex("analysis_steps_run_seq_uq").on(t.runId, t.seq)],
);

// ─── Results ──────────────────────────────────────────────────────────────────
export const requirements = sqliteTable(
  "requirements",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => analysisRuns.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    category: text("category", { enum: REQUIREMENT_CATEGORIES }).notNull(),
    priority: text("priority", { enum: PRIORITIES }).notNull(),
    sourceType: text("source_type", { enum: REQUIREMENT_SOURCES }).notNull(),
    sourceRef: text("source_ref").notNull().default(""),
    standardId: text("standard_id").references(() => standards.id, { onDelete: "set null" }),
    acceptance: text("acceptance").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("requirements_run_code_uq").on(t.runId, t.code)],
);

export const evaluations = sqliteTable(
  "evaluations",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => analysisRuns.id, { onDelete: "cascade" }),
    proposalId: text("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    scorePct: real("score_pct").notNull(),
    counts: text("counts", { mode: "json" }).$type<StatusCounts>().notNull(),
    mandatoryFailures: integer("mandatory_failures").notNull().default(0),
    categoryScores: text("category_scores", { mode: "json" })
      .$type<Partial<Record<string, number>>>()
      .notNull(),
    summary: text("summary").notNull().default(""),
    strengths: text("strengths", { mode: "json" }).$type<string[]>().notNull(),
    weaknesses: text("weaknesses", { mode: "json" }).$type<string[]>().notNull(),
    commercial: text("commercial", { mode: "json" }).$type<CommercialSnapshot>().notNull(),
  },
  (t) => [uniqueIndex("evaluations_run_proposal_uq").on(t.runId, t.proposalId)],
);

export const findings = sqliteTable(
  "findings",
  {
    id: text("id").primaryKey(),
    evaluationId: text("evaluation_id")
      .notNull()
      .references(() => evaluations.id, { onDelete: "cascade" }),
    requirementId: text("requirement_id")
      .notNull()
      .references(() => requirements.id, { onDelete: "cascade" }),
    status: text("status", { enum: FINDING_STATUSES }).notNull(),
    vendorResponse: text("vendor_response").notNull().default(""),
    evidenceQuote: text("evidence_quote"),
    evidenceDocId: text("evidence_doc_id").references(() => documents.id, {
      onDelete: "set null",
    }),
    evidencePage: integer("evidence_page"),
    evidenceSection: text("evidence_section"),
    assessment: text("assessment").notNull().default(""),
    gap: text("gap"),
    confidence: text("confidence", { enum: CONFIDENCE_LEVELS }).notNull().default("medium"),
    overrideStatus: text("override_status", { enum: FINDING_STATUSES }),
    overrideNote: text("override_note"),
    overriddenAt: text("overridden_at"),
  },
  (t) => [index("findings_evaluation_idx").on(t.evaluationId)],
);

export const comparisons = sqliteTable(
  "comparisons",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => analysisRuns.id, { onDelete: "cascade" }),
    proposalId: text("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    data: text("data", { mode: "json" }).$type<unknown>().notNull(),
  },
  (t) => [uniqueIndex("comparisons_run_proposal_uq").on(t.runId, t.proposalId)],
);

export const risks = sqliteTable(
  "risks",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => analysisRuns.id, { onDelete: "cascade" }),
    proposalId: text("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category", { enum: RISK_CATEGORIES }).notNull(),
    likelihood: integer("likelihood").notNull(),
    impact: integer("impact").notNull(),
    severity: text("severity", { enum: RISK_SEVERITIES }).notNull(),
    description: text("description").notNull().default(""),
    consequence: text("consequence").notNull().default(""),
    mitigation: text("mitigation").notNull().default(""),
    evidence: text("evidence"),
    requirementCodes: text("requirement_codes", { mode: "json" }).$type<string[]>().notNull(),
  },
  (t) => [index("risks_run_proposal_idx").on(t.runId, t.proposalId)],
);

export const runSummaries = sqliteTable("run_summaries", {
  runId: text("run_id")
    .primaryKey()
    .references(() => analysisRuns.id, { onDelete: "cascade" }),
  ranking: text("ranking", { mode: "json" }).$type<unknown>().notNull(),
  recommendedProposalId: text("recommended_proposal_id").references(() => proposals.id, {
    onDelete: "set null",
  }),
  executiveSummary: text("executive_summary").notNull().default(""),
  conditions: text("conditions", { mode: "json" }).$type<string[]>().notNull(),
  negotiationPoints: text("negotiation_points", { mode: "json" }).$type<string[]>().notNull(),
});
