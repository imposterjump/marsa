"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { Square } from "lucide-react";
import { cn } from "cn";
import { DepthBackdrop } from "@/components/motion/depth-backdrop";
import { MaskedText } from "@/components/motion/masked-text";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { ScrambleText } from "@/components/motion/scramble-text";
import { useProjectContext } from "@/components/projects/project-shell";
import { Button } from "@/components/ui/button";
import { useRunAction } from "@/hooks/use-runs";
import type { RunStatusDto } from "@/lib/api-types";
import { RUN_PHASES, type RunPhase } from "@/lib/domain";
import { RUN_PHASE_LABEL } from "@/lib/labels";
import { formatDuration } from "@/lib/plan";
import { StepTimeline, VendorChips } from "./run-parts";

/** "2:41" (or "1:02:41"). */
export function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

type PhaseState = "done" | "active" | "pending" | "skipped";

export function phaseStates(steps: RunStatusDto["steps"]): Record<RunPhase, PhaseState> {
  const out = {} as Record<RunPhase, PhaseState>;
  for (const phase of RUN_PHASES) {
    const s = steps.filter((x) => x.phase === phase);
    const finished = (x: (typeof s)[number]) =>
      x.status === "done" ||
      x.status === "skipped" ||
      x.status === "failed" ||
      x.status === "cancelled";
    out[phase] =
      s.length && s.every((x) => x.status === "skipped")
        ? "skipped"
        : s.length && s.every(finished)
          ? "done"
          : s.some((x) => x.status === "running" || finished(x))
            ? "active"
            : "pending";
  }
  return out;
}

/**
 * RDD §10 "Mission control" (P7.1): the live view of a running analysis. Never a blank spinner:
 * the ring, "Step k of T", the current activity (masked-line reveal on every change), elapsed
 * time and ETA, the phase rail, results as they arrive, and the step timeline.
 */
export function MissionControl({ data }: { data: RunStatusDto }) {
  const p = useProjectContext();
  const action = useRunAction(p.id);
  const reduce = useReducedMotion();
  const { run, steps } = data;
  const running = steps.filter((s) => s.status === "running");
  const current = running[0] ?? null;
  const pct = run.totalSteps ? Math.round((run.doneSteps / run.totalSteps) * 100) : 0;
  const k = Math.min(run.totalSteps, run.doneSteps + (running.length ? 1 : 0)) || 1;
  const phases = phaseStates(steps);
  // Only the phases this run has (no Standards without applied standards; old runs had Compare).
  const railPhases = RUN_PHASES.filter((ph) => steps.some((s) => s.phase === ph));

  // Elapsed clock ticks locally between polls.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const started = Date.parse(run.startedAt ?? run.createdAt);

  const cancel = async () => {
    try {
      await action.mutateAsync({ runId: run.id, action: "cancel" });
      toast.success("Cancelling…");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't cancel.");
    }
  };

  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <section
      aria-labelledby="mission-title"
      className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-xs"
    >
      <DepthBackdrop />
      <div className="relative flex flex-col gap-8 px-6 py-7 sm:px-9 sm:py-9">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2
              id="mission-title"
              className="font-heading text-lg font-semibold tracking-tight text-ink"
            >
              Evaluating {data.chips.length} proposal{data.chips.length === 1 ? "" : "s"}
            </h2>
            <p className="truncate text-[13px] text-ink-muted" dir="auto">
              {p.code} · {p.name} · {run.mode === "mock" ? "Demo AI" : run.model}
            </p>
          </div>
          <Button variant="secondary" onClick={() => void cancel()} disabled={action.isPending}>
            <Square /> Cancel
          </Button>
        </header>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <div
            role="progressbar"
            aria-label="Analysis progress"
            aria-valuemin={0}
            aria-valuemax={run.totalSteps}
            aria-valuenow={run.doneSteps}
            aria-valuetext={`${run.doneSteps} of ${run.totalSteps} steps finished`}
            className="relative grid size-28 shrink-0 place-items-center"
          >
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                strokeWidth="6"
                className="stroke-surface-muted"
              />
              <motion.circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                className="stroke-brand"
                strokeDasharray={C}
                initial={false}
                animate={{ strokeDashoffset: C * (1 - pct / 100) }}
                transition={{ duration: reduce ? 0 : 0.8, ease: EASE_OUT_QUINT }}
              />
            </svg>
            <span className="font-heading text-2xl font-semibold text-ink tabular-nums">
              {pct}%
            </span>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.06em] text-ink-muted uppercase tabular-nums">
              Step {k} of {run.totalSteps}
            </span>
            <div aria-live="polite" aria-atomic className="min-h-[3.5rem]">
              <MaskedText
                as="p"
                text={
                  current
                    ? `${current.seq}/${run.totalSteps} · ${current.label}`
                    : "Preparing the next step…"
                }
                replayKey={current?.id ?? "idle"}
                className="font-heading text-xl leading-snug font-semibold tracking-tight text-ink sm:text-2xl"
              />
            </div>
            <p className="text-[13px] text-ink-muted tabular-nums">
              Elapsed {formatClock(now - started)}
              {data.etaSeconds > 0 && <> · ~{formatDuration(data.etaSeconds)} left</>}
              {running.length > 1 && <> · {running.length} running in parallel</>}
            </p>
          </div>
        </div>

        <ol
          aria-label="Phases"
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${railPhases.length}, minmax(0, 1fr))` }}
        >
          {railPhases.map((phase) => {
            const state = phases[phase];
            return (
              <li key={phase} className="flex flex-col gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "relative h-1.5 overflow-hidden rounded-full",
                    state === "done"
                      ? "bg-brand"
                      : state === "skipped"
                        ? "bg-missing/40"
                        : "bg-surface-muted",
                  )}
                >
                  {state === "active" && (
                    <span className="absolute inset-y-0 start-0 w-1/2 rounded-full bg-brand/70 motion-safe:animate-[marsa-rail_1.6s_ease-in-out_infinite]" />
                  )}
                </span>
                <span
                  className={cn(
                    "truncate text-xs",
                    state === "active"
                      ? "font-semibold text-ink"
                      : state === "done"
                        ? "text-ink-2"
                        : "text-ink-faint",
                  )}
                >
                  {state === "active" ? (
                    <ScrambleText text={RUN_PHASE_LABEL[phase]} />
                  ) : (
                    RUN_PHASE_LABEL[phase]
                  )}
                  <span className="sr-only">
                    {state === "done"
                      ? ", done"
                      : state === "active"
                        ? ", in progress"
                        : state === "skipped"
                          ? ", skipped"
                          : ", pending"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col gap-3">
          <h3 className="text-2xs font-semibold tracking-[0.06em] text-ink-muted uppercase">
            Results so far
          </h3>
          <VendorChips chips={data.chips} projectId={p.id} active />
        </div>

        <AnimatePresence initial={false}>
          <StepTimeline data={data} compact />
        </AnimatePresence>
      </div>
    </section>
  );
}
