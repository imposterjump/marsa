"use client";

import { useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import type { VendorDocRef } from "@/components/results/finding-card";
import { STATUS_FILL } from "@/components/results/gap-bar";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import type {
  AnalysisResultsDto,
  FindingResultDto,
  RequirementResultDto,
  VendorResultDto,
} from "@/lib/api-types";
import {
  PROPOSAL_SECTIONS,
  type FindingStatus,
  type ProposalSection,
  type RiskSeverity,
} from "@/lib/domain";
import { FINDING_STATUS_LABEL, PROPOSAL_SECTION_LABEL } from "@/lib/labels";
import { computeScore, emptyCounts } from "@/lib/scoring";

/**
 * Shared pieces of the AI analysis results page (P8): per-section numbers computed from the run's
 * findings with the run's own weights, vendor identity colours, bars.
 */

/** Categorical jewel tones (RTA data-viz palette); a vendor keeps its colour in every chart. */
const PALETTE = ["#3b7dd8", "#1fa97c", "#6b5bd2", "#f5a623", "#d8558e", "#17a2b8", "#b0762e"];

export function vendorColors(vendors: VendorResultDto[]): Map<string, string> {
  const ids = [...vendors].map((v) => v.proposalId).sort();
  return new Map(ids.map((id, i) => [id, PALETTE[i % PALETTE.length]]));
}

/** Template order, then "Not assigned" for runs from before P8. */
export const SECTION_ORDER: (ProposalSection | null)[] = [...PROPOSAL_SECTIONS, null];
export const sectionLabel = (s: ProposalSection | null) =>
  s ? PROPOSAL_SECTION_LABEL[s] : "Not assigned to a section";
/**
 * The sections a results tab shows: always all 7 of the template (an empty one says so), plus
 * "Not assigned" only when an older run has points without a section.
 */
export function shownSections(d: AnalysisResultsDto): (ProposalSection | null)[] {
  const unassigned =
    d.requirements.some((r) => r.section === null) ||
    d.vendors.some((v) => v.risks.some((r) => r.section === null));
  return SECTION_ORDER.filter((s) => s !== null || unassigned);
}

/** The section's name as a card title; `as="span"` inside buttons. */
export function SectionTitle({
  section,
  as: Tag = "h3",
}: {
  section: ProposalSection | null;
  as?: "h3" | "span";
}) {
  return <Tag className="font-heading text-lg font-semibold text-ink">{sectionLabel(section)}</Tag>;
}

export type Scope = "standard" | "rfp";

/**
 * Commercial or technical point (user, 2026-10-25), by the proposal section it is answered in:
 * "Commercial offer & pricing" and "Terms & deviations" are commercial, the other five technical.
 * Points without a section (runs from before P8) have no type.
 */
export type PointType = "technical" | "commercial";
const COMMERCIAL_SECTIONS: ProposalSection[] = ["commercial", "terms"];
export const pointType = (s: ProposalSection | null): PointType | null =>
  s === null ? null : COMMERCIAL_SECTIONS.includes(s) ? "commercial" : "technical";

/** Opens the reader at a document page and quote; `vendorId` keeps that vendor's envelopes in it
 * when the document is the RFP (a clause opened from the vendor's finding). */
export type OpenEvidence = (
  docId: string,
  page: number | null,
  quote: string,
  vendorId?: string,
) => void;

export interface ScopeStats {
  pct: number | null;
  counts: ReturnType<typeof emptyCounts>;
  total: number;
  mandatoryNotMet: number;
}

export function scopeStats(
  d: AnalysisResultsDto,
  v: VendorResultDto,
  { section, scope, type }: { section?: ProposalSection | null; scope?: Scope; type?: PointType },
): ScopeStats {
  const reqs = new Map(d.requirements.map((r) => [r.id, r]));
  const items = v.findings
    .map((f) => ({ f, r: reqs.get(f.requirementId) }))
    .filter(
      (x): x is { f: FindingResultDto; r: RequirementResultDto } =>
        !!x.r &&
        (section === undefined || x.r.section === section) &&
        (scope === undefined || x.r.scope === scope) &&
        (type === undefined || pointType(x.r.section) === type),
    );
  if (!items.length) return { pct: null, counts: emptyCounts(), total: 0, mandatoryNotMet: 0 };
  const s = computeScore(
    items.map((x) => ({ priority: x.r.priority, status: x.f.status })),
    d.weights,
    d.partialCredit,
  );
  return {
    pct: s.scorePct,
    counts: s.counts,
    total: items.length,
    mandatoryNotMet: s.mandatoryFailures,
  };
}

export function vendorDocRefs(v: VendorResultDto): VendorDocRef[] {
  return [
    ...v.technicalDocuments.map((d) => ({
      id: d.id,
      name: d.originalName,
      envelope: "Technical" as const,
    })),
    ...v.commercialDocuments.map((d) => ({
      id: d.id,
      name: d.originalName,
      envelope: "Commercial" as const,
    })),
  ];
}

export const pctText = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : `${Number.isInteger(n) ? n : n.toFixed(1)}%`;

export function VendorLabel({
  v,
  color,
  size = "sm",
  className,
}: {
  v: VendorResultDto;
  color?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      {color && (
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: color }}
        />
      )}
      <InitialsAvatar name={v.vendor.name} size={size} />
      <span
        className={cn(
          "min-w-0 truncate font-medium text-ink",
          size === "md" ? "text-base" : "text-sm",
        )}
        dir="auto"
      >
        {v.vendor.name}
      </span>
    </span>
  );
}

/** 0–100 bar; `tone` picks the fill (compliance in green-blue, risk by level). */
export function MeterBar({
  value,
  fill,
  className,
  label,
}: {
  value: number | null;
  fill: string;
  className?: string;
  label: string;
}) {
  const v = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value ?? undefined}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-muted", className)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out-quint"
        style={{ width: `${v}%`, background: value === null ? "transparent" : fill }}
      />
    </div>
  );
}

/** Compliance fill: the RTA cool gradient; risk: by level. */
export const COMPLIANCE_FILL = "linear-gradient(90deg, #3b7dd8, #6fc3ff)";
export const RISK_FILL: Record<RiskSeverity, string> = {
  low: "var(--ok-fill)",
  moderate: "var(--partial-fill)",
  high: "#f07630",
  critical: "var(--fail-fill)",
};
export const SEVERITY_ORDER: RiskSeverity[] = ["critical", "high", "moderate", "low"];

/** Bands for a compliance % (user, 2026-10-25): green from 70, blue from 30, yellow below. */
export const pctTone = (pct: number | null) =>
  pct === null
    ? "var(--missing-fill)"
    : pct >= 70
      ? "var(--ok-fill)"
      : pct >= 30
        ? "var(--chart-1)"
        : "var(--partial-fill)";

/**
 * A 0–100 number inside a ring filled to its share (90 leaves a tenth of the ring empty). Flat ends,
 * so a 97 never reads as a closed ring; the number inside carries the value, the colour repeats it.
 */
export function ScoreRing({
  value,
  color,
  text,
  label,
}: {
  value: number | null;
  color: string;
  text: string;
  label: string;
}) {
  const reduce = useReducedMotion();
  const v = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <span
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value ?? undefined}
      aria-valuetext={text}
      className="relative grid size-16 shrink-0 place-items-center"
    >
      <svg viewBox="0 0 64 64" aria-hidden className="absolute inset-0 size-full -rotate-90">
        <circle cx="32" cy="32" r="28" fill="none" strokeWidth="5" className="stroke-border" />
        {v > 0 && (
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            strokeWidth="5"
            stroke={color}
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: v / 100 }}
            transition={{ duration: 0.8, ease: EASE_OUT_QUINT }}
          />
        )}
      </svg>
      <span className="text-sm font-semibold text-ink tabular-nums">{text}</span>
    </span>
  );
}

const LEGEND_ORDER: FindingStatus[] = ["compliant", "partial", "non_compliant", "not_addressed"];

/** "12 compliant · 0 partially compliant · …" under a status line (GapBar). */
export function CountsLegend({
  counts,
  label,
  className,
}: {
  counts: Record<FindingStatus, number>;
  label: string;
  className?: string;
}) {
  return (
    <ul
      className={cn("flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2", className)}
      aria-label={label}
    >
      {LEGEND_ORDER.map((st) => (
        <li key={st} className="inline-flex items-center gap-1.5">
          <span aria-hidden className={cn("size-2 rounded-full", STATUS_FILL[st])} />
          <span className="font-semibold tabular-nums">{counts[st]}</span>
          {FINDING_STATUS_LABEL[st].toLowerCase()}
        </li>
      ))}
    </ul>
  );
}

/**
 * A vendor's card in the RFP and Standards tabs: a tinted summary band on top that folds the card
 * away (user, 2026-10-25: "colapse each vendor to access the next one easily"). The whole band
 * toggles; the chevron is the real button, so keyboard and screen readers get aria-expanded.
 */
export function VendorCardShell({
  v,
  open,
  onToggle,
  header,
  children,
}: {
  v: VendorResultDto;
  open: boolean;
  onToggle: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const bodyId = useId();
  return (
    <section
      id={`vendor-${v.proposalId}`}
      aria-label={v.vendor.name}
      className="scroll-mt-24 rounded-xl border border-border bg-surface shadow-sm"
    >
      {/* The chevron's click bubbles up here, so one handler serves the band and the button.
          Selecting text in the band does not fold it. */}
      <div
        onClick={() => {
          if (!window.getSelection()?.toString()) onToggle();
        }}
        className={cn(
          "relative cursor-pointer bg-surface-muted/70 py-5 ps-5 pe-16 transition-colors hover:bg-surface-muted",
          open ? "rounded-t-xl border-b border-border" : "rounded-xl",
        )}
      >
        {header}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          className="absolute end-4 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg border border-border bg-surface text-ink-muted shadow-xs transition-colors hover:text-ink"
        >
          <span className="sr-only">
            {open ? "Collapse" : "Expand"} {v.vendor.name}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-5 transition-transform duration-200",
              !open && "-rotate-90 rtl:rotate-90",
            )}
          />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT_QUINT }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/** "VENDOR 2" over a vendor's card, with a rule, so the cards read as separate blocks. */
export function VendorDivider({ n, total }: { n: number; total: number }) {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="caption-caps text-ink-muted">
        Vendor {n}
        <span className="text-ink-faint"> of {total}</span>
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
