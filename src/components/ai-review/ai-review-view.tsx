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
import { useT } from "@/components/i18n-provider";
import { useProjectContext } from "@/components/projects/project-shell";
import { RunIcon } from "@/components/evaluation/run-parts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { reviewSummaryKey, useRunQuality } from "@/hooks/use-ai-review";
import type { RunQualityDto } from "@/lib/api-types";
import type { AiModel, RunStatus } from "@/lib/domain";
import { msg } from "@/lib/i18n/core";
import { AI_MODEL_LABEL, STEP_STATUS_LABEL } from "@/lib/labels";
import { Meter, StackedBar, StatTile, severityOf } from "./charts";
import { ReviewPanel } from "./review-panel";

const card = "rounded-xl border border-border bg-surface shadow-xs";

const STATUS_TEXT: Record<RunStatus, string> = {
  queued: msg("Queued"),
  running: msg("Running"),
  completed: msg("Succeeded"),
  completed_with_errors: msg("Partly succeeded"),
  failed: msg("Failed"),
  cancelled: msg("Cancelled"),
  interrupted: msg("Interrupted"),
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
  const t = useT();
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
            <Gauge className="size-3.5" aria-hidden /> {t("Confidence score")}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={t("How the score is calculated")}
                  className="rounded-full text-ink-faint outline-none hover:text-ink-muted focus-visible:ring-3 focus-visible:ring-ring/25"
                >
                  <HelpCircle className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {t(
                  "35 % AI confidence + 35 % evidence verified + 15 % coverage + 15 % completion. Computed from the stored results; no AI call.",
                )}
              </TooltipContent>
            </Tooltip>
          </h3>
          <span className="flex items-baseline gap-2">
            <span className="font-heading text-5xl font-semibold tracking-tight text-ink tabular-nums">
              {q.confidence.score}
            </span>
            <span className="text-sm font-medium text-ink-2">
              / 100 · {t.auto(q.confidence.label)}
            </span>
          </span>
          <div className="w-56">
            <Meter
              value={q.confidence.score}
              label={t("Confidence score")}
              severity={severityOf(q.confidence.score)}
            />
          </div>
        </div>
        <dl className="grid flex-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {[
            [
              t("AI confidence"),
              parts.aiConfidence,
              t("How sure the AI said it was, per finding (high / medium / low)"),
            ],
            [
              t("Evidence verified"),
              parts.evidence,
              t("Quotes found in the cited document on the cited page"),
            ],
            [t("Coverage"), parts.coverage, t("Requirements the AI answered itself (not skipped)")],
            [t("Completion"), parts.completion, t("Vendors analysed and the summary written")],
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
          label={t("Files scanned")}
          value={files.total}
          detail={t.plural(
            files.pages,
            "{n} pages · RFP, standards and proposals",
            "{n} pages · RFP, standards and proposals",
          )}
        />
        <StatTile
          icon={FileCheck2}
          label={t("Processed correctly")}
          value={`${files.processed} / ${files.total}`}
          detail={
            files.skipped
              ? t.plural(files.skipped, "{n} unreadable, skipped", "{n} unreadable, skipped")
              : t("No file skipped")
          }
        />
        <StatTile
          icon={Repeat}
          label={t("AI calls")}
          value={steps.attempts}
          detail={
            steps.retries
              ? t.plural(
                  steps.retries,
                  "{n} retry · {steps} steps",
                  "{n} retries · {steps} steps",
                  {
                    steps: steps.total,
                  },
                )
              : t("No retries · {steps} steps", { steps: steps.total })
          }
        />
        <StatTile
          icon={Activity}
          label={t("Outcome")}
          value={
            <span className="flex items-center gap-2 text-xl">
              <RunIcon status={q.status} />
              {t(STATUS_TEXT[q.status])}
            </span>
          }
          detail={[
            t("{n} done", { n: steps.done }),
            steps.failed ? t("{n} failed", { n: steps.failed }) : null,
            steps.skipped ? t("{n} skipped", { n: steps.skipped }) : null,
            steps.cancelled ? t("{n} cancelled", { n: steps.cancelled }) : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
        <StatTile
          icon={Timer}
          label={t("Time")}
          value={q.durationMs ? t.duration(q.durationMs / 1000) : "—"}
          detail={
            q.mode === "mock"
              ? t("Demo AI")
              : `${modelName(q.model)}${q.cacheHitPct != null ? ` · ${t("{pct} % from cache", { pct: q.cacheHitPct })}` : ""}`
          }
        />
      </div>

      {/* Distributions */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section aria-labelledby="dist-status" className={cn(card, "flex flex-col gap-4 p-5")}>
          <h3 id="dist-status" className="text-sm font-semibold text-ink">
            {t("Findings by status")}{" "}
            <span className="font-normal text-ink-muted">({findings.total})</span>
          </h3>
          <StackedBar
            label={t("Findings by status")}
            segments={[
              {
                key: "c",
                label: t("Compliant"),
                value: findings.byStatus.compliant,
                fill: "bg-ok",
                icon: CircleCheck,
              },
              {
                key: "p",
                label: t("Partial"),
                value: findings.byStatus.partial,
                fill: "bg-partial",
                icon: Contrast,
              },
              {
                key: "n",
                label: t("Non-compliant"),
                value: findings.byStatus.non_compliant,
                fill: "bg-fail",
                icon: CircleX,
              },
              {
                key: "m",
                label: t("Not addressed"),
                value: findings.byStatus.not_addressed,
                fill: "bg-missing",
                icon: CircleMinus,
              },
            ]}
          />
          {findings.notAssessed > 0 && (
            <p className="text-xs text-ink-muted">
              {t.plural(
                findings.notAssessed,
                "{n} requirement was skipped by the AI and counted as not addressed.",
                "{n} requirements were skipped by the AI and counted as not addressed.",
              )}
            </p>
          )}
        </section>
        <section aria-labelledby="dist-conf" className={cn(card, "flex flex-col gap-4 p-5")}>
          <h3 id="dist-conf" className="text-sm font-semibold text-ink">
            {t("AI’s own confidence")}
          </h3>
          <StackedBar
            label={t("AI confidence per finding")}
            segments={[
              // Green, blue, yellow (user, 2026-10-25: the red shades were too close to tell apart).
              { key: "h", label: t("High"), value: findings.byConfidence.high, fill: "bg-ok-fill" },
              {
                key: "m",
                label: t("Medium"),
                value: findings.byConfidence.medium,
                fill: "bg-chart-1",
              },
              {
                key: "l",
                label: t("Low"),
                value: findings.byConfidence.low,
                fill: "bg-partial-fill",
              },
            ]}
          />
        </section>
        <section aria-labelledby="dist-evidence" className={cn(card, "flex flex-col gap-4 p-5")}>
          <h3 id="dist-evidence" className="text-sm font-semibold text-ink">
            {t("Evidence check")}{" "}
            <span className="font-normal text-ink-muted">
              ({t.plural(evidence.quoted, "{n} quotes", "{n} quotes")})
            </span>
          </h3>
          <StackedBar
            label={t("Evidence check")}
            segments={[
              {
                key: "v",
                label: t("Found on cited page"),
                value: evidence.verified,
                fill: "bg-ok",
                icon: CircleCheck,
              },
              {
                key: "o",
                label: t("On another page"),
                value: evidence.otherPage,
                fill: "bg-partial",
                icon: Contrast,
              },
              {
                key: "n",
                label: t("Not found"),
                value: evidence.notFound,
                fill: "bg-fail",
                icon: CircleX,
              },
              {
                key: "u",
                label: t("Not checkable"),
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
          {t("Per vendor")}
        </h3>
        <VendorTable q={q} />
      </section>

      <details className={cn(card, "group")}>
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
          {t("Files sent to the AI")}{" "}
          <span className="font-normal text-ink-muted">({files.total})</span>
        </summary>
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="border-b border-border text-2xs tracking-[0.06em] text-ink-muted uppercase">
                <th scope="col" className="px-5 py-2 text-start font-semibold">
                  {t("File")}
                </th>
                <th scope="col" className="px-5 py-2 text-start font-semibold">
                  {t("From")}
                </th>
                <th scope="col" className="px-5 py-2 text-end font-semibold">
                  {t("Pages")}
                </th>
                <th scope="col" className="px-5 py-2 text-start font-semibold">
                  {t("Sent as")}
                </th>
                <th scope="col" className="px-5 py-2 text-start font-semibold">
                  {t("Processed")}
                </th>
              </tr>
            </thead>
            <tbody>
              {files.list.map((f) => (
                <tr key={f.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-2.5 text-ink" dir="auto">
                    {f.name}
                  </td>
                  <td className="px-5 py-2.5 text-ink-2">
                    {f.group === "rfp" ? t("RFP") : f.owner}
                  </td>
                  <td className="px-5 py-2.5 text-end text-ink-2 tabular-nums">{f.pages ?? "—"}</td>
                  <td className="px-5 py-2.5 text-ink-2">
                    {f.sentAs === "pdf"
                      ? t("PDF (pages)")
                      : f.sentAs === "image"
                        ? t("Image")
                        : f.sentAs === "text"
                          ? t("Extracted text")
                          : t("Not readable")}
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="flex items-center gap-1.5 text-ink-2">
                      {f.used ? (
                        <CircleCheck className="size-4 text-ok" aria-hidden />
                      ) : (
                        <CircleMinus className="size-4 text-missing" aria-hidden />
                      )}
                      {f.used ? t("Yes") : t("No")}
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
  const t = useT();
  return (
    <table className="mt-2 w-full min-w-[760px] text-[13px]">
      <thead>
        <tr className="border-b border-border text-2xs tracking-[0.06em] text-ink-muted uppercase">
          <th scope="col" className="px-5 py-2 text-start font-semibold">
            {t("Vendor")}
          </th>
          <th scope="col" className="px-5 py-2 text-end font-semibold">
            {t("Files / pages")}
          </th>
          <th scope="col" className="px-5 py-2 text-end font-semibold">
            {t("Findings")}
          </th>
          <th scope="col" className="px-5 py-2 text-end font-semibold">
            {t("Compliance")}
          </th>
          <th scope="col" className="px-5 py-2 text-end font-semibold">
            {t("Evidence verified")}
          </th>
          <th scope="col" className="px-5 py-2 text-end font-semibold">
            {t("AI confidence")}
          </th>
          <th scope="col" className="px-5 py-2 text-start font-semibold">
            {t("Analysis step")}
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
                    label={t("{vendor} evidence verified", { vendor: v.vendor })}
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
              {v.analysisStatus ? t(STEP_STATUS_LABEL[v.analysisStatus]) : "—"}
              {v.analysisAttempts > 1
                ? ` · ${t.plural(v.analysisAttempts, "{n} attempts", "{n} attempts")}`
                : ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
