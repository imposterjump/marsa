"use client";

import {
  ArrowUpRight,
  BookOpen,
  CircleAlert,
  FileText,
  Quote,
  ShieldCheck,
  StickyNote,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FindingStatusPill, Pill, PriorityPill, RiskPill } from "@/components/ui/status-pill";
import { StandardRuleChip } from "@/components/standards/rule-sheet";
import { useProposalResult } from "@/hooks/use-runs";
import type {
  FindingDto,
  ProposalResultDto,
  RequirementDto,
  RequirementSourceDto,
} from "@/lib/api-types";
import { FINDING_STATUSES, type FindingStatus } from "@/lib/domain";
import { FINDING_STATUS_LABEL } from "@/lib/labels";

export type AnalysisTab = "compliance" | "comparison" | "risk";

const card = "rounded-xl border border-border bg-surface shadow-xs";

/**
 * One vendor's analysis results (P6 basic view; P8 designs the full results UX): numbered
 * findings per status with evidence links into the reader, the comparison, and the risk register.
 */
export function ProposalResults({
  runId,
  proposalId,
  tab,
  onEvidence,
}: {
  runId: string;
  proposalId: string;
  tab: AnalysisTab;
  /** Open the reader at the quoted sentence. */
  onEvidence: (docId: string, page: number | null, quote: string) => void;
}) {
  const { data, isLoading } = useProposalResult(runId, proposalId);
  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data?.evaluation) {
    return (
      <div className={cn(card, "border-dashed")}>
        <EmptyState
          art={<CircleAlert className="size-10 text-ink-faint" strokeWidth={1.5} />}
          title="No analysis for this vendor"
          description="Its analysis step failed or was skipped. Retry it from the Evaluation tab."
        />
      </div>
    );
  }
  if (tab === "compliance") return <Compliance data={data} onEvidence={onEvidence} />;
  if (tab === "comparison") return <Comparison data={data} />;
  return <Risks data={data} />;
}

function Compliance({
  data,
  onEvidence,
}: {
  data: ProposalResultDto;
  onEvidence: (docId: string, page: number | null, quote: string) => void;
}) {
  const ev = data.evaluation!;
  const reqs = new Map(data.requirements.map((r) => [r.id, r]));
  const groups = FINDING_STATUSES.map((s) => ({
    status: s,
    items: data.findings.filter((f) => f.status === s),
  }));
  return (
    <div className="flex flex-col gap-5">
      <section className={cn(card, "flex flex-col gap-4 p-5")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex flex-col">
            <span className="font-heading text-4xl font-semibold tracking-tight text-ink tabular-nums">
              {ev.scorePct}%
            </span>
            <span className="text-xs text-ink-muted">weighted compliance</span>
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Findings by status">
            {groups.map((g) => (
              <li key={g.status}>
                <FindingStatusPill
                  status={g.status}
                  label={`${g.items.length} ${FINDING_STATUS_LABEL[g.status].toLowerCase()}`}
                />
              </li>
            ))}
            {ev.mandatoryFailures > 0 && (
              <li>
                <Pill tone="fail">{ev.mandatoryFailures} mandatory not met</Pill>
              </li>
            )}
          </ul>
        </div>
        {ev.summary && (
          <p className="max-w-4xl border-t border-border/70 pt-4 text-[13px] leading-relaxed text-ink-2">
            {ev.summary}
          </p>
        )}
      </section>

      {groups.map(
        (g) =>
          g.items.length > 0 && (
            <section key={g.status} aria-labelledby={`grp-${g.status}`} className={cn(card, "p-5")}>
              <h3
                id={`grp-${g.status}`}
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"
              >
                <FindingStatusPill status={g.status} size="sm" />
                <span className="text-ink-muted tabular-nums">{g.items.length}</span>
              </h3>
              <ol className="flex flex-col divide-y divide-border/60">
                {g.items.map((f, i) => (
                  <FindingRow
                    key={f.id}
                    n={i + 1}
                    f={f}
                    req={reqs.get(f.requirementId)}
                    sources={data.sources[f.requirementId] ?? []}
                    status={g.status}
                    onEvidence={onEvidence}
                  />
                ))}
              </ol>
            </section>
          ),
      )}
    </div>
  );
}

function FindingRow({
  n,
  f,
  req,
  sources,
  status,
  onEvidence,
}: {
  n: number;
  f: FindingDto;
  req?: RequirementDto;
  sources: RequirementSourceDto[];
  status: FindingStatus;
  onEvidence: (docId: string, page: number | null, quote: string) => void;
}) {
  // Short form for compliant findings; the explanation block for everything that falls short.
  const explain = status !== "compliant";
  return (
    <li className="flex gap-3 py-4 text-[13px]">
      <span className="w-6 shrink-0 text-end font-semibold text-ink-muted tabular-nums">{n}.</span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-ink-muted">{f.code}</span>
          <span className="font-medium text-ink">{req?.title ?? f.code}</span>
          {req && <PriorityPill priority={req.priority} size="sm" short />}
        </div>

        {explain ? (
          <dl className="grid gap-x-4 gap-y-2 rounded-lg border border-border/70 bg-surface-muted/40 p-3 sm:grid-cols-[7.5rem_1fr]">
            <dt className="text-xs font-semibold text-ink-muted">In the proposal</dt>
            <dd className="flex flex-col gap-1.5 text-ink-2">
              {status === "not_addressed" ? (
                <span className="italic">Nothing in the proposal addresses this requirement.</span>
              ) : (
                <span>{f.vendorResponse || f.assessment}</span>
              )}
              {f.evidenceQuote && (
                <span className="flex flex-wrap items-start gap-2">
                  <Quote className="mt-0.5 size-3.5 shrink-0 text-ink-faint" aria-hidden />
                  <q className="min-w-0 flex-1 text-ink-2 italic" dir="auto">
                    {f.evidenceQuote}
                  </q>
                  {f.evidenceDocId && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => onEvidence(f.evidenceDocId!, f.evidencePage, f.evidenceQuote!)}
                    >
                      <BookOpen /> {f.evidencePage ? `Page ${f.evidencePage}` : "Open"}
                    </Button>
                  )}
                </span>
              )}
            </dd>
            <dt className="text-xs font-semibold text-ink-muted">Required</dt>
            <dd className="text-ink">{req?.description || "See the source below."}</dd>
            {(f.gap || (status !== "not_addressed" && f.assessment)) && (
              <>
                <dt className="text-xs font-semibold text-ink-muted">
                  {status === "partial" ? "What is missing" : "Why it falls short"}
                </dt>
                <dd className="text-ink-2">{f.gap || f.assessment}</dd>
              </>
            )}
            <dt className="text-xs font-semibold text-ink-muted">Breaks</dt>
            <dd>
              <SourceChips sources={sources} fallback={req?.sourceRef} onOpen={onEvidence} />
            </dd>
          </dl>
        ) : (
          <>
            {f.assessment && <p className="leading-relaxed text-ink-2">{f.assessment}</p>}
            {f.evidenceQuote && (
              <div className="flex flex-wrap items-start gap-2 rounded-md bg-surface-muted/70 px-3 py-2">
                <Quote className="mt-0.5 size-3.5 shrink-0 text-ink-faint" aria-hidden />
                <q className="min-w-0 flex-1 text-ink-2 italic" dir="auto">
                  {f.evidenceQuote}
                </q>
                {f.evidenceDocId && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => onEvidence(f.evidenceDocId!, f.evidencePage, f.evidenceQuote!)}
                  >
                    <BookOpen /> {f.evidencePage ? `Page ${f.evidencePage}` : "Open"}
                  </Button>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              Source <SourceChips sources={sources} fallback={req?.sourceRef} onOpen={onEvidence} />
            </div>
          </>
        )}
      </div>
    </li>
  );
}

/**
 * Where the requirement comes from, as links: an RFP clause opens the RFP in the reader on its
 * page with the clause highlighted; a standard rule opens the standard with the rule highlighted.
 */
function SourceChips({
  sources,
  fallback,
  onOpen,
}: {
  sources: RequirementSourceDto[];
  fallback?: string;
  onOpen: (docId: string, page: number | null, quote: string) => void;
}) {
  const chip =
    "inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink-2";
  const link =
    "transition-colors hover:border-brand/50 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/25 outline-none";
  if (!sources.length) {
    return fallback ? (
      <span className={chip}>{fallback}</span>
    ) : (
      <span className="text-ink-faint">—</span>
    );
  }
  return (
    <span className="flex flex-wrap gap-1.5">
      {sources.map((s, i) => {
        if (s.kind === "standard") {
          return (
            <StandardRuleChip key={i} source={s} className={cn(chip, link)}>
              <ShieldCheck className="size-3.5 text-brand" aria-hidden />
              <span className="font-mono">{s.label}</span>
              <ArrowUpRight className="size-3 text-ink-faint" aria-hidden />
            </StandardRuleChip>
          );
        }
        if (s.kind === "notes") {
          return (
            <span key={i} className={chip}>
              <StickyNote className="size-3.5 text-ink-faint" aria-hidden /> {s.label}
            </span>
          );
        }
        if (!s.documentId) {
          return (
            <span key={i} className={chip} title="Not found in the RFP documents">
              <FileText className="size-3.5 text-ink-faint" aria-hidden /> {s.label}
            </span>
          );
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onOpen(s.documentId!, s.page, s.needle ?? "")}
            className={cn(chip, link)}
            title={`Open ${s.documentName}${s.page ? `, page ${s.page}` : ""}`}
          >
            <FileText className="size-3.5 text-brand" aria-hidden />
            <span className="truncate">{s.label}</span>
            {s.page && <span className="text-ink-muted tabular-nums">p. {s.page}</span>}
            <ArrowUpRight className="size-3 text-ink-faint" aria-hidden />
          </button>
        );
      })}
    </span>
  );
}

function Comparison({ data }: { data: ProposalResultDto }) {
  const c = data.comparison;
  if (!c) {
    return (
      <div className={cn(card, "border-dashed")}>
        <EmptyState
          art={<CircleAlert className="size-10 text-ink-faint" strokeWidth={1.5} />}
          title="No comparison"
          description="The comparison needs at least two analysed proposals."
        />
      </div>
    );
  }
  const PRICE = {
    lowest: "Lowest price",
    mid: "Mid-range price",
    highest: "Highest price",
    unknown: "Price not comparable",
  };
  return (
    <div className="flex flex-col gap-5">
      <section className={cn(card, "flex flex-col gap-2 p-5")}>
        <Pill
          tone={
            c.pricePosition === "lowest"
              ? "ok"
              : c.pricePosition === "highest"
                ? "partial"
                : "neutral"
          }
          className="w-fit"
        >
          {PRICE[c.pricePosition]}
        </Pill>
        <p className="text-[13px] leading-relaxed text-ink-2">{c.positionStatement}</p>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <PointList
          title="Advantages"
          items={c.advantages.map((a) => ({ point: a.point, who: a.versus, prefix: "vs" }))}
        />
        <PointList
          title="Disadvantages"
          items={c.disadvantages.map((d) => ({
            point: d.point,
            who: d.betterVendors,
            prefix: "better:",
          }))}
        />
      </div>
      {c.uniqueOffers.length > 0 && (
        <PointList
          title="Unique offers"
          items={c.uniqueOffers.map((u) => ({ point: u, who: [], prefix: "" }))}
        />
      )}
    </div>
  );
}

function PointList({
  title,
  items,
}: {
  title: string;
  items: { point: string; who: string[]; prefix: string }[];
}) {
  return (
    <section className={cn(card, "p-5")}>
      <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>
      {items.length ? (
        <ol className="flex list-decimal flex-col gap-2 ps-5 text-[13px] text-ink-2 marker:text-ink-muted">
          {items.map((x) => (
            <li key={x.point} className="leading-relaxed">
              {x.point}
              {x.who.length > 0 && (
                <span className="ms-1 text-xs text-ink-muted">
                  ({x.prefix} {x.who.join(", ")})
                </span>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[13px] text-ink-muted">None.</p>
      )}
    </section>
  );
}

function Risks({ data }: { data: ProposalResultDto }) {
  const overall = data.evaluation?.overallRisk;
  return (
    <div className="flex flex-col gap-5">
      {overall && (
        <section className={cn(card, "flex items-center gap-3 p-5 text-sm")}>
          <span className="font-medium text-ink">Overall risk of awarding to this vendor</span>
          <RiskPill severity={overall} />
        </section>
      )}
      <ol className="flex flex-col gap-3">
        {data.risks.map((r, i) => (
          <li key={r.id} className={cn(card, "flex flex-col gap-2 p-5 text-[13px]")}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-ink-muted tabular-nums">{i + 1}.</span>
              <span className="font-medium text-ink">{r.title}</span>
              <RiskPill severity={r.severity} size="sm" />
              <span className="text-xs text-ink-muted tabular-nums">
                L{r.likelihood} × I{r.impact} = {r.likelihood * r.impact} ·{" "}
                {r.category.replace(/_/g, " ")}
              </span>
            </div>
            <p className="leading-relaxed text-ink-2">{r.description}</p>
            <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              <div>
                <dt className="text-2xs font-semibold tracking-[0.06em] text-ink-muted uppercase">
                  If it happens
                </dt>
                <dd className="text-ink-2">{r.consequence}</dd>
              </div>
              <div>
                <dt className="text-2xs font-semibold tracking-[0.06em] text-ink-muted uppercase">
                  Mitigation
                </dt>
                <dd className="text-ink-2">{r.mitigation}</dd>
              </div>
            </dl>
            {r.evidence && (
              <p className="text-xs text-ink-muted italic" dir="auto">
                Evidence: {r.evidence}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
