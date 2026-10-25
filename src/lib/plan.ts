/**
 * Analysis plan and estimates (RDD §7.1, §7.7, §7.8). Pure, shared by the Analyse & process panel
 * (P5.2) and the pipeline planner (P6). Estimates are deliberately rough and labelled as such.
 */
import type { AiModel, RunPhase, TokenUsage } from "./domain";

/**
 * P8 plan: checklist (RFP requirements, rules filed by section) → per vendor: standards check,
 * RFP check, risk register → recommendation → per vendor: consultant report (2026-10-25).
 * T = 4N + 2 with standards, 3N + 2 without. `compare` only exists in runs from before P8.
 */
export interface RunPlan {
  total: number;
  /** Steps that will be skipped (none since P8). */
  skipped: number;
  phases: {
    checklist: number;
    standards: number;
    analyze: number;
    compare: number;
    risk: number;
    summary: number;
    report: number;
  };
}

export function planRun(proposals: number, withStandards = true): RunPlan {
  const n = Math.max(0, Math.floor(proposals));
  if (n === 0) {
    return {
      total: 0,
      skipped: 0,
      phases: {
        checklist: 0,
        standards: 0,
        analyze: 0,
        compare: 0,
        risk: 0,
        summary: 0,
        report: 0,
      },
    };
  }
  const std = withStandards ? n : 0;
  return {
    total: 1 + std + 2 * n + 1 + n,
    skipped: 0,
    phases: { checklist: 1, standards: std, analyze: n, compare: 0, risk: n, summary: 1, report: n },
  };
}

/** Typical seconds per step with the live model (P6.1 re-measures these). */
export const LIVE_SECONDS = {
  checklist: 75,
  standards: 80,
  analyze: 110,
  compare: 60,
  risk: 50,
  summary: 30,
  report: 70,
} as const;
/** Mock mode sleeps 2–5 s per step (RDD §7.8). */
export const MOCK_SECONDS = 3.5;

/**
 * Wall-clock estimate: phases run in order; inside a phase, steps run `concurrency` at a time.
 */
export function estimateSeconds(
  proposals: number,
  {
    concurrency,
    mode,
    withStandards = true,
  }: { concurrency: number; mode: "mock" | "live"; withStandards?: boolean },
): number {
  const plan = planRun(proposals, withStandards);
  if (!plan.total) return 0;
  const c = Math.max(1, Math.floor(concurrency));
  const waves = (steps: number) => Math.ceil(steps / c);
  const per = (phase: keyof typeof LIVE_SECONDS) =>
    mode === "mock" ? MOCK_SECONDS : LIVE_SECONDS[phase];
  return Math.round(
    per("checklist") +
      waves(plan.phases.standards) * per("standards") +
      waves(plan.phases.analyze) * per("analyze") +
      waves(plan.phases.risk) * per("risk") +
      per("summary") +
      waves(plan.phases.report) * per("report"),
  );
}

// ─── Prices and the run cost estimate (calibrated on real runs, HANDOFF G-65) ──
interface TokenPrices {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

/**
 * USD per million tokens (claude-api reference, checked 2026-10-21). Cache writes are 1.25× and
 * reads 0.1× of input (0.05× on Opus 5.5). Haiku 5.5 is priced by prompt size: above 100K tokens
 * per request everything costs 5×.
 */
export const MODEL_PRICES: Record<AiModel, TokenPrices & { longPrompt?: TokenPrices }> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
  "claude-haiku-5-5": {
    input: 0.1,
    output: 0.5,
    cacheWrite: 0.125,
    cacheRead: 0.01,
    longPrompt: { input: 0.5, output: 2.5, cacheWrite: 0.625, cacheRead: 0.05 },
  },
};
const LONG_PROMPT_TOKENS = 100_000;

/** Prices that apply to one request with this many prompt tokens (cached ones included). */
function pricesFor(model: AiModel, promptTokens: number): TokenPrices {
  const p = MODEL_PRICES[model];
  return p.longPrompt && promptTokens > LONG_PROMPT_TOKENS ? p.longPrompt : p;
}

/** Measured on Sonnet 5.5 runs (P6.10): tokens per unit of input or output. */
const TOKENS = {
  sharedPdfPage: 2_750, // RFP and standard pages (dense text)
  vendorPdfPage: 2_350, // proposal pages
  image: 1_600,
  charsPerToken: 3.8, // DOCX / XLSX / text documents, standard rules
  checklistPerReq: 185, // the checklist JSON every later step re-reads
  digestPerReq: 110, // one vendor's analysis as passed to compare / risk / summary
  outChecklistPerReq: 220,
  outAnalyzePerReq: 450, // findings incl. adaptive thinking
} as const;
/** Output tokens per second incl. thinking (Sonnet measured; Opus and Haiku assumed). */
const SPEED: Record<AiModel, number> = {
  "claude-opus-5-5": 110,
  "claude-sonnet-5-5": 170,
  "claude-haiku-5-5": 260,
};
/**
 * Output written per finding relative to Sonnet. Haiku measured on POC set 3 (2026-10-23, 3
 * vendors, 43 requirements): ~1,000 tokens per RFP finding and ~770 per rule incl. thinking, about
 * twice Sonnet's ($0.094 real vs $0.05 estimated before). Opus assumed until measured.
 */
const OUTPUT_FACTOR: Record<AiModel, number> = {
  "claude-opus-5-5": 1.2,
  "claude-sonnet-5-5": 1,
  "claude-haiku-5-5": 2,
};
/** The prompt cache lives 5 minutes from the request that last used it; keep a margin. */
const CACHE_TTL_S = 270;

export interface DocSizes {
  pdfPages: number;
  images: number;
  /** Characters of documents sent as text (DOCX, XLSX, TXT…). */
  textChars: number;
}

export interface RunEstimateInput {
  /** RFP + standard documents, plus the standards' rules. */
  shared: DocSizes & { rulesCount: number; rulesChars: number; rfpPageEquivalents: number };
  vendors: DocSizes[];
  /** Requirement count of the latest finished run (a re-run checks the same list). */
  previousRequirements: number | null;
}

export interface RunEstimate {
  usd: number;
  low: number;
  high: number;
  seconds: number;
  requirements: number;
  requirementsEstimated: boolean;
  steps: number;
  /** The consultant reports' share of usd (they come on top of the evaluation itself). */
  reportsUsd: number;
}

function stepUsd(
  model: AiModel,
  t: { uncached: number; read: number; write: number; out: number },
): number {
  const p = pricesFor(model, t.uncached + t.read + t.write);
  return (
    (t.uncached * p.input + t.read * p.cacheRead + t.write * p.cacheWrite + t.out * p.output) / 1e6
  );
}

/**
 * Realistic cost of one analysis run, step by step, with the same cache behaviour as the
 * pipeline (two shared output formats, G-58; cache entries expire after 5 minutes, I-22). The
 * model reproduces the measured Sonnet runs within a few percent; the range covers how much the
 * AI writes (findings and thinking vary by about ±20 %).
 */
export function estimateRun(
  input: RunEstimateInput,
  { model, concurrency }: { model: AiModel; concurrency: number },
): RunEstimate {
  const n = input.vendors.length;
  if (!n) {
    return {
      usd: 0,
      low: 0,
      high: 0,
      seconds: 0,
      requirements: 0,
      requirementsEstimated: false,
      steps: 0,
      reportsUsd: 0,
    };
  }
  const { shared } = input;
  const docTokens = (d: DocSizes, perPage: number) =>
    d.pdfPages * perPage + d.images * TOKENS.image + d.textChars / TOKENS.charsPerToken;
  const S =
    docTokens(shared, TOKENS.sharedPdfPage) +
    shared.rulesChars / TOKENS.charsPerToken +
    shared.rulesCount * 12 +
    1_500;
  const estimated = input.previousRequirements == null;
  // Checklist = RFP requirements + every standard rule as its own requirement (P8).
  const R =
    input.previousRequirements ??
    Math.min(
      250,
      Math.max(
        shared.rulesCount + 5,
        Math.round(shared.rulesCount + 3.5 * shared.rfpPageEquivalents),
      ),
    );
  const Rstd = Math.min(shared.rulesCount, R);
  const Rrfp = Math.max(1, R - Rstd);
  const C = TOKENS.checklistPerReq * R;
  const D = TOKENS.digestPerReq * R;
  const V = input.vendors.map((v) => docTokens(v, TOKENS.vendorPdfPage) + 300);
  const f = OUTPUT_FACTOR[model];
  const out = {
    checklist: (TOKENS.outChecklistPerReq * Rrfp + 25 * Rstd) * f,
    standards: TOKENS.outAnalyzePerReq * Rstd * f,
    analyze: TOKENS.outAnalyzePerReq * Rrfp * f,
    risk: (4_800 + 30 * R) * f,
    summary: (900 + 350 * n) * f,
    // A two-page report (~1,100 words of JSON) plus the thinking behind it.
    report: 6_500 * f,
  };
  const c = Math.max(1, Math.floor(concurrency));
  const waves = Math.ceil(n / c);
  const secs = (tokens: number) => tokens / SPEED[model] + 8;
  const withStd = Rstd > 0;

  let usd = stepUsd(model, { uncached: 900, read: 0, write: S, out: out.checklist });
  // The first check of each vendor writes its documents (③) to the cache; the first of all also
  // writes the checklist (②). Standards and RFP checks of a vendor share that cache.
  const firstChecks = (outTokens: number) =>
    V.forEach((v, i) => {
      usd += stepUsd(
        model,
        i === 0
          ? { uncached: 600, read: S, write: C + v, out: outTokens }
          : { uncached: 600, read: S + C, write: v, out: outTokens },
      );
    });
  const stdTime = withStd ? waves * secs(out.standards) : 0;
  if (withStd) firstChecks(out.standards);
  if (withStd && stdTime < CACHE_TTL_S) {
    for (const v of V) {
      usd += stepUsd(model, { uncached: 600, read: S + C + v, write: 0, out: out.analyze });
    }
  } else {
    firstChecks(out.analyze);
  }
  const analyzeTime = waves * secs(out.analyze);
  // Risk steps reuse the vendors' cache only if it has not expired in the meantime.
  const riskHit = analyzeTime < CACHE_TTL_S;
  V.forEach((v, i) => {
    usd += stepUsd(
      model,
      riskHit
        ? { uncached: D + 1_000, read: S + C + v, write: 0, out: out.risk }
        : i === 0
          ? { uncached: D + 1_000, read: 0, write: S + C + v, out: out.risk }
          : { uncached: D + 1_000, read: S + C, write: v, out: out.risk },
    );
  });
  const riskTime = waves * secs(out.risk);
  // Recommendation: scores + analyses only, no documents (one small uncached request).
  usd += stepUsd(model, { uncached: C + D * n + 1_500, read: 0, write: 0, out: out.summary });
  // Reports have their own output format, so they share no earlier cache entry: the first writes
  // the tender and the checklist (① ②), every report writes its vendor's documents (③).
  let reportsUsd = 0;
  V.forEach((v, i) => {
    reportsUsd += stepUsd(
      model,
      i === 0
        ? { uncached: D + 3_000, read: 0, write: S + C + v, out: out.report }
        : { uncached: D + 3_000, read: S + C, write: v, out: out.report },
    );
  });
  usd += reportsUsd;
  const reportTime = waves * secs(out.report);

  const round2 = (x: number) => Math.round(x * 100) / 100;
  return {
    usd: round2(usd),
    low: round2(usd * 0.8),
    high: round2(usd * 1.25),
    seconds: Math.round(
      secs(out.checklist) + stdTime + analyzeTime + riskTime + secs(out.summary) + reportTime,
    ),
    requirements: R,
    requirementsEstimated: estimated,
    steps: planRun(n, withStd).total,
    reportsUsd: round2(reportsUsd),
  };
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} s`;
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

// ─── Step plan (RDD §7.1) ────────────────────────────────────────────────────
export interface PlannedStep {
  seq: number;
  phase: RunPhase;
  /** Proposal the step is about (analyze/compare/risk). */
  proposalId: string | null;
  label: string;
  /** N = 1: the comparison is planned but skipped. */
  skipped?: string;
}

/** "A", "A and B", "A, B and C", or "the other 4 vendors" for long lists. */
export function joinNames(names: string[]): string {
  if (names.length > 3) return `the other ${names.length} vendors`;
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

export const analyzeLabel = (vendor: string, requirements?: number) =>
  requirements
    ? `Checking ${vendor} against the RFP: ${requirements} requirements`
    : `Checking ${vendor} against the RFP`;

export const standardsLabel = (vendor: string, rules: number) =>
  `Checking ${vendor} against the standards: ${rules} rule${rules === 1 ? "" : "s"}`;

export function planSteps(
  vendors: { proposalId: string; name: string }[],
  { standards, rules }: { standards: number; rules: number },
): PlannedStep[] {
  const n = vendors.length;
  if (!n) return [];
  const steps: PlannedStep[] = [];
  const add = (s: Omit<PlannedStep, "seq">) => steps.push({ seq: steps.length + 1, ...s });
  add({
    phase: "checklist",
    proposalId: null,
    label: rules
      ? `Building the RFP checklist and filing ${rules} rules of ${standards} standard${standards === 1 ? "" : "s"} by proposal section`
      : "Building the RFP checklist",
  });
  if (rules) {
    for (const v of vendors)
      add({ phase: "standards", proposalId: v.proposalId, label: standardsLabel(v.name, rules) });
  }
  for (const v of vendors)
    add({ phase: "analyze", proposalId: v.proposalId, label: analyzeLabel(v.name) });
  for (const v of vendors)
    add({ phase: "risk", proposalId: v.proposalId, label: `Assessing risks for ${v.name}` });
  add({
    phase: "summary",
    proposalId: null,
    label: "Scoring the vendors and writing the recommendation",
  });
  for (const v of vendors)
    add({ phase: "report", proposalId: v.proposalId, label: reportLabel(v.name) });
  return steps;
}

export const reportLabel = (vendor: string) => `Writing the consultant report on ${vendor}`;

// ─── Live ETA (RDD §7.7) ─────────────────────────────────────────────────────
const PHASE_ORDER: RunPhase[] = [
  "checklist",
  "standards",
  "analyze",
  "compare",
  "risk",
  "summary",
  "report",
];

/**
 * Seconds left: for each phase, waves of `concurrency` steps × average step time. Averages come
 * from finished steps of the run, else the defaults; running steps count as half done.
 */
export function etaSeconds(
  steps: { phase: RunPhase; status: string; durationMs: number | null }[],
  { concurrency, mode }: { concurrency: number; mode: "mock" | "live" },
): number {
  const c = Math.max(1, Math.floor(concurrency));
  let total = 0;
  for (const phase of PHASE_ORDER) {
    const inPhase = steps.filter((s) => s.phase === phase);
    const done = inPhase.filter((s) => s.status === "done" && s.durationMs);
    const avg = done.length
      ? done.reduce((sum, s) => sum + (s.durationMs ?? 0), 0) / done.length / 1000
      : mode === "mock"
        ? MOCK_SECONDS
        : LIVE_SECONDS[phase];
    const queued = inPhase.filter((s) => s.status === "queued").length;
    const running = inPhase.filter((s) => s.status === "running").length;
    if (!queued && !running) continue;
    total += Math.ceil((queued + running) / c) * avg - (running ? avg / 2 : 0);
  }
  return Math.max(0, Math.round(total));
}

/** Real cost of recorded usage (USD, 4 decimals). Unknown models (mock) cost 0. */
export function costFromUsage(model: string, u: TokenUsage): number {
  if (!MODEL_PRICES[model as AiModel]) return 0;
  // One step's usage is one request (plus a retry at most), so its prompt size picks the tier.
  const price = pricesFor(model as AiModel, u.inputTokens + u.cacheReadTokens + u.cacheWriteTokens);
  const usd =
    (u.inputTokens * price.input +
      u.outputTokens * price.output +
      u.cacheWriteTokens * price.cacheWrite +
      u.cacheReadTokens * price.cacheRead) /
    1e6;
  return Math.round(usd * 10_000) / 10_000;
}

export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
    cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
  };
}
