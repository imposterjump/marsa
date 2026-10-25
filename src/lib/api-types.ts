/**
 * Response shapes shared by route handlers and client hooks.
 * Client code imports types from here — never from src/server (HANDOFF G-18).
 */
import type {
  AiModel,
  CommercialSnapshot,
  Confidence,
  FindingStatus,
  Priority,
  RequirementCategory,
  RequirementSource,
  RiskCategory,
  RiskSeverity,
  RunPhase,
  RunStatus,
  StatusCounts,
  StepStatus,
  TokenUsage,
  ProjectCategory,
  ProjectStatus,
  ProposalSection,
  ProposalSource,
  ProposalStatus,
  ReportLanguage,
  ReportVerdict,
  StandardCategory,
  Theme,
  Weights,
} from "./domain";

export interface SettingsDto {
  customerName: string;
  organization: string;
  appName: string;
  theme: Theme;
  sidebarCollapsed: boolean;
  aiModel: AiModel;
  reportLanguage: ReportLanguage;
  weights: Weights;
  partialCredit: number;
  concurrency: number;
  onboarded: boolean;
  updatedAt: string;
  /** Runtime facts (read-only, not stored in settings). */
  runtime: {
    aiMode: "mock" | "live";
    apiKeyConfigured: boolean;
    maxUploadMb: number;
  };
}

export interface DocumentDto {
  id: string;
  kind: "rfp" | "commercial" | "technical" | "standard";
  originalName: string;
  mimeType: string;
  ext: string;
  sizeBytes: number;
  pageCount: number | null;
  aiReadable: boolean;
  createdAt: string;
  /** Inline view URL; add `?download=1` to download. */
  url: string;
}

export interface RuleDto {
  id: string;
  standardId: string;
  code: string;
  text: string;
  priority: Priority;
  sortOrder: number;
  createdAt: string;
}

export interface StandardDto {
  id: string;
  code: string;
  title: string;
  category: StandardCategory;
  description: string;
  isActive: boolean;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StandardSummaryDto extends StandardDto {
  rulesCount: number;
  mandatoryCount: number;
  documentsCount: number;
}

export interface StandardDetailDto extends StandardDto {
  rules: RuleDto[];
  documents: DocumentDto[];
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface ProjectDto {
  id: string;
  code: string;
  name: string;
  description: string;
  category: ProjectCategory;
  notes: string;
  deadline: string | null; // YYYY-MM-DD
  status: ProjectStatus;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  /** The client's internal cost estimate (building works; never shown to vendors). */
  estimateAmount: number | null;
  estimateCurrency: string | null;
}

export interface ProjectSummaryDto extends ProjectDto {
  rfpCount: number;
  proposalCount: number;
  standardCount: number;
}

export interface ProjectStandardRef {
  id: string;
  code: string;
  title: string;
  category: string;
  isActive: boolean;
  rulesCount: number;
  /** Pages of the standard's uploaded documents (sent to the AI with the rules). */
  documentPages: number;
}

export interface ProjectDetailDto extends ProjectDto {
  rfpDocuments: DocumentDto[];
  standards: ProjectStandardRef[];
  proposalCount: number;
}

export interface VendorDto {
  id: string;
  name: string;
  country: string;
  contactName: string;
  contactEmail: string;
  color: string;
  isSample: boolean;
  createdAt: string;
}

export interface VendorSummaryDto extends VendorDto {
  proposalCount: number;
}

export interface ProposalDto {
  id: string;
  projectId: string;
  vendorId: string;
  submittedAt: string;
  status: ProposalStatus;
  source: ProposalSource;
}

export interface ProposalSummaryDto extends ProposalDto {
  vendor: VendorDto;
  documentCounts: { commercial: number; technical: number; pages: number };
}

export interface ProposalDetailDto extends ProposalDto {
  vendor: VendorDto;
  project: { id: string; code: string; name: string; status: ProjectStatus };
  commercialDocuments: DocumentDto[];
  technicalDocuments: DocumentDto[];
}

// ─── Analysis runs (RDD §6, P6.8) ────────────────────────────────────────────
export interface RunDto {
  id: string;
  projectId: string;
  status: RunStatus;
  model: string;
  /** Engine that ran it: "mock" runs cost nothing. */
  mode: "mock" | "live";
  totalSteps: number;
  /** Finished steps (done or skipped). */
  doneSteps: number;
  usage: TokenUsage | null;
  costUsd: number;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface RunStepDto {
  id: string;
  seq: number;
  phase: RunPhase;
  proposalId: string | null;
  label: string;
  status: StepStatus;
  attempt: number;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  error: string | null;
  usage: TokenUsage | null;
}

/** Live result chip per vendor (appears as soon as its analysis is done). */
export interface RunChipDto {
  proposalId: string;
  vendor: string;
  vendorColor: string;
  scorePct: number | null;
  mandatoryFailures: number | null;
  overallRisk: RiskSeverity | null;
}

export interface RunStatusDto {
  run: RunDto;
  steps: RunStepDto[];
  chips: RunChipDto[];
  etaSeconds: number;
  /** A run is live in this server process (false after a restart until resumed). */
  active: boolean;
}

export interface ActiveRunDto {
  runId: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  status: RunStatus;
  doneSteps: number;
  totalSteps: number;
  currentLabel: string | null;
}

export interface RequirementDto {
  id: string;
  code: string;
  title: string;
  description: string;
  category: RequirementCategory;
  priority: Priority;
  sourceType: RequirementSource;
  sourceRef: string;
  standardId: string | null;
  acceptance: string;
}

/** Where a requirement comes from, resolved to something the UI can open (src/server/runs/sources.ts). */
export type RequirementSourceDto =
  | {
      kind: "rfp";
      label: string;
      /** Null when the reference could not be found in the RFP documents. */
      documentId: string | null;
      documentName: string | null;
      page: number | null;
      /** Text to highlight (the clause number), or null. */
      needle: string | null;
    }
  | {
      kind: "standard";
      label: string;
      standardId: string;
      standardCode: string;
      ruleCode: string;
      ruleText: string;
    }
  | { kind: "notes"; label: string };

export interface EvaluationDto {
  id: string;
  proposalId: string;
  vendor: VendorDto;
  scorePct: number;
  counts: StatusCounts;
  mandatoryFailures: number;
  categoryScores: Partial<Record<string, number>>;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  commercial: CommercialSnapshot;
  overallRisk: RiskSeverity | null;
}

export interface FindingDto {
  id: string;
  requirementId: string;
  code: string;
  status: FindingStatus;
  /** The AI's status before a human override (same as status when not overridden). */
  aiStatus: FindingStatus;
  vendorResponse: string;
  evidenceQuote: string | null;
  evidenceDocId: string | null;
  evidencePage: number | null;
  evidenceSection: string | null;
  assessment: string;
  gap: string | null;
  confidence: Confidence;
}

export interface ComparisonDto {
  advantages: { point: string; versus: string[] }[];
  disadvantages: { point: string; betterVendors: string[] }[];
  uniqueOffers: string[];
  pricePosition: "lowest" | "mid" | "highest" | "unknown";
  positionStatement: string;
}

export interface RiskDto {
  id: string;
  title: string;
  category: RiskCategory;
  likelihood: number;
  impact: number;
  severity: RiskSeverity;
  description: string;
  consequence: string;
  mitigation: string;
  evidence: string | null;
  requirementCodes: string[];
}

export interface RunSummaryDto {
  ranking: { vendor: string; proposalId: string | null; rank: number; rationale: string }[];
  recommendedProposalId: string | null;
  executiveSummary: string;
  conditions: string[];
  negotiationPoints: string[];
}

export interface RunResultsDto {
  run: RunDto;
  requirements: RequirementDto[];
  keyConstraints: { label: string; value: string }[];
  evaluations: EvaluationDto[];
  comparisons: { proposalId: string; data: ComparisonDto }[];
  summary: RunSummaryDto | null;
}

export interface ProposalResultDto {
  run: RunDto;
  evaluation: EvaluationDto | null;
  requirements: RequirementDto[];
  /** Requirement id → where it comes from (RFP clause with page, standard rule). */
  sources: Record<string, RequirementSourceDto[]>;
  findings: FindingDto[];
  comparison: ComparisonDto | null;
  risks: RiskDto[];
}

// ─── AI review (run quality + human reviews) ─────────────────────────────────
export interface RunQualityDto {
  runId: string;
  computedAt: string;
  model: string;
  mode: "mock" | "live";
  status: RunStatus;
  durationMs: number | null;
  costUsd: number;
  usage: TokenUsage | null;
  /** Share of prompt tokens served from the prompt cache (0–100). */
  cacheHitPct: number | null;
  files: {
    total: number;
    pages: number;
    /** Sent to the AI and used by a finished step. */
    processed: number;
    /** Not readable by the AI (unsupported format, password, no text). */
    skipped: number;
    list: {
      id: string;
      name: string;
      group: "rfp" | "standard" | "proposal";
      owner: string;
      pages: number | null;
      sentAs: "pdf" | "image" | "text" | "skipped";
      used: boolean;
    }[];
  };
  steps: {
    total: number;
    done: number;
    failed: number;
    skipped: number;
    cancelled: number;
    /** Calls made, including retries. */
    attempts: number;
    retries: number;
  };
  findings: {
    total: number;
    byStatus: StatusCounts;
    byConfidence: { high: number; medium: number; low: number };
    /** Requirements the AI skipped (counted as not addressed). */
    notAssessed: number;
  };
  evidence: {
    /** Findings that cite a quote. */
    quoted: number;
    /** Quote found on the cited page (or in the document when no page applies). */
    verified: number;
    /** Quote found, but on another page than cited. */
    otherPage: number;
    /** Quote not found in the cited document. */
    notFound: number;
    /** Could not be checked (no document matched, or no readable text). */
    unchecked: number;
  };
  vendors: {
    proposalId: string;
    vendor: string;
    files: number;
    pages: number;
    findings: number;
    scorePct: number | null;
    evidenceVerifiedPct: number | null;
    aiConfidencePct: number | null;
    analysisStatus: StepStatus | null;
    analysisAttempts: number;
  }[];
  /** 0–100 summary of how much the run's output can be relied on (formula in quality.ts). */
  confidence: {
    score: number;
    label: "High" | "Good" | "Fair" | "Low";
    parts: { aiConfidence: number; evidence: number; coverage: number; completion: number };
  };
}

export interface RunReviewDto {
  id: string;
  runId: string;
  reviewer: string;
  overall: number;
  accuracy: number | null;
  evidence: number | null;
  completeness: number | null;
  usefulness: number | null;
  verdict: "trust" | "trust_with_edits" | "do_not_trust";
  comment: string;
  createdAt: string;
}

// ─── AI analysis results page (P8) ───────────────────────────────────────────
/** A finding with its one-line summary (the details open with "View more"). */
export interface FindingResultDto extends FindingDto {
  headline: string;
}

export interface RequirementResultDto extends RequirementDto {
  /** Proposal section it is answered in (null for runs from before P8). */
  section: ProposalSection | null;
  scope: "standard" | "rfp";
}

export interface RiskResultDto extends RiskDto {
  section: ProposalSection | null;
}

export interface VendorScoresDto {
  standardsPct: number | null;
  rfpPct: number;
  mandatoryNotMet: number;
  riskScore: number;
  riskLevel: RiskSeverity;
  overall: number;
  rank: number;
}

export interface VendorResultDto {
  proposalId: string;
  vendor: VendorDto;
  analysed: boolean;
  scores: VendorScoresDto | null;
  standardsCounts: StatusCounts;
  rfpCounts: StatusCounts;
  riskCounts: Record<RiskSeverity, number>;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  commercial: CommercialSnapshot;
  findings: FindingResultDto[];
  risks: RiskResultDto[];
  commercialDocuments: DocumentDto[];
  technicalDocuments: DocumentDto[];
}

/** One vendor's consultant report (2026-10-25): its step, its verdict and the PDF. */
export interface ReportSummaryDto {
  proposalId: string;
  /** The report step's status; "none" when the run has no report for this vendor. */
  status: StepStatus | "none";
  verdict: ReportVerdict | null;
  headline: string | null;
  generatedAt: string | null;
  error: string | null;
  /** The PDF, inline; add `?download=1` to download it. */
  url: string;
}

export interface AnalysisResultsDto {
  run: RunDto;
  project: { id: string; code: string; name: string };
  weights: Weights;
  partialCredit: number;
  hasStandards: boolean;
  standards: { id: string; code: string; title: string }[];
  requirements: RequirementResultDto[];
  /** Requirement id → where it comes from (RFP clause with page, standard rule). */
  sources: Record<string, RequirementSourceDto[]>;
  /** Analysed vendors by rank (1 = recommended), then the ones whose analysis failed. */
  vendors: VendorResultDto[];
  recommendation: {
    proposalId: string | null;
    summary: string;
    conditions: string[];
    negotiationPoints: string[];
  } | null;
  keyConstraints: { label: string; value: string }[];
  /** One per vendor of `vendors`, in the same order. */
  reports: ReportSummaryDto[];
  /** The project's proposal sections in order (building works have their own, 2026-10-25). */
  sections: ProposalSection[];
  /**
   * The language the AI's texts come out in: the requested one when the run has a translation
   * (2026-10-25), else the language the run was written in.
   */
  textLanguage: ReportLanguage;
}

// ─── Price comparison of building works tenders (2026-10-25) ──────────────────
/** What stands out on one bidder's line of the bill of quantities. */
export type BoqFlag =
  "unpriced" | "missing" | "qty_changed" | "arithmetic" | "high" | "low" | "lowest";

export interface BoqCellDto {
  rate: number | null;
  /** Written instead of a rate ("LS", "Included"). */
  rateText: string | null;
  amount: number | null;
  amountText: string | null;
  /** The bidder's quantity when it differs from the client's. */
  qty: number | null;
  /** The rate, or amount ÷ quantity for a lump sum: what is compared across bidders. */
  effectiveRate: number | null;
  flags: BoqFlag[];
}

export interface BoqRowDto {
  index: number;
  sheet: string;
  section: string;
  no: string;
  description: string;
  unit: string;
  qty: number | null;
  /** False for descriptive lines with no quantity and no unit. */
  priceable: boolean;
  /** The bidders' median rate (3 or more priced bids). */
  median: number | null;
  /** By proposal id. */
  cells: Record<string, BoqCellDto>;
}

export interface BoqVendorDto {
  proposalId: string;
  vendor: string;
  /** The priced bill of quantities used (an Excel file of the bid). */
  document: string | null;
  /** False when the bid has no readable Excel bill of quantities. */
  parsed: boolean;
  /** The total the bidder wrote (before VAT). */
  statedTotal: number | null;
  vat: number | null;
  totalWithVat: number | null;
  /** What the bidder's lines add up to (its added lines included). */
  linesTotal: number | null;
  /** statedTotal − linesTotal when they disagree. */
  difference: number | null;
  priced: number;
  unpriced: number;
  /** Client lines the bidder left out of its copy. */
  missing: number;
  /** Lines the bidder added, and their amount. */
  extra: number;
  extraAmount: number;
  arithmetic: number;
  qtyChanged: number;
  high: number;
  low: number;
  /** Lines where this bidder has the lowest rate. */
  lowest: number;
  /** Bid total against the client's estimate, in %. */
  vsEstimatePct: number | null;
  /** 1 = cheapest bid. */
  rank: number | null;
}

export interface BoqComparisonDto {
  currency: string;
  /** The client's internal cost estimate (projects.estimate_amount). */
  estimate: number | null;
  clientDocument: string;
  /** Lines to price in the client's bill of quantities. */
  items: number;
  sheets: string[];
  rows: BoqRowDto[];
  vendors: BoqVendorDto[];
}

// ─── Tender import (2026-10-25): a tender as the e-procurement portal exports it ─
export interface TenderImportFileDto {
  name: string;
  /** Path inside the imported folder (zips shown as folders). */
  path: string;
  size: number;
  /** For a bid's file: the envelope it goes to. */
  kind: "commercial" | "technical" | null;
  /** Imported unless the user unticks it (lean import: false for what is left out). */
  include: boolean;
  /** Why it is left out by default; null when it is imported. */
  leftOut: "drawing" | "image" | "map" | "permit" | "site_report" | "bank_details" | null;
}

export interface TenderImportVendorDto {
  folder: string;
  /** From the company's supplier.txt, else its folder name. */
  name: string;
  files: TenderImportFileDto[];
  /** Identical files the company uploaded more than once (kept once). */
  duplicates: number;
}

export interface TenderImportRoundDto {
  /** opening = bids at the opening; negotiation = revised bids; bids = a single round. */
  key: "opening" | "negotiation" | "bids";
  vendors: TenderImportVendorDto[];
}

export interface TenderImportPreviewDto {
  id: string;
  /** Suggested project name (the tender's folder name). */
  name: string;
  /** The portal's tender reference, when the export has one (rfq.txt). */
  reference: string | null;
  tenderDocuments: TenderImportFileDto[];
  /** Internal papers: never imported; the estimate is read from them. */
  internalDocuments: TenderImportFileDto[];
  estimate: { amount: number; currency: string; source: string } | null;
  rounds: TenderImportRoundDto[];
  /** Files that belong to no part of the tender (left out). */
  ignored: string[];
}

export interface TenderImportResultDto {
  projectId: string;
  vendors: number;
  documents: number;
  /** Files that could not be imported, with the reason. */
  skipped: { name: string; reason: string }[];
}
