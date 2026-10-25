/**
 * Long checks in parts (2026-10-26). A vendor's standards or RFP check writes one finding per
 * requirement in a single answer, and an answer has a size limit (MAX_TOKENS, thinking included).
 * A checklist longer than CHECK_PART_SIZE for the model is checked in parts, one request each, in
 * checklist order: the first part writes the bid's cache entry, the others read it (cheap). A part
 * whose answer is still cut off is split in two and asked again. The findings are joined; the
 * summary, strengths and commercial terms come from the first part.
 * No SDK import and no `server-only`: tests drive it with a fake request.
 */
import { addUsage, checkParts } from "../../lib/plan";
import { EMPTY_USAGE, type TokenUsage } from "../../lib/domain";
import { AiError, type CallResult } from "./result";
import type { AnalysisOutput } from "./schemas";
import type { CheckPart } from "./types";

/** A cut-off part smaller than this is not split again (the step fails, Retry is offered). */
const MIN_SPLIT = 6;

/** `codes` in `total` parts of near-equal size, in order. */
export function splitCodes(codes: string[], total: number): string[][] {
  const n = Math.max(1, Math.min(total, codes.length));
  const size = Math.max(1, Math.ceil(codes.length / n));
  const out: string[][] = [];
  for (let i = 0; i < codes.length; i += size) out.push(codes.slice(i, i + size));
  return out.length ? out : [codes];
}

/** Tokens already billed by earlier parts, carried on an error so the step still records them. */
export function usageOfError(err: unknown): TokenUsage | undefined {
  if (err instanceof AiError) return err.usage;
  const u = (err as { usage?: TokenUsage } | null)?.usage;
  return u && typeof u.outputTokens === "number" ? u : undefined;
}

function withUsage(err: unknown, spent: TokenUsage): unknown {
  if (!spent.requests) return err;
  const own = usageOfError(err);
  const usage = own ? addUsage(spent, own) : spent;
  if (err instanceof AiError) return new AiError(err.code, err.message, err.details, usage);
  if (err && typeof err === "object") Object.assign(err, { usage });
  return err;
}

export async function checkInParts(
  model: string,
  codes: string[],
  ask: (part: CheckPart | undefined) => Promise<CallResult<AnalysisOutput>>,
): Promise<CallResult<AnalysisOutput>> {
  const queue = splitCodes(codes, checkParts(model, codes.length));
  const answers: AnalysisOutput[] = [];
  let usage: TokenUsage = EMPTY_USAGE;
  let last: CallResult<AnalysisOutput> | null = null;
  while (queue.length) {
    const group = queue.shift()!;
    const total = answers.length + 1 + queue.length;
    const part = total > 1 ? { codes: group, index: answers.length, total } : undefined;
    try {
      last = await ask(part);
      usage = addUsage(usage, last.usage);
      answers.push(last.data);
    } catch (err) {
      if (err instanceof AiError && err.code === "truncated" && group.length >= MIN_SPLIT) {
        if (err.usage) usage = addUsage(usage, err.usage);
        const half = Math.ceil(group.length / 2);
        queue.unshift(group.slice(0, half), group.slice(half));
        continue;
      }
      throw withUsage(err, usage);
    }
  }
  const [first] = answers;
  return {
    data: { ...first, findings: answers.flatMap((a) => a.findings) },
    usage,
    model: last!.model,
    stopReason: last!.stopReason,
  };
}
