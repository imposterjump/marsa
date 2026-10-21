"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CircleCheck, CircleX, Loader2, Circle, Wand2 } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGenJob, useInvalidateProposals, useStartGenJob } from "@/hooks/use-generate";
import { useSettings } from "@/hooks/use-settings";
import type { BidProfileDto, GenJobDto, ProjectDetailDto } from "@/lib/api-types";
import { DEFAULT_AI_MODEL } from "@/lib/domain";
import { MODEL_PRICES, TOKENS_PER_PAGE } from "@/lib/plan";

const PROFILES: { id: BidProfileDto; name: string; blurb: string }[] = [
  {
    id: "strong",
    name: "Strong",
    blurb: "Experienced bidder, complete and compliant, premium price",
  },
  {
    id: "budget_partial",
    name: "Budget",
    blurb: "Lower price, meets most requirements, some lower specs",
  },
  { id: "risky_cloud", name: "Risky", blurb: "Hosted services and contract terms of its own" },
  { id: "incomplete", name: "Incomplete", blurb: "Rushed submission that leaves items out" },
];

const ITEM_STATUS: Record<GenJobDto["items"][number]["status"], string> = {
  queued: "Queued",
  writing: "Writing the bid…",
  rendering: "Rendering the DOCX and PDF…",
  done: "Submitted",
  failed: "Failed",
};

/** Rough cost: the tender is cached once, then each bid adds its own output (live AI only). */
function estimateUsd(project: ProjectDetailDto, n: number, model: keyof typeof MODEL_PRICES) {
  const price = MODEL_PRICES[model];
  const pages =
    project.rfpDocuments.reduce((s, d) => s + (d.pageCount ?? 4), 0) +
    project.standards.reduce((s, x) => s + x.documentPages, 0);
  const shared = pages * TOKENS_PER_PAGE + 6_000;
  const usd =
    (shared * price.cacheWrite +
      shared * (n - 1) * price.cacheRead +
      n * 3_000 * price.input +
      n * 12_000 * price.output) /
    1e6;
  return Math.round(usd * 100) / 100;
}

/**
 * PRD FR-4.3 / P7.5: generate realistic vendor proposals from the RFP. One bid per chosen profile,
 * rendered as a technical DOCX and a financial PDF and submitted as an "AI" proposal.
 */
export function GenerateProposalsDialog({
  project,
  open,
  onOpenChange,
}: {
  project: ProjectDetailDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: settings } = useSettings();
  const [chosen, setChosen] = useState<BidProfileDto[]>(["strong", "budget_partial"]);
  const start = useStartGenJob(project.id);
  const { data: job } = useGenJob(project.id, open);
  const invalidate = useInvalidateProposals(project.id);
  const live = settings?.runtime.aiMode === "live";
  const model = settings?.aiModel ?? DEFAULT_AI_MODEL;
  const running = job?.status === "running";
  const showJob = job && (running || start.isSuccess);

  // Each finished bid shows up in the proposals table right away.
  const doneCount = job?.items.filter((i) => i.status === "done").length ?? 0;
  const prevDone = useRef(doneCount);
  useEffect(() => {
    if (doneCount !== prevDone.current) void invalidate();
    prevDone.current = doneCount;
  }, [doneCount, invalidate]);

  const toggle = (id: BidProfileDto, on: boolean) =>
    setChosen((c) => (on ? [...c, id] : c.filter((x) => x !== id)));

  const generate = async () => {
    try {
      await start.mutateAsync(chosen);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start generating.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent scrollable className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate proposals with AI</DialogTitle>
          <DialogDescription>
            {live
              ? "Claude reads the RFP and writes a complete bid per profile: a technical proposal (DOCX) and a financial proposal (PDF), submitted like any vendor's."
              : "Demo AI: bids are built from the RFP text as templates, at no cost. Switch to live AI for bids written by Claude."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {showJob ? (
            <JobProgress job={job} />
          ) : (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-ink">
                Bidder profiles (one proposal each)
              </legend>
              {PROFILES.map((p) => {
                const id = `gen-${p.id}`;
                return (
                  <label
                    key={p.id}
                    htmlFor={id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted/60 has-[[data-state=checked]]:border-brand/50 has-[[data-state=checked]]:bg-brand-soft/40"
                  >
                    <Checkbox
                      id={id}
                      checked={chosen.includes(p.id)}
                      onCheckedChange={(v) => toggle(p.id, v === true)}
                      className="mt-0.5"
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-ink">{p.name}</span>
                      <span className="text-xs text-ink-muted">{p.blurb}</span>
                    </span>
                  </label>
                );
              })}
              <p className="mt-2 text-xs text-ink-muted">
                {chosen.length} proposal{chosen.length === 1 ? "" : "s"} ·{" "}
                {live
                  ? `≈ $${estimateUsd(project, Math.max(1, chosen.length), model).toFixed(2)} with ${model} (rough estimate)`
                  : "free (demo AI)"}
              </p>
            </fieldset>
          )}
        </DialogBody>
        <DialogFooter>
          {showJob ? (
            <Button
              variant={running ? "secondary" : "default"}
              onClick={() => {
                start.reset();
                onOpenChange(false);
              }}
            >
              {running ? "Hide (keeps running)" : "Done"}
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => void generate()} disabled={!chosen.length || start.isPending}>
                <Wand2 /> Generate {chosen.length || ""}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function JobProgress({ job }: { job: GenJobDto }) {
  const done = job.items.filter((i) => i.status === "done" || i.status === "failed").length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[13px]">
          <span className="text-ink-2" aria-live="polite">
            {job.status === "running"
              ? `Generating ${done + 1 > job.items.length ? job.items.length : done + 1} of ${job.items.length}`
              : job.status === "done"
                ? "Finished"
                : "Generation failed"}
          </span>
          <span className="text-ink-muted tabular-nums">
            {job.mode === "live" ? `$${job.costUsd.toFixed(2)}` : "free"}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Generation progress"
          aria-valuemin={0}
          aria-valuemax={job.items.length}
          aria-valuenow={done}
          className="h-1.5 overflow-hidden rounded-full bg-surface-muted"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${(done / job.items.length) * 100}%` }}
          />
        </div>
      </div>
      <ul className="flex flex-col divide-y divide-border/60">
        {job.items.map((i) => {
          const Icon =
            i.status === "done"
              ? CircleCheck
              : i.status === "failed"
                ? CircleX
                : i.status === "queued"
                  ? Circle
                  : Loader2;
          return (
            <li key={i.vendorName} className="flex items-start gap-3 py-2.5 text-[13px]">
              <Icon
                aria-hidden
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  i.status === "done"
                    ? "text-ok"
                    : i.status === "failed"
                      ? "text-fail"
                      : i.status === "queued"
                        ? "text-ink-faint"
                        : "text-brand motion-safe:animate-spin",
                )}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium text-ink">
                  {i.vendorName}{" "}
                  <span className="font-normal text-ink-muted">
                    · {PROFILES.find((p) => p.id === i.profile)?.name}
                  </span>
                </span>
                <span className={i.status === "failed" ? "text-fail" : "text-ink-muted"}>
                  {i.status === "failed" && i.error ? i.error : ITEM_STATUS[i.status]}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
