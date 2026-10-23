"use client";

import { cn } from "cn";
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
/** Position in the proposal template (1–7), so every tab says "Section 3" for the same thing. */
export const sectionNumber = (s: ProposalSection | null) => (s ? PROPOSAL_SECTIONS.indexOf(s) + 1 : null);
export const sectionChip = (s: ProposalSection | null) =>
  s ? `${sectionNumber(s)} · ${PROPOSAL_SECTION_LABEL[s]}` : "Not assigned";

/** "SECTION 3" caption over the section name; `as="span"` inside buttons. */
export function SectionTitle({ section, as: Tag = "h3" }: { section: ProposalSection | null; as?: "h3" | "span" }) {
  const n = sectionNumber(section);
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="caption-caps text-ink-muted">{n ? `Section ${n}` : "Other"}</span>
      <Tag className="font-heading text-lg font-semibold text-ink">{sectionLabel(section)}</Tag>
    </span>
  );
}

export type Scope = "standard" | "rfp";

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
  { section, scope }: { section?: ProposalSection | null; scope?: Scope },
): ScopeStats {
  const reqs = new Map(d.requirements.map((r) => [r.id, r]));
  const items = v.findings
    .map((f) => ({ f, r: reqs.get(f.requirementId) }))
    .filter(
      (x): x is { f: FindingResultDto; r: RequirementResultDto } =>
        !!x.r &&
        (section === undefined || x.r.section === section) &&
        (scope === undefined || x.r.scope === scope),
    );
  if (!items.length) return { pct: null, counts: emptyCounts(), total: 0, mandatoryNotMet: 0 };
  const s = computeScore(
    items.map((x) => ({ priority: x.r.priority, status: x.f.status })),
    d.weights,
    d.partialCredit,
  );
  return { pct: s.scorePct, counts: s.counts, total: items.length, mandatoryNotMet: s.mandatoryFailures };
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
        <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
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
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2", className)} aria-label={label}>
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
