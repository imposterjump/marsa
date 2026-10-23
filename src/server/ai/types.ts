/**
 * Data the pipeline steps work on (RDD §7). Built from the DB by src/server/runs/context.ts and
 * consumed by both engines: the live one turns it into content blocks (content.ts), the mock one
 * reads the same documents directly (mock.ts). No `server-only`: tests import it.
 */
import type {
  DocumentKind,
  Priority,
  ReportLanguage,
  RunPhase,
  RiskSeverity,
  StatusCounts,
} from "../../lib/domain";
import type {
  AnalysisOutput,
  ChecklistOutput,
  ComparisonOutput,
  RiskOutput,
  SummaryOutput,
} from "./schemas";
import type { CallResult } from "./result";

export interface SourceDoc {
  id: string;
  /** Title shown to Claude; evidence references come back with it (evidenceDocument). */
  title: string;
  name: string;
  kind: DocumentKind;
  ext: string;
  mimeType: string;
  storagePath: string;
  pageCount: number | null;
  textContent: string | null;
  aiReadable: boolean;
  /** Files API id (PDFs and images), filled by ensureUploaded() before a live step. */
  fileId: string | null;
}

export interface StandardContext {
  id: string;
  code: string;
  title: string;
  category: string;
  rules: { code: string; text: string; priority: Priority }[];
  docs: SourceDoc[];
}

export interface VendorContext {
  proposalId: string;
  name: string;
  submittedAt: string;
  docs: SourceDoc[];
}

export interface RunContext {
  project: {
    code: string;
    name: string;
    description: string;
    notes: string;
    category: string;
    deadline: string | null;
  };
  rfpDocs: SourceDoc[];
  standards: StandardContext[];
  vendors: VendorContext[];
  reportLanguage: ReportLanguage;
}

/** One vendor's analysis plus the scores Marsa computed from it (never the model's numbers). */
export interface AnalysisDigest {
  proposalId: string;
  vendor: string;
  scorePct: number;
  mandatoryFailures: number;
  counts: StatusCounts;
  categoryScores: Record<string, number>;
  analysis: AnalysisOutput;
}

/** Marsa's numbers for one vendor (P8): what the recommendation step explains. */
export interface VendorScores {
  proposalId: string;
  vendor: string;
  /** Null when no standards are applied. */
  standardsPct: number | null;
  rfpPct: number;
  mandatoryNotMet: number;
  riskScore: number;
  riskLevel: RiskSeverity;
  /** 0–100 mix of the three (scoring.ts overallValue); ranks the vendors. */
  overall: number;
  rank: number;
}

export type StepInput =
  | { phase: "checklist"; ctx: RunContext }
  | { phase: "standards"; ctx: RunContext; checklist: ChecklistOutput; vendor: VendorContext }
  | { phase: "analyze"; ctx: RunContext; checklist: ChecklistOutput; vendor: VendorContext }
  | {
      phase: "compare";
      ctx: RunContext;
      checklist: ChecklistOutput;
      vendor: VendorContext;
      analyses: AnalysisDigest[];
    }
  | {
      phase: "risk";
      ctx: RunContext;
      checklist: ChecklistOutput;
      vendor: VendorContext;
      analysis: AnalysisDigest;
    }
  | {
      phase: "summary";
      ctx: RunContext;
      checklist: ChecklistOutput;
      analyses: AnalysisDigest[];
      /** Marsa's ranking (rank 1 first) and its pick (null when no vendor can be recommended). */
      scores: VendorScores[];
      recommended: string | null;
      /** Vendors whose analysis failed (the summary must say so). */
      missing: string[];
    };

export interface StepOutputs {
  checklist: ChecklistOutput;
  standards: AnalysisOutput;
  analyze: AnalysisOutput;
  compare: ComparisonOutput;
  risk: RiskOutput;
  summary: SummaryOutput;
}

export interface StepHooks {
  signal: AbortSignal;
  /** The response started streaming (its prompt-cache entry is now readable by other steps). */
  onStarted: () => void;
}

export interface AiEngine {
  readonly mode: "mock" | "live";
  runStep<P extends RunPhase>(
    input: Extract<StepInput, { phase: P }>,
    hooks: StepHooks,
  ): Promise<CallResult<StepOutputs[P]>>;
}
