"use client";

import { useState } from "react";
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
  SECTION_ORDER,
  SectionTitle,
  VendorLabel,
  pctText,
  scopeStats,
  sectionChip,
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

/**
 * Compliance (user's design, "section cards"): the vendors compared section by section of the
 * proposal template. Each section card shows every vendor's standards % and RFP % for that
 * section; the dropdown lists the vendor's points there, shortfalls first, each a summary line
 * with the details, the evidence page and the rule or RFP clause behind "View more".
 */
export function ComplianceTab({
  d,
  colors,
  onEvidence,
}: {
  d: AnalysisResultsDto;
  colors: Map<string, string>;
  onEvidence: OpenEvidence;
}) {
  const [shortOnly, setShortOnly] = useState(false);
  const sections = SECTION_ORDER.filter((s) => d.requirements.some((r) => r.section === s));
  const vendors = d.vendors.filter((v) => v.scores);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Sections" className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <a
              key={s ?? "none"}
              href={`#sec-${s ?? "none"}`}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-2 transition-colors outline-none hover:border-border-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {sectionChip(s)}
            </a>
          ))}
        </nav>
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

      {sections.map((s) => (
        <SectionCard
          key={s ?? "none"}
          d={d}
          section={s}
          vendors={vendors}
          colors={colors}
          shortOnly={shortOnly}
          onEvidence={onEvidence}
        />
      ))}
    </div>
  );
}

function SectionCard({
  d,
  section,
  vendors,
  colors,
  shortOnly,
  onEvidence,
}: {
  d: AnalysisResultsDto;
  section: ProposalSection | null;
  vendors: VendorResultDto[];
  colors: Map<string, string>;
  shortOnly: boolean;
  onEvidence: OpenEvidence;
}) {
  const reqs = d.requirements.filter((r) => r.section === section);
  const rules = reqs.filter((r) => r.scope === "standard").length;
  return (
    <section id={`sec-${section ?? "none"}`} aria-label={sectionLabel(section)} className={cn(card, "scroll-mt-24")}>
      <header className="flex flex-wrap items-end justify-between gap-2 border-b border-border/70 px-5 py-4">
        <SectionTitle section={section} />
        <span className="text-xs text-ink-muted">
          {d.hasStandards && `${rules} standard rule${rules === 1 ? "" : "s"} · `}
          {reqs.length - rules} RFP requirement{reqs.length - rules === 1 ? "" : "s"}
        </span>
      </header>
      <ul className="flex flex-col divide-y divide-border/70">
        {vendors.map((v) => (
          <VendorRow
            key={v.proposalId}
            d={d}
            v={v}
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
  section,
  color,
  shortOnly,
  onEvidence,
}: {
  d: AnalysisResultsDto;
  v: VendorResultDto;
  section: ProposalSection | null;
  color?: string;
  shortOnly: boolean;
  onEvidence: OpenEvidence;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const std = scopeStats(d, v, { section, scope: "standard" });
  const rfp = scopeStats(d, v, { section, scope: "rfp" });
  const all = scopeStats(d, v, { section });
  const short = all.counts.non_compliant + all.counts.not_addressed + all.counts.partial;
  const reqs = new Map(d.requirements.map((r) => [r.id, r]));
  const points = v.findings
    .filter((f) => reqs.get(f.requirementId)?.section === section)
    .filter((f) => !shortOnly || f.status !== "compliant")
    .sort((a, b) => SHORT_FIRST[a.status] - SHORT_FIRST[b.status]);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full grid-cols-1 items-center gap-3 px-5 py-4 text-start outline-none transition-colors hover:bg-surface-muted/50 focus-visible:bg-surface-muted md:grid-cols-[minmax(160px,1.2fr)_1fr_1fr_auto]"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <VendorLabel v={v} color={color} />
          <span className="ps-[4.25rem] text-xs text-ink-muted">
            {short ? `${short} point${short === 1 ? "" : "s"} short` : "Everything met"}
          </span>
        </span>
        {d.hasStandards && (
          <Metric icon={ShieldCheck} label="Standards" pct={std.pct} total={std.total} />
        )}
        <Metric icon={FileText} label="RFP" pct={rfp.pct} total={rfp.total} className={!d.hasStandards ? "md:col-span-2" : undefined} />
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
              <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-surface px-4 py-3">
                <span className="text-xs font-medium text-ink-muted">
                  {v.vendor.name} in this section · {all.total} point{all.total === 1 ? "" : "s"}
                </span>
                <GapBar counts={all.counts} />
                <CountsLegend counts={all.counts} label={`${v.vendor.name}: points in this section`} />
              </div>
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

function Metric({
  icon: Icon,
  label,
  pct,
  total,
  className,
}: {
  icon: typeof ShieldCheck;
  label: string;
  pct: number | null;
  total: number;
  className?: string;
}) {
  return (
    <span className={cn("flex flex-col gap-1.5", className)}>
      <span className="flex items-baseline justify-between gap-2 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <Icon className="size-3.5" aria-hidden /> {label}
          {total > 0 && <span className="text-ink-faint">· {total}</span>}
        </span>
        <span className="text-base font-semibold text-ink tabular-nums">{total ? pctText(pct) : "—"}</span>
      </span>
      <MeterBar value={total ? pct : null} fill={COMPLIANCE_FILL} label={`${label} compliance`} />
    </span>
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
