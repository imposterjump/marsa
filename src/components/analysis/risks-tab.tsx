"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { RiskPill } from "@/components/ui/status-pill";
import type { AnalysisResultsDto, RiskResultDto, VendorResultDto } from "@/lib/api-types";
import type { ProposalSection, RiskSeverity } from "@/lib/domain";
import { maxSeverity } from "@/lib/scoring";
import {
  MeterBar,
  RISK_FILL,
  SECTION_ORDER,
  SEVERITY_ORDER,
  SectionTitle,
  VendorLabel,
  sectionChip,
  sectionLabel,
} from "./shared";

const card = "rounded-xl border border-border bg-surface shadow-sm";
const SEVERITY_RANK: Record<RiskSeverity, number> = { critical: 0, high: 1, moderate: 2, low: 3 };
const byWeight = (a: RiskResultDto, b: RiskResultDto) =>
  SEVERITY_RANK[a.severity as RiskSeverity] - SEVERITY_RANK[b.severity as RiskSeverity] ||
  b.likelihood * b.impact - a.likelihood * a.impact;

/**
 * Risks (user's design: divided like Compliance). Top: every vendor's 0–100 risk score. Then one
 * card per proposal section ("Section 1 · Company & references"), and in it every vendor's risks
 * for that section: count, highest severity, its top risk, a severity line, and a dropdown with
 * the risk cards (details behind "View more").
 */
export function RisksTab({ d, colors }: { d: AnalysisResultsDto; colors: Map<string, string> }) {
  const vendors = d.vendors.filter((v) => v.scores);
  const sections = SECTION_ORDER.filter(
    (s) => vendors.some((v) => v.risks.some((r) => r.section === s)) || (s !== null && d.requirements.some((r) => r.section === s)),
  );

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Risk scores"
        className={cn(card, "grid gap-px overflow-hidden bg-border")}
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
      >
        {[...vendors]
          .sort((a, b) => a.scores!.riskScore - b.scores!.riskScore)
          .map((v) => (
            <div key={v.proposalId} className="flex flex-col gap-3 bg-surface p-5">
              <VendorLabel v={v} color={colors.get(v.proposalId)} />
              <div className="flex items-baseline gap-2">
                <span className="kpi text-[34px] text-ink">{v.scores!.riskScore}</span>
                <span className="text-sm text-ink-muted">/100</span>
                <span className="ms-auto">
                  <RiskPill severity={v.scores!.riskLevel} size="sm" />
                </span>
              </div>
              <MeterBar value={v.scores!.riskScore} fill={RISK_FILL[v.scores!.riskLevel]} label={`${v.vendor.name} risk score`} />
              <span className="text-xs text-ink-muted">
                {v.risks.length} risks ·{" "}
                {v.scores!.mandatoryNotMet
                  ? `${v.scores!.mandatoryNotMet} mandatory requirements not met`
                  : "all mandatory requirements met"}
              </span>
            </div>
          ))}
      </section>

      <nav aria-label="Sections" className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <a
            key={s ?? "none"}
            href={`#risk-${s ?? "none"}`}
            className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-2 transition-colors outline-none hover:border-border-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {sectionChip(s)}
          </a>
        ))}
      </nav>

      {sections.map((s) => (
        <SectionCard key={s ?? "none"} section={s} vendors={vendors} colors={colors} />
      ))}
    </div>
  );
}

function SectionCard({
  section,
  vendors,
  colors,
}: {
  section: ProposalSection | null;
  vendors: VendorResultDto[];
  colors: Map<string, string>;
}) {
  const all = vendors.flatMap((v) => v.risks.filter((r) => r.section === section));
  const top = all.length ? maxSeverity(all.map((r) => r.severity)) : null;
  return (
    <section id={`risk-${section ?? "none"}`} aria-label={sectionLabel(section)} className={cn(card, "scroll-mt-24")}>
      <header className="flex flex-wrap items-end justify-between gap-2 border-b border-border/70 px-5 py-4">
        <SectionTitle section={section} />
        <span className="flex items-center gap-2 text-xs text-ink-muted">
          {all.length ? `${all.length} risk${all.length === 1 ? "" : "s"} across ${vendors.length} vendors` : "No risks raised"}
          {top && (
            <>
              <span aria-hidden>·</span> highest <RiskPill severity={top} size="sm" />
            </>
          )}
        </span>
      </header>
      <ul className="flex flex-col divide-y divide-border/70">
        {vendors.map((v) => (
          <VendorRisks key={v.proposalId} v={v} section={section} color={colors.get(v.proposalId)} />
        ))}
      </ul>
    </section>
  );
}

function VendorRisks({
  v,
  section,
  color,
}: {
  v: VendorResultDto;
  section: ProposalSection | null;
  color?: string;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const list = v.risks.filter((r) => r.section === section).sort(byWeight);
  const counts = SEVERITY_ORDER.map((s) => [s, list.filter((r) => r.severity === s).length] as const);
  const top = list[0];

  return (
    <li>
      <button
        type="button"
        onClick={() => list.length && setOpen((o) => !o)}
        aria-expanded={list.length ? open : undefined}
        disabled={!list.length}
        className="grid w-full grid-cols-1 items-center gap-3 px-5 py-4 text-start outline-none transition-colors enabled:hover:bg-surface-muted/50 focus-visible:bg-surface-muted md:grid-cols-[minmax(200px,1.2fr)_2fr_auto]"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <VendorLabel v={v} color={color} />
          <span className="truncate ps-[4.25rem] text-xs text-ink-muted" dir="auto">
            {top ? `Top risk: ${top.title}` : "No risk in this section"}
          </span>
        </span>
        <span className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between gap-2 text-xs text-ink-muted">
            <span>
              {list.length
                ? counts
                    .filter(([, n]) => n)
                    .map(([s, n]) => `${n} ${s}`)
                    .join(" · ")
                : "Nothing raised"}
            </span>
            {top && <RiskPill severity={top.severity as RiskSeverity} size="sm" />}
          </span>
          <span className="flex h-2 w-full gap-[2px]" role="img" aria-label={counts.map(([s, n]) => `${n} ${s}`).join(", ")}>
            {list.length ? (
              counts
                .filter(([, n]) => n)
                .map(([s, n]) => (
                  <span key={s} className="h-full min-w-1.5 rounded-full" style={{ flexGrow: n, background: RISK_FILL[s] }} />
                ))
            ) : (
              <span className="h-full w-full rounded-full bg-surface-muted" />
            )}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn("size-5 justify-self-end text-ink-muted transition-transform", open && "rotate-180", !list.length && "opacity-0")}
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
            <ol className="grid gap-3 bg-surface-muted/40 px-5 pt-1 pb-5 lg:grid-cols-2">
              {list.map((r) => (
                <RiskCard key={r.id} r={r} />
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function RiskCard({ r }: { r: RiskResultDto }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={cn(card, "flex flex-col gap-2.5 p-4 text-[13px]")}>
      <div className="flex flex-wrap items-start gap-2">
        <RiskPill severity={r.severity as RiskSeverity} size="sm" />
        <span className="min-w-0 flex-1 text-sm font-medium text-ink" dir="auto">
          {r.title}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
        <span className="tabular-nums">
          Likelihood {r.likelihood}/5 · Impact {r.impact}/5
        </span>
        <span>{r.category.replace(/_/g, " ")}</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="ms-auto inline-flex items-center gap-1 rounded-sm font-medium text-brand-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {open ? "View less" : "View more"}
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </div>
      {open && (
        <dl className="grid gap-x-4 gap-y-2 border-t border-border/70 pt-3 sm:grid-cols-[7rem_1fr]">
          <dt className="text-xs font-semibold text-ink-muted">If it happens</dt>
          <dd className="text-ink-2" dir="auto">
            {r.consequence}
          </dd>
          <dt className="text-xs font-semibold text-ink-muted">What</dt>
          <dd className="text-ink-2" dir="auto">
            {r.description}
          </dd>
          <dt className="text-xs font-semibold text-ink-muted">Mitigation</dt>
          <dd className="text-ink-2" dir="auto">
            {r.mitigation}
          </dd>
          {r.evidence && (
            <>
              <dt className="text-xs font-semibold text-ink-muted">Evidence</dt>
              <dd className="text-ink-2 italic" dir="auto">
                {r.evidence}
              </dd>
            </>
          )}
          {r.requirementCodes.length > 0 && (
            <>
              <dt className="text-xs font-semibold text-ink-muted">Requirements</dt>
              <dd className="font-mono text-xs text-ink-2">{r.requirementCodes.join(", ")}</dd>
            </>
          )}
        </dl>
      )}
    </li>
  );
}
