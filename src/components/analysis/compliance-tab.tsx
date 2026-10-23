"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, FileText, ShieldCheck } from "lucide-react";
import { cn } from "cn";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { FindingCard } from "@/components/results/finding-card";
import { STATUS_FILL } from "@/components/results/gap-bar";
import type { AnalysisResultsDto, FindingResultDto, VendorResultDto } from "@/lib/api-types";
import type { FindingStatus, ProposalSection } from "@/lib/domain";
import { FINDING_STATUS_LABEL } from "@/lib/labels";
import {
  COMPLIANCE_FILL,
  CountsLegend,
  MeterBar,
  type OpenEvidence,
  type Scope,
  SECTION_ORDER,
  SectionTitle,
  VendorLabel,
  pctText,
  scopeStats,
  sectionLabel,
  vendorDocRefs,
} from "./shared";

const card = "rounded-xl border border-border bg-surface shadow-sm";
/** The status pills in a vendor's dropdown, worst first. */
const STATUS_PILLS: FindingStatus[] = ["non_compliant", "partial", "not_addressed", "compliant"];
const SHORT_FIRST: Record<FindingStatus, number> = {
  non_compliant: 0,
  not_addressed: 1,
  partial: 2,
  compliant: 3,
};

const SCOPE_TEXT: Record<Scope, { tab: string; unit: [string, string]; none: string; icon: typeof FileText }> = {
  rfp: {
    tab: "RFP",
    unit: ["RFP requirement", "RFP requirements"],
    none: "No RFP requirement falls in these sections",
    icon: FileText,
  },
  standard: {
    tab: "Standards",
    unit: ["standard rule", "standard rules"],
    none: "No standard rule falls in these sections",
    icon: ShieldCheck,
  },
};

export interface ComplianceFocus {
  section: ProposalSection | null;
  scope: Scope;
  at: number;
}

/**
 * The RFP tab and the Standards tab (user's design, 2026-10-23): the same section cards, one tab
 * per kind of point, so a section never shows an empty half. Sections with points come first in
 * template order; the sections this tab has nothing about are listed once at the end. In a card
 * every vendor has its % for that section and a dropdown of its points, shortfalls first.
 */
export function ComplianceTab({
  scope,
  d,
  colors,
  onEvidence,
  focus,
}: {
  scope: Scope;
  d: AnalysisResultsDto;
  colors: Map<string, string>;
  onEvidence: OpenEvidence;
  /** A section to bring into view (from a risk's "see its points"). */
  focus?: ComplianceFocus | null;
}) {
  const reduce = useReducedMotion();
  const vendors = d.vendors.filter((v) => v.scores);
  const inScope = d.requirements.filter((r) => r.scope === scope);
  const withData = SECTION_ORDER.filter((s) => inScope.some((r) => r.section === s));
  const empty = SECTION_ORDER.filter((s) => s !== null && !withData.includes(s));
  const Icon = SCOPE_TEXT[scope].icon;
  const [one, many] = SCOPE_TEXT[scope].unit;

  useEffect(() => {
    if (!focus || focus.scope !== scope) return;
    const el = document.getElementById(`sec-${focus.section ?? "none"}`);
    const raf = requestAnimationFrame(() =>
      el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }),
    );
    return () => cancelAnimationFrame(raf);
  }, [focus, reduce, scope]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] text-ink-muted">
          <Icon className="size-4" aria-hidden />
          {inScope.length} {inScope.length === 1 ? one : many}
          {scope === "standard" && d.standards.length > 0 && ` from ${d.standards.map((s) => s.code).join(", ")}`}, by
          proposal section
        </p>
      </div>

      {withData.length > 1 && (
        <nav aria-label="Sections" className="flex flex-wrap gap-2">
          {withData.map((s) => (
            <a
              key={s ?? "none"}
              href={`#sec-${s ?? "none"}`}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-2 transition-colors outline-none hover:border-border-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {sectionLabel(s)}
            </a>
          ))}
        </nav>
      )}

      {withData.map((s) => (
        <SectionCard
          key={`${scope}-${s ?? "none"}`}
          d={d}
          scope={scope}
          section={s}
          vendors={vendors}
          colors={colors}
          onEvidence={onEvidence}
          pulse={focus?.section === s && focus.scope === scope}
        />
      ))}

      {empty.length > 0 && (
        <section
          aria-label={SCOPE_TEXT[scope].none}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-border-strong/70 px-5 py-4"
        >
          <span className="text-[13px] text-ink-muted">{SCOPE_TEXT[scope].none}:</span>
          {empty.map((s) => (
            <span key={s} className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-muted">
              {sectionLabel(s)}
            </span>
          ))}
        </section>
      )}
    </div>
  );
}

function SectionCard({
  d,
  scope,
  section,
  vendors,
  colors,
  onEvidence,
  pulse,
}: {
  d: AnalysisResultsDto;
  scope: Scope;
  section: ProposalSection | null;
  vendors: VendorResultDto[];
  colors: Map<string, string>;
  onEvidence: OpenEvidence;
  pulse?: boolean;
}) {
  const n = d.requirements.filter((r) => r.section === section && r.scope === scope).length;
  const [one, many] = SCOPE_TEXT[scope].unit;
  return (
    <section
      id={`sec-${section ?? "none"}`}
      aria-label={sectionLabel(section)}
      className={cn(card, "scroll-mt-24", pulse && "marsa-pulse")}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-5 py-4">
        <SectionTitle section={section} />
        <span className="text-xs text-ink-muted">
          {n} {n === 1 ? one : many}
        </span>
      </header>
      <ul className="flex flex-col divide-y divide-border/70">
        {vendors.map((v) => (
          <VendorRow
            key={v.proposalId}
            d={d}
            v={v}
            scope={scope}
            section={section}
            color={colors.get(v.proposalId)}
              onEvidence={onEvidence}
          />
        ))}
      </ul>
    </section>
  );
}

function VendorRow({
  d,
  v,
  scope,
  section,
  color,
  onEvidence,
}: {
  d: AnalysisResultsDto;
  v: VendorResultDto;
  scope: Scope;
  section: ProposalSection | null;
  color?: string;
  onEvidence: OpenEvidence;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const st = scopeStats(d, v, { section, scope });
  const short = st.counts.non_compliant + st.counts.not_addressed + st.counts.partial;
  const reqs = new Map(d.requirements.map((r) => [r.id, r]));
  const points = v.findings
    .filter((f) => {
      const r = reqs.get(f.requirementId);
      return r?.section === section && r.scope === scope;
    })
    .sort((a, b) => SHORT_FIRST[a.status] - SHORT_FIRST[b.status]);
  // One status at a time (user, 2026-10-23: "3 pills to choose which one to display so if there
  // is 77 rules i dont have to scroll"). Opens on the worst status that has points.
  const [picked, setPicked] = useState<FindingStatus | null>(null);
  const byStatus = (s: FindingStatus) => points.filter((f) => f.status === s);
  const active = picked ?? STATUS_PILLS.find((s) => byStatus(s).length > 0) ?? "compliant";
  const shown = byStatus(active);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full grid-cols-1 items-center gap-x-6 gap-y-3 px-5 py-4 text-start outline-none transition-colors hover:bg-surface-muted/50 focus-visible:bg-surface-muted md:grid-cols-[minmax(200px,1fr)_minmax(0,2fr)_auto]"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <VendorLabel v={v} color={color} />
          <span className="ps-[4.25rem] text-xs text-ink-muted">
            {short ? `${short} point${short === 1 ? "" : "s"} short` : "Everything met"}
            {st.mandatoryNotMet > 0 && (
              <span className="text-fail">
                {" "}
                · {st.mandatoryNotMet} mandatory not met
              </span>
            )}
          </span>
        </span>
        <span className="flex flex-col gap-2">
          <span className="flex items-center gap-3">
            <MeterBar value={st.total ? st.pct : null} fill={COMPLIANCE_FILL} label={`${v.vendor.name} compliance`} className="flex-1" />
            <span className="w-16 text-end text-lg font-semibold text-ink tabular-nums">{pctText(st.pct)}</span>
          </span>
          <CountsLegend counts={st.counts} label={`${v.vendor.name}: points in this section`} />
        </span>
        <ChevronDown
          aria-hidden
          className={cn("size-5 justify-self-end text-ink-muted transition-transform", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT_QUINT }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 bg-surface-muted/40 px-5 pt-1 pb-5">
              <div role="radiogroup" aria-label={`${v.vendor.name}: show points`} className="flex flex-wrap gap-2">
                {STATUS_PILLS.map((s) => {
                  const n = byStatus(s).length;
                  const on = s === active;
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={n === 0}
                      onClick={() => setPicked(s)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-45",
                        on
                          ? "border-ink bg-ink text-surface"
                          : "border-border bg-surface text-ink-2 enabled:hover:border-border-strong",
                      )}
                    >
                      <span aria-hidden className={cn("size-2 rounded-full", STATUS_FILL[s])} />
                      {FINDING_STATUS_LABEL[s]}
                      <span
                        className={cn(
                          "rounded-full px-1.5 tabular-nums",
                          on ? "bg-surface/20 text-surface" : "bg-surface-muted text-ink-muted",
                        )}
                      >
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>
              {shown.length === 0 ? (
                <p className="text-[13px] text-ink-muted">No points in this section.</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {shown.map((f) => (
                    <PointCard key={f.id} d={d} v={v} f={f} onEvidence={onEvidence} />
                  ))}
                </ol>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function PointCard({
  d,
  v,
  f,
  onEvidence,
}: {
  d: AnalysisResultsDto;
  v: VendorResultDto;
  f: FindingResultDto;
  onEvidence: OpenEvidence;
}) {
  const req = d.requirements.find((r) => r.id === f.requirementId);
  const sources = d.sources[f.requirementId] ?? [];
  const isRule = req?.scope === "standard";
  return (
    <FindingCard
      f={f}
      req={req}
      code={isRule ? req!.sourceRef : f.code}
      title={f.headline}
      priority={req?.priority}
      sources={sources}
      sourceLabel={isRule ? "Breaks rule" : "Breaks clause"}
      vendorDocs={vendorDocRefs(v)}
      onEvidence={(id, page, quote) => onEvidence(id, page, quote, v.proposalId)}
      note={req ? `${isRule ? "Standard rule" : "RFP"} · ${req.title}` : undefined}
    />
  );
}
