"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, BookOpen, ChevronDown } from "lucide-react";
import { cn } from "cn";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { SourceChips } from "@/components/results/finding-card";
import { Button } from "@/components/ui/button";
import { RiskPill } from "@/components/ui/status-pill";
import type { AnalysisResultsDto, RiskResultDto, VendorResultDto } from "@/lib/api-types";
import type { ProposalSection, RiskSeverity } from "@/lib/domain";
import {
  type OpenEvidence,
  type Scope,
  RISK_FILL,
  SEVERITY_ORDER,
  VendorDivider,
  VendorLabel,
  sectionLabel,
  shownSections,
} from "./shared";

const card = "rounded-xl border border-border bg-surface shadow-sm";
const SEVERITY_RANK: Record<RiskSeverity, number> = { critical: 0, high: 1, moderate: 2, low: 3 };
const byWeight = (a: RiskResultDto, b: RiskResultDto) =>
  SEVERITY_RANK[a.severity as RiskSeverity] - SEVERITY_RANK[b.severity as RiskSeverity] ||
  b.likelihood * b.impact - a.likelihood * a.impact;

/** What a risk card can open: the evidence in the reader, and its section in Compliance. */
interface RiskLinks {
  d: AnalysisResultsDto;
  onEvidence: OpenEvidence;
  onSection: (s: ProposalSection | null, scope?: Scope, proposalId?: string) => void;
}

/**
 * Risks (user's design, 2026-10-23, "vendor first"): one card per vendor in ranking order, with
 * its 0–100 risk score on top and its risks in every proposal section underneath: count, top
 * risk, a severity line and a dropdown with the risk cards. "View more" links a risk to what it
 * is about: the RFP clause or standard rule, the vendor's evidence and the section's points.
 */
export function RisksTab({
  d,
  colors,
  onEvidence,
  onSection,
}: {
  d: AnalysisResultsDto;
  colors: Map<string, string>;
} & Omit<RiskLinks, "d">) {
  const vendors = d.vendors.filter((v) => v.scores);
  const links: RiskLinks = { d, onEvidence, onSection };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-muted">
          Each vendor&apos;s risk score (0–100, lower is better) and its risks per proposal section
        </p>
        {vendors.length > 1 && (
          <nav aria-label="Vendors" className="flex flex-wrap gap-2">
            {vendors.map((v) => (
              <a
                key={v.proposalId}
                href={`#risks-${v.proposalId}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-2 transition-colors outline-none hover:border-border-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <span aria-hidden className="size-2 rounded-full" style={{ background: colors.get(v.proposalId) }} />
                <span dir="auto">{v.vendor.name}</span>
              </a>
            ))}
          </nav>
        )}
      </div>
      {vendors.map((v, i) => (
        <div key={v.proposalId} className="flex flex-col gap-2">
          <VendorDivider n={i + 1} total={vendors.length} />
          <VendorRiskCard d={d} v={v} color={colors.get(v.proposalId)} links={links} />
        </div>
      ))}
    </div>
  );
}

function VendorRiskCard({
  d,
  v,
  color,
  links,
}: {
  d: AnalysisResultsDto;
  v: VendorResultDto;
  color?: string;
  links: RiskLinks;
}) {
  const s = v.scores!;
  const sections = shownSections(d).filter((x) => v.risks.some((r) => r.section === x));
  const none = shownSections(d).filter((x) => x !== null && !sections.includes(x));
  return (
    <section id={`risks-${v.proposalId}`} aria-label={v.vendor.name} className={cn(card, "scroll-mt-24")}>
      {/* The vendor's summary: a tinted band with one big number, unlike the section rows below. */}
      <header className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4 rounded-t-xl border-b border-border bg-surface-muted/70 px-5 py-5">
        <span className="flex min-w-0 flex-col gap-1">
          <VendorLabel v={v} color={color} size="md" />
          <span className="ps-[4.75rem] text-xs text-ink-muted">
            {v.risks.length} risk{v.risks.length === 1 ? "" : "s"} ·{" "}
            {s.mandatoryNotMet ? (
              <span className="text-fail">
                {s.mandatoryNotMet} mandatory requirement{s.mandatoryNotMet === 1 ? "" : "s"} not met
              </span>
            ) : (
              "all mandatory requirements met"
            )}
          </span>
        </span>
        <span className="flex items-center gap-4">
          <RiskPill severity={s.riskLevel} size="sm" />
          <span className="flex flex-col items-end">
            <span className="caption-caps text-ink-muted">Overall risk score</span>
            <span className="flex items-baseline gap-1">
              <span className="kpi text-4xl text-ink">{s.riskScore}</span>
              <span className="text-sm text-ink-muted">/100</span>
            </span>
          </span>
        </span>
      </header>
      {sections.length > 0 && (
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-2.5">
          <span className="caption-caps text-ink-muted">By proposal section</span>
          <span className="caption-caps text-ink-faint">Risks per section</span>
        </div>
      )}
      {sections.length === 0 ? (
        <p className="px-5 py-4 text-[13px] text-ink-muted">No risks raised for this vendor.</p>
      ) : (
        <ul aria-label={`${v.vendor.name} risks by section`} className="flex flex-col divide-y divide-border/70">
          {sections.map((x) => (
            <SectionRisks key={x ?? "none"} v={v} section={x} links={links} />
          ))}
        </ul>
      )}
      {none.length > 0 && sections.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-border/70 px-5 py-3 text-xs text-ink-muted">
          No risks in:
          {none.map((x) => (
            <span key={x} className="rounded-full bg-surface-muted px-2.5 py-0.5 font-medium">
              {sectionLabel(x)}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

function SectionRisks({
  v,
  section,
  links,
}: {
  v: VendorResultDto;
  section: ProposalSection | null;
  links: RiskLinks;
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
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full grid-cols-1 items-center gap-x-6 gap-y-3 px-5 py-4 text-start outline-none transition-colors hover:bg-surface-muted/50 focus-visible:bg-surface-muted md:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)_1.25rem]"
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium text-ink">{sectionLabel(section)}</span>
          <span className="truncate text-xs text-ink-muted" dir="auto">
            Top risk: {top.title}
          </span>
        </span>
        <span className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between gap-2 text-xs text-ink-muted">
            <span>
              {list.length} risk{list.length === 1 ? "" : "s"} ·{" "}
              {counts
                .filter(([, n]) => n)
                .map(([s, n]) => `${n} ${s}`)
                .join(" · ")}
            </span>
            <RiskPill severity={top.severity as RiskSeverity} size="sm" />
          </span>
          <span className="flex h-2 w-full gap-[2px]" role="img" aria-label={counts.map(([s, n]) => `${n} ${s}`).join(", ")}>
            {counts
              .filter(([, n]) => n)
              .map(([s, n]) => (
                <span key={s} className="h-full min-w-1.5 rounded-full" style={{ flexGrow: n, background: RISK_FILL[s] }} />
              ))}
          </span>
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
            <ol className="grid gap-3 bg-surface-muted/40 px-5 pt-1 pb-5 lg:grid-cols-2">
              {list.map((r) => (
                <RiskCard key={r.id} r={r} v={v} links={links} />
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function RiskCard({ r, v, links }: { r: RiskResultDto; v: VendorResultDto; links: RiskLinks }) {
  const [open, setOpen] = useState(false);
  const { d, onEvidence, onSection } = links;
  const reqs = r.requirementCodes
    .map((code) => d.requirements.find((x) => x.code === code))
    .filter((x): x is NonNullable<typeof x> => !!x);
  // The vendor's own sentence behind the risk: the finding on the same requirement, if it has one.
  const finding = reqs
    .map((req) => v.findings.find((f) => f.requirementId === req.id))
    .find((f) => f?.evidenceDocId);
  const open_ = (docId: string, page: number | null, quote: string) => onEvidence(docId, page, quote, v.proposalId);

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
        <dl className="grid gap-x-4 gap-y-2.5 border-t border-border/70 pt-3 sm:grid-cols-[7rem_1fr]">
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
          {(r.evidence || finding) && (
            <>
              <dt className="text-xs font-semibold text-ink-muted">Evidence</dt>
              <dd className="flex flex-col items-start gap-1.5">
                {r.evidence && (
                  <span className="text-ink-2 italic" dir="auto">
                    “{r.evidence}”
                  </span>
                )}
                {finding?.evidenceDocId && (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() =>
                      open_(finding.evidenceDocId!, finding.evidencePage, finding.evidenceQuote ?? r.evidence ?? "")
                    }
                  >
                    <BookOpen /> Open in {v.vendor.name}&apos;s proposal
                    {finding.evidencePage ? `, page ${finding.evidencePage}` : ""}
                  </Button>
                )}
              </dd>
            </>
          )}
          {r.requirementCodes.length > 0 && (
            <>
              <dt className="text-xs font-semibold text-ink-muted">About</dt>
              <dd className="flex flex-col gap-2">
                {r.requirementCodes.map((code) => {
                  const req = reqs.find((x) => x.code === code);
                  return (
                    <span key={code} className="flex flex-col gap-1">
                      {req && (
                        <span className="text-xs text-ink-2" dir="auto">
                          <span className="font-mono text-ink-muted">{req.scope === "standard" ? req.sourceRef : req.code}</span>{" "}
                          {req.title}
                        </span>
                      )}
                      <SourceChips sources={req ? (d.sources[req.id] ?? []) : []} fallback={code} onOpen={open_} />
                    </span>
                  );
                })}
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
      )}
    </li>
  );
}
