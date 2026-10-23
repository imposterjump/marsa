"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BookOpen, ChevronDown, Columns3, Pencil } from "lucide-react";
import { cn } from "cn";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FindingStatusPill, PriorityPill } from "@/components/ui/status-pill";
import type {
  AnalysisResultsDto,
  FindingResultDto,
  RequirementResultDto,
  VendorResultDto,
} from "@/lib/api-types";
import type { FindingStatus, ProposalSection } from "@/lib/domain";
import {
  type OpenEvidence,
  SECTION_ORDER,
  SectionTitle,
  VendorLabel,
  pctText,
  scopeStats,
  sectionLabel,
} from "./shared";

const card = "rounded-xl border border-border bg-surface shadow-sm";
const RANK: Record<FindingStatus, number> = {
  compliant: 0,
  partial: 1,
  not_addressed: 2,
  non_compliant: 3,
};

/**
 * Comparison (user's design): vendor cards with a checkbox; with two or more picked, Compare hides
 * the others and shows them side by side: their numbers as bars, then, section by section, only
 * the points where they differ (details in a dropdown). Computed from the saved analysis, free.
 */
export function ComparisonTab({
  d,
  colors,
  onEvidence,
}: {
  d: AnalysisResultsDto;
  colors: Map<string, string>;
  onEvidence: OpenEvidence;
}) {
  const analysed = d.vendors.filter((v) => v.scores);
  const [picked, setPicked] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const chosen = analysed.filter((v) => picked.includes(v.proposalId));
  const shown = comparing ? chosen : analysed;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-muted">
          {comparing
            ? `Comparing ${chosen.length} vendors. Only the points where they differ are listed.`
            : "Pick the vendors to compare, then press Compare."}
        </p>
        {comparing ? (
          <Button variant="secondary" onClick={() => setComparing(false)}>
            <Pencil /> Change selection
          </Button>
        ) : (
          <Button onClick={() => setComparing(true)} disabled={picked.length < 2}>
            <Columns3 /> {picked.length < 2 ? "Pick at least 2 vendors" : `Compare ${picked.length} vendors`}
          </Button>
        )}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Vendors">
        <AnimatePresence initial={false}>
          {shown.map((v) => {
            const on = picked.includes(v.proposalId);
            return (
              <motion.li
                key={v.proposalId}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: EASE_OUT_QUINT }}
              >
                <label
                  className={cn(
                    card,
                    "flex cursor-pointer flex-col gap-3 p-4 transition-colors",
                    on && "border-brand/50 ring-2 ring-brand/15",
                    comparing && "cursor-default",
                  )}
                >
                  <span className="flex items-center gap-3">
                    {!comparing && (
                      <Checkbox
                        checked={on}
                        onCheckedChange={(c) =>
                          setPicked((p) => (c === true ? [...p, v.proposalId] : p.filter((x) => x !== v.proposalId)))
                        }
                        aria-label={`Compare ${v.vendor.name}`}
                      />
                    )}
                    <VendorLabel v={v} color={colors.get(v.proposalId)} />
                  </span>
                  <dl className="grid grid-cols-3 gap-2 text-center">
                    <Num label="Standards" value={pctText(v.scores!.standardsPct)} />
                    <Num label="RFP" value={pctText(v.scores!.rfpPct)} />
                    <Num label="Risk" value={String(v.scores!.riskScore)} />
                  </dl>
                </label>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {comparing && chosen.length >= 2 && (
        <>
          <Bars d={d} vendors={chosen} colors={colors} />
          {SECTION_ORDER.filter((s) => d.requirements.some((r) => r.section === s)).map((s) => (
            <SectionDiff key={s ?? "none"} d={d} section={s} vendors={chosen} colors={colors} onEvidence={onEvidence} />
          ))}
        </>
      )}
    </div>
  );
}

function Num({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg bg-surface-muted/60 px-2 py-1.5">
      <dt className="text-2xs text-ink-muted">{label}</dt>
      <dd className="text-sm font-semibold text-ink tabular-nums">{value}</dd>
    </div>
  );
}

/** Grouped horizontal bars: one group per measure, one bar per vendor in its colour. */
function Bars({ d, vendors, colors }: { d: AnalysisResultsDto; vendors: VendorResultDto[]; colors: Map<string, string> }) {
  const reduce = useReducedMotion();
  const measures: { label: string; hint: string; value: (v: VendorResultDto) => number | null; suffix: string }[] = [
    ...(d.hasStandards
      ? [{ label: "Standards compliance", hint: "higher is better", value: (v: VendorResultDto) => v.scores!.standardsPct, suffix: "%" }]
      : []),
    { label: "RFP compliance", hint: "higher is better", value: (v) => v.scores!.rfpPct, suffix: "%" },
    { label: "Risk score", hint: "lower is better", value: (v) => v.scores!.riskScore, suffix: "" },
  ];
  return (
    <section aria-label="Scores" className={cn(card, "grid gap-6 p-5 lg:grid-cols-3")}>
      {measures.map((m) => (
        <div key={m.label} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">{m.label}</h3>
            <span className="text-2xs text-ink-muted">{m.hint}</span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {vendors.map((v) => {
              const val = m.value(v);
              return (
                <li key={v.proposalId} className="flex flex-col gap-1">
                  <span className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate text-ink-2" dir="auto">
                      {v.vendor.name}
                    </span>
                    <span className="font-semibold text-ink tabular-nums">
                      {val === null ? "—" : `${val}${m.suffix}`}
                    </span>
                  </span>
                  <span className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
                    <motion.span
                      className="block h-full rounded-full"
                      style={{ background: colors.get(v.proposalId) }}
                      initial={reduce ? false : { width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, val ?? 0))}%` }}
                      transition={{ duration: 0.6, ease: EASE_OUT_QUINT }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}

function SectionDiff({
  d,
  section,
  vendors,
  colors,
  onEvidence,
}: {
  d: AnalysisResultsDto;
  section: ProposalSection | null;
  vendors: VendorResultDto[];
  colors: Map<string, string>;
  onEvidence: OpenEvidence;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(true);
  const reqs = d.requirements.filter((r) => r.section === section);
  const byVendor = vendors.map((v) => new Map(v.findings.map((f) => [f.requirementId, f])));
  const diffs = reqs.filter((r) => {
    const st = byVendor.map((m) => m.get(r.id)?.status);
    return new Set(st).size > 1;
  });
  // Biggest gaps first: a point one vendor meets and another does not.
  diffs.sort((a, b) => spread(byVendor, b.id) - spread(byVendor, a.id));

  return (
    <section aria-label={sectionLabel(section)} className={card}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/70 px-5 py-4 text-start outline-none focus-visible:bg-surface-muted"
      >
        <SectionTitle section={section} as="span" />
        <span className="text-xs text-ink-muted">
          {diffs.length
            ? `${diffs.length} difference${diffs.length === 1 ? "" : "s"} · same on ${reqs.length - diffs.length}`
            : `Same result on all ${reqs.length} points`}
        </span>
        <span className="ms-auto flex flex-wrap items-center gap-3">
          {vendors.map((v) => {
            const st = scopeStats(d, v, { section });
            return (
              <span key={v.proposalId} className="inline-flex items-center gap-1.5 text-xs text-ink-2">
                <span aria-hidden className="size-2 rounded-full" style={{ background: colors.get(v.proposalId) }} />
                <span className="font-semibold tabular-nums">{pctText(st.pct)}</span>
              </span>
            );
          })}
          <ChevronDown className={cn("size-5 text-ink-muted transition-transform", open && "rotate-180")} aria-hidden />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && diffs.length > 0 && (
          <motion.ul
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT_QUINT }}
            className="flex flex-col divide-y divide-border/70 overflow-hidden"
          >
            {diffs.map((r) => (
              <DiffRow key={r.id} r={r} vendors={vendors} findings={byVendor.map((m) => m.get(r.id))} colors={colors} onEvidence={onEvidence} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  );
}

const spread = (byVendor: Map<string, FindingResultDto>[], reqId: string) => {
  const ranks = byVendor.map((m) => RANK[m.get(reqId)?.status ?? "not_addressed"]);
  return Math.max(...ranks) - Math.min(...ranks);
};

function DiffRow({
  r,
  vendors,
  findings,
  colors,
  onEvidence,
}: {
  r: RequirementResultDto;
  vendors: VendorResultDto[];
  findings: (FindingResultDto | undefined)[];
  colors: Map<string, string>;
  onEvidence: OpenEvidence;
}) {
  const [open, setOpen] = useState(false);
  const isRule = r.scope === "standard";
  return (
    <li className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full items-start gap-3 px-5 py-3.5 text-start outline-none transition-colors hover:bg-surface-muted/50 focus-visible:bg-surface-muted"
        style={{ gridTemplateColumns: `minmax(180px, 1.3fr) repeat(${vendors.length}, minmax(0, 1fr)) auto` }}
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium text-ink" dir="auto">
            {r.title}
          </span>
          <span className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span className="font-mono">{isRule ? r.sourceRef : r.code}</span>
            <span>{isRule ? "Standard rule" : "RFP"}</span>
            <PriorityPill priority={r.priority} size="sm" short />
          </span>
        </span>
        {findings.map((f, i) => (
          <span key={vendors[i].proposalId} className="flex min-w-0 flex-col gap-1">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: colors.get(vendors[i].proposalId) }} />
              {f ? <FindingStatusPill status={f.status} size="sm" /> : <span className="text-xs text-ink-faint">—</span>}
            </span>
            {f && (
              <span className="line-clamp-2 text-xs text-ink-2" dir="auto">
                {f.headline}
              </span>
            )}
          </span>
        ))}
        <ChevronDown className={cn("mt-1 size-4 text-ink-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div
          className="grid gap-3 bg-surface-muted/40 px-5 pt-1 pb-4"
          style={{ gridTemplateColumns: `repeat(${vendors.length}, minmax(0, 1fr))` }}
        >
          {findings.map((f, i) => {
            const v = vendors[i];
            return (
              <div key={v.proposalId} className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-[13px]">
                <VendorLabel v={v} color={colors.get(v.proposalId)} />
                {f ? (
                  <>
                    <p className="text-ink-2" dir="auto">
                      {f.vendorResponse || "Not addressed in the proposal."}
                    </p>
                    {(f.gap || f.assessment) && f.status !== "compliant" && (
                      <p className="text-ink-muted" dir="auto">
                        <span className="font-semibold text-ink-2">Short: </span>
                        {f.gap || f.assessment}
                      </p>
                    )}
                    {f.evidenceDocId && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="w-fit"
                        onClick={() => onEvidence(f.evidenceDocId!, f.evidencePage, f.evidenceQuote ?? "", v.proposalId)}
                      >
                        <BookOpen /> {f.evidencePage ? `Page ${f.evidencePage}` : "Open"}
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-ink-muted">Not analysed.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </li>
  );
}

