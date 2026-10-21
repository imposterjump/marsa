"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ChevronRight, CircleAlert, Lock, Play, Sparkles, Trophy } from "lucide-react";
import { cn } from "cn";
import { CountUp } from "@/components/motion/count-up";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { useProjectContext } from "@/components/projects/project-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskPill } from "@/components/ui/status-pill";
import {
  isRunActive,
  useInvalidateRun,
  useProjectRuns,
  useRunAction,
  useRunResults,
  useRunStatus,
} from "@/hooks/use-runs";
import type { RunResultsDto, RunStatusDto } from "@/lib/api-types";
import type { RunStatus } from "@/lib/domain";
import { formatDateTime } from "@/lib/format";
import { MissionControl } from "./mission-control";
import { RunIcon, StepTimeline, VendorChips, card } from "./run-parts";
import { StartRunButton } from "./start-run-button";

const RUN_TITLE: Record<RunStatus, string> = {
  queued: "Starting the analysis…",
  running: "Analysing proposals",
  completed: "Analysis complete",
  completed_with_errors: "Analysis complete, with errors",
  failed: "Analysis failed",
  cancelled: "Analysis cancelled",
  interrupted: "Analysis interrupted",
};

/** Evaluation tab: start a run, follow it in mission control (P7.1), then see the ranking. */
export function EvaluationView() {
  const p = useProjectContext();
  const runs = useProjectRuns(p.id);

  if (p.proposalCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface/60">
        <EmptyState
          size="lg"
          art={<Lock className="size-12 text-ink-faint" strokeWidth={1.25} />}
          title="Evaluation is locked"
          description="It unlocks once at least one vendor proposal is in. Marsa then checks every proposal against the RFP and the applied standards, and compares vendors."
        />
      </div>
    );
  }
  if (runs.isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  const latest = runs.data?.[0];
  if (!latest) {
    return (
      <div className={cn(card, "border-dashed")}>
        <EmptyState
          size="lg"
          art={<Sparkles className="size-12 text-brand" strokeWidth={1.25} />}
          title="Not analysed yet"
          description={`Marsa checks all ${p.proposalCount} proposal${p.proposalCount === 1 ? "" : "s"} against the RFP and the applied standards, compares the vendors, builds a risk register for each and writes an executive summary.`}
          actions={
            p.status === "open" || p.status === "evaluated" ? (
              <StartRunButton projectId={p.id} />
            ) : (
              <p className="text-sm text-ink-muted">Publish the tender first.</p>
            )
          }
        />
      </div>
    );
  }
  return <RunView key={latest.id} runId={latest.id} />;
}

function RunView({ runId }: { runId: string }) {
  const p = useProjectContext();
  const reduce = useReducedMotion();
  const { data, isLoading } = useRunStatus(runId);
  const status = data?.run.status;
  const active = isRunActive(status);
  const finished = status === "completed" || status === "completed_with_errors";
  const results = useRunResults(runId, finished);
  const invalidate = useInvalidateRun(p.id);

  // Leaving the active states: refresh the project (status pill, locks) and the results.
  // The completion toast comes from the global RunPill (P7.3), so it shows on every page.
  const prev = useRef(status);
  useEffect(() => {
    if (prev.current && isRunActive(prev.current) && status && !isRunActive(status)) {
      void invalidate(runId);
    }
    prev.current = status;
  }, [status, runId, invalidate]);

  if (isLoading || !data) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {active ? (
        <motion.div
          key="live"
          // P7.4 curtain lift: mission control rolls up and uncovers the results.
          exit={
            reduce
              ? { opacity: 0, transition: { duration: 0.15 } }
              : {
                  clipPath: "inset(0 0 100% 0)",
                  transition: { duration: 0.7, ease: EASE_OUT_QUINT },
                }
          }
          style={{ clipPath: "inset(0 0 0% 0)" }}
        >
          <MissionControl data={data} />
        </motion.div>
      ) : (
        <motion.div
          key="done"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.55, ease: EASE_OUT_QUINT }}
          className="flex flex-col gap-6"
        >
          <RunHeader data={data} />
          <VendorChips chips={data.chips} projectId={p.id} active={false} />
          {finished && results.data && <ResultsSummary results={results.data} projectId={p.id} />}
          <StepTimeline data={data} defaultOpen={!finished || status === "completed_with_errors"} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RunHeader({ data }: { data: RunStatusDto }) {
  const p = useProjectContext();
  const action = useRunAction(p.id);
  const { run } = data;
  const failed = data.steps.filter((s) => s.status === "failed");
  const canRunAgain = p.status === "open" || p.status === "evaluated";

  const resume = async () => {
    try {
      await action.mutateAsync({ runId: run.id, action: "resume" });
      toast.success("Analysis resumed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <section aria-labelledby="run-title" className={cn(card, "relative overflow-hidden p-6")}>
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand via-brand/60 to-info/60"
      />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2
            id="run-title"
            className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight text-ink"
          >
            <RunIcon status={run.status} />
            {RUN_TITLE[run.status]}
          </h2>
          <p className="text-[13px] text-ink-muted">
            {formatDateTime(run.startedAt ?? run.createdAt)} ·{" "}
            {run.mode === "mock" ? "Demo AI (free)" : `${run.model} · $${run.costUsd.toFixed(2)}`} ·{" "}
            {run.doneSteps} of {run.totalSteps} steps finished
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {(run.status === "interrupted" || run.status === "cancelled") && (
            <Button onClick={() => void resume()} disabled={action.isPending}>
              <Play /> Resume
            </Button>
          )}
          {canRunAgain && <StartRunButton projectId={p.id} again size="default" />}
        </div>
      </div>
      {(run.status === "completed_with_errors" || run.status === "failed") && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-lg bg-partial-soft p-4 text-[13px] text-ink-2"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-partial" aria-hidden />
          <div className="flex flex-col gap-1">
            <span className="font-medium text-ink">
              {failed.length
                ? `${failed.length} step${failed.length === 1 ? "" : "s"} failed`
                : "The analysis stopped early"}
            </span>
            <span>
              {run.status === "completed_with_errors"
                ? "The results below leave out what those steps would have added. Retry them in the step list; finished steps are not re-run."
                : (run.error ?? "Retry the failed step in the step list.")}
            </span>
          </div>
        </div>
      )}
      {run.status === "interrupted" && (
        <p className="mt-4 text-[13px] text-ink-muted">
          The server restarted during the analysis. Resume continues where it stopped; finished
          steps are kept.
        </p>
      )}
    </section>
  );
}

function ResultsSummary({ results, projectId }: { results: RunResultsDto; projectId: string }) {
  const s = results.summary;
  const byProposal = new Map(results.evaluations.map((e) => [e.proposalId, e]));
  const recommended = s?.recommendedProposalId ? byProposal.get(s.recommendedProposalId) : null;
  const ranking = s?.ranking.length
    ? s.ranking
    : results.evaluations.map((e, i) => ({
        vendor: e.vendor.name,
        proposalId: e.proposalId,
        rank: i + 1,
        rationale: "",
      }));

  return (
    <section aria-labelledby="ranking-title" className={cn(card, "flex flex-col gap-5 p-6")}>
      <div className="flex flex-col gap-1">
        <h2 id="ranking-title" className="font-heading text-base font-semibold text-ink">
          Ranking
        </h2>
        <p className="text-[13px] text-ink-muted">
          {results.requirements.length} requirements checked. Scores are computed from the findings
          with your weights; the AI never sets them.
        </p>
      </div>

      {s && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-lg p-4",
            recommended ? "bg-ok-soft" : "bg-partial-soft",
          )}
        >
          <Trophy
            className={cn("mt-0.5 size-4 shrink-0", recommended ? "text-ok" : "text-partial")}
            aria-hidden
          />
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">
              {recommended
                ? `Recommended: ${recommended.vendor.name}`
                : "No vendor is recommended without conditions"}
            </span>
            <p className="leading-relaxed whitespace-pre-line text-ink-2">{s.executiveSummary}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-start text-2xs tracking-[0.06em] text-ink-muted uppercase">
              <th scope="col" className="py-2 pe-3 text-start font-semibold">
                Rank
              </th>
              <th scope="col" className="py-2 pe-3 text-start font-semibold">
                Vendor
              </th>
              <th scope="col" className="py-2 pe-3 text-end font-semibold">
                Compliance
              </th>
              <th scope="col" className="py-2 pe-3 text-end font-semibold">
                Mandatory fails
              </th>
              <th scope="col" className="py-2 pe-3 text-start font-semibold">
                Risk
              </th>
              <th scope="col" className="py-2 text-start font-semibold">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r) => {
              const e = r.proposalId ? byProposal.get(r.proposalId) : undefined;
              return (
                <tr
                  key={`${r.rank}-${r.vendor}`}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="py-3 pe-3 font-semibold text-ink tabular-nums">{r.rank}</td>
                  <td className="py-3 pe-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-ink">{e?.vendor.name ?? r.vendor}</span>
                      {r.rationale && (
                        <span className="text-xs leading-relaxed text-ink-muted">
                          {r.rationale}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pe-3 text-end font-semibold text-ink tabular-nums">
                    {e ? <CountUp value={e.scorePct} decimals={1} suffix="%" /> : "—"}
                  </td>
                  <td className="py-3 pe-3 text-end tabular-nums">
                    {e ? (
                      <span
                        className={e.mandatoryFailures ? "font-medium text-fail" : "text-ink-2"}
                      >
                        {e.mandatoryFailures}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pe-3">
                    {e?.overallRisk ? <RiskPill severity={e.overallRisk} size="sm" /> : "—"}
                  </td>
                  <td className="py-3 text-end">
                    {r.proposalId && (
                      <Button asChild variant="ghost" size="icon-sm">
                        <Link
                          href={`/projects/${projectId}/proposals/${r.proposalId}`}
                          aria-label={`Open ${r.vendor}`}
                        >
                          <ChevronRight className="rtl:rotate-180" />
                        </Link>
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {results.keyConstraints.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-2xs font-semibold tracking-[0.06em] text-ink-muted uppercase">
            Key constraints from the RFP
          </h3>
          <dl className="grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
            {results.keyConstraints.map((k) => (
              <div key={k.label} className="flex flex-col">
                <dt className="font-medium text-ink">{k.label}</dt>
                <dd className="text-ink-2">{k.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
