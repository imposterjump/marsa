"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ChevronDown, CircleCheck, FilterX } from "lucide-react";
import { cn } from "cn";
import { useT, type T } from "@/components/i18n-provider";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { EvidenceChip, SourceChips } from "@/components/results/finding-card";
import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import { RiskPill } from "@/components/ui/status-pill";
import type { AnalysisResultsDto, RiskResultDto, VendorResultDto } from "@/lib/api-types";
import type { ProposalSection, RiskCategory, RiskSeverity } from "@/lib/domain";
import { msg } from "@/lib/i18n/core";
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

function sliceName(f: RiskFilters, t: T) {
  const parts = [
    f.type !== "all" && t(TYPE_TEXT[f.type].label),
    f.section !== "all" && t(sectionLabel(f.section === "none" ? null : f.section)),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "";
}

/** A risk's category as shown, lower case (the risk list capitalises it with CSS). */
const RISK_CATEGORY_TEXT: Record<RiskCategory, string> = {
  technical: msg("technical"),
  infrastructure: msg("infrastructure"),
  security: msg("security"),
  commercial: msg("commercial"),
  legal: msg("legal"),
  schedule: msg("schedule"),
  operational: msg("operational"),
  vendor_capability: msg("vendor capability"),
  compliance: msg("compliance"),
};
/** The category's msg()-marked text: show it with t(riskCategoryText(r.category)). */
export const riskCategoryText = (c: string) =>
  RISK_CATEGORY_TEXT[c as RiskCategory] ?? c.replace(/_/g, " ");

/** "2 critical": a severity's count in a legend (shown with t(…, { n })). */
export const SEVERITY_COUNT: Record<RiskSeverity, string> = {
  critical: msg("{n} critical"),
  high: msg("{n} high"),
  moderate: msg("{n} moderate"),
  low: msg("{n} low"),
};
/** "· critical only" after the count of risks shown. */
const SEVERITY_ONLY: Record<RiskSeverity, string> = {
  critical: msg("critical only"),
  high: msg("high only"),
  moderate: msg("moderate only"),
  low: msg("low only"),
};
/** The empty list when one severity is picked: for the vendor, and within a type or section. */
const NO_SEVERITY_RISKS: Record<RiskSeverity, { all: string; slice: string }> = {
  critical: {
    all: msg("No critical risks for {vendor}"),
    slice: msg("No critical risks for {vendor} in {slice}"),
  },
  high: {
    all: msg("No high risks for {vendor}"),
    slice: msg("No high risks for {vendor} in {slice}"),
  },
  moderate: {
    all: msg("No moderate risks for {vendor}"),
    slice: msg("No moderate risks for {vendor} in {slice}"),
  },
  low: {
    all: msg("No low risks for {vendor}"),
    slice: msg("No low risks for {vendor} in {slice}"),
  },
};
/** Joins a list inside a sentence: "a, b" / "a، b". */
// The right-to-left mark keeps Latin names in reading order in an Arabic list.
export const listSep = (t: T) => (t.locale === "ar" ? "،\u200f " : ", ");

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
  const t = useT();
  // Kept here, outside the folding body, so a vendor keeps its filters while folded.
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const s = v.scores!;
  const all = [...v.risks].sort(byWeight);
  const inSlice = all.filter((r) => matches(r, { ...filters, severity: "all" }));
  const shown = all.filter((r) => matches(r, filters));
  const slice = sliceName(filters, t);
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
              {t.plural(v.risks.length, "{n} risk", "{n} risks")} ·{" "}
              {s.mandatoryNotMet ? (
                <span className="text-fail">
                  {t.plural(
                    s.mandatoryNotMet,
                    "{n} mandatory requirement not met",
                    "{n} mandatory requirements not met",
                  )}
                </span>
              ) : (
                t("all mandatory requirements met")
              )}
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <ul
              aria-label={
                slice
                  ? t("{vendor}: risks, {slice}", { vendor: v.vendor.name, slice })
                  : t("{vendor}: risks", { vendor: v.vendor.name })
              }
              className="grid max-w-xs grid-cols-2 gap-x-5 gap-y-1 text-xs text-ink-2"
            >
              {counts.map(([sev, n]) => (
                <li key={sev} className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ background: RISK_FILL[sev] }}
                  />
                  {t(SEVERITY_COUNT[sev], {
                    n: <span className="font-semibold tabular-nums">{n}</span>,
                  })}
                </li>
              ))}
            </ul>
            <span className="flex items-center gap-3">
              <span className="flex flex-col items-end gap-1 text-end">
                <span className="caption-caps text-ink-muted">{t("Overall risk score")}</span>
                <RiskPill severity={s.riskLevel} size="sm" />
              </span>
              <ScoreRing
                value={s.riskScore}
                color={RISK_FILL[s.riskLevel]}
                text={String(s.riskScore)}
                label={t("{vendor}: overall risk score", { vendor: v.vendor.name })}
              />
            </span>
          </span>
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border/70 bg-surface px-5 py-3">
        <span className="text-xs text-ink-muted">
          {t.plural(
            v.risks.length,
            "Showing {shown} of {n} risks",
            "Showing {shown} of {n} risks",
            {
              shown: <span className="font-semibold text-ink-2 tabular-nums">{shown.length}</span>,
            },
          )}
          {filters.severity !== "all" && ` · ${t(SEVERITY_ONLY[filters.severity])}`}
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
          aria-label={t("{vendor}: risk list", { vendor: v.vendor.name })}
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
            {inSlice.length === 0
              ? slice
                ? t("No data related to {slice}: no risk raised for {vendor} there", {
                    slice,
                    vendor: <span dir="auto">{v.vendor.name}</span>,
                  })
                : t("No data related to this vendor: no risk raised for {vendor}", {
                    vendor: <span dir="auto">{v.vendor.name}</span>,
                  })
              : filters.severity !== "all" &&
                t(NO_SEVERITY_RISKS[filters.severity][slice ? "slice" : "all"], {
                  vendor: <span dir="auto">{v.vendor.name}</span>,
                  slice,
                })}
          </p>
          {inSlice.length > 0 ? (
            <Button
              variant="link"
              size="sm"
              onClick={() => setFilters({ ...filters, severity: "all" })}
            >
              {t("Show every severity")}
            </Button>
          ) : (
            <Button variant="link" size="sm" onClick={reset}>
              {t("Reset filters")}
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
  const t = useT();
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
      aria-label={t("Filters for {vendor}", { vendor })}
      className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto"
    >
      {changed && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <FilterX aria-hidden /> {t("Reset")}
        </Button>
      )}
      <FilterSelect
        label={t("Severity")}
        value={filters.severity}
        onChange={(severity) => set({ severity })}
        className="sm:w-52"
      >
        <SelectItem value="all">
          {t("All severities")} {n(count({ severity: "all" }))}
        </SelectItem>
        {SEVERITY_ORDER.map((sev) => (
          <SelectItem key={sev} value={sev}>
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ background: RISK_FILL[sev] }}
            />
            {t(RISK_SEVERITY_LABEL[sev])} {n(count({ severity: sev }))}
          </SelectItem>
        ))}
      </FilterSelect>
      <FilterSelect
        label={t("Type")}
        value={filters.type}
        onChange={(type) => set({ type })}
        className="sm:w-52"
      >
        <SelectItem value="all">
          {t("All types")} {n(count({ type: "all" }))}
        </SelectItem>
        {(["technical", "commercial"] as const).map((ty) => {
          const Icon = TYPE_TEXT[ty].icon;
          return (
            <SelectItem key={ty} value={ty}>
              <Icon aria-hidden className="text-ink-muted" /> {t(TYPE_TEXT[ty].label)}{" "}
              {n(count({ type: ty }))}
            </SelectItem>
          );
        })}
      </FilterSelect>
      <FilterSelect
        label={t("Section")}
        value={filters.section}
        onChange={(section) => set({ section })}
        className="sm:w-60"
      >
        <SelectItem value="all">
          {t("All sections")} {n(count({ section: "all" }))}
        </SelectItem>
        {sections.map((s) => (
          <SelectItem key={sectionKey(s)} value={sectionKey(s)}>
            {t(sectionLabel(s))} {n(count({ section: sectionKey(s) }))}
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
  const t = useT();
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
              <TypeIcon className="size-3" aria-hidden /> {t(TYPE_TEXT[type].label)}
            </span>
          )}
          <span className="text-xs text-ink-muted">{t(sectionLabel(r.section))}</span>
          <span className="ms-auto text-xs text-ink-muted tabular-nums">
            {t("Likelihood {likelihood}/5 · Impact {impact}/5", {
              likelihood: r.likelihood,
              impact: r.impact,
            })}{" "}
            · <span className="capitalize">{t(riskCategoryText(r.category))}</span>
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
          <span className={cn("me-1.5 font-semibold", TINT[severity].ink)}>
            {t("If it happens:")}
          </span>
          {/* <bdi>: AI text in the other language keeps its own direction and punctuation. */}
          <bdi className="text-ink-2">{r.consequence}</bdi>
        </p>
        <p className={cn("text-[13px] text-ink-2", !open && "line-clamp-2")} dir="auto">
          <span className="me-1.5 font-semibold text-ink">{t("Mitigation:")}</span>
          <bdi>{r.mitigation}</bdi>
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
            {open ? t("Hide details") : t("Details")}
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
                  <dt className="text-xs font-semibold text-ink-muted">{t("Evidence")}</dt>
                  <dd className="text-ink-2 italic" dir="auto">
                    “{r.evidence}”
                  </dd>
                </>
              )}
              {reqs.length > 0 && (
                <>
                  <dt className="text-xs font-semibold text-ink-muted">{t("About")}</dt>
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
              <dt className="text-xs font-semibold text-ink-muted">{t("Section")}</dt>
              <dd>
                <button
                  type="button"
                  onClick={() => onSection(r.section, reqs[0]?.scope, v.proposalId)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink-2 transition-colors outline-none hover:border-brand/50 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {t("{section}: see its points", { section: t(sectionLabel(r.section)) })}
                  <ArrowUpRight className="size-3 text-ink-faint rtl:-scale-x-100" aria-hidden />
                </button>
              </dd>
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
