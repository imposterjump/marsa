/**
 * Background job for AI-generated proposals (P7.5): for each requested profile, write a bid
 * (mock or Claude), render it (technical DOCX + financial PDF) and submit it as a normal proposal
 * with source "ai". Jobs live in memory (one active job per project); the proposals they create
 * are ordinary DB rows. No `server-only`: tests drive it with an in-memory DB.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/connect";
import { analysisRuns, projects, projectStandards, proposals, vendors } from "../db/schema";
import { ApiError, notFound } from "../api-errors";
import { ingestDocument } from "../documents/ingest";
import type { LocalStorage } from "../storage/local";
import { seeded } from "../ai/mock";
import type { RunContext } from "../ai/types";
import { loadRunContext } from "../runs/context";
import { readChecklist } from "../runs/store";
import { ensureVendor, submitProposal, vendorInputSchema } from "../services/proposals";
import { getSettings } from "../services/settings";
import { newId } from "../../lib/ids";
import { BID_PROFILES, VENDOR_POOL, cleanBid, type BidProfile, type GeneratedBid } from "./schema";
import { technicalDocx, type BidMeta } from "./render";

export type GenItemStatus = "queued" | "writing" | "rendering" | "done" | "failed";

export interface GenJobItem {
  profile: BidProfile;
  vendorName: string;
  country: string;
  status: GenItemStatus;
  error: string | null;
  proposalId: string | null;
  costUsd: number;
}

export interface GenJob {
  id: string;
  projectId: string;
  mode: "mock" | "live";
  model: string;
  status: "running" | "done" | "failed";
  items: GenJobItem[];
  costUsd: number;
  createdAt: string;
  finishedAt: string | null;
}

export interface BidWriterInput {
  ctx: RunContext;
  vendorName: string;
  country: string;
  profile: BidProfile;
  checklist: { code: string; title: string; sourceRef: string }[];
  model: string;
}

export interface GeneratorDeps {
  db: Db;
  storage: LocalStorage;
  mode: "mock" | "live";
  maxUploadMb: number;
  writeBid(input: BidWriterInput): Promise<{ bid: GeneratedBid; costUsd: number }>;
  renderPdf(bid: GeneratedBid, meta: BidMeta): Promise<Uint8Array>;
}

const slugOf = (s: string) => s.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function createGenerator(deps: GeneratorDeps) {
  const { db, storage } = deps;
  const jobs = new Map<string, GenJob>();

  function contextFor(projectId: string) {
    const standardIds = db
      .select({ id: projectStandards.standardId })
      .from(projectStandards)
      .where(eq(projectStandards.projectId, projectId))
      .all()
      .map((r) => r.id);
    const settings = getSettings(db);
    return loadRunContext(db, projectId, {
      weights: settings.weights,
      partialCredit: settings.partialCredit,
      standardIds,
      proposalIds: [],
      reportLanguage: settings.reportLanguage,
      concurrency: 1,
      mode: deps.mode,
    });
  }

  /** Requirement titles from the latest finished analysis, to steer coverage (RDD §7.9). */
  function latestChecklist(projectId: string) {
    const run = db
      .select({ id: analysisRuns.id })
      .from(analysisRuns)
      .where(
        and(
          eq(analysisRuns.projectId, projectId),
          inArray(analysisRuns.status, ["completed", "completed_with_errors"]),
        ),
      )
      .orderBy(desc(analysisRuns.createdAt))
      .get();
    const checklist = run ? readChecklist(db, run.id) : null;
    return (checklist?.requirements ?? []).map((r) => ({
      code: r.code,
      title: r.title,
      sourceRef: r.sourceRef,
    }));
  }

  /** Fictional names not yet used by a proposal in this project. */
  function pickVendors(projectId: string, n: number) {
    const used = new Set(
      db
        .select({ name: vendors.name })
        .from(proposals)
        .innerJoin(vendors, eq(vendors.id, proposals.vendorId))
        .where(eq(proposals.projectId, projectId))
        .all()
        .map((r) => r.name.toLowerCase()),
    );
    const start = Math.floor(seeded(projectId) * VENDOR_POOL.length);
    const pool = VENDOR_POOL.map((_, i) => VENDOR_POOL[(start + i) % VENDOR_POOL.length]).filter(
      (v) => !used.has(v.name.toLowerCase()),
    );
    if (pool.length < n) {
      throw new ApiError(409, "no_vendor_names", "No unused vendor names left for this tender.");
    }
    return pool.slice(0, n);
  }

  async function runItem(
    job: GenJob,
    item: GenJobItem,
    ctx: RunContext,
    checklist: BidWriterInput["checklist"],
  ) {
    item.status = "writing";
    const { bid: raw, costUsd } = await deps.writeBid({
      ctx,
      vendorName: item.vendorName,
      country: item.country,
      profile: item.profile,
      checklist,
      model: job.model,
    });
    const bid = cleanBid(raw);
    item.costUsd = costUsd;
    job.costUsd = Math.round((job.costUsd + costUsd) * 10_000) / 10_000;
    item.status = "rendering";
    const meta: BidMeta = {
      vendorName: item.vendorName,
      tenderRef: bid.tenderReference.trim() || ctx.project.code,
      tenderName: ctx.project.name,
      date: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
    const [docx, pdf] = await Promise.all([technicalDocx(bid, meta), deps.renderPdf(bid, meta)]);
    const email = vendorInputSchema.shape.contactEmail.safeParse(bid.vendor.contactEmail);
    const vendor = ensureVendor(
      db,
      vendorInputSchema.parse({
        name: item.vendorName,
        country: item.country,
        contactName: bid.vendor.contactName.slice(0, 120),
        contactEmail: email.success ? email.data : "",
      }),
    );
    const { proposal } = await submitProposal(db, storage, job.projectId, vendor.id, {
      source: "ai",
    });
    const slug = slugOf(item.vendorName);
    await ingestDocument(db, storage, {
      owner: { kind: "commercial", projectId: job.projectId, proposalId: proposal.id },
      fileName: `${slug}-Financial-Proposal.pdf`,
      bytes: pdf,
      maxSizeMb: deps.maxUploadMb,
    });
    await ingestDocument(db, storage, {
      owner: { kind: "technical", projectId: job.projectId, proposalId: proposal.id },
      fileName: `${slug}-Technical-Proposal.docx`,
      bytes: docx,
      maxSizeMb: deps.maxUploadMb,
    });
    item.proposalId = proposal.id;
    item.status = "done";
  }

  async function execute(job: GenJob) {
    try {
      const ctx = contextFor(job.projectId);
      const checklist = latestChecklist(job.projectId);
      // One at a time: the first bid writes the tender to the prompt cache, the next ones read it.
      for (const item of job.items) {
        try {
          await runItem(job, item, ctx, checklist);
        } catch (err) {
          item.status = "failed";
          item.error = err instanceof Error ? err.message : String(err);
        }
      }
      job.status = job.items.some((i) => i.status === "done") ? "done" : "failed";
    } catch (err) {
      job.status = "failed";
      for (const i of job.items) {
        if (i.status !== "done") {
          i.status = "failed";
          i.error ??= err instanceof Error ? err.message : String(err);
        }
      }
    }
    job.finishedAt = new Date().toISOString();
  }

  return {
    start(projectId: string, profiles: BidProfile[]): GenJob {
      const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
      if (!project) throw notFound("Project");
      if (project.status !== "open") {
        throw new ApiError(
          409,
          "not_accepting_proposals",
          "Only an open tender accepts new proposals.",
        );
      }
      if (
        !profiles.length ||
        profiles.length > 4 ||
        profiles.some((p) => !BID_PROFILES.includes(p))
      ) {
        throw new ApiError(400, "validation_error", "Choose between 1 and 4 bidder profiles.");
      }
      const running = [...jobs.values()].find(
        (j) => j.projectId === projectId && j.status === "running",
      );
      if (running) throw new ApiError(409, "job_active", "Proposals are already being generated.");
      const names = pickVendors(projectId, profiles.length);
      const job: GenJob = {
        id: newId("run").replace(/^run_/, "gen_"),
        projectId,
        mode: deps.mode,
        model: getSettings(db).aiModel,
        status: "running",
        items: profiles.map((profile, i) => ({
          profile,
          vendorName: names[i].name,
          country: names[i].country,
          status: "queued",
          error: null,
          proposalId: null,
          costUsd: 0,
        })),
        costUsd: 0,
        createdAt: new Date().toISOString(),
        finishedAt: null,
      };
      jobs.set(job.id, job);
      void execute(job);
      return job;
    },
    /** The project's most recent job (running or finished), if any. */
    latest(projectId: string): GenJob | null {
      return (
        [...jobs.values()]
          .filter((j) => j.projectId === projectId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
      );
    },
  };
}

export type Generator = ReturnType<typeof createGenerator>;
