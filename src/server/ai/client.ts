/**
 * Claude client for the pipeline (RDD §7.3, P6.1), following the bundled claude-api skill:
 * - streaming + finalMessage() for long inputs/outputs, max_tokens 64k (thinking counts too);
 * - Opus/Sonnet 5.5: adaptive thinking is always on, depth set with output_config.effort. One
 *   effort for every step of a run, because changing it invalidates the prompt cache;
 * - structured outputs via output_config.format (schema from the SDK's betaZodOutputFormat),
 *   parsed and validated here so enum-like values can be normalised first (the SDK moves `enum`
 *   into the description, so the API does not enforce it);
 * - server-side refusal fallbacks (`fallbacks: "default"`, beta header) shipped from day one;
 * - stop_reason checked before reading content; typed SDK errors pass through (SDK retries 429/5xx).
 * Server-only: the API key never reaches the browser.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { env } from "../env";
import type { TokenUsage } from "../../lib/domain";
import { AiError, parseStepOutput, type CallResult } from "./result";

export { AiError, type CallResult } from "./result";

export const EFFORT = "high" as const; // RDD §7.3; one value for every step keeps the cache warm
export const MAX_TOKENS = 64_000;
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

const globalForAi = globalThis as typeof globalThis & { __marsaAnthropic?: Anthropic };

export function getAnthropic(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new AiError(
      "no_api_key",
      "No Anthropic API key is configured (set ANTHROPIC_API_KEY in .env).",
    );
  }
  globalForAi.__marsaAnthropic ??= new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    maxRetries: 3,
    timeout: 15 * 60_000,
  });
  return globalForAi.__marsaAnthropic;
}

export async function callStructured<S extends z.ZodType>({
  model,
  system,
  content,
  schema,
  signal,
  onStarted,
  effort = EFFORT,
}: {
  model: string;
  system: string;
  content: Anthropic.Beta.BetaContentBlockParam[];
  schema: S;
  signal?: AbortSignal;
  /** Fires when the response starts streaming: from then on its cache entry is readable. */
  onStarted?: () => void;
  /** Keep one value per workload (the pipeline uses EFFORT for every step). */
  effort?: "low" | "medium" | "high";
}): Promise<CallResult<z.infer<S>>> {
  const client = getAnthropic();
  // Plain format object (no SDK auto-parse): we normalise and validate ourselves.
  const { type, schema: jsonSchema } = betaZodOutputFormat(schema);
  const stream = client.beta.messages.stream(
    {
      model,
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: system }],
      messages: [{ role: "user", content }],
      output_config: { effort, format: { type, schema: jsonSchema } },
      betas: [FALLBACK_BETA],
      fallbacks: "default",
    },
    { signal },
  );
  if (onStarted) stream.on("streamEvent", (e) => e.type === "message_start" && onStarted());
  let message: Anthropic.Beta.BetaMessage;
  try {
    message = await stream.finalMessage();
  } catch (err) {
    // An expired or deleted Files API id: the runner clears the cached ids and re-uploads.
    if (
      err instanceof Anthropic.APIError &&
      (err.status === 404 || err.status === 400) &&
      /file/i.test(err.message)
    ) {
      throw new AiError(
        "file_missing",
        "A document is no longer on Anthropic's file store.",
        err.message,
      );
    }
    throw err;
  }

  const usage: TokenUsage = {
    inputTokens: message.usage.input_tokens ?? 0,
    outputTokens: message.usage.output_tokens ?? 0,
    cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
  };
  if (message.stop_reason === "refusal") {
    const details = (
      message as { stop_details?: { category?: string | null; explanation?: string | null } }
    ).stop_details;
    throw new AiError(
      "refusal",
      `The model declined this step${details?.category ? ` (${details.category})` : ""}.`,
      details,
      usage,
    );
  }
  if (message.stop_reason === "max_tokens") {
    throw new AiError(
      "truncated",
      "The answer was cut off (max_tokens reached).",
      undefined,
      usage,
    );
  }
  const text = message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  try {
    return {
      data: parseStepOutput(schema, text),
      usage,
      model: message.model,
      stopReason: message.stop_reason,
    };
  } catch (err) {
    if (err instanceof AiError) throw new AiError(err.code, err.message, err.details, usage);
    throw err;
  }
}

/** Upload a file once to the Files API (no beta header: the Files API is GA). */
export async function uploadFile(
  name: string,
  bytes: Uint8Array,
  mimeType: string,
): Promise<string> {
  const client = getAnthropic();
  const file = await Anthropic.toFile(Buffer.from(bytes), name, { type: mimeType });
  const meta = await client.files.upload({ file });
  return meta.id;
}

/** A short, readable reason for a failed step (shown in the UI next to Retry). */
export function describeError(err: unknown): string {
  if (err instanceof AiError) return err.message;
  if (err instanceof Anthropic.APIUserAbortError) return "Cancelled.";
  if (err instanceof Anthropic.AuthenticationError)
    return "The Anthropic API key was rejected (401). Check ANTHROPIC_API_KEY in .env.";
  if (err instanceof Anthropic.PermissionDeniedError)
    return "This API key has no access to the selected model (403).";
  if (err instanceof Anthropic.RateLimitError)
    return "Rate limit reached (429) after several retries. Try again in a minute.";
  if (err instanceof Anthropic.APIConnectionError)
    return "Could not reach the Anthropic API (network error).";
  if (err instanceof Anthropic.APIError)
    return `Anthropic API error ${err.status ?? ""}: ${err.message}`.trim();
  return err instanceof Error ? err.message : String(err);
}
