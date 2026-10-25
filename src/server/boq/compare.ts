/**
 * Price comparison of a building works tender (2026-10-25): every bidder's priced bill of
 * quantities against the client's, item by item. Computed by Mizan, never by the AI (the AI
 * explains the result). Pure.
 *
 * Items are matched by their description (and number and quantity), in order, so a bidder that
 * re-typed the sheets or renamed them is still compared line by line. Per bidder: the stated
 * total and what its lines add up to, unpriced lines, lines removed or added, changed quantities,
 * quantity × rate ≠ amount, rates far from the other bidders', and the gap to the estimate.
 */
import type {
  BoqCellDto,
  BoqComparisonDto,
  BoqFlag,
  BoqRowDto,
  BoqVendorDto,
} from "../../lib/api-types";
import type { BoqItem, ParsedBoq } from "./parse";

export interface BoqBid {
  proposalId: string;
  vendor: string;
  document: string | null;
  boq: ParsedBoq | null;
}

const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[ً-ْـ]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .split(" ")
      .filter((w) => w.length > 1)
      .slice(0, 30),
  );

function similarity(a: BoqItem, b: BoqItem, wa: Set<string>, wb: Set<string>): number {
  let common = 0;
  for (const w of wa) if (wb.has(w)) common++;
  const jaccard = wa.size + wb.size ? common / (wa.size + wb.size - common) : 0;
  return (
    jaccard +
    (a.qty !== null && a.qty === b.qty ? 0.25 : 0) +
    (a.no && a.no === b.no ? 0.1 : 0) +
    (a.unit && a.unit === b.unit ? 0.05 : 0)
  );
}

/** Client item index → the bidder's item; the bidder's lines that match nothing. */
export function alignItems(client: BoqItem[], bid: BoqItem[]) {
  const cw = client.map((i) => words(i.description));
  const bw = bid.map((i) => words(i.description));
  const match = new Map<number, BoqItem>();
  const used = new Set<number>();
  let p = 0;
  client.forEach((c, i) => {
    let best = -1;
    let bestScore = 0.55;
    // A little behind as well: a bidder may have swapped two lines.
    for (let j = Math.max(0, p - 8); j < Math.min(bid.length, p + 15); j++) {
      if (used.has(j)) continue;
      const s = similarity(c, bid[j], cw[i], bw[j]);
      if (s > bestScore) {
        best = j;
        bestScore = s;
      }
    }
    if (best >= 0) {
      match.set(i, bid[best]);
      used.add(best);
      p = Math.max(p, best + 1);
    }
  });
  const extra = bid.filter((_, j) => !used.has(j) && (bid[j].amount ?? 0) > 0);
  return { match, extra };
}

/** A line with something to price (descriptive lines have neither quantity nor unit). */
const priceable = (i: BoqItem) => i.qty !== null || !!i.unit;

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const round = (n: number) => Math.round(n * 100) / 100;

/** Rates more than this far from the bidders' median are flagged (×2.5 or ÷2.5). */
export const OUTLIER_FACTOR = 2.5;

export function compareBoqs(
  client: ParsedBoq,
  bids: BoqBid[],
  { estimate, clientDocument }: { estimate: number | null; clientDocument: string },
): BoqComparisonDto {
  const items = client.items;
  const aligned = new Map(
    bids.map((b) => [b.proposalId, b.boq ? alignItems(items, b.boq.items) : null]),
  );

  const rows: BoqRowDto[] = items.map((c, i) => {
    const cells: Record<string, BoqCellDto> = {};
    for (const b of bids) {
      const a = aligned.get(b.proposalId);
      if (!a) continue;
      const v = a.match.get(i);
      const flags: BoqFlag[] = [];
      if (!v) {
        if (priceable(c)) flags.push("missing");
        cells[b.proposalId] = {
          rate: null,
          rateText: null,
          amount: null,
          amountText: null,
          qty: null,
          effectiveRate: null,
          flags,
        };
        continue;
      }
      const amount = v.amount && v.amount !== 0 ? v.amount : null;
      const qtyChanged = c.qty !== null && v.qty !== null && Math.abs(c.qty - v.qty) > 1e-6;
      const qty = v.qty ?? c.qty;
      if (priceable(c) && amount === null && !v.inGroup) flags.push("unpriced");
      if (qtyChanged) flags.push("qty_changed");
      if (v.rate !== null && qty !== null && amount !== null) {
        const expected = v.rate * qty;
        if (Math.abs(expected - amount) > Math.max(1, Math.abs(amount) * 0.005))
          flags.push("arithmetic");
      }
      const effectiveRate =
        v.rate ?? (amount !== null && qty !== null && qty > 0 ? amount / qty : null);
      cells[b.proposalId] = {
        rate: v.rate,
        rateText: v.rateText,
        amount,
        amountText: v.inGroup ? null : v.amountText,
        qty: qtyChanged ? v.qty : null,
        effectiveRate: effectiveRate === null ? null : round(effectiveRate),
        flags,
      };
    }
    const rates = Object.values(cells)
      .map((x) => x.effectiveRate)
      .filter((r): r is number => r !== null && r > 0);
    const med = rates.length >= 3 ? median(rates) : null;
    const low = rates.length >= 2 ? Math.min(...rates) : null;
    for (const cell of Object.values(cells)) {
      const r = cell.effectiveRate;
      if (r === null || r <= 0) continue;
      if (med !== null && r > med * OUTLIER_FACTOR) cell.flags.push("high");
      if (med !== null && r < med / OUTLIER_FACTOR) cell.flags.push("low");
      if (low !== null && r === low) cell.flags.push("lowest");
    }
    return {
      index: i,
      sheet: c.sheet,
      section: c.section,
      no: c.no,
      description: c.description,
      unit: c.unit,
      qty: c.qty,
      priceable: priceable(c),
      median: med === null ? null : round(med),
      cells,
    };
  });

  const vendors: BoqVendorDto[] = bids.map((b) => {
    const a = aligned.get(b.proposalId);
    if (!b.boq || !a) {
      return {
        proposalId: b.proposalId,
        vendor: b.vendor,
        document: b.document,
        parsed: false,
        statedTotal: null,
        vat: null,
        totalWithVat: null,
        linesTotal: null,
        difference: null,
        priced: 0,
        unpriced: 0,
        missing: 0,
        extra: 0,
        extraAmount: 0,
        arithmetic: 0,
        qtyChanged: 0,
        high: 0,
        low: 0,
        lowest: 0,
        vsEstimatePct: null,
        rank: null,
      };
    }
    const cells = rows.map((r) => r.cells[b.proposalId]).filter(Boolean);
    const count = (f: BoqFlag) => cells.filter((c) => c.flags.includes(f)).length;
    const matchedSum = [...a.match.values()].reduce((s, it) => s + (it.amount ?? 0), 0);
    const extraAmount = a.extra.reduce((s, it) => s + (it.amount ?? 0), 0);
    const linesTotal = round(matchedSum + extraAmount);
    const statedTotal = b.boq.stated.total;
    const bidTotal = statedTotal ?? linesTotal;
    return {
      proposalId: b.proposalId,
      vendor: b.vendor,
      document: b.document,
      parsed: true,
      statedTotal,
      vat: b.boq.stated.vat,
      totalWithVat: b.boq.stated.totalWithVat,
      linesTotal,
      difference:
        statedTotal === null ||
        Math.abs(statedTotal - linesTotal) <= Math.max(1, statedTotal * 0.001)
          ? null
          : round(statedTotal - linesTotal),
      priced: cells.filter((c) => c.amount !== null).length,
      unpriced: count("unpriced"),
      missing: count("missing"),
      extra: a.extra.length,
      extraAmount: round(extraAmount),
      arithmetic: count("arithmetic"),
      qtyChanged: count("qty_changed"),
      high: count("high"),
      low: count("low"),
      lowest: count("lowest"),
      vsEstimatePct: estimate ? round(((bidTotal - estimate) / estimate) * 100) : null,
      rank: null,
    };
  });
  // Rank by the price the bidder signed for (its stated total), else what its lines add up to.
  const priced = vendors
    .filter((v) => v.parsed)
    .sort((x, y) => (x.statedTotal ?? x.linesTotal ?? 0) - (y.statedTotal ?? y.linesTotal ?? 0));
  priced.forEach((v, i) => (v.rank = i + 1));

  return {
    currency: client.currency ?? bids.find((b) => b.boq?.currency)?.boq?.currency ?? "AED",
    estimate,
    clientDocument,
    items: rows.filter((r) => r.priceable).length,
    sheets: client.sheets.map((s) => s.name),
    rows,
    vendors,
  };
}
