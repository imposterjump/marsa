"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Banknote,
  BookOpen,
  ChevronDown,
  CircleCheck,
  Cpu,
  FileText,
  FilterX,
  Quote,
  SearchX,
  ShieldCheck,
} from "lucide-react";
import { cn } from "cn";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { EvidenceChip, SourceChips } from "@/components/results/finding-card";
import { STATUS_FILL } from "@/components/results/gap-bar";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FindingStatusPill, PriorityPill } from "@/components/ui/status-pill";
import type {
  AnalysisResultsDto,
  FindingResultDto,
  RequirementResultDto,
  VendorResultDto,
} from "@/lib/api-types";
import {
  FINDING_STATUSES,
  PROPOSAL_SECTIONS,
  type FindingStatus,
  type Priority,
  type ProposalSection,
} from "@/lib/domain";
import { FINDING_STATUS_LABEL } from "@/lib/labels";
import {
  CountsLegend,
  type OpenEvidence,
  type PointType,
  type Scope,
  SECTION_ORDER,
  ScoreRing,
  VendorCardShell,
  VendorDivider,
  VendorLabel,
  pctText,
  pctTone,
  pointType,
  scopeStats,
  sectionLabel,
  vendorDocRefs,
} from "./shared";

/**
 * The point list of the RFP and Standards tabs (user, 2026-10-25, for the client's commercial and
 * technical analysts): instead of section by section, every point of a vendor in one list, worst
 * first, filtered by status, type (commercial / technical) and proposal section. One card per
 * vendor, one under the other, as in the section view.
 */

export type ComplianceView = "sections" | "list";

export interface ListFilters {
  status: FindingStatus | "all";
  type: PointType | "all";
  /** "none": points without a section (runs from before P8). */
  section: ProposalSection | "none" | "all";
}

/** The list opens on the non-compliant points (user, 2026-10-25); "All" is one click away. */
export const DEFAULT_FILTERS: ListFilters = {
  status: "non_compliant",
  type: "all",
  section: "all",
};

/**
 * The filters from the URL (?status=&type=&section=). No status means the default
 * (non-compliant), `status=all` means every status; an unknown type or section reads as "all".
 */
export function filtersFrom(get: (key: string) => string | null): ListFilters {
  const status = get("status") ?? "";
  const type = get("type");
  const section = get("section") ?? "";
  return {
    status:
      status === "all"
        ? "all"
        : (FINDING_STATUSES as readonly string[]).includes(status)
          ? (status as FindingStatus)
          : DEFAULT_FILTERS.status,
    type: type === "technical" || type === "commercial" ? type : "all",
    section:
      section === "none" || (PROPOSAL_SECTIONS as readonly string[]).includes(section)
        ? (section as ProposalSection | "none")
        : "all",
  };
}

/** Worst first, as everywhere on the results page. */
const STATUS_OPTIONS: FindingStatus[] = ["non_compliant", "partial", "not_addressed", "compliant"];
const STATUS_RANK: Record<FindingStatus, number> = {
  non_compliant: 0,
  not_addressed: 1,
  partial: 2,
  compliant: 3,
};
const PRIORITY_RANK: Record<Priority, number> = { mandatory: 0, important: 1, desirable: 2 };
const CONFIDENCE = { high: "High", medium: "Medium", low: "Low" } as const;

const TYPE_TEXT: Record<PointType, { label: string; icon: typeof Cpu }> = {
  technical: { label: "Technical", icon: Cpu },
  commercial: { label: "Commercial", icon: Banknote },
};

/** The line under a point's title: what the AI found, tinted by the status. */
const VERDICT: Record<FindingStatus, { label: string; tint: string; ink: string }> = {
  non_compliant: { label: "Why it falls short", tint: "bg-fail-soft", ink: "text-fail" },
  partial: { label: "What is missing", tint: "bg-partial-soft", ink: "text-partial" },
  not_addressed: { label: "Not addressed", tint: "bg-missing-soft", ink: "text-missing" },
  compliant: { label: "Why it is met", tint: "bg-ok-soft", ink: "text-ok" },
};

interface Point {
  f: FindingResultDto;
  r: RequirementResultDto;
}

const sectionKey = (s: ProposalSection | null) => s ?? "none";

/** The type and section picked: which requirements of the tab are in view at all. */
const inSlice = (r: RequirementResultDto, f: ListFilters) =>
  (f.type === "all" || pointType(r.section) === f.type) &&
  (f.section === "all" || sectionKey(r.section) === f.section);

const matches = (p: Point, f: ListFilters) =>
  (f.status === "all" || p.f.status === f.status) && inSlice(p.r, f);

function pointsOf(d: AnalysisResultsDto, v: VendorResultDto, scope: Scope): Point[] {
  const reqs = new Map(d.requirements.map((r) => [r.id, r]));
  return v.findings
    .map((f) => ({ f, r: reqs.get(f.requirementId) }))
    .filter((p): p is Point => p.r?.scope === scope)
    .sort(
      (a, b) =>
        STATUS_RANK[a.f.status] - STATUS_RANK[b.f.status] ||
        PRIORITY_RANK[a.r.priority] - PRIORITY_RANK[b.r.priority] ||
        SECTION_ORDER.indexOf(a.r.section) - SECTION_ORDER.indexOf(b.r.section) ||
        a.f.code.localeCompare(b.f.code, undefined, { numeric: true }),
    );
}

/** "Commercial · Terms & deviations", or "All points" with no type or section picked. */
function sliceName(f: ListFilters) {
  const parts = [
    f.type !== "all" && TYPE_TEXT[f.type].label,
    f.section !== "all" && sectionLabel(f.section === "none" ? null : f.section),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "All points";
}

export function PointListView({
  d,
  scope,
  vendors,
  colors,
  filters,
  onFilters,
  isOpen,
  onToggle,
  onEvidence,
}: {
  d: AnalysisResultsDto;
  scope: Scope;
  vendors: VendorResultDto[];
  colors: Map<string, string>;
  filters: ListFilters;
  onFilters: (f: ListFilters) => void;
  isOpen: (proposalId: string) => boolean;
  onToggle: (proposalId: string) => void;
  onEvidence: OpenEvidence;
}) {
  const lists = vendors.map((v) => ({ v, points: pointsOf(d, v, scope) }));
  const inScope = d.requirements.filter((r) => r.scope === scope);
  // The type and section picked may hold nothing of this tab at all: one message, not one per vendor.
  const sliceHas = inScope.some((r) => inSlice(r, filters));

  return (
    <div className="flex flex-col gap-6">
      <FilterBar
        scope={scope}
        filters={filters}
        onFilters={onFilters}
        all={lists.flatMap((l) => l.points)}
        reqs={inScope}
      />
      {!sliceHas ? (
        <NoData scope={scope} filters={filters} onClear={() => onFilters(DEFAULT_FILTERS)} />
      ) : (
        lists.map(({ v, points }, i) => (
          <div key={v.proposalId} className="flex flex-col gap-2">
            <VendorDivider n={i + 1} total={vendors.length} />
            <VendorPoints
              d={d}
              scope={scope}
              v={v}
              color={colors.get(v.proposalId)}
              points={points}
              filters={filters}
              open={isOpen(v.proposalId)}
              onToggle={() => onToggle(v.proposalId)}
              onAllStatuses={() => onFilters({ ...filters, status: "all" })}
              onEvidence={onEvidence}
            />
          </div>
        ))
      )}
    </div>
  );
}

function FilterBar({
  scope,
  filters,
  onFilters,
  all,
  reqs,
}: {
  scope: Scope;
  filters: ListFilters;
  onFilters: (f: ListFilters) => void;
  /** Every vendor's points of this tab: the counts are faceted over them. */
  all: Point[];
  reqs: RequirementResultDto[];
}) {
  // Each option counts the points it would show with the other two filters kept.
  const count = (over: Partial<ListFilters>) =>
    all.filter((p) => matches(p, { ...filters, ...over })).length;
  const sections = SECTION_ORDER.filter((s) => s !== null || reqs.some((r) => r.section === null));
  const changed =
    filters.status !== DEFAULT_FILTERS.status ||
    filters.type !== DEFAULT_FILTERS.type ||
    filters.section !== DEFAULT_FILTERS.section;
  const set = (over: Partial<ListFilters>) => onFilters({ ...filters, ...over });

  return (
    <div
      role="group"
      aria-label={`Filter the ${scope === "rfp" ? "RFP requirements" : "standard rules"}`}
      className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm"
    >
      <FilterGroup label="Status">
        <SegmentedControl
          size="sm"
          aria-label="Status"
          value={filters.status}
          onValueChange={(status) => set({ status })}
          options={[
            { value: "all", label: "All", count: count({ status: "all" }) },
            ...STATUS_OPTIONS.map((s) => ({
              value: s,
              label: FINDING_STATUS_LABEL[s],
              icon: <span aria-hidden className={cn("size-2 rounded-full", STATUS_FILL[s])} />,
              count: count({ status: s }),
            })),
          ]}
        />
      </FilterGroup>
      <FilterGroup label="Type">
        <SegmentedControl
          size="sm"
          aria-label="Type"
          value={filters.type}
          onValueChange={(type) => set({ type })}
          options={[
            { value: "all", label: "All", count: count({ type: "all" }) },
            ...(["technical", "commercial"] as const).map((t) => {
              const Icon = TYPE_TEXT[t].icon;
              return {
                value: t,
                label: TYPE_TEXT[t].label,
                icon: <Icon aria-hidden />,
                count: count({ type: t }),
              };
            }),
          ]}
        />
      </FilterGroup>
      <FilterGroup label="Section">
        <Select
          value={filters.section}
          onValueChange={(v) => set({ section: v as ListFilters["section"] })}
        >
          <SelectTrigger size="sm" aria-label="Section" className="min-w-60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All sections{" "}
              <span className="text-ink-faint tabular-nums">{count({ section: "all" })}</span>
            </SelectItem>
            {sections.map((s) => {
              const has = reqs.some((r) => r.section === s);
              return (
                <SelectItem key={sectionKey(s)} value={sectionKey(s)}>
                  {sectionLabel(s)}{" "}
                  <span className="text-ink-faint tabular-nums">
                    {has ? count({ section: sectionKey(s) }) : "no data"}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </FilterGroup>
      {changed && (
        <Button
          variant="ghost"
          size="sm"
          className="ms-auto"
          onClick={() => onFilters(DEFAULT_FILTERS)}
        >
          <FilterX aria-hidden /> Reset filters
        </Button>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex max-w-full min-w-0 flex-col gap-1.5">
      <span aria-hidden className="caption-caps text-ink-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

/** The type and section picked have no point of this tab for anyone. */
function NoData({
  scope,
  filters,
  onClear,
}: {
  scope: Scope;
  filters: ListFilters;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong/70 px-6 py-14 text-center">
      <SearchX className="size-8 text-ink-faint" aria-hidden />
      <h3 className="font-heading text-lg font-semibold text-ink">
        No data related to {sliceName(filters)}
      </h3>
      <p className="max-w-md text-[13px] leading-relaxed text-ink-muted">
        No {scope === "rfp" ? "RFP requirement" : "standard rule"} of this project falls in{" "}
        {sliceName(filters).toLowerCase()}, so there is nothing to show for any vendor.
      </p>
      <Button variant="secondary" size="sm" onClick={onClear}>
        <FilterX aria-hidden /> Reset filters
      </Button>
    </div>
  );
}

function VendorPoints({
  d,
  scope,
  v,
  color,
  points,
  filters,
  open,
  onToggle,
  onAllStatuses,
  onEvidence,
}: {
  d: AnalysisResultsDto;
  scope: Scope;
  v: VendorResultDto;
  color?: string;
  points: Point[];
  filters: ListFilters;
  open: boolean;
  onToggle: () => void;
  onAllStatuses: () => void;
  onEvidence: OpenEvidence;
}) {
  const shown = points.filter((p) => matches(p, filters));
  // The ring scores the slice (type and section), not the status pick: a status filter would
  // make it 0 or 100.
  const st = scopeStats(d, v, {
    scope,
    type: filters.type === "all" ? undefined : filters.type,
    section:
      filters.section === "all" ? undefined : filters.section === "none" ? null : filters.section,
  });
  const slice = sliceName(filters);
  const what = scope === "rfp" ? "RFP" : "Standards";
  const unit = scope === "rfp" ? "requirements" : "rules";

  return (
    <VendorCardShell
      v={v}
      open={open}
      onToggle={onToggle}
      header={
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
          <span className="flex min-w-0 flex-col gap-1">
            <VendorLabel v={v} color={color} size="md" />
            <span className="ps-[4.75rem] text-xs text-ink-muted">
              Showing <span className="font-semibold text-ink-2 tabular-nums">{shown.length}</span>{" "}
              of {st.total} {unit}
              {filters.status !== "all" &&
                ` · ${FINDING_STATUS_LABEL[filters.status].toLowerCase()} only`}
              {st.mandatoryNotMet > 0 && (
                <span className="text-fail"> · {st.mandatoryNotMet} mandatory not met</span>
              )}
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <CountsLegend
              counts={st.counts}
              label={`${v.vendor.name}: ${slice}`}
              className="max-w-xs"
            />
            <span className="flex items-center gap-3">
              <span className="flex flex-col items-end text-end">
                <span className="caption-caps text-ink-muted">{what} compliance</span>
                <span className="text-xs text-ink-muted">{slice}</span>
              </span>
              <ScoreRing
                value={st.total ? st.pct : null}
                color={pctTone(st.pct)}
                text={pctText(st.total ? st.pct : null)}
                label={`${v.vendor.name}: ${what} compliance, ${slice}`}
              />
            </span>
          </span>
        </div>
      }
    >
      {shown.length > 0 ? (
        <ol
          aria-label={`${v.vendor.name}: points`}
          className="flex flex-col divide-y divide-border/70"
        >
          {shown.map((p) => (
            <PointRow key={p.f.id} d={d} v={v} p={p} onEvidence={onEvidence} />
          ))}
        </ol>
      ) : (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          {filters.status !== "all" && filters.status !== "compliant" ? (
            <CircleCheck className="size-7 text-ok" aria-hidden />
          ) : (
            <SearchX className="size-7 text-ink-faint" aria-hidden />
          )}
          <p className="text-sm font-medium text-ink">
            No{" "}
            {filters.status === "all"
              ? ""
              : `${FINDING_STATUS_LABEL[filters.status].toLowerCase()} `}
            points for <span dir="auto">{v.vendor.name}</span>
            {slice === "All points" ? "" : ` in ${slice}`}
          </p>
          {filters.status !== "all" && (
            <Button variant="link" size="sm" onClick={onAllStatuses}>
              Show every status
            </Button>
          )}
        </div>
      )}
    </VendorCardShell>
  );
}

/**
 * One point, built for scanning: a status edge, the status / priority / type / section line, the
 * one-line headline over the requirement's title, the AI's verdict tinted by status, then the
 * clause or rule and the vendor's page as links. Details put the requirement and the offer side
 * by side.
 */
function PointRow({
  d,
  v,
  p: { f, r },
  onEvidence,
}: {
  d: AnalysisResultsDto;
  v: VendorResultDto;
  p: Point;
  onEvidence: OpenEvidence;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const isRule = r.scope === "standard";
  const type = pointType(r.section);
  const verdict = VERDICT[f.status];
  const verdictText =
    f.status === "compliant"
      ? f.assessment
      : f.gap ||
        f.assessment ||
        (f.status === "not_addressed" ? "Nothing in the proposal answers this point." : "");
  const onOpen = (id: string, page: number | null, quote: string) =>
    onEvidence(id, page, quote, v.proposalId);
  const TypeIcon = type ? TYPE_TEXT[type].icon : null;

  return (
    <li className="relative transition-colors hover:bg-surface-muted/30">
      <span
        aria-hidden
        className={cn("absolute inset-y-4 start-0 w-1 rounded-e-full", STATUS_FILL[f.status])}
      />
      <div className="flex flex-col gap-2.5 py-3.5 ps-6 pe-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <FindingStatusPill status={f.status} size="sm" />
          <PriorityPill priority={r.priority} size="sm" />
          {type && TypeIcon && (
            <span className="inline-flex h-5 items-center gap-1 rounded-full border border-border px-2 text-2xs font-medium text-ink-2">
              <TypeIcon className="size-3" aria-hidden /> {TYPE_TEXT[type].label}
            </span>
          )}
          <span className="text-xs text-ink-muted">{sectionLabel(r.section)}</span>
          <span className="ms-auto font-mono text-xs text-ink-muted">
            {isRule ? r.sourceRef : f.code}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] leading-snug font-medium text-ink" dir="auto">
            {f.headline}
          </p>
          <p className="line-clamp-1 text-[13px] text-ink-muted" dir="auto">
            {isRule ? "Standard rule" : "RFP"} · {r.title}
          </p>
        </div>

        {verdictText && (
          <p
            className={cn(
              "rounded-lg px-3 py-2 text-[13px] leading-relaxed",
              verdict.tint,
              !open && "line-clamp-2",
            )}
            dir="auto"
          >
            <span className={cn("me-1.5 font-semibold", verdict.ink)}>{verdict.label}:</span>
            <span className="text-ink-2">{verdictText}</span>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <SourceChips
            sources={d.sources[f.requirementId] ?? []}
            fallback={r.sourceRef}
            onOpen={onOpen}
          />
          <EvidenceChip f={f} vendorDocs={vendorDocRefs(v)} onEvidence={onOpen} />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="ms-auto inline-flex items-center gap-1 rounded-sm text-xs font-medium text-brand-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {open ? "Hide details" : "Details"}
            <ChevronDown
              aria-hidden
              className={cn("size-3.5 transition-transform", open && "rotate-180")}
            />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT_QUINT }}
            className="overflow-hidden"
          >
            <div className="grid gap-3 ps-6 pe-5 pb-5 md:grid-cols-2">
              <DetailPanel
                icon={isRule ? ShieldCheck : FileText}
                title={isRule ? "The rule requires" : "The RFP requires"}
              >
                {r.description || r.title}
                {r.acceptance && (
                  <span className="mt-2 block text-ink-muted">Accepted when: {r.acceptance}</span>
                )}
              </DetailPanel>
              <DetailPanel icon={BookOpen} title={`${v.vendor.name} offers`}>
                {f.vendorResponse || (
                  <span className="text-ink-muted italic">Nothing in the proposal.</span>
                )}
                {f.evidenceQuote && (
                  <span className="mt-2 flex items-start gap-2 text-ink-muted">
                    <Quote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <q className="italic" dir="auto">
                      {f.evidenceQuote}
                    </q>
                  </span>
                )}
              </DetailPanel>
              <p className="text-xs text-ink-muted md:col-span-2">
                AI confidence: {CONFIDENCE[f.confidence]}
                {f.aiStatus !== f.status &&
                  ` · status changed by a reviewer (the AI said ${FINDING_STATUS_LABEL[f.aiStatus].toLowerCase()})`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function DetailPanel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface-muted/40 p-3.5">
      <span className="flex items-center gap-1.5 caption-caps text-ink-muted">
        <Icon className="size-3.5" aria-hidden /> <span dir="auto">{title}</span>
      </span>
      <p className="text-[13px] leading-relaxed text-ink" dir="auto">
        {children}
      </p>
    </div>
  );
}
