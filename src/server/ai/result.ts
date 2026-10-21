/**
 * Step results and output validation, shared by the live client, the mock engine and tests
 * (no SDK import, no `server-only`).
 */
import type { z } from "zod";
import type { TokenUsage } from "../../lib/domain";

export class AiError extends Error {
  constructor(
    readonly code: "no_api_key" | "refusal" | "truncated" | "invalid_output" | "file_missing",
    message: string,
    readonly details?: unknown,
    /** Tokens billed for the failed attempt (recorded on the step). */
    readonly usage?: TokenUsage,
  ) {
    super(message);
    this.name = "AiError";
  }
}

export interface CallResult<T> {
  data: T;
  usage: TokenUsage;
  /** Model that produced the answer (differs from the requested one after a fallback). */
  model: string;
  stopReason: string | null;
}

/** Keys whose values are enum tokens: normalised to lower_snake_case before validation. */
const ENUM_KEYS = new Set([
  "status",
  "confidence",
  "category",
  "priority",
  "sourceType",
  "overall",
  "pricePosition",
]);

export function normalizeEnums(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeEnums);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        ENUM_KEYS.has(k) && typeof v === "string"
          ? v
              .trim()
              .toLowerCase()
              .replace(/[\s-]+/g, "_")
          : normalizeEnums(v),
      ]),
    );
  }
  return value;
}

/** Validate a step's JSON text against its schema (shared by the live client and tests). */
export function parseStepOutput<S extends z.ZodType>(schema: S, text: string): z.infer<S> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new AiError("invalid_output", "The model returned text that is not valid JSON.");
  }
  const result = schema.safeParse(normalizeEnums(json));
  if (!result.success) {
    throw new AiError(
      "invalid_output",
      "The model's answer did not match the expected structure.",
      result.error.issues.slice(0, 5),
    );
  }
  return result.data;
}
