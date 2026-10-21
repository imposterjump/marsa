/**
 * Analysis plan and estimates (RDD §7.1, §7.7, §7.8). Pure, shared by the Analyse & process panel
 * (P5.2) and the pipeline planner (P6). Estimates are deliberately rough and labelled as such.
 */
import type { AiModel, RunPhase, TokenUsage } from "./domain";

export interface RunPlan {
  /** Total steps: T = 3N + 2 (0 when there is nothing to analyse). */
  total: number;
  /** Steps that will be skipped (N = 1: comparison needs at least two proposals). */
  skipped: number;
  phases: { checklist: number; analyze: number; compare: number; risk: number; summary: number };
}

export function planRun(proposals: number): RunPlan {
  const n = Math.max(0, Math.floor(proposals));
  if (n === 0) {
    return {
      total: 0,
      skipped: 0,
      phases: { checklist: 0, analyze: 0, compare: 0, risk: 0, summary: 0 },
    };
  }
  return {
    total: 3 * n + 2,
    skipped: n === 1 ? 1 : 0,
    phases: { checklist: 1, analyze: n, compare: n, risk: n, summary: 1 },
  };
}

/** Typical seconds per step with the live model (P6.1 re-measures these). */
export const LIVE_SECONDS = {
  checklist: 75,
  analyze: 120,
  compare: 60,
  risk: 50,
  summary: 45,
} as const;
/** Mock mode sleeps 2–5 s per step (RDD §7.8). */
export const MOCK_SECONDS = 3.5;

/**
 * Wall-clock estimate: phases run in order; inside a phase, steps run `concurrency` at a time.
 */
export function estimateSeconds(
  proposals: number,
  { concurrency, mode }: { concurrency: number; mode: "mock" | "live" },
): number {
  const plan = planRun(proposals);
  if (!plan.total) return 0;
  const c = Math.max(1, Math.floor(concurrency));
  const waves = (steps: number) => Math.ceil(steps / c);
  const per = (phase: keyof typeof LIVE_SECONDS) =>
    mode === "mock" ? MOCK_SECONDS : LIVE_SECONDS[phase];
  const compare = plan.skipped ? 0 : plan.phases.compare;
  return Math.round(
    per("checklist") +
      waves(plan.phases.analyze) * per("analyze") +
      waves(compare) * per("compare") +
      waves(plan.phases.risk) * per("risk") +
      per("summary"),
  );
}

/** USD per million tokens (from the claude-api reference, checked 2026-10-21). */
export const MODEL_PRICES: Record<
  AiModel,
  { input: number; output: number; cacheWrite: number; cacheRead: number }
> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
};

/** A PDF page sent to Claude costs roughly this many input tokens (text + page image). */
export const TOKENS_PER_PAGE = 2_000;

/**
 * Rough cost of one run. The shared context (RFP + standards) is written to the prompt cache once
 * and read by every later step; each vendor's documents are read by its analyse step only.
 */
export function estimateCostUsd({
  model,
  sharedPages,
  vendorPages,
}: {
  model: AiModel;
  /** Pages of RFP + standard documents. */
  sharedPages: number;
  /** Pages per vendor (commercial + technical). */
  vendorPages: number[];
}): number {
  const n = vendorPages.length;
  if (!n) return 0;
  const price = MODEL_PRICES[model];
  const shared = sharedPages * TOKENS_PER_PAGE + 6_000; // + rules and instructions
  const plan = planRun(n);
  const compareSteps = plan.skipped ? 0 : n;
  const cachedReads = n + compareSteps + n + 1; // every step after the checklist re-reads the shared prefix
  const input =
    shared * (price.cacheWrite / 1e6) +
    shared * cachedReads * (price.cacheRead / 1e6) +
    vendorPages.reduce((s, p) => s + p * TOKENS_PER_PAGE, 0) * (price.input / 1e6) +
    (compareSteps * 12_000 + n * 15_000 + 25_000) * (price.input / 1e6); // findings passed between steps
  const output =
    (8_000 + n * 9_000 + compareSteps * 3_500 + n * 3_500 + 4_000) * (price.output / 1e6);
  return Math.round((input + output) * 100) / 100;
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
    ? `Analysing ${vendor}: checking ${requirements} requirements`
    : `Analysing ${vendor}`;

export function planSteps(
  vendors: { proposalId: string; name: string }[],
  standardsCount: number,
): PlannedStep[] {
  const n = vendors.length;
  if (!n) return [];
  const steps: PlannedStep[] = [];
  const add = (s: Omit<PlannedStep, "seq">) => steps.push({ seq: steps.length + 1, ...s });
  add({
    phase: "checklist",
    proposalId: null,
    label: `Building the evaluation checklist from your RFP and ${standardsCount} standard${standardsCount === 1 ? "" : "s"}`,
  });
  for (const v of vendors)
    add({ phase: "analyze", proposalId: v.proposalId, label: analyzeLabel(v.name) });
  for (const v of vendors) {
    const others = vendors.filter((o) => o !== v).map((o) => o.name);
    add({
      phase: "compare",
      proposalId: v.proposalId,
      label:
        n === 1
          ? `Comparing ${v.name} with other vendors`
          : `Comparing ${v.name} against ${joinNames(others)}`,
      ...(n === 1 ? { skipped: "Needs at least two proposals." } : {}),
    });
  }
  for (const v of vendors)
    add({ phase: "risk", proposalId: v.proposalId, label: `Assessing risks for ${v.name}` });
  add({
    phase: "summary",
    proposalId: null,
    label: "Ranking vendors and writing the executive summary",
  });
  return steps;
}

// ─── Live ETA (RDD §7.7) ─────────────────────────────────────────────────────
const PHASE_ORDER: RunPhase[] = ["checklist", "analyze", "compare", "risk", "summary"];

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
  const price = MODEL_PRICES[model as AiModel];
  if (!price) return 0;
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
