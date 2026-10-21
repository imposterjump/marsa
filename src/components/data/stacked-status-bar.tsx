"use client";

import { motion } from "motion/react";
import { cn } from "cn";
import { FINDING_STATUSES, type StatusCounts } from "@/lib/domain";
import { FINDING_STATUS_LABEL } from "@/lib/labels";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const FILL: Record<keyof StatusCounts, string> = {
  compliant: "bg-ok",
  partial: "bg-partial",
  non_compliant: "bg-fail",
  not_addressed: "bg-missing",
};

/** Proportional bar of compliant / partial / non-compliant / not-addressed counts, with legend. */
export function StackedStatusBar({
  counts,
  legend = true,
  className,
}: {
  counts: StatusCounts;
  legend?: boolean;
  className?: string;
}) {
  const total = FINDING_STATUSES.reduce((s, k) => s + counts[k], 0);
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div
        role="img"
        aria-label={FINDING_STATUSES.map((k) => `${counts[k]} ${FINDING_STATUS_LABEL[k]}`).join(", ")}
        className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-surface-muted"
      >
        {total > 0 &&
          FINDING_STATUSES.filter((k) => counts[k] > 0).map((k, i) => (
            <Tooltip key={k}>
              <TooltipTrigger asChild>
                <motion.div
                  className={cn("h-full first:rounded-s-full last:rounded-e-full", FILL[k])}
                  initial={{ width: 0 }}
                  animate={{ width: `${(counts[k] / total) * 100}%` }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
                />
              </TooltipTrigger>
              <TooltipContent>
                {counts[k]} {FINDING_STATUS_LABEL[k].toLowerCase()} ·{" "}
                {Math.round((counts[k] / total) * 100)}%
              </TooltipContent>
            </Tooltip>
          ))}
      </div>
      {legend && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-muted">
          {FINDING_STATUSES.map((k) => (
            <li key={k} className="inline-flex items-center gap-1.5">
              <span aria-hidden className={cn("size-2 rounded-full", FILL[k])} />
              <span className="font-medium text-ink tabular-nums">{counts[k]}</span>
              {FINDING_STATUS_LABEL[k]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
