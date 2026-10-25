/**
 * The price comparison as text for the AI (2026-10-25, building works): Mizan's own figures, so
 * the model explains the prices instead of adding up a bill of quantities itself. An overview of
 * every bid, and for one bidder the lines that stand out. Pure.
 */
import type { BoqComparisonDto, BoqFlag } from "../../lib/api-types";

const n = (x: number | null | undefined) =>
  x == null ? "—" : x.toLocaleString("en-US", { maximumFractionDigits: 2 });

const short = (s: string, max = 70) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/** Every bid's totals and issues, cheapest first. */
export function boqOverview(c: BoqComparisonDto): string {
  const cur = c.currency;
  const lines = [
    `Lines to price in the client's bill of quantities: ${c.items}.`,
    c.estimate
      ? `Client's internal cost estimate: ${n(c.estimate)} ${cur}.`
      : "No cost estimate was given.",
  ];
  const ranked = [...c.vendors].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  for (const v of ranked) {
    if (!v.parsed) {
      lines.push(`- ${v.vendor}: no Excel bill of quantities in the bid (prices not compared).`);
      continue;
    }
    const issues = [
      v.unpriced && `${v.unpriced} unpriced lines`,
      v.missing && `${v.missing} client lines left out`,
      v.extra && `${v.extra} lines added (${n(v.extraAmount)} ${cur})`,
      v.qtyChanged && `${v.qtyChanged} quantities changed`,
      v.arithmetic && `${v.arithmetic} lines where quantity × rate ≠ amount`,
      v.high && `${v.high} rates more than 2.5× the bidders' median`,
      v.low && `${v.low} rates less than the median ÷ 2.5`,
      v.difference !== null &&
        `its lines add up to ${n(v.linesTotal)}, ${n(Math.abs(v.difference))} ${v.difference > 0 ? "less" : "more"} than its stated total`,
    ].filter(Boolean);
    lines.push(
      `- ${v.vendor}: rank ${v.rank} of ${ranked.filter((x) => x.parsed).length} by price; stated total ${n(v.statedTotal)} ${cur} before VAT (${n(v.totalWithVat)} with VAT)${
        v.vsEstimatePct != null
          ? `, ${Math.abs(v.vsEstimatePct)}% ${v.vsEstimatePct < 0 ? "below" : "above"} the estimate`
          : ""
      }; ${v.priced} of ${c.items} lines priced${issues.length ? `; ${issues.join("; ")}` : ""}.`,
    );
  }
  return lines.join("\n");
}

/** The lines of one bid that stand out (at most `max` of each kind). */
export function boqDetail(c: BoqComparisonDto, proposalId: string, max = 8): string {
  const v = c.vendors.find((x) => x.proposalId === proposalId);
  if (!v?.parsed) return "";
  const cur = c.currency;
  const pick = (flag: BoqFlag) =>
    c.rows.filter((r) => r.cells[proposalId]?.flags.includes(flag)).slice(0, max);
  const label = (r: (typeof c.rows)[number]) =>
    `${r.sheet !== c.sheets[0] || c.sheets.length > 1 ? `${r.sheet} › ` : ""}${r.section ? `${short(r.section, 40)} › ` : ""}item ${r.no || "?"} "${short(r.description)}"`;
  const out: string[] = [];
  const arithmetic = pick("arithmetic");
  if (arithmetic.length)
    out.push(
      "Quantity × rate ≠ amount:",
      ...arithmetic.map((r) => {
        const cell = r.cells[proposalId];
        const qty = cell.qty ?? r.qty;
        return `  - ${label(r)}: ${n(qty)} ${r.unit} × ${n(cell.rate)} = ${n((qty ?? 0) * (cell.rate ?? 0))}, but the amount written is ${n(cell.amount)}.`;
      }),
    );
  const qty = pick("qty_changed");
  if (qty.length)
    out.push(
      "Quantities changed from the client's bill of quantities:",
      ...qty.map((r) => `  - ${label(r)}: ${n(r.qty)} → ${n(r.cells[proposalId].qty)} ${r.unit}.`),
    );
  const unpriced = pick("unpriced");
  if (unpriced.length)
    out.push(
      `Unpriced lines (${v.unpriced} in all):`,
      ...unpriced.map((r) => {
        const note = r.cells[proposalId].amountText ?? r.cells[proposalId].rateText;
        return `  - ${label(r)}${note ? `: "${short(note, 50)}"` : ""}.`;
      }),
    );
  const far = [...pick("high"), ...pick("low")];
  if (far.length)
    out.push(
      "Rates far from the other bids (bidders' median in brackets):",
      ...far.map(
        (r) =>
          `  - ${label(r)}: ${n(r.cells[proposalId].effectiveRate)} ${cur} per ${r.unit || "unit"} (${n(r.median)}).`,
      ),
    );
  return out.join("\n");
}
