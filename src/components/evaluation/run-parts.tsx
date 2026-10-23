"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  Ban,
  ChevronRight,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleSlash,
  CircleX,
  Loader2,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { useProjectContext } from "@/components/projects/project-shell";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Pill, RiskPill } from "@/components/ui/status-pill";
import { isRunActive, useRunAction } from "@/hooks/use-runs";
import type { RunChipDto, RunStatusDto, RunStepDto } from "@/lib/api-types";
import type { RunStatus, StepStatus } from "@/lib/domain";
import { STEP_STATUS_LABEL } from "@/lib/labels";
import { formatDuration } from "@/lib/plan";

export const card = "rounded-xl border border-border bg-surface shadow-xs";

const STEP_ICON: Record<StepStatus, { icon: LucideIcon; className: string }> = {
  queued: { icon: Circle, className: "text-ink-faint" },
  running: { icon: Loader2, className: "text-brand motion-safe:animate-spin" },
  done: { icon: CircleCheck, className: "text-ok" },
  failed: { icon: CircleX, className: "text-fail" },
  skipped: { icon: CircleSlash, className: "text-missing" },
  cancelled: { icon: Ban, className: "text-ink-faint" },
};

export function RunIcon({ status }: { status: RunStatus }) {
  if (isRunActive(status))
    return <Loader2 className="size-5 text-brand motion-safe:animate-spin" aria-hidden />;
  if (status === "completed") return <CircleCheck className="size-5 text-ok" aria-hidden />;
  if (status === "completed_with_errors")
    return <CircleAlert className="size-5 text-partial" aria-hidden />;
  if (status === "failed") return <CircleX className="size-5 text-fail" aria-hidden />;
  return <Ban className="size-5 text-ink-faint" aria-hidden />;
}

/** One chip per vendor; its score pops in when that vendor's analysis finishes (FR-11.4). */
export function VendorChips({
  chips,
  projectId,
  active,
}: {
  chips: RunChipDto[];
  projectId: string;
  active: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <ul aria-label="Vendors" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {chips.map((c) => (
        <li key={c.proposalId}>
          <Link
            href={`/projects/${projectId}/proposals/${c.proposalId}`}
            className={cn(
              card,
              "flex min-h-24 items-center gap-3 p-4 transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-brand",
            )}
          >
            <InitialsAvatar name={c.vendor} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-sm font-medium text-ink" dir="auto">
                {c.vendor}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                {c.scorePct !== null ? (
                  <motion.span
                    key="score"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    className="flex flex-col items-start gap-1.5 text-xs text-ink-muted"
                  >
                    <span>
                      <span className="font-semibold text-ink tabular-nums">{c.scorePct}%</span> compliance
                    </span>
                    {/* Always a second line, so every vendor's box has the same height (user, 2026-10-23). */}
                    {c.mandatoryFailures ? (
                      <Pill tone="fail" size="sm">
                        {c.mandatoryFailures} mandatory fail{c.mandatoryFailures === 1 ? "" : "s"}
                      </Pill>
                    ) : (
                      <Pill tone="ok" size="sm">
                        No mandatory fails
                      </Pill>
                    )}
                  </motion.span>
                ) : (
                  <motion.span
                    key="wait"
                    exit={{ opacity: 0 }}
                    className={cn("text-xs", active ? "text-ink-muted" : "text-ink-faint")}
                  >
                    {active ? (
                      <span className="marsa-shimmer">Waiting for analysis…</span>
                    ) : (
                      "Not analysed"
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {c.overallRisk && (
              <motion.span
                initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: EASE_OUT_QUINT }}
              >
                <RiskPill severity={c.overallRisk} size="sm" />
              </motion.span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Step timeline (FR-11.3): every step with its status, duration and error. Failed steps get Retry
 * once the run has stopped. `compact` (mission control) renders it open; otherwise it collapses.
 */
export function StepTimeline({
  data,
  compact = false,
  defaultOpen = false,
}: {
  data: RunStatusDto;
  compact?: boolean;
  defaultOpen?: boolean;
}) {
  const p = useProjectContext();
  const action = useRunAction(p.id);
  const { run, steps } = data;
  const canRetry = !isRunActive(run.status) && p.status !== "archived";

  const retry = async (step: RunStepDto) => {
    try {
      await action.mutateAsync({ runId: run.id, action: "retry", stepId: step.id });
      toast.success(`Retrying step ${step.seq}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't retry the step.");
    }
  };

  const list = (
    <ol className={cn("flex flex-col", !compact && "border-t border-border")}>
      {steps.map((s) => {
        const icon = STEP_ICON[s.status];
        const Icon = icon.icon;
        return (
          <li
            key={s.id}
            className={cn(
              "flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/60 py-3 text-[13px] last:border-0",
              compact ? "px-1" : "px-6",
              s.status === "queued" && "text-ink-muted",
            )}
          >
            <Icon className={cn("size-4 shrink-0", icon.className)} aria-hidden />
            <span className="w-12 shrink-0 text-ink-muted tabular-nums">
              {s.seq}/{run.totalSteps}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1",
                s.status === "running" ? "marsa-shimmer font-medium text-ink" : "text-ink",
                s.status === "queued" && "text-ink-muted",
              )}
            >
              {s.label}
            </span>
            <span className="text-xs text-ink-muted tabular-nums">
              {STEP_STATUS_LABEL[s.status]}
              {s.durationMs && s.status === "done"
                ? ` · ${formatDuration(s.durationMs / 1000)}`
                : ""}
              {s.attempt > 1 ? ` · attempt ${s.attempt}` : ""}
            </span>
            {s.status === "failed" && canRetry && (
              <Button
                size="xs"
                variant="secondary"
                onClick={() => void retry(s)}
                disabled={action.isPending}
              >
                <RotateCcw /> Retry
              </Button>
            )}
            {s.error && s.status !== "done" && (
              <p
                className={cn(
                  "w-full ps-[76px] text-xs",
                  s.status === "failed" ? "text-fail" : "text-ink-muted",
                )}
              >
                {s.error}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-2xs font-semibold tracking-[0.06em] text-ink-muted uppercase">Steps</h3>
        {list}
      </div>
    );
  }
  return (
    <details open={defaultOpen} className={cn(card, "group")}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
        <span>
          Steps <span className="text-ink-muted tabular-nums">({steps.length})</span>
        </span>
        <ChevronRight
          className="size-4 text-ink-muted transition-transform group-open:rotate-90 motion-reduce:transition-none rtl:rotate-180 rtl:group-open:rotate-90"
          aria-hidden
        />
      </summary>
      {list}
    </details>
  );
}
