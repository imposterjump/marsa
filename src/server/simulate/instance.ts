/**
 * The app's proposal generator (P7.5): mock bids at $0 with AI_MODE=mock, Claude-written bids
 * with AI_MODE=live. Kept on globalThis like the runner so dev hot reloads keep running jobs.
 */
import "server-only";
import { getDb } from "../db/client";
import { env } from "../env";
import { getStorage } from "../storage";
import { callStructured } from "../ai/client";
import { tenderBlocks } from "../ai/content";
import { ensureUploaded } from "../ai/engine";
import { createPageLoader } from "../ai/mock";
import { costFromUsage } from "../../lib/plan";
import { createGenerator, type Generator, type GeneratorDeps } from "./jobs";
import { mockBid } from "./mock";
import { GENERATOR_SYSTEM, generatorTask } from "./prompt";
import { commercialPdf } from "./render";
import { GeneratedBidSchema } from "./schema";

const globalForGen = globalThis as typeof globalThis & { __marsaGenerator?: Generator };

export function getGenerator(): Generator {
  if (!globalForGen.__marsaGenerator) {
    const db = getDb();
    const storage = getStorage();
    const loadPages = createPageLoader(storage);
    const delay = Number(process.env.MOCK_STEP_MS) || 1200;

    const writeBid: GeneratorDeps["writeBid"] =
      env.AI_MODE === "live"
        ? async ({ ctx, vendorName, country, profile, checklist, model }) => {
            await ensureUploaded(
              db,
              storage,
              [...ctx.rfpDocs, ...ctx.standards.flatMap((s) => s.docs)].filter(
                (d) =>
                  d.aiReadable &&
                  (d.ext === "pdf" || ["png", "jpg", "jpeg", "gif", "webp"].includes(d.ext)),
              ),
            );
            const res = await callStructured({
              model,
              system: GENERATOR_SYSTEM,
              content: [
                ...tenderBlocks(ctx),
                { type: "text", text: generatorTask({ vendorName, country, profile, checklist }) },
              ],
              schema: GeneratedBidSchema,
              effort: "medium", // writing a bid needs less depth than evaluating one
            });
            return { bid: res.data, costUsd: costFromUsage(model, res.usage) };
          }
        : async ({ ctx, vendorName, country, profile }) => {
            await new Promise((r) => setTimeout(r, delay));
            return {
              bid: await mockBid({ ctx, vendorName, country, profile, loadPages }),
              costUsd: 0,
            };
          };

    globalForGen.__marsaGenerator = createGenerator({
      db,
      storage,
      mode: env.AI_MODE,
      maxUploadMb: env.MAX_UPLOAD_MB,
      writeBid,
      renderPdf: commercialPdf,
    });
  }
  return globalForGen.__marsaGenerator;
}
