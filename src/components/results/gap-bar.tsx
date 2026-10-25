"use client";

import { cn } from "cn";
import { useT } from "@/components/i18n-provider";
import type { FindingStatus, StatusCounts } from "@/lib/domain";
import { msg } from "@/lib/i18n/core";

/** Met → partly → not addressed → not met: the shortfalls sit at the end, where the eye lands. */
export const STATUS_ORDER: FindingStatus[] = [
  "compliant",
  "partial",
  "not_addressed",
  "non_compliant",
];

/** "3 non-compliant": the count with its status, one key per status. */
const COUNT_LABEL: Record<FindingStatus, string> = {
  compliant: msg("{n} compliant"),
  partial: msg("{n} partially compliant"),
  non_compliant: msg("{n} non-compliant"),
  not_addressed: msg("{n} not addressed"),
};

export const STATUS_FILL: Record<FindingStatus, string> = {
  compliant: "bg-ok-fill",
  partial: "bg-partial-fill",
  not_addressed: "bg-missing-fill",
  non_compliant: "bg-fail-fill",
};

/**
 * One scope's findings as a thin stacked bar (2 px surface gaps, rounded ends). Colour is never
 * alone: the accessible label and the counts next to it carry the same numbers.
 */
export function GapBar({ counts, className }: { counts: StatusCounts; className?: string }) {
  const t = useT();
  const total = STATUS_ORDER.reduce((s, k) => s + counts[k], 0);
  const countOf = (k: FindingStatus) => t(COUNT_LABEL[k], { n: counts[k] });
  const label = STATUS_ORDER.map(countOf).join(t.locale === "ar" ? "، " : ", ");
  if (!total) {
    return (
      <div className={cn("h-2 w-full rounded-full bg-surface-muted", className)} aria-hidden />
    );
  }
  return (
    <div role="img" aria-label={label} className={cn("flex h-2 w-full gap-[2px]", className)}>
      {STATUS_ORDER.filter((k) => counts[k] > 0).map((k) => (
        <span
          key={k}
          title={countOf(k)}
          className={cn("h-full min-w-1.5 rounded-full", STATUS_FILL[k])}
          style={{ flexGrow: counts[k] }}
        />
      ))}
    </div>
  );
}

/** "2 not met · 1 partly met" — only the shortfalls, or "All met". */
export function ShortfallText({ counts }: { counts: StatusCounts }) {
  const t = useT();
  const parts = (["non_compliant", "not_addressed", "partial"] as const)
    .filter((k) => counts[k] > 0)
    .map((k) => (
      <span key={k} className="inline-flex items-center gap-1.5">
        <span aria-hidden className={cn("size-2 rounded-full", STATUS_FILL[k])} />
        {t(COUNT_LABEL[k], { n: <span className="tabular-nums">{counts[k]}</span> })}
      </span>
    ));
  if (!parts.length) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="size-2 rounded-full bg-ok-fill" /> {t("All met")}
      </span>
    );
  }
  return <span className="flex flex-wrap items-center gap-x-3 gap-y-1">{parts}</span>;
}
