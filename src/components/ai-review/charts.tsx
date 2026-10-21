"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Small chart pieces for the AI review dashboard (dataviz skill): stat tiles, meters and a
 * part-to-whole stacked bar. Status colours come with an icon + label; text uses ink tokens,
 * never the data colour; segments are separated by a 2 px surface gap; every segment has a
 * hover tooltip and the legend repeats the numbers (the table view is the vendor table).
 */

export function StatTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-surface p-4 shadow-xs">
      <span className="flex items-center gap-1.5 text-xs text-ink-muted">
        {Icon && <Icon className="size-3.5" aria-hidden />}
        {label}
      </span>
      <span className="font-heading text-2xl font-semibold tracking-tight text-ink tabular-nums">
        {value}
      </span>
      {detail && <span className="text-xs text-ink-muted">{detail}</span>}
    </div>
  );
}

export type Severity = "good" | "warn" | "bad";

/** A same-ramp meter: the track is a lighter step of the fill's colour (state reads end to end). */
export function Meter({
  value,
  label,
  severity = "good",
  size = "md",
}: {
  value: number;
  label: string;
  severity?: Severity;
  size?: "sm" | "md";
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      className={cn(
        "w-full overflow-hidden rounded-full",
        size === "sm" ? "h-1.5" : "h-2.5",
        severity === "good"
          ? "bg-brand-soft"
          : severity === "warn"
            ? "bg-partial-soft"
            : "bg-fail-soft",
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none",
          severity === "good" ? "bg-brand" : severity === "warn" ? "bg-partial" : "bg-fail",
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export const severityOf = (pct: number): Severity =>
  pct >= 70 ? "good" : pct >= 50 ? "warn" : "bad";

export interface Segment {
  key: string;
  label: string;
  value: number;
  /** Background class of the mark (status token or a step of one ramp). */
  fill: string;
  icon?: LucideIcon;
}

/** Part-to-whole bar (≤ 6 segments) with a legend that carries icon, label, count and share. */
export function StackedBar({ segments, label }: { segments: Segment[]; label: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const shown = segments.filter((s) => s.value > 0);
  const share = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  return (
    <figure className="flex flex-col gap-3" aria-label={label}>
      {total === 0 ? (
        <div className="h-3 rounded-full bg-surface-muted" aria-hidden />
      ) : (
        <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-[4px]" aria-hidden>
          {shown.map((s) => (
            <Tooltip key={s.key}>
              <TooltipTrigger asChild>
                <div
                  className={cn("h-full min-w-[3px] transition-opacity hover:opacity-80", s.fill)}
                  style={{ flexGrow: s.value, flexBasis: 0 }}
                />
              </TooltipTrigger>
              <TooltipContent>
                {s.label}: {s.value} ({share(s.value)} %)
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-2">
        {segments.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.key} className="flex items-center gap-1.5">
              <span aria-hidden className={cn("size-2.5 rounded-[3px]", s.fill)} />
              {Icon && <Icon className="size-3.5 text-ink-muted" aria-hidden />}
              <span>{s.label}</span>
              <span className="font-medium text-ink tabular-nums">{s.value}</span>
              <span className="text-ink-muted tabular-nums">({share(s.value)} %)</span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
