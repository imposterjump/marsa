"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  FileText,
  LayoutList,
  Rows3,
  ShieldCheck,
} from "lucide-react";
import { cn } from "cn";
import { useT } from "@/components/i18n-provider";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { FindingCard } from "@/components/results/finding-card";
import { STATUS_FILL } from "@/components/results/gap-bar";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { AnalysisResultsDto, FindingResultDto, VendorResultDto } from "@/lib/api-types";
import type { FindingStatus, ProposalSection } from "@/lib/domain";
import { msg } from "@/lib/i18n/core";
import { FINDING_STATUS_LABEL } from "@/lib/labels";
import {
  COMPLIANCE_FILL,
  CountsLegend,
  MeterBar,
  type OpenEvidence,
  type Scope,
  sectionOrder,
  VendorCardShell,
  VendorDivider,
  VendorLabel,
  pctText,
  scopeStats,
  sectionLabel,
  vendorDocRefs,
} from "./shared";
import { type ComplianceView, PointListView } from "./point-list";

/** The status pills in a section's dropdown, worst first. */
const STATUS_PILLS: FindingStatus[] = ["non_compliant", "partial", "not_addressed", "compliant"];
const SHORT_FIRST: Record<FindingStatus, number> = {
  non_compliant: 0,
  not_addressed: 1,
  partial: 2,
  compliant: 3,
};

const SCOPE_TEXT: Record<Scope, { none: string; icon: typeof FileText }> = {
  rfp: {
    none: msg("No RFP requirement falls in these sections"),
    icon: FileText,
  },
  standard: {
    none: msg("No standard rule falls in these sections"),
    icon: ShieldCheck,
  },
};

export interface ComplianceFocus {
  section: ProposalSection | null;
  scope: Scope;
  /** The vendor whose risk asked for it: its card opens on that section. */
  proposalId?: string;
  at: number;
}

const rowId = (proposalId: string, section: ProposalSection | null) =>
  `sec-${proposalId}-${section ?? "none"}`;

/**
 * The RFP tab and the Standards tab (user's design, 2026-10-23, "vendor first"): one card per
 * vendor in ranking order, with its result for the whole tab on top and its score in every
 * proposal section underneath. A section opens its points, one status group at a time. Sections
 * this tab has nothing about are listed once at the end.
 * Two views (user, 2026-10-25): that one, "By section", and the filtered "Point list"
 * (`point-list.tsx`). Every vendor card folds away in both.
 */
export function ComplianceTab({
  scope,
  d,
  colors,
  onEvidence,
  focus,
  view,
  onView,
}: {
  scope: Scope;
  d: AnalysisResultsDto;
  colors: Map<string, string>;
  onEvidence: OpenEvidence;
  /** A section to bring into view (from a risk's "see its points"). */
  focus?: ComplianceFocus | null;
  view: ComplianceView;
  onView: (view: ComplianceView) => void;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  const vendors = d.vendors.filter((v) => v.scores);
  const inScope = d.requirements.filter((r) => r.scope === scope);
  const sections = sectionOrder(d).filter((s) => inScope.some((r) => r.section === s));
  const empty = sectionOrder(d).filter((s) => s !== null && !sections.includes(s));
  const Icon = SCOPE_TEXT[scope].icon;
  const none = t(SCOPE_TEXT[scope].none);
  const codes = d.standards.map((s) => s.code).join(", ");
  const target =
    focus && focus.scope === scope
      ? { proposalId: focus.proposalId ?? vendors[0]?.proposalId, section: focus.section }
      : null;
  // Folded vendor cards, in both views. The tab opens with only the first vendor open (user,
  // 2026-10-25); a risk's "see its points" opens its own vendor instead.
  const [closed, setClosed] = useState<ReadonlySet<string>>(() => {
    const first = target?.proposalId ?? vendors[0]?.proposalId;
    return new Set(vendors.map((v) => v.proposalId).filter((id) => id !== first));
  });
  const toggle = (id: string) =>
    setClosed((c) => {
      const next = new Set(c);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  useEffect(() => {
    if (!target?.proposalId) return;
    const el = document.getElementById(rowId(target.proposalId, target.section));
    const raf = requestAnimationFrame(() =>
      el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }),
    );
    return () => cancelAnimationFrame(raf);
  }, [target?.proposalId, target?.section, reduce]);

  const allClosed = vendors.length > 0 && vendors.every((v) => closed.has(v.proposalId));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] text-ink-muted">
          <Icon className="size-4" aria-hidden />
          {scope === "rfp"
            ? t.plural(inScope.length, "{n} RFP requirement", "{n} RFP requirements")
            : d.standards.length > 0
              ? t.plural(
                  inScope.length,
                  "{n} standard rule from {codes}",
                  "{n} standard rules from {codes}",
                  { codes },
                )
              : t.plural(inScope.length, "{n} standard rule", "{n} standard rules")}{" "}
          ·{" "}
          {view === "list"
            ? t("every point of a vendor in one list, worst first")
            : t("each vendor\u2019s score per proposal section")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {vendors.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setClosed(allClosed ? new Set() : new Set(vendors.map((v) => v.proposalId)))
              }
            >
              {allClosed ? <ChevronsUpDown aria-hidden /> : <ChevronsDownUp aria-hidden />}
              {allClosed ? t("Expand all") : t("Collapse all")}
            </Button>
          )}
          <SegmentedControl
            size="sm"
            tone="brand"
            aria-label={t("View")}
            value={view}
            onValueChange={onView}
            options={[
              { value: "sections", label: t("By section"), icon: <Rows3 aria-hidden /> },
              { value: "list", label: t("Point list"), icon: <LayoutList aria-hidden /> },
            ]}
          />
        </div>
        {/* Vendor jump pills, hidden for now (user, 2026-10-25). They still work: to bring them
            back, delete the opening and closing comment lines around the block below. */}
        {/*
        {vendors.length > 1 && (
          <nav aria-label="Vendors" className="flex flex-wrap gap-2">
            {vendors.map((v) => (
              <a
                key={v.proposalId}
                href={`#vendor-${v.proposalId}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-2 transition-colors outline-none hover:border-border-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ background: colors.get(v.proposalId) }}
                />
                <span dir="auto">{v.vendor.name}</span>
              </a>
            ))}
          </nav>
        )}
        */}
      </div>

      {view === "list" ? (
        <PointListView
          d={d}
          scope={scope}
          vendors={vendors}
          colors={colors}
          isOpen={(id) => !closed.has(id)}
          onToggle={toggle}
          onEvidence={onEvidence}
        />
      ) : (
        vendors.map((v, i) => (
          <div key={v.proposalId} className="flex flex-col gap-2">
            <VendorDivider n={i + 1} total={vendors.length} />
            <VendorCard
              d={d}
              scope={scope}
              v={v}
              color={colors.get(v.proposalId)}
              sections={sections}
              onEvidence={onEvidence}
              focusSection={target?.proposalId === v.proposalId ? target.section : undefined}
              open={!closed.has(v.proposalId)}
              onToggle={() => toggle(v.proposalId)}
            />
          </div>
        ))
      )}

      {view === "sections" && empty.length > 0 && (
        <section
          aria-label={none}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-border-strong/70 px-5 py-4"
        >
          <span className="text-[13px] text-ink-muted">{none}:</span>
          {empty.map((s) => (
            <span
              key={s}
              className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-muted"
            >
              {t(sectionLabel(s))}
            </span>
          ))}
        </section>
      )}
    </div>
  );
}

function VendorCard({
  d,
  scope,
  v,
  color,
  sections,
  onEvidence,
  focusSection,
  open,
  onToggle,
}: {
  d: AnalysisResultsDto;
  scope: Scope;
  v: VendorResultDto;
  color?: string;
  sections: (ProposalSection | null)[];
  onEvidence: OpenEvidence;
  /** undefined: no focus on this vendor; null is the "not assigned" section. */
  focusSection?: ProposalSection | null;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const st = scopeStats(d, v, { scope });
  const short = st.counts.non_compliant + st.counts.not_addressed + st.counts.partial;
  return (
    <VendorCardShell
      v={v}
      open={open}
      onToggle={onToggle}
      // The vendor's summary is a tinted band with one big number and no bar, so it never reads
      // like one more section row (user, 2026-10-23: "no contrast between the general score and
      // each section score").
      header={
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
          <span className="flex min-w-0 flex-col gap-1">
            <VendorLabel v={v} color={color} size="md" />
            <span className="ps-[4.75rem] text-xs text-ink-muted">
              {scope === "rfp"
                ? t.plural(st.total, "{n} RFP requirements", "{n} RFP requirements")
                : t.plural(st.total, "{n} standard rules", "{n} standard rules")}{" "}
              · {short ? t.plural(short, "{n} short", "{n} short") : t("everything met")}
              {st.mandatoryNotMet > 0 && (
                <span className="text-fail">
                  {" "}
                  · {t.plural(st.mandatoryNotMet, "{n} mandatory not met", "{n} mandatory not met")}
                </span>
              )}
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <CountsLegend
              counts={st.counts}
              label={t("{vendor}: all points", { vendor: v.vendor.name })}
              className="max-w-xs"
            />
            <span className="flex flex-col items-end">
              <span className="caption-caps text-ink-muted">
                {scope === "rfp" ? t("Overall RFP compliance") : t("Overall standards compliance")}
              </span>
              <span className="text-4xl kpi text-ink">{pctText(st.pct)}</span>
            </span>
          </span>
        </div>
      }
    >
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-2.5">
        <span className="caption-caps text-ink-muted">{t("By proposal section")}</span>
        <span className="caption-caps text-ink-faint">{t("Score per section")}</span>
      </div>
      <ul
        aria-label={t("{vendor} by section", { vendor: v.vendor.name })}
        className="flex flex-col divide-y divide-border/70"
      >
        {sections.map((s) => (
          <SectionRow
            key={s ?? "none"}
            d={d}
            scope={scope}
            v={v}
            section={s}
            onEvidence={onEvidence}
            focused={focusSection !== undefined && focusSection === s}
          />
        ))}
      </ul>
    </VendorCardShell>
  );
}

function SectionRow({
  d,
  scope,
  v,
  section,
  onEvidence,
  focused,
}: {
  d: AnalysisResultsDto;
  scope: Scope;
  v: VendorResultDto;
  section: ProposalSection | null;
  onEvidence: OpenEvidence;
  focused: boolean;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  // A risk's "see its points" lands here open (the tab remounts on every new focus).
  const [open, setOpen] = useState(focused);
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
  const name = t(sectionLabel(section));

  return (
    <li id={rowId(v.proposalId, section)} className={cn("scroll-mt-24", focused && "marsa-pulse")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full grid-cols-1 items-center gap-x-6 gap-y-3 px-5 py-4 text-start transition-colors outline-none hover:bg-surface-muted/50 focus-visible:bg-surface-muted md:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)_1.25rem]"
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium text-ink">{name}</span>
          <span className="text-xs text-ink-muted">
            {t.plural(st.total, "{n} point", "{n} points")} ·{" "}
            {short ? t.plural(short, "{n} short", "{n} short") : t("everything met")}
            {st.mandatoryNotMet > 0 && (
              <span className="text-fail">
                {" "}
                · {t.plural(st.mandatoryNotMet, "{n} mandatory not met", "{n} mandatory not met")}
              </span>
            )}
          </span>
        </span>
        <span className="flex flex-col gap-2">
          <span className="flex items-center gap-3">
            <MeterBar
              value={st.total ? st.pct : null}
              fill={COMPLIANCE_FILL}
              label={t("{section} compliance", { section: name })}
              className="flex-1"
            />
            <span className="w-20 text-end text-lg font-semibold text-ink tabular-nums">
              {pctText(st.pct)}
            </span>
          </span>
          <CountsLegend counts={st.counts} label={t("{section}: points", { section: name })} />
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-5 justify-self-end text-ink-muted transition-transform",
            open && "rotate-180",
          )}
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
              <div
                role="radiogroup"
                aria-label={t("{section}: show points", { section: name })}
                className="flex flex-wrap gap-2"
              >
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
                      {t(FINDING_STATUS_LABEL[s])}
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
                <p className="text-[13px] text-ink-muted">{t("No points in this section.")}</p>
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
  const t = useT();
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
      sourceLabel={isRule ? t("Breaks rule") : t("Breaks clause")}
      vendorDocs={vendorDocRefs(v)}
      onEvidence={(id, page, quote) => onEvidence(id, page, quote, v.proposalId)}
      note={req ? `${isRule ? t("Standard rule") : t("RFP")} · ${req.title}` : undefined}
    />
  );
}
