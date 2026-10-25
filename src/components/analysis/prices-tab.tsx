"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  Calculator,
  Check,
  CircleDashed,
  Equal,
  FileSpreadsheet,
  FileX,
  Info,
  ListMinus,
  ListPlus,
  Ruler,
  TriangleAlert,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { useT } from "@/components/i18n-provider";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { SelectItem } from "@/components/ui/select";
import { Pill } from "@/components/ui/status-pill";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { BoqCellDto, BoqComparisonDto, BoqRowDto, BoqVendorDto } from "@/lib/api-types";
import { intlLocale, type Locale } from "@/lib/i18n/core";
import { FilterSelect } from "./point-list";

const card = "rounded-xl border border-border bg-surface shadow-sm";

/** How far from the bidders' median the server flags a rate (OUTLIER_FACTOR, server/boq). */
const OUTLIER = 2.5;
/** Above the estimate by more than this (%): the red tone instead of amber. */
const FAR_ABOVE = 20;

type Tone = React.ComponentProps<typeof Pill>["tone"];

/* ───────────────────────── Numbers ───────────────────────── */

const FORMATS = new Map<Locale, Intl.NumberFormat>();
function numberFormat(locale: Locale): Intl.NumberFormat {
  let f = FORMATS.get(locale);
  if (!f) {
    // Western digits in both languages (intlLocale picks them for Arabic).
    f = new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 2 });
    FORMATS.set(locale, f);
  }
  return f;
}

interface Fmt {
  currency: string;
  num: (n: number) => string;
  money: (n: number) => string;
}

function useFmt(currency: string): Fmt {
  const t = useT();
  const f = numberFormat(t.locale);
  return {
    currency,
    num: (n) => f.format(n),
    money: (n) => `${currency} ${f.format(n)}`,
  };
}

/** An amount with its currency, kept left-to-right inside Arabic text. */
function Money({ n, fmt }: { n: number; fmt: Fmt }) {
  return (
    <span dir="ltr" className="whitespace-nowrap tabular-nums">
      {fmt.money(n)}
    </span>
  );
}

/** The price a bid is ranked by: the total the bidder signed for, else what its lines add up to. */
const bidTotal = (v: BoqVendorDto) => v.statedTotal ?? v.linesTotal;

/* ───────────────────────── The tab ───────────────────────── */

/**
 * Prices (2026-10-25, building works): each bidder's priced bill of quantities against the
 * client's, line by line. Every number here is computed by the server (src/server/boq), never by
 * the AI: the ranking by total, the gap to the client's estimate, the bidders' issues (unpriced or
 * missing lines, added lines, quantity × rate ≠ amount, changed quantities, rates far from the
 * others), then the lines themselves with each bidder's rate and amount. Only shown when the
 * tender has an Excel bill of quantities.
 */
export function PricesTab({ c, colors }: { c: BoqComparisonDto; colors: Map<string, string> }) {
  const fmt = useFmt(c.currency);
  // Cheapest first; bids without a readable bill of quantities last.
  const ranked = [...c.vendors].sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9));
  return (
    <div className="flex min-w-0 flex-col gap-10">
      <Header c={c} fmt={fmt} />
      <Ranking c={c} vendors={ranked} colors={colors} fmt={fmt} />
      <LineByLine c={c} vendors={ranked.filter((v) => v.parsed)} colors={colors} fmt={fmt} />
    </div>
  );
}

function SectionHeader({ title, note }: { title: string; note?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="flex flex-col gap-1">
        <h3 className="font-heading text-lg font-semibold text-ink">{title}</h3>
        <span aria-hidden className="rta-rule" />
      </div>
      {note && <div className="text-xs text-ink-muted">{note}</div>}
    </header>
  );
}

/* ───────────────────────── Header and estimate ───────────────────────── */

function Header({ c, fmt }: { c: BoqComparisonDto; fmt: Fmt }) {
  const t = useT();
  const sheets = c.sheets.filter((s) => c.rows.some((r) => r.sheet === s && r.priceable)).length;
  return (
    <section
      aria-label={t("Prices")}
      className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,auto)] lg:items-end"
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
            <Calculator className="size-5 text-ink-muted" aria-hidden /> {t("Prices")}
          </h2>
          <span aria-hidden className="rta-rule" />
        </div>
        <p className="max-w-3xl text-[13px] leading-relaxed text-ink-muted">
          {t(
            "The bidders' bills of quantities are compared with the client's, line by line. {app} computes these numbers from the Excel files, not the AI.",
            { app: t.appName },
          )}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <FileSpreadsheet className="size-3.5 shrink-0 text-ok" aria-hidden />
            <span className="min-w-0 truncate">
              {t("Client's bill of quantities: {name}", {
                name: <bdi className="font-medium text-ink">{c.clientDocument}</bdi>,
              })}
            </span>
          </span>
          <span aria-hidden className="text-ink-faint">
            ·
          </span>
          <span className="tabular-nums">
            {t.plural(c.items, "{n} line to price", "{n} lines to price")}
          </span>
          {sheets > 1 && (
            <>
              <span aria-hidden className="text-ink-faint">
                ·
              </span>
              <span className="tabular-nums">{t.plural(sheets, "{n} sheet", "{n} sheets")}</span>
            </>
          )}
          <span aria-hidden className="text-ink-faint">
            ·
          </span>
          <span className="tabular-nums">{t.plural(c.vendors.length, "{n} bid", "{n} bids")}</span>
        </p>
      </div>

      {c.estimate !== null ? (
        <div className={cn(card, "flex flex-col gap-2 px-5 py-4")}>
          <span className="caption-caps text-ink-muted">
            {t("Client's cost estimate (internal)")}
          </span>
          <span dir="ltr" className="flex items-baseline gap-1.5 self-start whitespace-nowrap">
            <span className="text-xs font-medium text-ink-muted">{c.currency}</span>
            <span className="text-[30px] kpi text-ink">{fmt.num(c.estimate)}</span>
          </span>
          <span className="text-xs text-ink-muted">{t("Not shared with the bidders")}</span>
        </div>
      ) : (
        <p className="flex max-w-md items-start gap-2 rounded-xl border border-dashed border-border bg-surface-muted/50 px-4 py-3 text-xs leading-relaxed text-ink-muted">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t(
            "No cost estimate for this tender. Add the client's estimate to the project's details to compare every bid with it.",
          )}
        </p>
      )}
    </section>
  );
}

/* ───────────────────────── Bid ranking ───────────────────────── */

function Ranking({
  c,
  vendors,
  colors,
  fmt,
}: {
  c: BoqComparisonDto;
  vendors: BoqVendorDto[];
  colors: Map<string, string>;
  fmt: Fmt;
}) {
  const t = useT();
  const totals = vendors.map(bidTotal).filter((x): x is number => x !== null);
  // Bars run to the most expensive bid (or the estimate, when it is higher).
  const scale = Math.max(...totals, c.estimate ?? 0, 1);
  const ranked = vendors.filter((v) => v.rank !== null).length;
  return (
    <section aria-label={t("Bid ranking")} className="flex flex-col gap-4">
      <SectionHeader
        title={t("Bid ranking")}
        note={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{t("Cheapest first, by the total each bidder signed for (before VAT)")}</span>
            {c.estimate !== null && (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-3.5 w-0.5 rounded-full bg-ink" />
                {t("Client's cost estimate")}
              </span>
            )}
          </span>
        }
      />
      <ol className={cn(card, "flex flex-col divide-y divide-border/70")}>
        {vendors.map((v) => (
          <RankRow
            key={v.proposalId}
            v={v}
            of={ranked}
            estimate={c.estimate}
            scale={scale}
            color={colors.get(v.proposalId) ?? "var(--chart-1)"}
            fmt={fmt}
          />
        ))}
      </ol>
    </section>
  );
}

function RankRow({
  v,
  of,
  estimate,
  scale,
  color,
  fmt,
}: {
  v: BoqVendorDto;
  of: number;
  estimate: number | null;
  scale: number;
  color: string;
  fmt: Fmt;
}) {
  const t = useT();
  const total = bidTotal(v);
  const priced = v.parsed && total !== null;
  return (
    <li className="flex flex-col gap-3.5 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums",
              v.rank === 1 ? "bg-ok-soft text-ok" : "bg-surface-muted text-ink-2",
            )}
          >
            {v.rank !== null ? (
              <>
                <span aria-hidden>{v.rank}</span>
                <span className="sr-only">{t("Rank {rank} of {n}", { rank: v.rank, n: of })}</span>
              </>
            ) : (
              <span aria-hidden>—</span>
            )}
          </span>
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: color }}
          />
          <InitialsAvatar name={v.vendor} size="sm" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="min-w-0 truncate text-sm font-semibold text-ink" dir="auto">
                {v.vendor}
              </span>
              {v.rank === 1 && (
                <Pill tone="ok" icon={Trophy} size="sm">
                  {t("Lowest bid")}
                </Pill>
              )}
            </span>
            {v.document && (
              <span className="flex min-w-0 items-center gap-1 text-xs text-ink-muted">
                <FileSpreadsheet className="size-3 shrink-0" aria-hidden />
                <bdi className="truncate">{v.document}</bdi>
              </span>
            )}
          </span>
        </div>

        {priced ? (
          <div className="flex flex-col items-start gap-0.5 sm:items-end">
            <span dir="ltr" className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-xs font-medium text-ink-muted">{fmt.currency}</span>
              <span className="text-2xl kpi text-ink">{fmt.num(total)}</span>
            </span>
            <span className="text-xs text-ink-muted">
              {v.statedTotal !== null ? t("before VAT") : t("sum of its lines, before VAT")}
            </span>
            {(v.vat !== null || v.totalWithVat !== null) && (
              <span className="flex flex-wrap gap-x-2 text-2xs text-ink-muted sm:justify-end">
                {v.vat !== null && (
                  <span>{t("VAT {amount}", { amount: <Money n={v.vat} fmt={fmt} /> })}</span>
                )}
                {v.vat !== null && v.totalWithVat !== null && <span aria-hidden>·</span>}
                {v.totalWithVat !== null && (
                  <span>
                    {t("{amount} with VAT", { amount: <Money n={v.totalWithVat} fmt={fmt} /> })}
                  </span>
                )}
              </span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-3 py-1.5 text-[13px] text-ink-muted">
            <FileX className="size-4 shrink-0" aria-hidden />
            {t("No Excel bill of quantities in this bid")}
          </span>
        )}
      </div>

      {priced && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <PriceBar value={total} scale={scale} estimate={estimate} color={color} />
          {v.vsEstimatePct !== null && <EstimateGap pct={v.vsEstimatePct} fmt={fmt} />}
        </div>
      )}

      {v.parsed && <IssueChips v={v} fmt={fmt} />}

      {v.parsed && v.difference !== null && v.linesTotal !== null && (
        <p className="flex items-start gap-2 rounded-lg bg-fail-soft px-3 py-2 text-[13px] text-ink-2">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-fail" aria-hidden />
          <span>
            {v.difference < 0
              ? t("Its lines add up to {total}: {diff} more than its stated total", {
                  total: <Money n={v.linesTotal} fmt={fmt} />,
                  diff: <Money n={Math.abs(v.difference)} fmt={fmt} />,
                })
              : t("Its lines add up to {total}: {diff} less than its stated total", {
                  total: <Money n={v.linesTotal} fmt={fmt} />,
                  diff: <Money n={v.difference} fmt={fmt} />,
                })}
          </span>
        </p>
      )}
    </li>
  );
}

/** The bid's total against the most expensive one; a dark line marks the client's estimate. */
function PriceBar({
  value,
  scale,
  estimate,
  color,
}: {
  value: number;
  scale: number;
  estimate: number | null;
  color: string;
}) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, (value / scale) * 100));
  const at = estimate !== null ? Math.max(0, Math.min(100, (estimate / scale) * 100)) : null;
  return (
    <div aria-hidden className="relative h-2.5 min-w-40 flex-1 rounded-full bg-border">
      <motion.div
        className="absolute inset-y-0 start-0 rounded-full"
        style={{ background: color }}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: EASE_OUT_QUINT }}
      />
      {at !== null && (
        <span
          className="absolute -inset-y-1.5 -ms-px w-0.5 rounded-full bg-ink shadow-[0_0_0_1.5px_var(--surface)]"
          style={{ insetInlineStart: `${at}%` }}
        />
      )}
    </div>
  );
}

function EstimateGap({ pct, fmt }: { pct: number; fmt: Fmt }) {
  const t = useT();
  const a = Math.abs(pct);
  const shown = a >= 10 ? Math.round(a) : Math.round(a * 10) / 10;
  if (shown === 0)
    return (
      <Pill tone="neutral" icon={Equal}>
        {t("In line with the estimate")}
      </Pill>
    );
  return pct < 0 ? (
    <Pill tone="ok" icon={ArrowDown}>
      {t("{pct}% below the estimate", { pct: fmt.num(shown) })}
    </Pill>
  ) : (
    <Pill tone={pct > FAR_ABOVE ? "fail" : "partial"} icon={ArrowUp}>
      {t("{pct}% above the estimate", { pct: fmt.num(shown) })}
    </Pill>
  );
}

/** The bid's issues, only those it has; each chip explains itself in a tooltip. */
function IssueChips({ v, fmt }: { v: BoqVendorDto; fmt: Fmt }) {
  const t = useT();
  const chips: { id: string; tone: Tone; icon: LucideIcon; text: React.ReactNode; tip: string }[] =
    [];
  if (v.unpriced)
    chips.push({
      id: "unpriced",
      tone: "partial",
      icon: CircleDashed,
      text: t.plural(v.unpriced, "{n} unpriced line", "{n} unpriced lines"),
      tip: t("Lines to price that the bidder left without a price"),
    });
  if (v.missing)
    chips.push({
      id: "missing",
      tone: "fail",
      icon: ListMinus,
      text: t.plural(v.missing, "{n} line left out", "{n} lines left out"),
      tip: t("Lines of the client's bill of quantities missing from the bidder's copy"),
    });
  if (v.extra)
    chips.push({
      id: "extra",
      tone: "info",
      icon: ListPlus,
      text: t.plural(v.extra, "{n} added line ({amount})", "{n} added lines ({amount})", {
        amount: <Money n={v.extraAmount} fmt={fmt} />,
      }),
      tip: t("Priced lines the bidder added that are not in the client's bill of quantities"),
    });
  if (v.arithmetic)
    chips.push({
      id: "arithmetic",
      tone: "fail",
      icon: TriangleAlert,
      text: t.plural(v.arithmetic, "{n} arithmetic error", "{n} arithmetic errors"),
      tip: t("Quantity × rate ≠ amount"),
    });
  if (v.qtyChanged)
    chips.push({
      id: "qty",
      tone: "partial",
      icon: Ruler,
      text: t.plural(v.qtyChanged, "{n} changed quantity", "{n} changed quantities"),
      tip: t("Lines the bidder priced for another quantity than the client's"),
    });
  if (v.high)
    chips.push({
      id: "high",
      tone: "fail",
      icon: ArrowUp,
      text: t.plural(v.high, "{n} rate far above the others", "{n} rates far above the others"),
      tip: t("Rates more than {x} times the bidders' median", { x: fmt.num(OUTLIER) }),
    });
  if (v.low)
    chips.push({
      id: "low",
      tone: "partial",
      icon: ArrowDown,
      text: t.plural(v.low, "{n} rate far below the others", "{n} rates far below the others"),
      tip: t("Rates under the bidders' median divided by {x}", { x: fmt.num(OUTLIER) }),
    });
  if (!chips.length && !v.lowest) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.length > 0 && (
        <ul
          aria-label={t("Issues in the bid of {vendor}", { vendor: v.vendor })}
          className="flex flex-wrap gap-2"
        >
          {chips.map((x) => (
            <li key={x.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <Pill tone={x.tone} icon={x.icon}>
                      {x.text}
                    </Pill>
                    <span className="sr-only">: {x.tip}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{x.tip}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
      {v.lowest > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
          <Check className="size-3.5 text-ok" aria-hidden />
          {t.plural(v.lowest, "Lowest rate on {n} line", "Lowest rate on {n} lines")}
        </span>
      )}
    </div>
  );
}

/* ───────────────────────── Line by line ───────────────────────── */

const hasIssue = (r: BoqRowDto) =>
  Object.values(r.cells).some((x) => x.flags.some((f) => f !== "lowest"));

function LineByLine({
  c,
  vendors,
  colors,
  fmt,
}: {
  c: BoqComparisonDto;
  vendors: BoqVendorDto[];
  colors: Map<string, string>;
  fmt: Fmt;
}) {
  const t = useT();
  const [sheet, setSheet] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [onlyIssues, setOnlyIssues] = useState(false);

  // Sheets with lines to price (a summary sheet has none), by their index in c.sheets.
  const sheets = c.sheets
    .map((name, i) => ({ name, key: String(i) }))
    .filter((s) => c.rows.some((r) => r.sheet === s.name && r.priceable));
  const multiSheet = sheets.length > 1;
  const sheetName = sheets.find((s) => s.key === sheet)?.name ?? null;
  const matches = (r: BoqRowDto, name: string | null) =>
    (showAll || r.priceable) && (name === null || r.sheet === name) && (!onlyIssues || hasIssue(r));
  const shown = c.rows.filter((r) => matches(r, sheetName));
  const cols = vendors.length + 3;
  const reset = () => {
    setSheet("all");
    setShowAll(false);
    setOnlyIssues(false);
  };

  // Section headings (and sheet headings when every sheet is shown) between the lines.
  const body: React.ReactNode[] = [];
  let lastSheet: string | null = null;
  let lastSection = "";
  for (const r of shown) {
    if (r.sheet !== lastSheet) {
      if (multiSheet && sheetName === null)
        body.push(<GroupRow key={`sheet-${r.index}`} kind="sheet" text={r.sheet} cols={cols} />);
      lastSheet = r.sheet;
      lastSection = "";
    }
    if (r.section && r.section !== lastSection)
      body.push(
        <GroupRow key={`section-${r.index}`} kind="section" text={r.section} cols={cols} />,
      );
    lastSection = r.section;
    body.push(<LineRow key={r.index} r={r} vendors={vendors} fmt={fmt} />);
  }
  const sums = vendors.map((v) =>
    shown.reduce((s, r) => s + (r.cells[v.proposalId]?.amount ?? 0), 0),
  );

  return (
    <section aria-label={t("Line by line")} className="flex flex-col gap-4">
      <SectionHeader
        title={t("Line by line")}
        note={t("Each bidder's unit rate, with the amount underneath, against the client's lines")}
      />

      {vendors.length === 0 ? (
        <p className={cn(card, "px-5 py-6 text-[13px] text-ink-muted")}>
          {t(
            "No bid has a readable Excel bill of quantities, so there is nothing to compare line by line.",
          )}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {multiSheet && (
              <FilterSelect
                label={t("Sheet")}
                value={sheet}
                onChange={setSheet}
                className="sm:w-80"
              >
                <SelectItem value="all">
                  {t("All sheets")}{" "}
                  <span className="text-ink-faint tabular-nums">
                    {c.rows.filter((r) => matches(r, null)).length}
                  </span>
                </SelectItem>
                {sheets.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    <bdi>{s.name}</bdi>{" "}
                    <span className="text-ink-faint tabular-nums">
                      {c.rows.filter((r) => matches(r, s.name)).length}
                    </span>
                  </SelectItem>
                ))}
              </FilterSelect>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink-2">
              <Switch checked={onlyIssues} onCheckedChange={setOnlyIssues} />
              {t("Only lines with issues")}
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink-2">
              <Switch checked={showAll} onCheckedChange={setShowAll} />
              {t("Show every line")}
            </label>
            <span className="text-xs text-ink-muted tabular-nums sm:ms-auto" aria-live="polite">
              {t.plural(shown.length, "{n} line shown", "{n} lines shown")}
            </span>
          </div>

          <div className={cn(card, "overflow-hidden")}>
            {/* Scrolls inside the card both ways: the header row and the item column stay put. */}
            <div className="max-h-[75vh] overflow-auto overscroll-x-contain">
              <table
                aria-label={t("Bills of quantities, line by line")}
                className="w-full table-fixed border-separate border-spacing-0 text-sm"
              >
                <colgroup>
                  <col className="w-52 sm:w-72 lg:w-96" />
                  <col className="w-28" />
                  {vendors.map((v) => (
                    <col key={v.proposalId} className="w-36" />
                  ))}
                  <col className="w-28" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col" className={cn(headCell, "start-0 z-20 border-e text-start")}>
                      {t("Item")}
                    </th>
                    <th scope="col" className={cn(headCell, "text-end")}>
                      {t("Quantity")}
                    </th>
                    {vendors.map((v) => (
                      <th key={v.proposalId} scope="col" className={cn(headCell, "text-end")}>
                        <span className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1.5 text-2xs text-ink-muted tabular-nums">
                            <span
                              aria-hidden
                              className="size-2 rounded-full"
                              style={{ background: colors.get(v.proposalId) ?? "var(--chart-1)" }}
                            />
                            {t("Rank {rank}", { rank: v.rank ?? "—" })}
                          </span>
                          <span
                            className="line-clamp-2 text-xs font-semibold text-ink"
                            title={v.vendor}
                          >
                            <bdi>{v.vendor}</bdi>
                          </span>
                        </span>
                      </th>
                    ))}
                    <th scope="col" className={cn(headCell, "text-end")}>
                      {t("Median rate")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {body.length ? (
                    body
                  ) : (
                    <tr>
                      <td colSpan={cols} className="px-5 py-10">
                        <span className="sticky start-5 inline-flex flex-wrap items-center gap-3 text-[13px] text-ink-muted">
                          {t("No line matches these filters.")}
                          <Button variant="secondary" size="sm" onClick={reset}>
                            {t("Reset filters")}
                          </Button>
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
                {body.length > 0 && (
                  <tfoot>
                    <tr>
                      <th scope="row" className={cn(footCell, "start-0 z-20 border-e text-start")}>
                        {t("Sum of the lines shown")}
                      </th>
                      <td className={footCell} />
                      {vendors.map((v, i) => (
                        <td key={v.proposalId} className={cn(footCell, "text-end tabular-nums")}>
                          {fmt.num(sums[i])}
                        </td>
                      ))}
                      <td className={footCell} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <Legend fmt={fmt} />
        </>
      )}
    </section>
  );
}

const headCell =
  "sticky top-0 z-10 border-b border-border bg-surface-muted px-3 py-2.5 align-bottom text-xs font-semibold text-ink-2";
const footCell =
  "sticky bottom-0 z-10 border-t border-border bg-surface-muted px-3 py-2.5 text-xs font-semibold text-ink";
const bodyCell = "border-b border-border/60 px-3 py-2 align-top";

function GroupRow({ kind, text, cols }: { kind: "sheet" | "section"; text: string; cols: number }) {
  return (
    <tr>
      <th
        colSpan={cols}
        scope="rowgroup"
        className={cn(
          "border-b border-border/60 px-3 text-start font-normal",
          kind === "sheet" ? "bg-sunken py-2.5" : "bg-surface-muted/60 py-1.5",
        )}
      >
        {/* Kept in view while the table scrolls sideways. */}
        <span
          className={cn(
            "sticky start-3 inline-flex max-w-[min(36rem,80vw)] items-center gap-1.5",
            kind === "sheet"
              ? "text-[13px] font-semibold text-ink"
              : "text-xs font-semibold text-ink-2",
          )}
        >
          {kind === "sheet" && (
            <FileSpreadsheet className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
          )}
          <span className="truncate" dir="auto">
            {text}
          </span>
        </span>
      </th>
    </tr>
  );
}

function LineRow({ r, vendors, fmt }: { r: BoqRowDto; vendors: BoqVendorDto[]; fmt: Fmt }) {
  return (
    <tr>
      <th
        scope="row"
        className={cn(bodyCell, "sticky start-0 z-[1] border-e bg-surface text-start font-normal")}
      >
        <span className="flex gap-2">
          {r.no && (
            <span className="mt-0.5 min-w-8 shrink-0 font-mono text-2xs text-ink-muted tabular-nums">
              <bdi>{r.no}</bdi>
            </span>
          )}
          <Description r={r} />
        </span>
      </th>
      <td className={cn(bodyCell, "text-end text-[13px] text-ink-2 tabular-nums")}>
        {r.qty !== null && fmt.num(r.qty)}
        {r.unit && (
          <span className="block text-2xs text-ink-muted">
            <bdi>{r.unit}</bdi>
          </span>
        )}
      </td>
      {vendors.map((v) => (
        <PriceCell key={v.proposalId} r={r} cell={r.cells[v.proposalId]} fmt={fmt} />
      ))}
      <td className={cn(bodyCell, "text-end text-[13px] text-ink-muted tabular-nums")}>
        {r.median !== null ? fmt.num(r.median) : r.priceable ? "—" : null}
      </td>
    </tr>
  );
}

/** Two lines at most; a longer description opens in place (and shows whole on hover). */
function Description({ r }: { r: BoqRowDto }) {
  const [open, setOpen] = useState(false);
  const text = cn(
    "text-[13px] leading-snug",
    r.priceable ? "text-ink-2" : "font-medium text-ink-muted",
    !open && "line-clamp-2",
  );
  if (r.description.length <= 50)
    return (
      <span className={cn(text, "min-w-0")} dir="auto">
        {r.description}
      </span>
    );
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      title={open ? undefined : r.description}
      className="min-w-0 cursor-pointer rounded-sm text-start outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <span className={text} dir="auto">
        {r.description}
      </span>
    </button>
  );
}

function PriceCell({ r, cell, fmt }: { r: BoqRowDto; cell: BoqCellDto | undefined; fmt: Fmt }) {
  const t = useT();
  if (!cell) return <td className={bodyCell} />;
  const f = cell.flags;
  const high = f.includes("high");
  const low = f.includes("low");
  const lowest = f.includes("lowest");
  // A warning wins over "lowest" (a rate far below the others is usually the lowest too).
  const tint = high ? "bg-fail-soft" : low ? "bg-partial-soft" : lowest ? "bg-ok-soft" : "";
  const blank = f.includes("missing") ? "missing" : f.includes("unpriced") ? "unpriced" : null;
  const rate = cell.rate !== null ? fmt.num(cell.rate) : cell.rateText;
  const amount = cell.amount !== null ? fmt.num(cell.amount) : cell.amountText;
  // The rate on top and the amount underneath; a line priced by its amount alone shows it on top.
  const main = rate ?? amount;
  const sub = rate !== null ? amount : null;

  if (blank)
    return (
      <td className={cn(bodyCell, "text-end")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block px-1 text-ink-faint">
              <span aria-hidden>—</span>
              <span className="sr-only">
                {blank === "missing" ? t("Left out of this bid") : t("Not priced")}
              </span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {blank === "missing" ? t("Left out of this bid") : t("Not priced")}
          </TooltipContent>
        </Tooltip>
        {cell.qty !== null && <QtyBadge qty={cell.qty} client={r.qty} fmt={fmt} />}
      </td>
    );

  // Matched, but nothing written on the line: a lump sum on the merged lines above covers it.
  if (main === null)
    return (
      <td className={cn(bodyCell, "text-end text-2xs text-ink-muted")}>
        {r.priceable && (
          <span title={t("Priced with the lines above it as one lump sum")}>
            {t("Included above")}
          </span>
        )}
      </td>
    );

  return (
    <td className={cn(bodyCell, "text-end", tint)}>
      <span className="flex items-center justify-end gap-1">
        {f.includes("arithmetic") && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <TriangleAlert className="size-3.5 text-fail" aria-hidden />
                <span className="sr-only">{t("Quantity × rate ≠ amount")}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("Quantity × rate ≠ amount")}</TooltipContent>
          </Tooltip>
        )}
        {high ? (
          <ArrowUp className="size-3 shrink-0 text-fail" aria-hidden />
        ) : low ? (
          <ArrowDown className="size-3 shrink-0 text-partial" aria-hidden />
        ) : lowest ? (
          <Check className="size-3 shrink-0 text-ok" aria-hidden />
        ) : null}
        <span className="text-[13px] font-medium text-ink tabular-nums">
          <bdi>{main}</bdi>
        </span>
      </span>
      {sub !== null && (
        <span className="block text-2xs text-ink-muted tabular-nums">
          <bdi>{sub}</bdi>
        </span>
      )}
      {(high || low || lowest) && (
        <span className="sr-only">
          {high
            ? t("Rate far above the other bids")
            : low
              ? t("Rate far below the other bids")
              : t("Lowest rate on the line")}
        </span>
      )}
      {cell.qty !== null && <QtyBadge qty={cell.qty} client={r.qty} fmt={fmt} />}
    </td>
  );
}

function QtyBadge({ qty, client, fmt }: { qty: number; client: number | null; fmt: Fmt }) {
  const t = useT();
  const tip =
    client !== null
      ? t("The bidder priced a quantity of {qty} instead of the client's {client}", {
          qty: fmt.num(qty),
          client: fmt.num(client),
        })
      : t("Quantity changed by the bidder");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="mt-1 inline-flex items-center gap-1 rounded-full bg-partial-soft px-1.5 text-2xs font-medium text-partial tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Ruler className="size-3" aria-hidden />
          {t("Qty {qty}", { qty: fmt.num(qty) })}
          <span className="sr-only">: {tip}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

function Legend({ fmt }: { fmt: Fmt }) {
  const t = useT();
  const swatch = "inline-flex size-4 shrink-0 items-center justify-center rounded-sm";
  return (
    <ul aria-label={t("Legend")} className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-2">
      <li className="inline-flex items-center gap-2">
        <span aria-hidden className={cn(swatch, "bg-ok-soft")}>
          <Check className="size-3 text-ok" />
        </span>
        {t("Lowest rate on the line")}
      </li>
      <li className="inline-flex items-center gap-2">
        <span aria-hidden className={cn(swatch, "bg-fail-soft")}>
          <ArrowUp className="size-3 text-fail" />
        </span>
        {t("Rate more than {x} times the bidders' median", { x: fmt.num(OUTLIER) })}
      </li>
      <li className="inline-flex items-center gap-2">
        <span aria-hidden className={cn(swatch, "bg-partial-soft")}>
          <ArrowDown className="size-3 text-partial" />
        </span>
        {t("Rate under the bidders' median divided by {x}", { x: fmt.num(OUTLIER) })}
      </li>
      <li className="inline-flex items-center gap-2">
        <span aria-hidden className={cn(swatch, "bg-surface-muted text-ink-faint")}>
          —
        </span>
        {t("Not priced, or left out of the bid")}
      </li>
      <li className="inline-flex items-center gap-2">
        <TriangleAlert aria-hidden className="size-3.5 text-fail" />
        {t("Quantity × rate ≠ amount")}
      </li>
      <li className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="inline-flex items-center rounded-full bg-partial-soft px-1.5 text-partial"
        >
          <Ruler className="size-3" />
        </span>
        {t("Quantity changed by the bidder")}
      </li>
    </ul>
  );
}
