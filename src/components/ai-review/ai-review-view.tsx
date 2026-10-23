"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CircleCheck,
  CircleMinus,
  CircleX,
  Contrast,
  FileStack,
  FileCheck2,
  Gauge,
  HelpCircle,
  Repeat,
  Timer,
} from "lucide-react";
import { cn } from "cn";
import { useProjectContext } from "@/components/projects/project-shell";
import { RunIcon } from "@/components/evaluation/run-parts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { reviewSummaryKey, useRunQuality } from "@/hooks/use-ai-review";
import type { RunQualityDto } from "@/lib/api-types";
import type { AiModel, RunStatus } from "@/lib/domain";
import { AI_MODEL_LABEL, STEP_STATUS_LABEL } from "@/lib/labels";
import { formatDuration } from "@/lib/plan";
import { Meter, StackedBar, StatTile, severityOf } from "./charts";
import { ReviewPanel } from "./review-panel";

const card = "rounded-xl border border-border bg-surface shadow-xs";

const STATUS_TEXT: Record<RunStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Succeeded",
  completed_with_errors: "Partly succeeded",
  failed: "Failed",
  cancelled: "Cancelled",
  interrupted: "Interrupted",
};

const modelName = (m: string) => AI_MODEL_LABEL[m as AiModel] ?? m;

/** One run's report and the human rating: the AI quality tab of the analysis results page (P8). */
export function RunQuality({ runId }: { runId: string }) {
  const p = useProjectContext();
  return (
    <div className="flex flex-col gap-6">
      <RunReport runId={runId} needsRefresh />
      <ReviewPanel projectId={p.id} runId={runId} />
    </div>
  );
}

function RunReport({ runId, needsRefresh }: { runId: string; needsRefresh: boolean }) {
  const { data: q, isLoading } = useRunQuality(runId);
  const qc = useQueryClient();
  const p = useProjectContext();
  // Older runs get their metrics on first view: refresh the run list so its score shows too.
  useEffect(() => {
    if (q && needsRefresh) void qc.invalidateQueries({ queryKey: reviewSummaryKey(p.id) });
  }, [q, needsRefresh, qc, p.id]);
  if (isLoading || !q) return <Skeleton className="h-96 w-full rounded-xl" />;
  const { files, steps, findings, evidence } = q;
  const parts = q.confidence.parts;

  return (
    <div className="flex flex-col gap-5">
      {/* Hero: the one number this view leads with */}
      <section
        aria-labelledby="conf-title"
        className={cn(card, "flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:gap-10")}
      >
        <div className="flex shrink-0 flex-col gap-1">
          <h3 id="conf-title" className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Gauge className="size-3.5" aria-hidden /> Confidence score
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="How the score is calculated"
                  className="rounded-full text-ink-faint outline-none hover:text-ink-muted focus-visible:ring-3 focus-visible:ring-ring/25"
                >
                  <HelpCircle className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                35 % AI confidence + 35 % evidence verified + 15 % coverage + 15 % completion.
                Computed from the stored results; no AI call.
              </TooltipContent>
            </Tooltip>
          </h3>
          <span className="flex items-baseline gap-2">
            <span className="font-heading text-5xl font-semibold tracking-tight text-ink tabular-nums">
              {q.confidence.score}
            </span>
            <span className="text-sm font-medium text-ink-2">/ 100 · {q.confidence.label}</span>
          </span>
          <div className="w-56">
            <Meter
              value={q.confidence.score}
              label="Confidence score"
              severity={severityOf(q.confidence.score)}
            />
          </div>
        </div>
        <dl className="grid flex-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {[
            [
              "AI confidence",
              parts.aiConfidence,
              "How sure the AI said it was, per finding (high / medium / low)",
            ],
            [
              "Evidence verified",
              parts.evidence,
              "Quotes found in the cited document on the cited page",
            ],
            ["Coverage", parts.coverage, "Requirements the AI answered itself (not skipped)"],
            ["Completion", parts.completion, "Vendors analysed and the summary written"],
          ].map(([label, value, hint]) => (
            <div key={label as string} className="flex flex-col gap-1.5">
              <dt className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="font-medium text-ink">{label}</span>
                <span className="text-ink tabular-nums">{value} %</span>
              </dt>
              <dd className="flex flex-col gap-1">
                <Meter
                  value={value as number}
                  label={label as string}
                  severity={severityOf(value as number)}
                  size="sm"
                />
                <span className="text-xs text-ink-muted">{hint}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          icon={FileStack}
          label="Files scanned"
          value={files.total}
          detail={`${files.pages} pages · RFP, standards and proposals`}
        />
        <StatTile
          icon={FileCheck2}
          label="Processed correctly"
          value={`${files.processed} / ${files.total}`}
          detail={files.skipped ? `${files.skipped} unreadable, skipped` : "No file skipped"}
        />
        <StatTile
          icon={Repeat}
          label="AI calls"
          value={steps.attempts}
          detail={
            steps.retries
              ? `${steps.retries} retr${steps.retries === 1 ? "y" : "ies"} · ${steps.total} steps`
              : `No retries · ${steps.total} steps`
          }
        />
        <StatTile
          icon={Activity}
          label="Outcome"
          value={
            <span className="flex items-center gap-2 text-xl">
              <RunIcon status={q.status} />
              {STATUS_TEXT[q.status]}
            </span>
          }
          detail={`${steps.done} done${steps.failed ? ` · ${steps.failed} failed` : ""}${steps.skipped ? ` · ${steps.skipped} skipped` : ""}${steps.cancelled ? ` · ${steps.cancelled} cancelled` : ""}`}
        />
        <StatTile
          icon={Timer}
          label={q.mode === "mock" ? "Time" : "Cost and time"}
          value={
            q.mode === "mock"
              ? q.durationMs
                ? formatDuration(q.durationMs / 1000)
                : "—"
              : `$${q.costUsd.toFixed(2)}`
          }
          detail={
            q.mode === "mock"
              ? "Demo AI (free)"
              : `${q.durationMs ? formatDuration(q.durationMs / 1000) : "—"} · ${modelName(q.model)}${q.cacheHitPct != null ? ` · ${q.cacheHitPct} % from cache` : ""}`
          }
        />
      </div>

      {/* Distributions */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section aria-labelledby="dist-status" className={cn(card, "flex flex-col gap-4 p-5")}>
          <h3 id="dist-status" className="text-sm font-semibold text-ink">
            Findings by status{" "}
            <span className="font-normal text-ink-muted">({findings.total})</span>
          </h3>
          <StackedBar
            label="Findings by status"
            segments={[
              {
                key: "c",
                label: "Compliant",
                value: findings.byStatus.compliant,
                fill: "bg-ok",
                icon: CircleCheck,
              },
              {
                key: "p",
                label: "Partial",
                value: findings.byStatus.partial,
                fill: "bg-partial",
                icon: Contrast,
              },
              {
                key: "n",
                label: "Non-compliant",
                value: findings.byStatus.non_compliant,
                fill: "bg-fail",
                icon: CircleX,
              },
              {
                key: "m",
                label: "Not addressed",
                value: findings.byStatus.not_addressed,
                fill: "bg-missing",
                icon: CircleMinus,
              },
            ]}
          />
          {findings.notAssessed > 0 && (
            <p className="text-xs text-ink-muted">
              {findings.notAssessed} requirement{findings.notAssessed === 1 ? " was" : "s were"}{" "}
              skipped by the AI and counted as not addressed.
            </p>
          )}
        </section>
        <section aria-labelledby="dist-conf" className={cn(card, "flex flex-col gap-4 p-5")}>
          <h3 id="dist-conf" className="text-sm font-semibold text-ink">
            AI’s own confidence
          </h3>
          <StackedBar
            label="AI confidence per finding"
            segments={[
              { key: "h", label: "High", value: findings.byConfidence.high, fill: "bg-brand" },
              {
                key: "m",
                label: "Medium",
                value: findings.byConfidence.medium,
                fill: "bg-brand/55",
              },
              { key: "l", label: "Low", value: findings.byConfidence.low, fill: "bg-brand/25" },
            ]}
          />
        </section>
        <section aria-labelledby="dist-evidence" className={cn(card, "flex flex-col gap-4 p-5")}>
          <h3 id="dist-evidence" className="text-sm font-semibold text-ink">
            Evidence check{" "}
            <span className="font-normal text-ink-muted">({evidence.quoted} quotes)</span>
          </h3>
          <StackedBar
            label="Evidence check"
            segments={[
              {
                key: "v",
                label: "Found on cited page",
                value: evidence.verified,
                fill: "bg-ok",
                icon: CircleCheck,
              },
              {
                key: "o",
                label: "On another page",
                value: evidence.otherPage,
                fill: "bg-partial",
                icon: Contrast,
              },
              {
                key: "n",
                label: "Not found",
                value: evidence.notFound,
                fill: "bg-fail",
                icon: CircleX,
              },
              {
                key: "u",
                label: "Not checkable",
                value: evidence.unchecked,
                fill: "bg-missing",
                icon: CircleMinus,
              },
            ]}
          />
        </section>
      </div>

      {/* Table view per vendor */}
      <section aria-labelledby="vendors-title" className={cn(card, "overflow-x-auto")}>
        <h3 id="vendors-title" className="px-5 pt-4 text-sm font-semibold text-ink">
          Per vendor
        </h3>
        <VendorTable q={q} />
      </section>

      <details className={cn(card, "group")}>
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
          Files sent to the AI <span className="font-normal text-ink-muted">({files.total})</span>
        </summary>
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="border-b border-border text-2xs tracking-[0.06em] text-ink-muted uppercase">
                <th scope="col" className="px-5 py-2 text-start font-semibold">
                  File
                </th>
                <th scope="col" className="px-5 py-2 text-start font-semibold">
                  From
                </th>
                <th scope="col" className="px-5 py-2 text-end font-semibold">
                  Pages
                </th>
                <th scope="col" className="px-5 py-2 text-start font-semibold">
                  Sent as
                </th>
                <th scope="col" className="px-5 py-2 text-start font-semibold">
                  Processed
                </th>
              </tr>
            </thead>
            <tbody>
              {files.list.map((f) => (
                <tr key={f.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-2.5 text-ink" dir="auto">
                    {f.name}
                  </td>
                  <td className="px-5 py-2.5 text-ink-2">{f.group === "rfp" ? "RFP" : f.owner}</td>
                  <td className="px-5 py-2.5 text-end text-ink-2 tabular-nums">{f.pages ?? "—"}</td>
                  <td className="px-5 py-2.5 text-ink-2">
                    {f.sentAs === "pdf"
                      ? "PDF (pages)"
                      : f.sentAs === "image"
                        ? "Image"
                        : f.sentAs === "text"
                          ? "Extracted text"
                          : "Not readable"}
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="flex items-center gap-1.5 text-ink-2">
                      {f.used ? (
                        <CircleCheck className="size-4 text-ok" aria-hidden />
                      ) : (
                        <CircleMinus className="size-4 text-missing" aria-hidden />
                      )}
                      {f.used ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function VendorTable({ q }: { q: RunQualityDto }) {
  return (
    <table className="mt-2 w-full min-w-[760px] text-[13px]">
      <thead>
        <tr className="border-b border-border text-2xs tracking-[0.06em] text-ink-muted uppercase">
          <th scope="col" className="px-5 py-2 text-start font-semibold">
            Vendor
          </th>
          <th scope="col" className="px-5 py-2 text-end font-semibold">
            Files / pages
          </th>
          <th scope="col" className="px-5 py-2 text-end font-semibold">
            Findings
          </th>
          <th scope="col" className="px-5 py-2 text-end font-semibold">
            Compliance
          </th>
          <th scope="col" className="px-5 py-2 text-end font-semibold">
            Evidence verified
          </th>
          <th scope="col" className="px-5 py-2 text-end font-semibold">
            AI confidence
          </th>
          <th scope="col" className="px-5 py-2 text-start font-semibold">
            Analysis step
          </th>
        </tr>
      </thead>
      <tbody>
        {q.vendors.map((v) => (
          <tr key={v.proposalId} className="border-b border-border/60 last:border-0">
            <td className="px-5 py-3 font-medium text-ink" dir="auto">
              {v.vendor}
            </td>
            <td className="px-5 py-3 text-end text-ink-2 tabular-nums">
              {v.files} / {v.pages}
            </td>
            <td className="px-5 py-3 text-end text-ink-2 tabular-nums">{v.findings}</td>
            <td className="px-5 py-3 text-end text-ink tabular-nums">
              {v.scorePct != null ? `${v.scorePct} %` : "—"}
            </td>
            <td className="px-5 py-3 text-end tabular-nums">
              {v.evidenceVerifiedPct != null ? (
                <span className="inline-flex w-24 flex-col items-end gap-1">
                  <span className="text-ink">{v.evidenceVerifiedPct} %</span>
                  <Meter
                    value={v.evidenceVerifiedPct}
                    label={`${v.vendor} evidence verified`}
                    severity={severityOf(v.evidenceVerifiedPct)}
                    size="sm"
                  />
                </span>
              ) : (
                "—"
              )}
            </td>
            <td className="px-5 py-3 text-end text-ink tabular-nums">
              {v.aiConfidencePct != null ? `${v.aiConfidencePct} %` : "—"}
            </td>
            <td className="px-5 py-3 text-ink-2">
              {v.analysisStatus ? STEP_STATUS_LABEL[v.analysisStatus] : "—"}
              {v.analysisAttempts > 1 ? ` · ${v.analysisAttempts} attempts` : ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
