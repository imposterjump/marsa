/**
 * Live pipeline run from the command line (P6.10), without the web server. Uses its own DATA_DIR
 * so the user's projects are untouched, loads the sample tender, and prints every step with its
 * duration, cache use and cost. Ctrl+C stops it (the run is then marked interrupted on next use).
 *   DATA_DIR=./data/live-test npm run ai:run -- claude-sonnet-5-5        (sample X-ray tender)
 *   DATA_DIR=./data/live-test npm run ai:run -- claude-sonnet-5-5 pcs    (PCS tender + Phase 6 bids)
 */
import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "../src/server/db/client";
import { projects, proposals, settings } from "../src/server/db/schema";
import { ingestDocument } from "../src/server/documents/ingest";
import { env } from "../src/server/env";
import { forgetUploads, getEngine } from "../src/server/ai/engine";
import { createRunner } from "../src/server/runs/runner";
import { getRunResults, getRunStatus } from "../src/server/runs/read";
import { loadSampleData } from "../src/server/seed";
import { ensureVendor, submitProposal, vendorInputSchema } from "../src/server/services/proposals";
import { getStorage } from "../src/server/storage";
import { costFromUsage } from "../src/lib/plan";
import type { AiModel } from "../src/lib/domain";
import { PCS_BIDS } from "./test-inputs/content/pcs-proposals";

const model = (process.argv[2] ?? "claude-sonnet-5-5") as AiModel;
const tender = process.argv[3] === "pcs" ? "Port Community System" : "Cargo X-Ray";

/** Submit the three Phase 6 bids to the PCS sample tender (as the vendor portal would). */
async function submitPcsBids(projectId: string) {
  const db = getDb();
  const dir = path.join(env.seedDir, "phase-6", "pcs-proposals");
  for (const [i, b] of PCS_BIDS.entries()) {
    const vendor = ensureVendor(
      db,
      vendorInputSchema.parse({
        name: b.name,
        country: b.country,
        contactName: b.contact.name,
        contactEmail: b.contact.email,
      }),
    );
    const { proposal } = await submitProposal(db, getStorage(), projectId, vendor.id);
    for (const kind of ["commercial", "technical"] as const) {
      const file = `${i + 1}-${b.slug}-${kind === "commercial" ? "Commercial" : "Technical"}.pdf`;
      await ingestDocument(db, getStorage(), {
        owner: { kind, projectId, proposalId: proposal.id },
        fileName: file,
        bytes: new Uint8Array(fs.readFileSync(path.join(dir, file))),
        maxSizeMb: env.MAX_UPLOAD_MB,
      });
    }
  }
}

async function main() {
  if (!/live-test|e2e|tmp/.test(env.dataDir))
    throw new Error(`Refusing to run in ${env.dataDir}; set DATA_DIR=./data/live-test.`);
  const db = getDb();
  const find = () =>
    db
      .select()
      .from(projects)
      .all()
      .find((p) => p.name.startsWith(tender));
  let project = find();
  if (!project) {
    console.log("Loading the sample tenders…");
    await loadSampleData(db, getStorage(), env.seedDir);
    project = find()!;
  }
  const id = project.id;
  if (
    project.status === "open" &&
    !db
      .select()
      .from(proposals)
      .all()
      .some((p) => p.projectId === id)
  ) {
    console.log("Submitting the Phase 6 bids…");
    await submitPcsBids(id);
  }
  db.update(settings).set({ aiModel: model }).where(eq(settings.id, 1)).run();
  const runner = createRunner({
    db,
    engineFor: (run) => getEngine(db, run.model, "live"),
    forgetUploads: (docs) => forgetUploads(db, docs),
    mode: "live",
    apiKeyConfigured: Boolean(env.ANTHROPIC_API_KEY),
  });
  const run = runner.start(project.id);
  console.log(`Run ${run.id} · ${model} · ${run.totalSteps} steps`);
  const seen = new Map<string, string>();
  const tick = setInterval(() => {
    const s = getRunStatus(db, run.id, true);
    for (const step of s.steps) {
      if (seen.get(step.id) === step.status) continue;
      seen.set(step.id, step.status);
      if (step.status === "queued") continue;
      const u = step.usage;
      const extra =
        step.status === "running"
          ? ""
          : ` · ${((step.durationMs ?? 0) / 1000).toFixed(0)} s` +
            (u
              ? ` · in ${u.inputTokens} · cache r/w ${u.cacheReadTokens}/${u.cacheWriteTokens} · out ${u.outputTokens} · $${costFromUsage(model, u).toFixed(3)}`
              : "") +
            (step.error ? ` · ${step.error}` : "");
      console.log(`${step.seq}/${s.run.totalSteps} ${step.status.padEnd(8)} ${step.label}${extra}`);
    }
  }, 1000);
  await runner.wait(run.id);
  clearInterval(tick);
  const status = getRunStatus(db, run.id, false);
  const results = getRunResults(db, run.id);
  console.log(
    `\nRun ${status.run.status} · $${status.run.costUsd.toFixed(2)} · usage ${JSON.stringify(status.run.usage)}`,
  );
  console.log(`Requirements: ${results.requirements.length}`);
  for (const e of results.evaluations) {
    console.log(
      `  ${e.vendor.name}: ${e.scorePct}% · mandatory fails ${e.mandatoryFailures} · risk ${e.overallRisk} · ${JSON.stringify(e.counts)}`,
    );
  }
  console.log(`Recommended: ${results.summary?.recommendedProposalId ?? "none"}`);
  console.log(results.summary?.executiveSummary ?? "(no summary)");
}

main().catch((err) => {
  console.error("Run failed:", err?.message ?? err);
  process.exit(1);
});
