/**
 * Safeguards for long and interrupted runs (2026-10-26): checks in parts, which errors pause a run,
 * the price tier of a step that made several requests, and the database copy after a paid run.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { AUTO_BACKUPS_KEPT, backupDatabase } from "@/server/db/backup";
import { migrateDb, openDb } from "@/server/db/connect";
import { pauseReason } from "@/server/ai/client";
import { checkInParts, splitCodes, usageOfError } from "@/server/ai/parts";
import { AiError, type CallResult } from "@/server/ai/result";
import type { AnalysisOutput } from "@/server/ai/schemas";
import type { CheckPart } from "@/server/ai/types";
import { addUsage, checkParts, costFromUsage } from "@/lib/plan";

const codes = (n: number) =>
  Array.from({ length: n }, (_, i) => `REQ-${String(i + 1).padStart(3, "0")}`);
const usage = { inputTokens: 100, outputTokens: 1_000, cacheReadTokens: 0, cacheWriteTokens: 0 };

/** A fake request: one finding per code of its part; the summary names the part. */
function fake(fail?: (part: CheckPart | undefined) => Error | null) {
  const parts: (CheckPart | undefined)[] = [];
  const ask = async (part: CheckPart | undefined): Promise<CallResult<AnalysisOutput>> => {
    parts.push(part);
    const err = fail?.(part);
    if (err) throw err;
    const list = part?.codes ?? codes(25);
    return {
      data: {
        findings: list.map((code) => ({
          code,
          status: "compliant",
          headline: "",
          vendorResponse: "",
          evidenceQuote: null,
          evidenceDocument: null,
          evidencePage: null,
          evidenceSection: null,
          assessment: "",
          gap: null,
          confidence: "high",
        })),
        summary: `part ${part ? part.index + 1 : 1}`,
        strengths: [],
        weaknesses: [],
        commercial: {
          totalPrice: null,
          currency: null,
          paymentTerms: null,
          deliveryTime: null,
          warranty: null,
          validity: null,
          exclusions: [],
        },
      },
      usage: { ...usage, requests: 1 },
      model: "claude-sonnet-5-5",
      stopReason: "end_turn",
    };
  };
  return { ask, parts };
}

describe("checks in parts", () => {
  it("splits codes evenly and in order", () => {
    expect(splitCodes(codes(61), 2).map((g) => g.length)).toEqual([31, 30]);
    expect(splitCodes(codes(5), 1)).toEqual([codes(5)]);
    expect(splitCodes([], 3)).toEqual([[]]);
    expect(checkParts("claude-sonnet-5-5", 60)).toBe(1);
    expect(checkParts("claude-sonnet-5-5", 130)).toBe(3);
    expect(checkParts("claude-haiku-5-5", 31)).toBe(2);
  });

  it("asks a short checklist in one request", async () => {
    const { ask, parts } = fake();
    const res = await checkInParts("claude-sonnet-5-5", codes(25), ask);
    expect(parts).toEqual([undefined]);
    expect(res.data.findings).toHaveLength(25);
  });

  it("asks a long checklist in parts and joins the findings in order", async () => {
    const all = codes(130);
    const { ask, parts } = fake();
    const res = await checkInParts("claude-sonnet-5-5", all, ask);
    expect(parts.map((p) => [p?.index, p?.total, p?.codes.length])).toEqual([
      [0, 3, 44],
      [1, 3, 44],
      [2, 3, 42],
    ]);
    expect(res.data.findings.map((f) => f.code)).toEqual(all);
    expect(res.data.summary).toBe("part 1"); // the overall texts come from the first part
    expect(res.usage.requests).toBe(3);
  });

  it("splits a part whose answer is cut off, and counts the cut-off tokens", async () => {
    const { ask, parts } = fake((part) =>
      part && part.codes.length > 12
        ? new AiError("truncated", "cut off", undefined, { ...usage, requests: 1 })
        : null,
    );
    const res = await checkInParts("claude-haiku-5-5", codes(40), ask);
    expect(res.data.findings.map((f) => f.code)).toEqual(codes(40));
    // Two parts of 20 were cut off, then asked again as four parts of 10.
    expect(parts.filter((p) => p!.codes.length === 10)).toHaveLength(4);
    expect(res.usage.requests).toBe(6);
  });

  it("keeps the tokens of finished parts on an error, so the step still records them", async () => {
    const { ask } = fake((part) =>
      part?.index === 1 ? new Anthropic.APIConnectionError({ message: "Connection error." }) : null,
    );
    const err = await checkInParts("claude-sonnet-5-5", codes(100), ask).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Anthropic.APIConnectionError);
    expect(usageOfError(err)?.requests).toBe(1);
    expect(pauseReason(err)).toMatch(/^Could not reach the Anthropic API/);
  });
});

describe("errors that pause a run", () => {
  const api = (status: number, message: string) =>
    Anthropic.APIError.generate(
      status,
      { type: "error", error: { type: "x", message } },
      undefined,
      new Headers(),
    );

  it("pauses on the account and the connection, not on the step's own errors", () => {
    expect(
      pauseReason(api(400, "Your credit balance is too low to access the Anthropic API.")),
    ).toMatch(/credit ran out/);
    expect(pauseReason(api(400, "You have reached your specified API usage limits."))).toMatch(
      /spending limit/,
    );
    expect(pauseReason(api(429, "Number of request tokens has exceeded your rate limit"))).toMatch(
      /rate limit/,
    );
    expect(pauseReason(api(529, "Overloaded"))).toMatch(/busy or down/);
    expect(pauseReason(api(401, "invalid x-api-key"))).toMatch(/401/);
    expect(pauseReason(new TypeError("terminated"))).toMatch(/connection .* was lost/);
    expect(pauseReason(new AiError("no_api_key", "No Anthropic API key is configured."))).toMatch(
      /No Anthropic API key/,
    );
    // The step's own problems fail the step (Retry), as before.
    expect(pauseReason(api(400, "prompt is too long"))).toBeNull();
    expect(pauseReason(new AiError("truncated", "cut off"))).toBeNull();
    expect(pauseReason(new AiError("refusal", "declined"))).toBeNull();
    expect(pauseReason(new Error("Model said no"))).toBeNull();
    expect(pauseReason(new Anthropic.APIUserAbortError())).toBeNull();
  });
});

describe("price tier of a step with several requests", () => {
  it("prices Haiku by each request's prompt, not their sum", () => {
    const one = {
      inputTokens: 80_000,
      outputTokens: 10_000,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    };
    const two = addUsage(one, one);
    expect(two.requests).toBe(2);
    // 2 × 80k prompt: each under 100k, so the base price ($0.10 / $0.50 per million).
    expect(costFromUsage("claude-haiku-5-5", two)).toBeCloseTo(
      (160_000 * 0.1 + 20_000 * 0.5) / 1e6,
      4,
    );
    // A record from before (no count) is one request: above 100k, the long-prompt price.
    const { requests: _, ...old } = two;
    expect(costFromUsage("claude-haiku-5-5", old)).toBeCloseTo(
      (160_000 * 0.5 + 20_000 * 2.5) / 1e6,
      4,
    );
  });
});

describe("database copy after a paid run", () => {
  it("copies the live database and keeps the newest copies", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "marsa-backup-"));
    const db = openDb(path.join(dir, "app.db"));
    migrateDb(db);
    const files: string[] = [];
    for (let i = 0; i < AUTO_BACKUPS_KEPT + 2; i++)
      files.push(await backupDatabase(db, dir, `run_${String(i).padStart(2, "0")}`));
    const kept = fs.readdirSync(path.join(dir, "backups", "auto"));
    expect(kept).toHaveLength(AUTO_BACKUPS_KEPT);
    expect(kept).not.toContain(path.basename(files[0]));
    const copy = openDb(files.at(-1)!);
    expect(copy.$client.prepare("select count(*) as n from projects").get()).toEqual({ n: 0 });
    copy.$client.close();
    db.$client.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
