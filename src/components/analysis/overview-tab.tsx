"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, FileText, ShieldAlert, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { cn } from "cn";
import { CountUp } from "@/components/motion/count-up";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { GapBar } from "@/components/results/gap-bar";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { RiskPill } from "@/components/ui/status-pill";
import type { AnalysisResultsDto, VendorResultDto } from "@/lib/api-types";
import type { FindingStatus } from "@/lib/domain";
import {
  COMPLIANCE_FILL,
  CountsLegend,
  MeterBar,
  RISK_FILL,
  SEVERITY_ORDER,
  VendorLabel,
  pctText,
} from "./shared";

const card = "rounded-xl border border-border bg-surface shadow-sm";

/**
 * Overview (user's design): the recommended vendor in a big box beside three mini boxes of the
 * same total height (Standards %, RFP %, risk score); then one row per vendor for the standards,
 * the RFP and the risks, each with its number and a coloured line.
 */
export function OverviewTab({
  d,
  colors,
}: {
  d: AnalysisResultsDto;
  colors: Map<string, string>;
}) {
  const analysed = d.vendors.filter((v) => v.scores);
  const pick =
    d.vendors.find((v) => v.proposalId === d.recommendation?.proposalId && v.scores) ?? analysed[0];

  return (
    <div className="flex flex-col gap-10">
      {pick && <Hero d={d} v={pick} />}

      {d.hasStandards && (
        <ScopeSection
          title="Standards compliance"
          icon={ShieldCheck}
          note={d.standards.map((s) => s.code).join(" · ")}
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
      <ScopeSection
        title="RFP compliance"
        icon={FileText}
        note={`${d.requirements.filter((r) => r.scope === "rfp").length} requirements`}
        rows={[...analysed]
          .sort((a, b) => b.scores!.rfpPct - a.scores!.rfpPct)
          .map((v) => ({ v, pct: v.scores!.rfpPct, counts: v.rfpCounts, unit: "requirements" }))}
        colors={colors}
      />
      <RiskSection vendors={[...analysed].sort((a, b) => a.scores!.riskScore - b.scores!.riskScore)} colors={colors} />
    </div>
  );
}

function Hero({ d, v }: { d: AnalysisResultsDto; v: VendorResultDto }) {
  const reduce = useReducedMotion();
  const [why, setWhy] = useState(false);
  const s = v.scores!;
  const ranked = d.vendors.filter((x) => x.scores);
  const runnerUp = ranked.find((x) => x.proposalId !== v.proposalId);
  const lead = runnerUp ? Math.round((s.overall - runnerUp.scores!.overall) * 10) / 10 : null;
  const price = v.commercial.totalPrice?.replace(/[\s,;.]+$/, "");
  const conditions = d.recommendation?.conditions ?? [];
  return (
    <section aria-label="Recommended vendor" className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT_QUINT }}
        className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-xl bg-rail p-7 text-white shadow-md"
      >
        {/* RTA dark hero band: ink, an angular red wash, the clipped corner. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-24 h-80 w-[28rem] opacity-60"
          style={{
            background:
              "linear-gradient(135deg, rgb(236 28 36 / 0.45), rgb(255 138 92 / 0.12) 60%, transparent 80%)",
            clipPath: "polygon(100% 0, 0 18%, 100% 92%)",
          }}
        />
        <span aria-hidden className="absolute inset-y-0 start-0 w-1 bg-rta" />
        <div className="relative flex flex-col gap-4">
          <span className="caption-caps flex items-center gap-2 text-white/60">
            <Trophy className="size-3.5 text-[#ff8a5c]" aria-hidden /> Recommended vendor
          </span>
          <div className="flex items-center gap-4">
            <InitialsAvatar name={v.vendor.name} size="lg" />
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="truncate font-heading text-3xl font-semibold tracking-tight" dir="auto">
                {v.vendor.name}
              </h2>
              <p className="text-sm text-white/65">
                {[v.vendor.country, price].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <p className="text-sm text-white/75">
            Rank 1 of {ranked.length} · overall{" "}
            <span className="font-semibold text-white tabular-nums">{s.overall}</span>
            {runnerUp && lead !== null && lead > 0 && (
              <>
                {" "}
                · {lead} points ahead of <span dir="auto">{runnerUp.vendor.name}</span>
              </>
            )}
            {s.mandatoryNotMet > 0 && (
              <span className="text-[#ffb4a6]">
                {" "}
                · {s.mandatoryNotMet} mandatory requirement{s.mandatoryNotMet === 1 ? "" : "s"} still
                to fix
              </span>
            )}
          </p>
        </div>
        <div className="relative flex flex-col gap-4">
          {d.recommendation?.summary && (
            <div className="flex flex-col gap-1.5">
              <span className="caption-caps flex items-center gap-1.5 text-white/55">
                <Sparkles className="size-3.5" aria-hidden /> Why this vendor · AI-generated
              </span>
              <p className="max-w-3xl text-[15px] leading-relaxed text-white/90" dir="auto">
                {d.recommendation.summary}
              </p>
            </div>
          )}
          {v.strengths.length > 0 && (
            <ul aria-label="Strengths" className="flex flex-col gap-1.5 text-sm text-white/80">
              {v.strengths.slice(0, 3).map((x) => (
                <li key={x} className="flex items-start gap-2" dir="auto">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#5fd3a5]" aria-hidden />
                  {x}
                </li>
              ))}
            </ul>
          )}
          {conditions.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setWhy((o) => !o)}
                aria-expanded={why}
                className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-white/90 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Conditions before an award ({conditions.length})
                <ChevronDown className={cn("size-4 transition-transform", why && "rotate-180")} aria-hidden />
              </button>
              {why && (
                <ul className="flex list-disc flex-col gap-1 rounded-lg bg-white/[0.06] p-4 ps-9 text-sm leading-relaxed text-white/85">
                  {conditions.map((c) => (
                    <li key={c} dir="auto">
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:grid-rows-3">
        <MiniBox
          label="Standards compliance"
          value={s.standardsPct}
          suffix="%"
          bar={<MeterBar value={s.standardsPct} fill={COMPLIANCE_FILL} label="Standards compliance" />}
          empty="No standards applied"
        />
        <MiniBox
          label="RFP compliance"
          value={s.rfpPct}
          suffix="%"
          bar={<MeterBar value={s.rfpPct} fill={COMPLIANCE_FILL} label="RFP compliance" />}
        />
        <MiniBox
          label="Risk score"
          value={s.riskScore}
          suffix="/100"
          extra={<RiskPill severity={s.riskLevel} size="sm" />}
          bar={<MeterBar value={s.riskScore} fill={RISK_FILL[s.riskLevel]} label="Risk score" />}
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

function ScopeSection({
  title,
  icon: Icon,
  note,
  rows,
  colors,
}: {
  title: string;
  icon: typeof ShieldCheck;
  note: string;
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
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
            <Icon className="size-5 text-ink-muted" aria-hidden /> {title}
          </h2>
          <span aria-hidden className="rta-rule" />
        </div>
        <span className="text-xs text-ink-muted">{note}</span>
      </header>
      <ul className={cn(card, "flex flex-col divide-y divide-border/70")}>
        {rows.map(({ v, pct, counts, unit }) => (
          <li key={v.proposalId} className="flex flex-col gap-3 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <VendorLabel v={v} color={colors.get(v.proposalId)} />
              <span className="kpi text-2xl text-ink">{pctText(pct)}</span>
            </div>
            <GapBar
              counts={{
                compliant: counts.compliant,
                partial: counts.partial,
                not_addressed: counts.not_addressed,
                non_compliant: counts.non_compliant,
              }}
            />
            <CountsLegend counts={counts} label={`${v.vendor.name}: ${unit}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RiskSection({ vendors, colors }: { vendors: VendorResultDto[]; colors: Map<string, string> }) {
  return (
    <section aria-label="Risks" className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
            <ShieldAlert className="size-5 text-ink-muted" aria-hidden /> Risks
          </h2>
          <span aria-hidden className="rta-rule" />
        </div>
        <span className="text-xs text-ink-muted">Risk score 0–100, lower is better</span>
      </header>
      <ul className={cn(card, "flex flex-col divide-y divide-border/70")}>
        {vendors.map((v) => {
          const total = SEVERITY_ORDER.reduce((n, s) => n + v.riskCounts[s], 0);
          return (
            <li key={v.proposalId} className="flex flex-col gap-3 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <VendorLabel v={v} color={colors.get(v.proposalId)} />
                <span className="flex items-center gap-3">
                  <RiskPill severity={v.scores!.riskLevel} size="sm" />
                  <span className="kpi text-2xl text-ink">{v.scores!.riskScore}</span>
                </span>
              </div>
              <div
                role="img"
                aria-label={SEVERITY_ORDER.map((s) => `${v.riskCounts[s]} ${s}`).join(", ")}
                className="flex h-2 w-full gap-[2px]"
              >
                {SEVERITY_ORDER.filter((s) => v.riskCounts[s]).map((s) => (
                  <span
                    key={s}
                    className="h-full min-w-1.5 rounded-full"
                    style={{ flexGrow: v.riskCounts[s], background: RISK_FILL[s] }}
                  />
                ))}
                {!total && <span className="h-full w-full rounded-full bg-surface-muted" />}
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
                {SEVERITY_ORDER.map((s) => (
                  <li key={s} className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="size-2 rounded-full" style={{ background: RISK_FILL[s] }} />
                    <span className="font-semibold tabular-nums">{v.riskCounts[s]}</span> {s}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
