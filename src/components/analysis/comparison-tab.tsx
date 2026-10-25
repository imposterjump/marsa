"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Check,
  ChevronDown,
  Columns3,
  FileText,
  LoaderCircle,
  Pencil,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { cn } from "cn";
import { useT } from "@/components/i18n-provider";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { useProjectContext } from "@/components/projects/project-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { FindingStatusPill, RiskPill } from "@/components/ui/status-pill";
import type {
  AnalysisResultsDto,
  FindingResultDto,
  RequirementResultDto,
  VendorResultDto,
} from "@/lib/api-types";
import type { FindingStatus, ProposalSection, RiskSeverity } from "@/lib/domain";
import { msg } from "@/lib/i18n/core";
import { maxSeverity } from "@/lib/scoring";
import {
  COMPLIANCE_FILL,
  MeterBar,
  type OpenEvidence,
  RISK_FILL,
  type Scope,
  sectionOrder,
  VendorLabel,
  pctText,
  scopeStats,
  sectionLabel,
} from "./shared";
import { CompareRun } from "./compare-run";
import { listSep } from "./risk-list";

const card = "rounded-xl border border-border bg-surface shadow-sm";
const RANK: Record<FindingStatus, number> = {
  compliant: 0,
  partial: 1,
  not_addressed: 2,
  non_compliant: 3,
};
const SEVERITY_WEIGHT: Record<RiskSeverity, number> = { low: 1, moderate: 2, high: 3, critical: 4 };

/**
 * Comparison (user's design, 2026-10-23: "like SaaS pricing pages"). Pick two or more vendors,
 * then one big column per vendor and one row per aspect: the overall numbers, RFP compliance and
 * standards compliance per proposal section, risks per section, and the commercial terms the AI
 * read from each proposal. The best value of a row is marked. A section row opens the points
 * where the vendors differ. Everything comes from the saved analysis: no new AI call, no cost.
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
  const t = useT();
  const p = useProjectContext();
  const analysed = d.vendors.filter((v) => v.scores);
  const [picked, setPicked] = useState<string[]>([]);
  // pick → the agents' run under the vendors (user, 2026-10-25) → it folds away → the table.
  const [stage, setStage] = useState<"pick" | "running" | "closing" | "done">("pick");
  const chosen = analysed.filter((v) => picked.includes(v.proposalId));
  const busy = stage === "running" || stage === "closing";

  if (stage === "done" && chosen.length >= 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_QUINT }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-3xl text-[13px] text-ink-muted">
            {t(
              "Side by side from the AI analysis of each proposal. The best value in each row is marked; open a section to see the points where the vendors differ.",
            )}
          </p>
          <Button variant="secondary" onClick={() => setStage("pick")}>
            <Pencil /> {t("Change selection")}
          </Button>
        </div>
        <PricingTable d={d} vendors={chosen} colors={colors} onEvidence={onEvidence} />
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-muted">
          {t("Pick the vendors to compare, then press Compare.")}
        </p>
        <Button onClick={() => setStage("running")} disabled={picked.length < 2 || busy}>
          {busy ? (
            <>
              <LoaderCircle className="animate-spin" /> {t("Comparing…")}
            </>
          ) : (
            <>
              <Columns3 />{" "}
              {picked.length < 2
                ? t("Pick at least 2 vendors")
                : t.plural(picked.length, "Compare {n} vendor", "Compare {n} vendors")}
            </>
          )}
        </Button>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("Vendors")}>
        {analysed.map((v) => {
          const on = picked.includes(v.proposalId);
          return (
            <li key={v.proposalId}>
              <label
                className={cn(
                  card,
                  "flex cursor-pointer flex-col gap-3 p-4 transition-[color,border-color,opacity] duration-300",
                  on && "border-brand/50 ring-2 ring-brand/15",
                  busy && "cursor-default",
                  busy && !on && "opacity-45",
                )}
              >
                <span className="flex items-center gap-3">
                  <Checkbox
                    checked={on}
                    disabled={busy}
                    onCheckedChange={(c) =>
                      setPicked((p) =>
                        c === true ? [...p, v.proposalId] : p.filter((x) => x !== v.proposalId),
                      )
                    }
                    aria-label={t("Compare {vendor}", { vendor: v.vendor.name })}
                  />
                  <VendorLabel v={v} color={colors.get(v.proposalId)} />
                </span>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  <Num label={t("Standards")} value={pctText(v.scores!.standardsPct)} />
                  <Num label={t("RFP")} value={pctText(v.scores!.rfpPct)} />
                  <Num label={t("Risk")} value={String(v.scores!.riskScore)} />
                </dl>
              </label>
            </li>
          );
        })}
      </ul>
      <AnimatePresence onExitComplete={() => setStage((s) => (s === "closing" ? "done" : s))}>
        {stage === "running" && (
          <motion.div
            key="run"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT_QUINT }}
            className="overflow-hidden"
          >
            <CompareRun
              d={d}
              vendors={chosen}
              rfpDocs={p.rfpDocuments}
              onDone={() => setStage("closing")}
            />
          </motion.div>
        )}
      </AnimatePresence>
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

/* ───────────────────────── The table ───────────────────────── */

type Best = "high" | "low";

/** Indexes of the best values (none when all are equal or missing). */
function bestOf(values: (number | null)[], best: Best): Set<number> {
  const nums = values.filter((x): x is number => x !== null);
  if (nums.length < 2 || nums.every((x) => x === nums[0])) return new Set();
  const target = best === "high" ? Math.max(...nums) : Math.min(...nums);
  return new Set(values.flatMap((x, i) => (x === target ? [i] : [])));
}

const cleanText = (s: string | null | undefined) => (s ?? "").replace(/[\s,;.]+$/, "").trim();

/** The commercial terms the AI read from each proposal, one row each. */
const COMMERCIAL_ROWS: [string, (v: VendorResultDto) => string][] = [
  [msg("Total price"), (v) => cleanText(v.commercial.totalPrice)],
  [msg("Payment"), (v) => cleanText(v.commercial.paymentTerms)],
  [msg("Delivery"), (v) => cleanText(v.commercial.deliveryTime)],
  [msg("Warranty"), (v) => cleanText(v.commercial.warranty)],
  [msg("Bid validity"), (v) => cleanText(v.commercial.validity)],
];

function PricingTable({
  d,
  vendors,
  colors,
  onEvidence,
}: {
  d: AnalysisResultsDto;
  vendors: VendorResultDto[];
  colors: Map<string, string>;
  onEvidence: OpenEvidence;
}) {
  const t = useT();
  const ranked = d.vendors.filter((v) => v.scores);
  const recommended = d.recommendation?.proposalId ?? ranked[0]?.proposalId;
  const sectionsFor = (scope: Scope) =>
    sectionOrder(d).filter((s) => d.requirements.some((r) => r.section === s && r.scope === scope));
  const missingFor = (scope: Scope) =>
    sectionOrder(d).filter(
      (s): s is ProposalSection => s !== null && !sectionsFor(scope).includes(s),
    );
  const riskSections = sectionOrder(d).filter((s) =>
    vendors.some((v) => v.risks.some((r) => r.section === s)),
  );
  const n = vendors.length;
  const colCls: ColCls = (i, extra) =>
    cn(
      "border-x border-border bg-surface px-4 align-top",
      // The tint is a background image over the solid surface, so the pinned header stays opaque.
      vendors[i].proposalId === recommended &&
        "border-brand/40 bg-[linear-gradient(color-mix(in_srgb,var(--brand)_4%,transparent),color-mix(in_srgb,var(--brand)_4%,transparent))]",
      extra,
    );

  return (
    <div className="overflow-x-auto pb-2 lg:overflow-visible">
      <table
        aria-label={t("Vendor comparison")}
        className="w-full min-w-[760px] table-fixed border-separate [border-spacing:0.75rem_0] text-sm"
      >
        <colgroup>
          <col className="w-60" />
          {vendors.map((v) => (
            <col key={v.proposalId} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky top-16 z-10 bg-background pt-2 pb-4 text-start align-bottom font-normal"
            >
              <span className="caption-caps text-ink-muted">
                {t.plural(n, "{n} vendor compared", "{n} vendors compared")}
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-ok-fill text-white">
                  <Check className="size-3" aria-hidden />
                </span>
                {t("best in the row")}
              </span>
            </th>
            {vendors.map((v, i) => (
              <th
                key={v.proposalId}
                scope="col"
                className={cn(
                  colCls(i),
                  "sticky top-16 z-10 rounded-t-xl border-t pt-0 pb-4 text-start font-normal shadow-[0_8px_16px_-12px_rgb(0_0_0/0.25)]",
                )}
              >
                <VendorHead
                  v={v}
                  color={colors.get(v.proposalId)}
                  rank={ranked.findIndex((x) => x.proposalId === v.proposalId) + 1}
                  of={ranked.length}
                  recommended={v.proposalId === recommended}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <GroupRow title={t("Overall")} icon={Trophy} vendors={vendors} colCls={colCls} />
          <ValueRow
            label={t("Overall score")}
            hint={t("Standards, RFP and risk combined")}
            vendors={vendors}
            colCls={colCls}
            values={vendors.map((v) => v.scores!.overall)}
            best="high"
            render={(v) => <Big value={String(v.scores!.overall)} />}
          />
          {d.hasStandards && (
            <ValueRow
              label={t("Standards compliance")}
              vendors={vendors}
              colCls={colCls}
              values={vendors.map((v) => v.scores!.standardsPct)}
              best="high"
              render={(v) => <PctCell pct={v.scores!.standardsPct} />}
            />
          )}
          <ValueRow
            label={t("RFP compliance")}
            vendors={vendors}
            colCls={colCls}
            values={vendors.map((v) => v.scores!.rfpPct)}
            best="high"
            render={(v) => <PctCell pct={v.scores!.rfpPct} />}
          />
          <ValueRow
            label={t("Risk score")}
            hint={t("0–100, lower is better")}
            vendors={vendors}
            colCls={colCls}
            values={vendors.map((v) => v.scores!.riskScore)}
            best="low"
            render={(v) => (
              <span className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between gap-2">
                  <Big value={String(v.scores!.riskScore)} suffix="/100" />
                  <RiskPill severity={v.scores!.riskLevel} size="sm" />
                </span>
                <MeterBar
                  value={v.scores!.riskScore}
                  fill={RISK_FILL[v.scores!.riskLevel]}
                  label={t("Risk score")}
                />
              </span>
            )}
          />
          <ValueRow
            label={t("Mandatory requirements not met")}
            vendors={vendors}
            colCls={colCls}
            values={vendors.map((v) => v.scores!.mandatoryNotMet)}
            best="low"
            render={(v) => (
              <span
                className={cn(
                  "text-base font-semibold tabular-nums",
                  v.scores!.mandatoryNotMet ? "text-fail" : "text-ink",
                )}
              >
                {v.scores!.mandatoryNotMet || t("None")}
              </span>
            )}
          />

          <ScopeGroup
            scope="rfp"
            title={t("RFP compliance by section")}
            icon={FileText}
            d={d}
            vendors={vendors}
            colCls={colCls}
            sections={sectionsFor("rfp")}
            missing={missingFor("rfp")}
            onEvidence={onEvidence}
          />
          {d.hasStandards && (
            <ScopeGroup
              scope="standard"
              title={t("Standards compliance by section")}
              icon={ShieldCheck}
              d={d}
              vendors={vendors}
              colCls={colCls}
              sections={sectionsFor("standard")}
              missing={missingFor("standard")}
              onEvidence={onEvidence}
            />
          )}

          <GroupRow
            title={t("Risks by section")}
            icon={ShieldAlert}
            vendors={vendors}
            colCls={colCls}
          />
          {riskSections.length === 0 ? (
            <NoteRow
              text={t("No risks raised for these vendors.")}
              vendors={vendors}
              colCls={colCls}
            />
          ) : (
            riskSections.map((s) => (
              <RiskRow key={s ?? "none"} section={s} vendors={vendors} colCls={colCls} />
            ))
          )}

          <GroupRow
            title={t("Commercial terms")}
            icon={Receipt}
            hint={t("As the AI read them from each proposal")}
            vendors={vendors}
            colCls={colCls}
          />
          {COMMERCIAL_ROWS.map(([label, get]) => (
            <ValueRow
              key={label}
              label={t(label)}
              vendors={vendors}
              colCls={colCls}
              values={vendors.map(() => null)}
              best="high"
              render={(v) => {
                const text = get(v);
                return text ? (
                  <span className="text-[13px] leading-relaxed text-ink-2" dir="auto">
                    {text}
                  </span>
                ) : (
                  <span className="text-[13px] text-ink-faint">{t("Not stated")}</span>
                );
              }}
            />
          ))}
          {/* Close the column cards. */}
          <tr aria-hidden>
            <td />
            {vendors.map((v, i) => (
              <td key={v.proposalId} className={colCls(i, "h-4 rounded-b-xl border-b")} />
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function VendorHead({
  v,
  color,
  rank,
  of,
  recommended,
}: {
  v: VendorResultDto;
  color?: string;
  rank: number;
  of: number;
  recommended: boolean;
}) {
  const t = useT();
  const price = cleanText(v.commercial.totalPrice);
  return (
    <span className="flex flex-col gap-3">
      <span aria-hidden className="-mx-4 block h-1.5 rounded-t-xl" style={{ background: color }} />
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs text-ink-muted tabular-nums">
          {t("Rank {rank} of {n}", { rank, n: of })}
        </span>
        {recommended && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rta px-2 py-0.5 text-2xs font-semibold text-white">
            <Trophy className="size-3" aria-hidden /> {t("Recommended")}
          </span>
        )}
      </span>
      <span className="flex min-w-0 items-center gap-3">
        <InitialsAvatar name={v.vendor.name} size="md" />
        <span className="min-w-0 text-base leading-snug font-semibold text-ink" dir="auto">
          {v.vendor.name}
        </span>
      </span>
      <span className="flex flex-col">
        <span className="truncate text-2xl kpi text-ink">{price || "—"}</span>
        <span className="text-xs text-ink-muted">{t("total bid price")}</span>
      </span>
    </span>
  );
}

type ColCls = (i: number, extra?: string) => string;

function GroupRow({
  title,
  icon: Icon,
  hint,
  vendors,
  colCls,
}: {
  title: string;
  icon: typeof Trophy;
  hint?: string;
  vendors: VendorResultDto[];
  colCls: ColCls;
}) {
  return (
    <tr>
      <th scope="rowgroup" className="pt-7 pb-2 text-start align-bottom font-normal">
        <span className="flex items-center gap-2 font-heading text-base font-semibold text-ink">
          <Icon className="size-4 text-brand" aria-hidden /> {title}
        </span>
        {hint && <span className="mt-0.5 block text-xs text-ink-muted">{hint}</span>}
      </th>
      {vendors.map((v, i) => (
        <td key={v.proposalId} className={colCls(i, "pt-7 pb-2")} />
      ))}
    </tr>
  );
}

function NoteRow({
  text,
  vendors,
  colCls,
}: {
  text: string;
  vendors: VendorResultDto[];
  colCls: ColCls;
}) {
  return (
    <tr>
      <th
        scope="row"
        className="border-t border-border/70 py-3 text-start text-xs font-normal text-ink-muted"
      >
        {text}
      </th>
      {vendors.map((v, i) => (
        <td key={v.proposalId} className={colCls(i, "border-t border-t-border/70 py-3")} />
      ))}
    </tr>
  );
}

function ValueRow({
  label,
  hint,
  vendors,
  colCls,
  values,
  best,
  render,
}: {
  label: React.ReactNode;
  hint?: string;
  vendors: VendorResultDto[];
  colCls: ColCls;
  values: (number | null)[];
  best: Best;
  render: (v: VendorResultDto) => React.ReactNode;
}) {
  const winners = bestOf(values, best);
  return (
    <tr>
      <th
        scope="row"
        className="border-t border-border/70 py-3.5 pe-2 text-start align-top font-normal"
      >
        <span className="block text-[13px] font-medium text-ink-2">{label}</span>
        {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
      </th>
      {vendors.map((v, i) => (
        <td key={v.proposalId} className={colCls(i, "border-t border-t-border/70 py-3.5")}>
          <Cell best={winners.has(i)}>{render(v)}</Cell>
        </td>
      ))}
    </tr>
  );
}

function Cell({ best, children }: { best: boolean; children: React.ReactNode }) {
  const t = useT();
  return (
    <span className="relative block">
      {best && (
        <span
          className="absolute -end-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-ok-fill text-white"
          title={t("Best in this row")}
        >
          <Check className="size-3" aria-hidden />
          <span className="sr-only">{t("Best in this row")}</span>
        </span>
      )}
      <span className={cn("block", best && "pe-5")}>{children}</span>
    </span>
  );
}

function Big({ value, suffix }: { value: string; suffix?: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-2xl kpi text-ink">{value}</span>
      {suffix && <span className="text-xs text-ink-muted">{suffix}</span>}
    </span>
  );
}

function PctCell({ pct, sub }: { pct: number | null; sub?: React.ReactNode }) {
  const t = useT();
  return (
    <span className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-lg font-semibold text-ink tabular-nums">{pctText(pct)}</span>
        {sub}
      </span>
      <MeterBar value={pct} fill={COMPLIANCE_FILL} label={t("Compliance")} />
    </span>
  );
}

/* ── A scope (RFP or standards): one row per section, a section opens its differing points ── */

function ScopeGroup({
  scope,
  title,
  icon,
  d,
  vendors,
  colCls,
  sections,
  missing,
  onEvidence,
}: {
  scope: Scope;
  title: string;
  icon: typeof Trophy;
  d: AnalysisResultsDto;
  vendors: VendorResultDto[];
  colCls: ColCls;
  sections: (ProposalSection | null)[];
  missing: ProposalSection[];
  onEvidence: OpenEvidence;
}) {
  const t = useT();
  return (
    <>
      <GroupRow
        title={title}
        icon={icon}
        hint={t("Open a section to see where the vendors differ")}
        vendors={vendors}
        colCls={colCls}
      />
      {sections.map((s) => (
        <SectionRow
          key={s ?? "none"}
          d={d}
          scope={scope}
          section={s}
          vendors={vendors}
          colCls={colCls}
          onEvidence={onEvidence}
        />
      ))}
      {missing.length > 0 && (
        <NoteRow
          text={t("Nothing to compare in: {sections}", {
            sections: missing.map((s) => t(sectionLabel(s))).join(listSep(t)),
          })}
          vendors={vendors}
          colCls={colCls}
        />
      )}
    </>
  );
}

function SectionRow({
  d,
  scope,
  section,
  vendors,
  colCls,
  onEvidence,
}: {
  d: AnalysisResultsDto;
  scope: Scope;
  section: ProposalSection | null;
  vendors: VendorResultDto[];
  colCls: ColCls;
  onEvidence: OpenEvidence;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const stats = vendors.map((v) => scopeStats(d, v, { section, scope }));
  const winners = bestOf(
    stats.map((s) => s.pct),
    "high",
  );
  const reqs = d.requirements.filter((r) => r.section === section && r.scope === scope);
  const byVendor = vendors.map((v) => new Map(v.findings.map((f) => [f.requirementId, f])));
  const diffs = reqs
    .filter((r) => new Set(byVendor.map((m) => m.get(r.id)?.status)).size > 1)
    .sort((a, b) => spread(byVendor, b.id) - spread(byVendor, a.id));

  return (
    <>
      <tr>
        <th
          scope="row"
          className="border-t border-border/70 py-3 pe-2 text-start align-top font-normal"
        >
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex w-full items-start justify-between gap-2 rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="flex flex-col">
              <span className="text-[13px] font-medium text-ink-2">{t(sectionLabel(section))}</span>
              <span className="text-xs text-ink-muted">
                {diffs.length
                  ? t.plural(
                      diffs.length,
                      "{n} difference of {total}",
                      "{n} differences of {total}",
                      {
                        total: reqs.length,
                      },
                    )
                  : t("Same on all {n}", { n: reqs.length })}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "mt-0.5 size-4 shrink-0 text-ink-muted transition-transform",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </th>
        {vendors.map((v, i) => {
          const st = stats[i];
          const short = st.counts.non_compliant + st.counts.not_addressed + st.counts.partial;
          return (
            <td key={v.proposalId} className={colCls(i, "border-t border-t-border/70 py-3")}>
              <Cell best={winners.has(i)}>
                <PctCell
                  pct={st.pct}
                  sub={
                    <span
                      className={cn("text-xs", st.mandatoryNotMet ? "text-fail" : "text-ink-muted")}
                    >
                      {st.mandatoryNotMet
                        ? t.plural(st.mandatoryNotMet, "{n} mandatory short", "{n} mandatory short")
                        : short
                          ? t.plural(short, "{n} short", "{n} short")
                          : t("all met")}
                    </span>
                  }
                />
              </Cell>
            </td>
          );
        })}
      </tr>
      <AnimatePresence initial={false}>
        {open &&
          (diffs.length === 0 ? (
            <NoteRow
              key="same"
              text={t("The vendors have the same result on every point here.")}
              vendors={vendors}
              colCls={colCls}
            />
          ) : (
            diffs.map((r) => (
              <PointRow
                key={r.id}
                r={r}
                vendors={vendors}
                findings={byVendor.map((m) => m.get(r.id))}
                colCls={colCls}
                onEvidence={onEvidence}
              />
            ))
          ))}
      </AnimatePresence>
    </>
  );
}

const spread = (byVendor: Map<string, FindingResultDto>[], reqId: string) => {
  const ranks = byVendor.map((m) => RANK[m.get(reqId)?.status ?? "not_addressed"]);
  return Math.max(...ranks) - Math.min(...ranks);
};

function PointRow({
  r,
  vendors,
  findings,
  colCls,
  onEvidence,
}: {
  r: RequirementResultDto;
  vendors: VendorResultDto[];
  findings: (FindingResultDto | undefined)[];
  colCls: ColCls;
  onEvidence: OpenEvidence;
}) {
  const t = useT();
  const isRule = r.scope === "standard";
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE_OUT_QUINT }}
    >
      <th
        scope="row"
        className="border-t border-dashed border-border/70 py-2.5 ps-3 pe-2 text-start align-top font-normal"
      >
        <span className="block font-mono text-2xs text-ink-muted">
          {isRule ? r.sourceRef : r.code}
        </span>
        <span className="line-clamp-3 text-xs text-ink-2" dir="auto">
          {r.title}
        </span>
      </th>
      {findings.map((f, i) => (
        <td
          key={vendors[i].proposalId}
          className={colCls(
            i,
            "border-t border-dashed border-t-border/70 bg-surface-muted/40 py-2.5",
          )}
        >
          {f ? (
            <span className="flex flex-col items-start gap-1">
              <FindingStatusPill status={f.status} size="sm" />
              <span className="line-clamp-2 text-xs text-ink-2" dir="auto">
                {f.headline}
              </span>
              {f.evidenceDocId && (
                <button
                  type="button"
                  onClick={() =>
                    onEvidence(
                      f.evidenceDocId!,
                      f.evidencePage,
                      f.evidenceQuote ?? "",
                      vendors[i].proposalId,
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-brand-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <BookOpen className="size-3" aria-hidden />
                  {f.evidencePage ? t("Page {page}", { page: f.evidencePage }) : t("Open")}
                </button>
              )}
            </span>
          ) : (
            <span className="text-xs text-ink-faint">{t("Not analysed")}</span>
          )}
        </td>
      ))}
    </motion.tr>
  );
}

/* ── Risks: one row per section, a row opens the vendors' risks there ── */

function RiskRow({
  section,
  vendors,
  colCls,
}: {
  section: ProposalSection | null;
  vendors: VendorResultDto[];
  colCls: ColCls;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const lists = vendors.map((v) => v.risks.filter((r) => r.section === section));
  const weights = lists.map((l) =>
    l.reduce((s, r) => s + SEVERITY_WEIGHT[r.severity as RiskSeverity], 0),
  );
  const winners = bestOf(weights, "low");
  return (
    <>
      <tr>
        <th
          scope="row"
          className="border-t border-border/70 py-3 pe-2 text-start align-top font-normal"
        >
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex w-full items-start justify-between gap-2 rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="text-[13px] font-medium text-ink-2">{t(sectionLabel(section))}</span>
            <ChevronDown
              className={cn(
                "mt-0.5 size-4 shrink-0 text-ink-muted transition-transform",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </th>
        {lists.map((l, i) => {
          const top = l.length ? maxSeverity(l.map((r) => r.severity)) : null;
          return (
            <td
              key={vendors[i].proposalId}
              className={colCls(i, "border-t border-t-border/70 py-3")}
            >
              <Cell best={winners.has(i)}>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-ink-2">
                    {l.length ? t.plural(l.length, "{n} risk", "{n} risks") : t("No risk")}
                  </span>
                  {top && <RiskPill severity={top} size="sm" />}
                </span>
              </Cell>
            </td>
          );
        })}
      </tr>
      {open && (
        <tr>
          <th
            scope="row"
            className="border-t border-dashed border-border/70 py-2.5 ps-3 text-start align-top text-xs font-normal text-ink-muted"
          >
            {t("The risks")}
          </th>
          {lists.map((l, i) => (
            <td
              key={vendors[i].proposalId}
              className={colCls(
                i,
                "border-t border-dashed border-t-border/70 bg-surface-muted/40 py-2.5",
              )}
            >
              {l.length ? (
                <ul className="flex flex-col gap-2">
                  {l.map((r) => (
                    <li key={r.id} className="flex flex-col items-start gap-1">
                      <RiskPill severity={r.severity as RiskSeverity} size="sm" />
                      <span className="text-xs text-ink-2" dir="auto">
                        {r.title}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-ink-faint">{t("None raised")}</span>
              )}
            </td>
          ))}
        </tr>
      )}
    </>
  );
}
