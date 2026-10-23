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
import { maxSeverity } from "@/lib/scoring";
import {
  MeterBar,
  type OpenEvidence,
  type Scope,
  RISK_FILL,
  SEVERITY_ORDER,
  SectionTitle,
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
  onSection: (s: ProposalSection | null, scope?: Scope) => void;
}

/**
 * Risks (user's design: divided like Compliance). Top: every vendor's 0–100 risk score. Then one
 * card per proposal section, and in it every vendor's risks for that section: count, highest
 * severity, its top risk, a severity line, and a dropdown with the risk cards. "View more" links
 * the risk to what it is about, as in Compliance: the RFP clause or standard rule, the vendor's
 * evidence and the section's points.
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
  // Sections with risks first (template order); the rest are listed once at the end.
  const sections = shownSections(d).filter((s) => vendors.some((v) => v.risks.some((r) => r.section === s)));
  const empty = shownSections(d).filter((s) => s !== null && !sections.includes(s));
  const links: RiskLinks = { d, onEvidence, onSection };

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
            {sectionLabel(s)}
          </a>
        ))}
      </nav>

      {sections.map((s) => (
        <SectionCard key={s ?? "none"} section={s} vendors={vendors} colors={colors} links={links} />
      ))}

      {empty.length > 0 && (
        <section
          aria-label="No risks raised in these sections"
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-border-strong/70 px-5 py-4"
        >
          <span className="text-[13px] text-ink-muted">No risks raised in these sections:</span>
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
  section,
  vendors,
  colors,
  links,
}: {
  section: ProposalSection | null;
  vendors: VendorResultDto[];
  colors: Map<string, string>;
  links: RiskLinks;
}) {
  const all = vendors.flatMap((v) => v.risks.filter((r) => r.section === section));
  const top = all.length ? maxSeverity(all.map((r) => r.severity)) : null;
  return (
    <section id={`risk-${section ?? "none"}`} aria-label={sectionLabel(section)} className={cn(card, "scroll-mt-24")}>
      <header
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 px-5 py-4",
          all.length > 0 && "border-b border-border/70",
        )}
      >
        <SectionTitle section={section} />
        <span className="flex items-center gap-2 text-xs text-ink-muted">
          {all.length
            ? `${all.length} risk${all.length === 1 ? "" : "s"} across ${vendors.length} vendors`
            : "No risks raised in this section"}
          {top && (
            <>
              <span aria-hidden>·</span> highest <RiskPill severity={top} size="sm" />
            </>
          )}
        </span>
      </header>
      {all.length > 0 && (
        <ul className="flex flex-col divide-y divide-border/70">
          {vendors.map((v) => (
            <VendorRisks key={v.proposalId} v={v} section={section} color={colors.get(v.proposalId)} links={links} />
          ))}
        </ul>
      )}
    </section>
  );
}

function VendorRisks({
  v,
  section,
  color,
  links,
}: {
  v: VendorResultDto;
  section: ProposalSection | null;
  color?: string;
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
              onClick={() => onSection(r.section, reqs[0]?.scope)}
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
