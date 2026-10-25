"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ChevronDown, CircleCheck, FilterX } from "lucide-react";
import { cn } from "cn";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { EvidenceChip, SourceChips } from "@/components/results/finding-card";
import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import { RiskPill } from "@/components/ui/status-pill";
import type { AnalysisResultsDto, RiskResultDto, VendorResultDto } from "@/lib/api-types";
import type { ProposalSection, RiskSeverity } from "@/lib/domain";
import { RISK_SEVERITY_LABEL } from "@/lib/labels";
import { FilterSelect, TYPE_TEXT, sectionKey } from "./point-list";
import {
  type OpenEvidence,
  type PointType,
  type Scope,
  RISK_FILL,
  SECTION_ORDER,
  SEVERITY_ORDER,
  ScoreRing,
  VendorCardShell,
  VendorDivider,
  VendorLabel,
  pointType,
  sectionLabel,
  vendorDocRefs,
} from "./shared";

/**
 * The risk list of the Risks tab (user, 2026-10-25: "the exact same" as the RFP point list): every
 * risk of a vendor in one list, worst first, with the vendor's own severity, type and section
 * dropdowns. It opens on every severity (user's pick: a vendor has 3–10 risks, nothing to hide).
 */

/** What a risk can open: the evidence in the reader, and its section's points. */
export interface RiskLinks {
  d: AnalysisResultsDto;
  onEvidence: OpenEvidence;
  onSection: (s: ProposalSection | null, scope?: Scope, proposalId?: string) => void;
}

const SEVERITY_RANK: Record<RiskSeverity, number> = { critical: 0, high: 1, moderate: 2, low: 3 };
export const byWeight = (a: RiskResultDto, b: RiskResultDto) =>
  SEVERITY_RANK[a.severity as RiskSeverity] - SEVERITY_RANK[b.severity as RiskSeverity] ||
  b.likelihood * b.impact - a.likelihood * a.impact;

/** The requirements a risk is about, and the vendor's own sentence behind it (if any). */
export function riskContext(r: RiskResultDto, v: VendorResultDto, d: AnalysisResultsDto) {
  const reqs = r.requirementCodes
    .map((code) => d.requirements.find((x) => x.code === code))
    .filter((x): x is NonNullable<typeof x> => !!x);
  const finding = reqs
    .map((req) => v.findings.find((f) => f.requirementId === req.id))
    .find((f) => f?.evidenceDocId);
  return { reqs, finding };
}

interface RiskFilters {
  severity: RiskSeverity | "all";
  type: PointType | "all";
  /** "none": risks without a section (runs from before P8). */
  section: ProposalSection | "none" | "all";
}
const DEFAULT_FILTERS: RiskFilters = { severity: "all", type: "all", section: "all" };

const matches = (r: RiskResultDto, f: RiskFilters) =>
  (f.severity === "all" || r.severity === f.severity) &&
  (f.type === "all" || pointType(r.section) === f.type) &&
  (f.section === "all" || sectionKey(r.section) === f.section);

function sliceName(f: RiskFilters) {
  const parts = [
    f.type !== "all" && TYPE_TEXT[f.type].label,
    f.section !== "all" && sectionLabel(f.section === "none" ? null : f.section),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "";
}

/** The line under a risk's title, tinted by its severity. */
const TINT: Record<RiskSeverity, { tint: string; ink: string }> = {
  critical: { tint: "bg-risk-critical-soft", ink: "text-risk-critical" },
  high: { tint: "bg-risk-high-soft", ink: "text-risk-high" },
  moderate: { tint: "bg-risk-moderate-soft", ink: "text-risk-moderate" },
  low: { tint: "bg-risk-low-soft", ink: "text-risk-low" },
};

export function RiskListView({
  vendors,
  colors,
  isOpen,
  onToggle,
  links,
}: {
  vendors: VendorResultDto[];
  colors: Map<string, string>;
  isOpen: (proposalId: string) => boolean;
  onToggle: (proposalId: string) => void;
  links: RiskLinks;
}) {
  return (
    <div className="flex flex-col gap-6">
      {vendors.map((v, i) => (
        <div key={v.proposalId} className="flex flex-col gap-2">
          <VendorDivider n={i + 1} total={vendors.length} />
          <VendorRisks
            v={v}
            color={colors.get(v.proposalId)}
            open={isOpen(v.proposalId)}
            onToggle={() => onToggle(v.proposalId)}
            links={links}
          />
        </div>
      ))}
    </div>
  );
}

function VendorRisks({
  v,
  color,
  open,
  onToggle,
  links,
}: {
  v: VendorResultDto;
  color?: string;
  open: boolean;
  onToggle: () => void;
  links: RiskLinks;
}) {
  // Kept here, outside the folding body, so a vendor keeps its filters while folded.
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const s = v.scores!;
  const all = [...v.risks].sort(byWeight);
  const inSlice = all.filter((r) => matches(r, { ...filters, severity: "all" }));
  const shown = all.filter((r) => matches(r, filters));
  const slice = sliceName(filters);
  const counts = SEVERITY_ORDER.map(
    (sev) => [sev, inSlice.filter((r) => r.severity === sev).length] as const,
  );
  const reset = () => setFilters(DEFAULT_FILTERS);

  return (
    <VendorCardShell
      v={v}
      id={`risks-${v.proposalId}`}
      open={open}
      onToggle={onToggle}
      header={
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
          <span className="flex min-w-0 flex-col gap-1">
            <VendorLabel v={v} color={color} size="md" />
            <span className="ps-[4.75rem] text-xs text-ink-muted">
              {v.risks.length} risk{v.risks.length === 1 ? "" : "s"} ·{" "}
              {s.mandatoryNotMet ? (
                <span className="text-fail">
                  {s.mandatoryNotMet} mandatory requirement{s.mandatoryNotMet === 1 ? "" : "s"} not
                  met
                </span>
              ) : (
                "all mandatory requirements met"
              )}
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <ul
              aria-label={`${v.vendor.name}: risks${slice ? `, ${slice}` : ""}`}
              className="grid max-w-xs grid-cols-2 gap-x-5 gap-y-1 text-xs text-ink-2"
            >
              {counts.map(([sev, n]) => (
                <li key={sev} className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ background: RISK_FILL[sev] }}
                  />
                  <span className="font-semibold tabular-nums">{n}</span> {sev}
                </li>
              ))}
            </ul>
            <span className="flex items-center gap-3">
              <span className="flex flex-col items-end gap-1 text-end">
                <span className="caption-caps text-ink-muted">Overall risk score</span>
                <RiskPill severity={s.riskLevel} size="sm" />
              </span>
              <ScoreRing
                value={s.riskScore}
                color={RISK_FILL[s.riskLevel]}
                text={String(s.riskScore)}
                label={`${v.vendor.name}: overall risk score`}
              />
            </span>
          </span>
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border/70 bg-surface px-5 py-3">
        <span className="text-xs text-ink-muted">
          Showing <span className="font-semibold text-ink-2 tabular-nums">{shown.length}</span> of{" "}
          {v.risks.length} risks
          {filters.severity !== "all" && ` · ${filters.severity} only`}
          {slice && ` · ${slice}`}
        </span>
        <RiskFilterBar
          vendor={v.vendor.name}
          filters={filters}
          onFilters={setFilters}
          risks={all}
          onReset={reset}
        />
      </div>
      {shown.length > 0 ? (
        <ol
          aria-label={`${v.vendor.name}: risk list`}
          className="flex flex-col divide-y divide-border/70"
        >
          {shown.map((r) => (
            <RiskRow key={r.id} r={r} v={v} links={links} />
          ))}
        </ol>
      ) : (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <CircleCheck className="size-7 text-ok" aria-hidden />
          <p className="text-sm font-medium text-ink">
            {inSlice.length === 0 ? (
              <>
                No data related to {slice || "this vendor"}: no risk raised for{" "}
                <span dir="auto">{v.vendor.name}</span>
                {slice ? " there" : ""}
              </>
            ) : (
              <>
                No {filters.severity} risks for <span dir="auto">{v.vendor.name}</span>
                {slice ? ` in ${slice}` : ""}
              </>
            )}
          </p>
          {inSlice.length > 0 ? (
            <Button
              variant="link"
              size="sm"
              onClick={() => setFilters({ ...filters, severity: "all" })}
            >
              Show every severity
            </Button>
          ) : (
            <Button variant="link" size="sm" onClick={reset}>
              Reset filters
            </Button>
          )}
        </div>
      )}
    </VendorCardShell>
  );
}

/** The vendor's three risk filters, compact and red, on the right (as in the RFP list). */
function RiskFilterBar({
  vendor,
  filters,
  onFilters,
  risks,
  onReset,
}: {
  vendor: string;
  filters: RiskFilters;
  onFilters: (f: RiskFilters) => void;
  risks: RiskResultDto[];
  onReset: () => void;
}) {
  const count = (over: Partial<RiskFilters>) =>
    risks.filter((r) => matches(r, { ...filters, ...over })).length;
  const sections = SECTION_ORDER.filter((s) => s !== null || risks.some((r) => r.section === null));
  const changed =
    filters.severity !== DEFAULT_FILTERS.severity ||
    filters.type !== DEFAULT_FILTERS.type ||
    filters.section !== DEFAULT_FILTERS.section;
  const set = (over: Partial<RiskFilters>) => onFilters({ ...filters, ...over });
  const n = (value: number) => <span className="text-ink-faint tabular-nums">{value}</span>;

  return (
    <div
      role="group"
      aria-label={`Filters for ${vendor}`}
      className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto"
    >
      {changed && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <FilterX aria-hidden /> Reset
        </Button>
      )}
      <FilterSelect
        label="Severity"
        value={filters.severity}
        onChange={(severity) => set({ severity })}
        className="sm:w-52"
      >
        <SelectItem value="all">All severities {n(count({ severity: "all" }))}</SelectItem>
        {SEVERITY_ORDER.map((sev) => (
          <SelectItem key={sev} value={sev}>
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ background: RISK_FILL[sev] }}
            />
            {RISK_SEVERITY_LABEL[sev]} {n(count({ severity: sev }))}
          </SelectItem>
        ))}
      </FilterSelect>
      <FilterSelect
        label="Type"
        value={filters.type}
        onChange={(type) => set({ type })}
        className="sm:w-52"
      >
        <SelectItem value="all">All types {n(count({ type: "all" }))}</SelectItem>
        {(["technical", "commercial"] as const).map((t) => {
          const Icon = TYPE_TEXT[t].icon;
          return (
            <SelectItem key={t} value={t}>
              <Icon aria-hidden className="text-ink-muted" /> {TYPE_TEXT[t].label}{" "}
              {n(count({ type: t }))}
            </SelectItem>
          );
        })}
      </FilterSelect>
      <FilterSelect
        label="Section"
        value={filters.section}
        onChange={(section) => set({ section })}
        className="sm:w-60"
      >
        <SelectItem value="all">All sections {n(count({ section: "all" }))}</SelectItem>
        {sections.map((s) => (
          <SelectItem key={sectionKey(s)} value={sectionKey(s)}>
            {sectionLabel(s)} {n(count({ section: sectionKey(s) }))}
          </SelectItem>
        ))}
      </FilterSelect>
    </div>
  );
}

/**
 * One risk, built for scanning like a point of the RFP list: a severity edge, severity / type /
 * section / likelihood × impact, the title over what it is, what happens to the client if it
 * materialises (tinted by severity) and the mitigation, then the vendor's page and the clauses it
 * is about. Details add the full text and the section's points.
 */
function RiskRow({ r, v, links }: { r: RiskResultDto; v: VendorResultDto; links: RiskLinks }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const { d, onEvidence, onSection } = links;
  const severity = r.severity as RiskSeverity;
  const type = pointType(r.section);
  const TypeIcon = type ? TYPE_TEXT[type].icon : null;
  const { reqs, finding } = riskContext(r, v, d);
  const openDoc = (docId: string, page: number | null, quote: string) =>
    onEvidence(docId, page, quote, v.proposalId);

  return (
    <li className="relative transition-colors hover:bg-surface-muted/30">
      <span
        aria-hidden
        className="absolute inset-y-4 start-0 w-1 rounded-e-full"
        style={{ background: RISK_FILL[severity] }}
      />
      <div className="flex flex-col gap-2.5 py-3.5 ps-6 pe-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <RiskPill severity={severity} size="sm" />
          {type && TypeIcon && (
            <span className="inline-flex h-5 items-center gap-1 rounded-full border border-border px-2 text-2xs font-medium text-ink-2">
              <TypeIcon className="size-3" aria-hidden /> {TYPE_TEXT[type].label}
            </span>
          )}
          <span className="text-xs text-ink-muted">{sectionLabel(r.section)}</span>
          <span className="ms-auto text-xs text-ink-muted tabular-nums">
            Likelihood {r.likelihood}/5 · Impact {r.impact}/5 ·{" "}
            <span className="capitalize">{r.category.replace(/_/g, " ")}</span>
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] leading-snug font-medium text-ink" dir="auto">
            {r.title}
          </p>
          <p className={cn("text-[13px] text-ink-muted", !open && "line-clamp-1")} dir="auto">
            {r.description}
          </p>
        </div>

        <p
          className={cn(
            "rounded-lg px-3 py-2 text-[13px] leading-relaxed",
            TINT[severity].tint,
            !open && "line-clamp-2",
          )}
          dir="auto"
        >
          <span className={cn("me-1.5 font-semibold", TINT[severity].ink)}>If it happens:</span>
          <span className="text-ink-2">{r.consequence}</span>
        </p>
        <p className={cn("text-[13px] text-ink-2", !open && "line-clamp-2")} dir="auto">
          <span className="me-1.5 font-semibold text-ink">Mitigation:</span>
          {r.mitigation}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {/* The vendor's own sentence behind the risk, as in the RFP list. */}
          {finding && (
            <EvidenceChip f={finding} vendorDocs={vendorDocRefs(v)} onEvidence={openDoc} />
          )}
          {reqs.slice(0, 2).map((req) => (
            <SourceChips
              key={req.id}
              sources={d.sources[req.id] ?? []}
              fallback={req.code}
              onOpen={openDoc}
            />
          ))}
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
            <dl className="grid gap-x-4 gap-y-2.5 ps-6 pe-5 pb-5 text-[13px] sm:grid-cols-[7rem_1fr]">
              {r.evidence && (
                <>
                  <dt className="text-xs font-semibold text-ink-muted">Evidence</dt>
                  <dd className="text-ink-2 italic" dir="auto">
                    “{r.evidence}”
                  </dd>
                </>
              )}
              {reqs.length > 0 && (
                <>
                  <dt className="text-xs font-semibold text-ink-muted">About</dt>
                  <dd className="flex flex-col gap-2">
                    {reqs.map((req) => (
                      <span key={req.id} className="flex flex-col gap-1">
                        <span className="text-xs text-ink-2" dir="auto">
                          <span className="font-mono text-ink-muted">
                            {req.scope === "standard" ? req.sourceRef : req.code}
                          </span>{" "}
                          {req.title}
                        </span>
                        <SourceChips
                          sources={d.sources[req.id] ?? []}
                          fallback={req.code}
                          onOpen={openDoc}
                        />
                      </span>
                    ))}
                  </dd>
                </>
              )}
              <dt className="text-xs font-semibold text-ink-muted">Section</dt>
              <dd>
                <button
                  type="button"
                  onClick={() => onSection(r.section, reqs[0]?.scope, v.proposalId)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink-2 transition-colors outline-none hover:border-brand/50 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {sectionLabel(r.section)}: see its points
                  <ArrowUpRight className="size-3 text-ink-faint" aria-hidden />
                </button>
              </dd>
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
