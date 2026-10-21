"use client";

import { ArrowRight, CircleAlert, Info, Sparkles } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/status-pill";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettings } from "@/hooks/use-settings";
import type { ProjectDetailDto, ProposalSummaryDto } from "@/lib/api-types";
import { DEFAULT_AI_MODEL, DEFAULT_CONCURRENCY } from "@/lib/domain";
import { estimateCostUsd, estimateSeconds, formatDuration, planRun } from "@/lib/plan";

const MODEL_LABEL = {
  "claude-opus-5-5": "Claude Opus 5.5",
  "claude-sonnet-5-5": "Claude Sonnet 5.5",
} as const;

/**
 * PRD FR-5.3: the "Analyse & process" action bar under the proposals table. Shows what the run
 * will cover (proposals, standards, T = 3N + 2 steps) with a rough time and cost estimate.
 * The button is wired to the pipeline in Phase 6.
 */
export function AnalysePanel({
  project,
  proposals,
}: {
  project: ProjectDetailDto;
  proposals: ProposalSummaryDto[];
}) {
  const { data: settings } = useSettings();
  const n = proposals.length;
  const plan = planRun(n);
  const mode = settings?.runtime.aiMode ?? "mock";
  const model = settings?.aiModel ?? DEFAULT_AI_MODEL;
  const seconds = estimateSeconds(n, {
    concurrency: settings?.concurrency ?? DEFAULT_CONCURRENCY,
    mode,
  });
  const sharedPages =
    project.rfpDocuments.reduce((s, d) => s + (d.pageCount ?? 4), 0) +
    project.standards.reduce((s, x) => s + x.documentPages, 0);
  const cost =
    mode === "live"
      ? estimateCostUsd({
          model,
          sharedPages,
          vendorPages: proposals.map((p) => p.documentCounts.pages || 10),
        })
      : 0;
  const rules = project.standards.reduce((s, x) => s + x.rulesCount, 0);
  const incomplete = proposals.filter(
    (p) => !p.documentCounts.commercial || !p.documentCounts.technical,
  );

  const notes: { tone: "warn" | "info"; text: string }[] = [];
  if (n === 1)
    notes.push({
      tone: "warn",
      text: "Only one proposal: the vendor comparison step will be skipped.",
    });
  if (incomplete.length) {
    notes.push({
      tone: "warn",
      text: `${incomplete.map((p) => p.vendor.name).join(", ")} ${incomplete.length === 1 ? "is" : "are"} missing a commercial or technical file.`,
    });
  }
  if (!project.standards.length) {
    notes.push({
      tone: "info",
      text: "No standards applied: proposals are checked against the RFP only.",
    });
  }

  const steps: [string, number][] = [
    ["Checklist", plan.phases.checklist],
    ["Analyse", plan.phases.analyze],
    ["Compare", plan.phases.compare],
    ["Risk", plan.phases.risk],
    ["Summary", plan.phases.summary],
  ];

  return (
    <section
      aria-labelledby="analyse-title"
      className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-xs"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand via-brand/60 to-info/60"
      />
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3
              id="analyse-title"
              className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight text-ink"
            >
              <Sparkles className="size-4 text-brand" aria-hidden />
              Analyse &amp; process
            </h3>
            <p className="max-w-2xl text-[13px] leading-relaxed text-ink-muted">
              {n === 0
                ? "Once vendors have submitted, Marsa checks every proposal against the RFP and the applied standards, compares vendors and builds a risk register."
                : `Marsa will check ${n === 1 ? "the proposal" : `all ${n} proposals`} against the RFP${
                    project.standards.length
                      ? ` and ${project.standards.length} standard${project.standards.length === 1 ? "" : "s"} (${rules} rules)`
                      : ""
                  }, ${n > 1 ? "compare each vendor with the others, " : ""}assess risks and write an executive summary.`}
            </p>
          </div>

          {n > 0 && (
            <dl className="flex flex-wrap gap-x-8 gap-y-3 text-[13px]">
              <Stat label="Proposals" value={String(n)} />
              <Stat
                label="Standards"
                value={
                  project.standards.length ? (
                    <span className="flex flex-wrap gap-1.5">
                      {project.standards.map((s) => (
                        <Pill key={s.id} tone="neutral" size="sm">
                          <span className="font-mono">{s.code}</span>
                        </Pill>
                      ))}
                    </span>
                  ) : (
                    "None"
                  )
                }
              />
              <Stat
                label="Steps"
                value={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        tabIndex={0}
                        className="cursor-help underline decoration-dotted underline-offset-4"
                      >
                        {plan.total} (3 × {n} + 2)
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      1 checklist, then per vendor: analyse, compare and risk, then 1 summary.
                    </TooltipContent>
                  </Tooltip>
                }
              />
              <Stat label="Time" value={`≈ ${formatDuration(seconds)}`} />
              <Stat
                label={mode === "live" ? `Cost · ${MODEL_LABEL[model]}` : "Cost"}
                value={mode === "live" ? `≈ $${cost.toFixed(2)}` : "Free (demo AI)"}
              />
            </dl>
          )}

          {n > 0 && (
            <ol
              aria-label="Pipeline"
              className="flex flex-wrap items-center gap-1.5 text-xs text-ink-2"
            >
              {steps.map(([label, count], i) => (
                <li key={label} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 tabular-nums",
                      label === "Compare" && plan.skipped
                        ? "border-dashed border-border text-ink-faint line-through"
                        : "border-border bg-surface-muted/60",
                    )}
                  >
                    {count} × {label}
                  </span>
                  {i < steps.length - 1 && (
                    <ArrowRight className="size-3 text-ink-faint rtl:rotate-180" aria-hidden />
                  )}
                </li>
              ))}
            </ol>
          )}

          {notes.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {notes.map((x) => (
                <li
                  key={x.text}
                  className={cn(
                    "flex items-start gap-2 text-xs",
                    x.tone === "warn" ? "text-partial" : "text-ink-muted",
                  )}
                >
                  {x.tone === "warn" ? (
                    <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                  ) : (
                    <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                  )}
                  {x.text}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 lg:items-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-flex rounded-lg">
                <Button size="lg" disabled className="w-full lg:w-auto">
                  <Sparkles /> Analyse &amp; process
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {n === 0 ? "Needs at least one proposal." : "The AI pipeline is wired in Phase 6."}
            </TooltipContent>
          </Tooltip>
          <span className="text-center text-2xs text-ink-faint lg:text-end">
            {n === 0 ? "Needs at least one proposal" : "Estimates are rough · Phase 6"}
          </span>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-2xs font-semibold tracking-[0.06em] text-ink-muted uppercase">{label}</dt>
      <dd className="font-medium text-ink tabular-nums">{value}</dd>
    </div>
  );
}
