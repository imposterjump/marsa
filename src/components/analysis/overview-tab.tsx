"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUp,
  Check,
  ChevronRight,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Trophy,
} from "lucide-react";
import { cn } from "cn";
import { CountUp } from "@/components/motion/count-up";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { RiskPill } from "@/components/ui/status-pill";
import type { AnalysisResultsDto, VendorResultDto } from "@/lib/api-types";
import type { FindingStatus } from "@/lib/domain";
import {
  CountsLegend,
  MeterBar,
  RISK_FILL,
  SEVERITY_ORDER,
  ScoreRing,
  VendorLabel,
  pctText,
  pctTone,
} from "./shared";

const card = "rounded-xl border border-border bg-surface shadow-sm";
/** Overview bars show the missing share too (user, 2026-10-25): a track that reads on the card. */
const track = "bg-border";

export type OverviewTarget = "standards" | "rfp" | "risks";

/**
 * Overview (user's design): the recommended vendor in a big box beside three mini boxes of the
 * same total height (RFP %, Standards %, risk score); then one row per vendor for the RFP, the
 * standards and the risks (user, 2026-10-25: RFP first), each with a bar filled to its number and the number in a ring. A section
 * title opens its tab.
 */
export function OverviewTab({
  d,
  colors,
  onOpen,
}: {
  d: AnalysisResultsDto;
  colors: Map<string, string>;
  onOpen: (tab: OverviewTarget) => void;
}) {
  const analysed = d.vendors.filter((v) => v.scores);
  const pick =
    d.vendors.find((v) => v.proposalId === d.recommendation?.proposalId && v.scores) ?? analysed[0];

  return (
    <div className="flex flex-col gap-10">
      {pick && <Hero d={d} v={pick} />}

      <ScopeSection
        title="RFP compliance"
        icon={FileText}
        note={`${d.requirements.filter((r) => r.scope === "rfp").length} requirements`}
        onOpen={() => onOpen("rfp")}
        rows={[...analysed]
          .sort((a, b) => b.scores!.rfpPct - a.scores!.rfpPct)
          .map((v) => ({ v, pct: v.scores!.rfpPct, counts: v.rfpCounts, unit: "requirements" }))}
        colors={colors}
      />
      {d.hasStandards && (
        <ScopeSection
          title="Standards compliance"
          icon={ShieldCheck}
          note={d.standards.map((s) => s.code).join(" · ")}
          onOpen={() => onOpen("standards")}
          rows={[...analysed]
            .sort((a, b) => (b.scores!.standardsPct ?? 0) - (a.scores!.standardsPct ?? 0))
            .map((v) => ({
              v,
              pct: v.scores!.standardsPct,
              counts: v.standardsCounts,
              unit: "rules",
            }))}
          colors={colors}
        />
      )}
      <RiskSection
        vendors={[...analysed].sort((a, b) => a.scores!.riskScore - b.scores!.riskScore)}
        colors={colors}
        onOpen={() => onOpen("risks")}
      />
    </div>
  );
}

/**
 * The recommendation as the page's RTA featured card (user, 2026-10-25: white like the rest of the
 * page, but reading as the overall choice): thin gradient border, a faint warm wash, and the
 * overall score as the page's one gradient number.
 */
function Hero({ d, v }: { d: AnalysisResultsDto; v: VendorResultDto }) {
  const reduce = useReducedMotion();
  const s = v.scores!;
  const ranked = d.vendors.filter((x) => x.scores);
  const runnerUp = ranked.find((x) => x.proposalId !== v.proposalId);
  const lead = runnerUp ? Math.round((s.overall - runnerUp.scores!.overall) * 10) / 10 : null;
  const price = v.commercial.totalPrice?.replace(/[\s,;.]+$/, "");
  return (
    <section aria-label="Recommended vendor" className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT_QUINT }}
        className="rta-featured relative flex flex-col gap-6 overflow-hidden rounded-xl p-5 shadow-md sm:p-7"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -end-20 -top-20 h-72 w-[26rem]"
          style={{
            background:
              "linear-gradient(135deg, rgb(236 28 36 / 0.09), rgb(255 138 92 / 0.05) 60%, transparent 85%)",
            clipPath: "polygon(100% 0, 0 18%, 100% 92%)",
          }}
        />
        <div className="relative flex items-center justify-between gap-3">
          <span className="caption-caps flex items-center gap-2 text-ink-muted">
            <Trophy className="size-3.5 text-brand" aria-hidden /> Recommended vendor
          </span>
          <span className="inline-flex h-6 items-center rounded-full bg-brand-soft px-2.5 text-xs font-bold text-brand-ink">
            Rank 1 of {ranked.length}
          </span>
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="flex min-w-0 items-center gap-4">
            <InitialsAvatar name={v.vendor.name} size="lg" />
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="truncate font-heading text-3xl font-semibold tracking-tight text-ink" dir="auto">
                {v.vendor.name}
              </h2>
              <p className="text-sm text-ink-muted">
                {[v.vendor.country, price].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <span className="caption-caps text-ink-muted">Overall score</span>
            <span className="flex items-baseline gap-1.5">
              <span className="kpi text-rta text-[56px]">
                <CountUp value={s.overall} decimals={Number.isInteger(s.overall) ? 0 : 1} />
              </span>
              <span className="text-sm text-ink-muted">/100</span>
            </span>
            {runnerUp && lead !== null && lead > 0 && (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok">
                <ArrowUp className="size-3.5" aria-hidden />
                {lead} points ahead of <span dir="auto">{runnerUp.vendor.name}</span>
              </span>
            )}
          </div>
        </div>

        {s.mandatoryNotMet > 0 && (
          <p className="relative flex items-center gap-2 text-sm font-medium text-fail">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            {s.mandatoryNotMet} mandatory requirement{s.mandatoryNotMet === 1 ? "" : "s"} still to fix
          </p>
        )}

        {(d.recommendation?.summary || v.strengths.length > 0) && (
          <div className="relative flex flex-col gap-4 border-t border-border pt-5">
            {d.recommendation?.summary && (
              <div className="flex flex-col gap-1.5">
                <span className="caption-caps flex items-center gap-1.5 text-ink-muted">
                  <Sparkles className="size-3.5" aria-hidden /> Why this vendor · AI-generated
                </span>
                <p className="max-w-3xl text-[15px] leading-relaxed text-ink-2" dir="auto">
                  {d.recommendation.summary}
                </p>
              </div>
            )}
            {v.strengths.length > 0 && (
              <ul aria-label="Strengths" className="flex flex-col gap-1.5 text-sm text-ink-2">
                {v.strengths.slice(0, 3).map((x) => (
                  <li key={x} className="flex items-start gap-2" dir="auto">
                    <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:grid-rows-3">
        <MiniBox
          label="RFP compliance"
          value={s.rfpPct}
          suffix="%"
          bar={<MeterBar value={s.rfpPct} fill={pctTone(s.rfpPct)} className={track} label="RFP compliance" />}
        />
        <MiniBox
          label="Standards compliance"
          value={s.standardsPct}
          suffix="%"
          bar={<MeterBar value={s.standardsPct} fill={pctTone(s.standardsPct)} className={track} label="Standards compliance" />}
          empty="No standards applied"
        />
        <MiniBox
          label="Risk score"
          value={s.riskScore}
          suffix="/100"
          extra={<RiskPill severity={s.riskLevel} size="sm" />}
          bar={<MeterBar value={s.riskScore} fill={RISK_FILL[s.riskLevel]} className={track} label="Risk score" />}
        />
      </div>
    </section>
  );
}

function MiniBox({
  label,
  value,
  suffix,
  bar,
  extra,
  empty,
}: {
  label: string;
  value: number | null;
  suffix: string;
  bar: React.ReactNode;
  extra?: React.ReactNode;
  empty?: string;
}) {
  return (
    <div className={cn(card, "flex flex-col justify-center gap-2.5 px-5 py-4")}>
      <span className="caption-caps text-ink-muted">{label}</span>
      {value === null ? (
        <span className="text-sm text-ink-muted">{empty}</span>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="kpi text-[34px] text-ink">
            <CountUp value={value} decimals={Number.isInteger(value) ? 0 : 1} />
          </span>
          <span className="text-sm text-ink-muted">{suffix}</span>
          {extra && <span className="ms-auto">{extra}</span>}
        </div>
      )}
      {bar}
    </div>
  );
}

/** A section's title is a button to its tab (user, 2026-10-25: "for easier navigation"). */
function SectionHeader({
  title,
  icon: Icon,
  note,
  onOpen,
}: {
  title: string;
  icon: typeof ShieldCheck;
  note: string;
  onOpen: () => void;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-2">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-semibold text-ink">
          <button
            type="button"
            onClick={onOpen}
            className="group inline-flex items-center gap-2 rounded-md transition-colors hover:text-brand-ink"
          >
            <Icon className="size-5 text-ink-muted transition-colors group-hover:text-brand-ink" aria-hidden />
            {title}
            <ChevronRight
              className="size-4 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-ink rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              aria-hidden
            />
          </button>
        </h2>
        <span aria-hidden className="rta-rule" />
      </div>
      <span className="text-xs text-ink-muted">{note}</span>
    </header>
  );
}

function ScopeSection({
  title,
  icon,
  note,
  onOpen,
  rows,
  colors,
}: {
  title: string;
  icon: typeof ShieldCheck;
  note: string;
  onOpen: () => void;
  rows: {
    v: VendorResultDto;
    pct: number | null;
    counts: Record<FindingStatus, number>;
    unit: string;
  }[];
  colors: Map<string, string>;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <SectionHeader title={title} icon={icon} note={note} onOpen={onOpen} />
      <ul className={cn(card, "flex flex-col divide-y divide-border/70")}>
        {rows.map(({ v, pct, counts, unit }) => (
          <li key={v.proposalId} className="flex items-center gap-5 px-5 py-4">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <VendorLabel v={v} color={colors.get(v.proposalId)} />
              {/* The ring below is the meter; the bar repeats it for the eye. */}
              <div aria-hidden>
                <MeterBar value={pct} fill={pctTone(pct)} className={track} label={title} />
              </div>
              <CountsLegend counts={counts} label={`${v.vendor.name}: ${unit}`} />
            </div>
            <ScoreRing
              value={pct}
              color={pctTone(pct)}
              text={pctText(pct)}
              label={`${v.vendor.name}: ${title}`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RiskSection({
  vendors,
  colors,
  onOpen,
}: {
  vendors: VendorResultDto[];
  colors: Map<string, string>;
  onOpen: () => void;
}) {
  return (
    <section aria-label="Risks" className="flex flex-col gap-4">
      <SectionHeader
        title="Risks"
        icon={ShieldAlert}
        note="Risk score 0–100, lower is better"
        onOpen={onOpen}
      />
      <ul className={cn(card, "flex flex-col divide-y divide-border/70")}>
        {vendors.map((v) => {
          const { riskScore, riskLevel } = v.scores!;
          return (
            <li key={v.proposalId} className="flex items-center gap-5 px-5 py-4">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <VendorLabel v={v} color={colors.get(v.proposalId)} />
                  <RiskPill severity={riskLevel} size="sm" />
                </div>
                <div aria-hidden>
                  <MeterBar value={riskScore} fill={RISK_FILL[riskLevel]} className={track} label="Risk score" />
                </div>
                <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2" aria-label={`${v.vendor.name}: risks`}>
                  {SEVERITY_ORDER.map((s) => (
                    <li key={s} className="inline-flex items-center gap-1.5">
                      <span aria-hidden className="size-2 rounded-full" style={{ background: RISK_FILL[s] }} />
                      <span className="font-semibold tabular-nums">{v.riskCounts[s]}</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Risk keeps its level colours (lower is better), not the compliance bands. */}
              <ScoreRing
                value={riskScore}
                color={RISK_FILL[riskLevel]}
                text={String(riskScore)}
                label={`${v.vendor.name}: risk score`}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
