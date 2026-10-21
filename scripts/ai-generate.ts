/**
 * Live check of AI-generated proposals (P7.5) on the PCS sample tender in a test DATA_DIR. The
 * tender is re-opened there so it accepts bids. Prints each bid's status, cost and files.
 *   DATA_DIR=./data/live-test npm run ai:generate -- claude-sonnet-5-5 strong risky_cloud
 */
import "./load-env";
import { eq } from "drizzle-orm";
import { getDb } from "../src/server/db/client";
import { documents, projects, settings } from "../src/server/db/schema";
import { env } from "../src/server/env";
import { getGenerator } from "../src/server/simulate/instance";
import type { BidProfile } from "../src/server/simulate/schema";
import type { AiModel } from "../src/lib/domain";

const model = (process.argv[2] ?? "claude-sonnet-5-5") as AiModel;
const profiles = (
  process.argv.slice(3).length ? process.argv.slice(3) : ["strong"]
) as BidProfile[];

async function main() {
  if (!/live-test|tmp/.test(env.dataDir)) throw new Error(`Refusing to run in ${env.dataDir}.`);
  if (env.AI_MODE !== "live") throw new Error("Set AI_MODE=live for this check.");
  const db = getDb();
  db.update(settings).set({ aiModel: model }).where(eq(settings.id, 1)).run();
  const pcs = db
    .select()
    .from(projects)
    .all()
    .find((p) => p.name.startsWith("Port Community System"));
  if (!pcs) throw new Error("Run `npm run ai:run -- <model> pcs` first to load the sample tender.");
  db.update(projects).set({ status: "open" }).where(eq(projects.id, pcs.id)).run();
  const job = getGenerator().start(pcs.id, profiles);
  console.log(`Job ${job.id} · ${model} · ${profiles.join(", ")}`);
  while (job.status === "running") {
    await new Promise((r) => setTimeout(r, 2000));
    console.log(job.items.map((i) => `${i.vendorName}: ${i.status}`).join(" | "));
  }
  for (const i of job.items) {
    const docs = i.proposalId
      ? db.select().from(documents).where(eq(documents.proposalId, i.proposalId)).all()
      : [];
    console.log(
      `${i.vendorName} (${i.profile}): ${i.status} · $${i.costUsd.toFixed(3)} ${i.error ?? ""}`,
      docs.map((d) => `${d.originalName} ${d.pageCount ?? ""}p ${d.sizeBytes}B`).join(" · "),
    );
  }
  console.log(`Total $${job.costUsd.toFixed(3)}`);
}

main().catch((err) => {
  console.error("Failed:", err?.message ?? err);
  process.exit(1);
});
