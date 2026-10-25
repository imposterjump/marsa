/**
 * Exact size of what an analysis would send, and the run estimate from it (2026-10-26). Every
 * document of the project (tender, standards, each bid) is counted with Anthropic's token
 * counting endpoint, which is free (not billed, runs no model), instead of the estimator's
 * tokens-per-page guess. The documents go to Anthropic for counting, as an analysis would send
 * them. Read-only on the app's data; never prints the API key.
 *   npx tsx scripts/count-tokens.ts <project code or id> [--model=sonnet|haiku|opus|all]
 */
import "./load-env";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { and, eq, inArray, or } from "drizzle-orm";
import { openDb } from "../src/server/db/connect";
import { documents, projectStandards, projects, proposals, vendors } from "../src/server/db/schema";
import { runEstimateInput } from "../src/server/runs/estimate";
import { evaluableProposals } from "../src/server/runs/store";
import { getSettings } from "../src/server/services/settings";
import { createLocalStorage } from "../src/server/storage/local";
import { estimateRun, formatDuration } from "../src/lib/plan";
import type { AiModel } from "../src/lib/domain";

const MODELS: Record<string, AiModel> = {
  sonnet: "claude-sonnet-5-5",
  haiku: "claude-haiku-5-5",
  opus: "claude-opus-5-5",
};
const IMAGE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

const ref = process.argv[2];
const modelArg = process.argv.find((a) => a.startsWith("--model="))?.slice(8) ?? "all";
if (!ref) throw new Error("Use: npx tsx scripts/count-tokens.ts <project code or id> [--model=…]");
const models = modelArg === "all" ? Object.values(MODELS) : [MODELS[modelArg]];
if (!models[0]) throw new Error(`Unknown model "${modelArg}" (sonnet, haiku, opus or all).`);
if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set in .env.");

const dataDir = path.resolve(process.env.DATA_DIR || "./data");
const db = openDb(path.join(dataDir, "app.db"));
const storage = createLocalStorage(path.join(dataDir, "uploads"));
const client = new Anthropic({ maxRetries: 5 });

const found = db
  .select()
  .from(projects)
  .where(or(eq(projects.id, ref), eq(projects.code, ref)))
  .get();
if (!found) throw new Error(`No project ${ref}.`);
const project = found;
const input = runEstimateInput(db, project.id);
const props = evaluableProposals(db, project.id);
const names = new Map(
  db
    .select({ id: proposals.id, name: vendors.name })
    .from(proposals)
    .innerJoin(vendors, eq(vendors.id, proposals.vendorId))
    .where(eq(proposals.projectId, project.id))
    .all()
    .map((r) => [r.id, r.name]),
);
const standardIds = db
  .select({ id: projectStandards.standardId })
  .from(projectStandards)
  .where(eq(projectStandards.projectId, project.id))
  .all()
  .map((r) => r.id);
const docs = db
  .select()
  .from(documents)
  .where(
    and(
      eq(documents.aiReadable, true),
      or(
        and(eq(documents.projectId, project.id), eq(documents.kind, "rfp")),
        standardIds.length ? inArray(documents.standardId, standardIds) : undefined,
        props.length
          ? inArray(
              documents.proposalId,
              props.map((p) => p.id),
            )
          : undefined,
      ),
    ),
  )
  .all();

type Block = Anthropic.ContentBlockParam;
async function blockOf(d: (typeof docs)[number]): Promise<Block | null> {
  if (d.ext === "pdf") {
    const data = (await storage.read(d.storagePath)).toString("base64");
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data },
      title: d.originalName,
    };
  }
  if (IMAGE_TYPES[d.ext]) {
    const data = (await storage.read(d.storagePath)).toString("base64");
    return {
      type: "image",
      source: { type: "base64", media_type: IMAGE_TYPES[d.ext] as "image/png", data },
    };
  }
  if (!d.textContent) return null;
  return {
    type: "document",
    source: { type: "text", media_type: "text/plain", data: d.textContent },
    title: d.originalName,
  };
}

const count = async (model: AiModel, content: Block[]) =>
  (await client.messages.countTokens({ model, messages: [{ role: "user", content }] }))
    .input_tokens;

async function main() {
  const settings = getSettings(db);
  const concurrency = settings.concurrency ?? 3;
  console.log(
    `${project.code} ${project.name}: ${docs.length} documents, ${props.length} bids, ${input.shared.rulesCount} standard rules`,
  );

  for (const model of models) {
    const base = await count(model, [{ type: "text", text: "." }]);
    let shared = 0;
    const perBid = new Map<string, number>(props.map((p) => [p.id, 0]));
    for (const d of docs) {
      const block = await blockOf(d);
      if (!block) continue;
      const n = (await count(model, [block, { type: "text", text: "." }])) - base;
      if (d.proposalId) perBid.set(d.proposalId, (perBid.get(d.proposalId) ?? 0) + n);
      else shared += n;
    }
    const bidTokens = props.map((p) => perBid.get(p.id) ?? 0);
    console.log(`\n${model}`);
    console.log(`  tender documents: ${shared.toLocaleString("en")} tokens`);
    for (const p of props)
      console.log(
        `  ${names.get(p.id) ?? p.id}: ${(perBid.get(p.id) ?? 0).toLocaleString("en")} tokens`,
      );
    // The estimator in token terms: its per-page constants turned back into the counted tokens.
    const measured = {
      ...input,
      shared: { ...input.shared, pdfPages: shared / 2_750, images: 0, textChars: 0 },
      vendors: bidTokens.map((t) => ({ pdfPages: t / 2_350, images: 0, textChars: 0 })),
    };
    const sizes = input.previousRequirements ? [input.previousRequirements] : [30, 45, 60];
    for (const r of sizes) {
      const e = estimateRun({ ...measured, previousRequirements: r }, { model, concurrency });
      const biggest = shared + 185 * r + Math.max(...bidTokens) + 1_500;
      console.log(
        `  ${r} requirements: $${e.usd} ($${e.low}–$${e.high}), about ${formatDuration(e.seconds)}; largest request ${Math.round(biggest / 1000)}k tokens`,
      );
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
