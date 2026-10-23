"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, FileText, ShieldCheck } from "lucide-react";
import { cn } from "cn";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { FindingCard } from "@/components/results/finding-card";
import { GapBar } from "@/components/results/gap-bar";
import type { AnalysisResultsDto, FindingResultDto, VendorResultDto } from "@/lib/api-types";
import type { FindingStatus, ProposalSection } from "@/lib/domain";
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
 * Compliance (user's design, refined 2026-10-23): the RFP and the standards are two views, each
 * with its own section cards, so a section never shows an empty half. Sections with points come
 * first in template order; sections the view has nothing about are listed once at the end. In a
 * card every vendor has its % for that section and a dropdown of its points, shortfalls first.
 */
export function ComplianceTab({
  d,
  colors,
  onEvidence,
  focus,
}: {
  d: AnalysisResultsDto;
  colors: Map<string, string>;
  onEvidence: OpenEvidence;
  /** A section to bring into view (from a risk's "see its points in Compliance"). */
  focus?: ComplianceFocus | null;
}) {
  const reduce = useReducedMotion();
  const [scope, setScope] = useState<Scope>(focus?.scope ?? "rfp");
  const [shortOnly, setShortOnly] = useState(false);
  const vendors = d.vendors.filter((v) => v.scores);
  const inScope = d.requirements.filter((r) => r.scope === scope);
  const withData = SECTION_ORDER.filter((s) => inScope.some((r) => r.section === s));
  const empty = SECTION_ORDER.filter((s) => s !== null && !withData.includes(s));
  const scopes: Scope[] = d.hasStandards ? ["rfp", "standard"] : ["rfp"];

  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById(`sec-${focus.section ?? "none"}`);
    const raf = requestAnimationFrame(() =>
      el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }),
    );
    return () => cancelAnimationFrame(raf);
  }, [focus, reduce]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {scopes.length > 1 ? (
          <div role="radiogroup" aria-label="Checked against" className="flex rounded-xl border border-border bg-surface p-1">
            {scopes.map((s) => {
              const n = d.requirements.filter((r) => r.scope === s).length;
              const Icon = SCOPE_TEXT[s].icon;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={scope === s}
                  onClick={() => setScope(s)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    scope === s ? "bg-ink text-surface" : "text-ink-muted hover:text-ink",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {SCOPE_TEXT[s].tab}
                  <span className={cn("text-xs tabular-nums", scope === s ? "text-surface/70" : "text-ink-faint")}>
                    {n} {n === 1 ? SCOPE_TEXT[s].unit[0] : SCOPE_TEXT[s].unit[1]}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <span />
        )}
        <div role="radiogroup" aria-label="Points shown" className="flex rounded-full border border-border bg-surface p-1 text-[13px]">
          {[
            [false, "All points"],
            [true, "Shortfalls only"],
          ].map(([v, label]) => (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={shortOnly === v}
              onClick={() => setShortOnly(v as boolean)}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                shortOnly === v ? "bg-ink text-surface" : "text-ink-muted hover:text-ink",
              )}
            >
              {label as string}
            </button>
          ))}
        </div>
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
          shortOnly={shortOnly}
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
  shortOnly,
  onEvidence,
  pulse,
}: {
  d: AnalysisResultsDto;
  scope: Scope;
  section: ProposalSection | null;
  vendors: VendorResultDto[];
  colors: Map<string, string>;
  shortOnly: boolean;
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
            shortOnly={shortOnly}
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
  shortOnly,
  onEvidence,
}: {
  d: AnalysisResultsDto;
  v: VendorResultDto;
  scope: Scope;
  section: ProposalSection | null;
  color?: string;
  shortOnly: boolean;
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
    .filter((f) => !shortOnly || f.status !== "compliant")
    .sort((a, b) => SHORT_FIRST[a.status] - SHORT_FIRST[b.status]);

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
              <GapBar counts={st.counts} className="max-w-md" />
              {points.length === 0 ? (
                <p className="text-[13px] text-ink-muted">Nothing short in this section.</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {points.map((f) => (
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
