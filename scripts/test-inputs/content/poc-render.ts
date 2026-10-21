/**
 * POC inputs (user request, 2026-10-21): two small, complete tenders that show the whole workflow
 * in a meeting: one to rehearse, one to run live. Each has one standard (pasted as rules), one
 * RFP and two vendors with a technical and a commercial proposal. This file renders them; the
 * content is in poc-gates.ts and poc-eseals.ts. Nothing in the documents is written for the
 * evaluator (HANDOFF §0 rule 3); expected outcomes for humans are in test-inputs/SCENARIO.md.
 */
import { DOC_CSS, clause, doc, tag } from "../lib/pdf";

export type Level = "M" | "I" | "D";
export type Priority = "mandatory" | "important" | "desirable";

export interface PocStandard {
  code: string;
  title: string;
  category: string;
  description: string;
  rules: [code: string, text: string, priority: Priority][];
}

export interface PocTender {
  ref: string;
  title: string;
  place: string;
  issuer: string;
  programme: string;
  issued: string;
  closing: string;
  contact: string;
  sections: { title: string; clauses: [no: string, text: string, level?: Level][] }[];
  /** Annex 1 compliance matrix: [clause, short requirement]. */
  matrix: [string, string][];
}

export interface PocBid {
  slug: string;
  name: string;
  legalName: string;
  country: string;
  address: string;
  contact: { name: string; email: string };
  signatory: { name: string; title: string };
  date: string;
  ref: string;
  technical: { title: string; html: string }[];
  /** The bidder's answers to Annex 1: clause → [response, offered / reference]. */
  matrix: Record<string, [string, string]>;
  commercial: {
    lines: [description: string, qty: number, unit: number][];
    recurring: { label: string; amounts: number[] };
    notes: string[];
    terms: [string, string][];
  };
}

export const usd = (n: number) => `USD ${Math.round(n).toLocaleString("en-US")}`;
export const p = (s: string) => `<p>${s}</p>`;
export const ul = (items: string[]) =>
  `<ul>${items.map((i) => `<li style="margin-bottom:3pt">${i}</li>`).join("")}</ul>`;
export const tbl = (head: string[], rows: string[][]) =>
  `<table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`;

/** The paste block for Standards → Paste rules: `CODE | text | priority`, one rule per line. */
export function rulesText(s: PocStandard): string {
  return s.rules.map(([code, text, priority]) => `${code} | ${text} | ${priority}`).join("\n");
}

export function rfpHtml(t: PocTender): string {
  const sections = t.sections
    .map(
      (s, i) =>
        `<h2>${i + 1}. ${s.title}</h2>\n${s.clauses
          .map(([no, text, level]) => clause(no, level ? `${text} ${tag(level)}` : text))
          .join("\n")}`,
    )
    .join("\n");
  const body = `
<section class="cover">
  <div>
    <div class="small" style="letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8pt">${t.issuer} · ${t.programme}</div>
    <div class="band">
      <div style="font-size:10pt;opacity:.85;margin-bottom:6pt">REQUEST FOR PROPOSAL · ${t.ref}</div>
      <h1>${t.title}</h1>
      <div style="font-size:11pt;opacity:.9">${t.place}</div>
    </div>
  </div>
  <table class="kv">
    <tr><td>Tender reference</td><td><b>${t.ref}</b></td></tr>
    <tr><td>Procedure</td><td>Open tender · two envelopes (technical / commercial)</td></tr>
    <tr><td>Date of issue</td><td>${t.issued}</td></tr>
    <tr><td>Bid closing date</td><td>${t.closing}</td></tr>
    <tr><td>Contact</td><td>${t.contact}</td></tr>
  </table>
  <div class="warn"><b>SAMPLE DOCUMENT.</b> This tender, the issuing authority and the sites are fictional. The document was created to demonstrate procurement-evaluation software.</div>
</section>

<section class="pb">
  <p class="small">Requirements marked ${tag("M")} are mandatory: a bid that does not meet them may be rejected. ${tag("I")} and ${tag("D")} requirements are scored.</p>
  ${sections}
  <div class="sig"><div>Chair, Tender Committee<br>${t.issuer}</div><div>Issued: ${t.issued}<br>Reference: ${t.ref}</div></div>
</section>

<section class="pb">
  <h2>Annex 1. Compliance matrix (to be completed by the bidder)</h2>
  <p>For each clause, state Comply, Partially comply or Do not comply, and the section of the technical proposal where the requirement is answered.</p>
  ${tbl(
    ["Clause", "Requirement", "Response", "Reference in the proposal"],
    t.matrix.map(([ref, req]) => [ref, req, "", ""]),
  )}
</section>`;
  return doc(body, `${t.ref} RFP`);
}

const css = `${DOC_CSS}
  .letterhead { display:flex; justify-content:space-between; border-bottom:1.5pt solid #13304d; padding-bottom:6pt; margin-bottom:12pt; }
  .letterhead b { font-size: 13pt; color:#13304d; }
  td.num, th.num { text-align:right; white-space:nowrap; }
  tr.total td { font-weight:700; background:#eef2f6 !important; }`;

const letterhead = (b: PocBid) =>
  `<div class="letterhead"><div><b>${b.legalName}</b><br><span class="small">${b.address}</span></div><div class="small" style="text-align:right">${b.contact.name}<br>${b.contact.email}</div></div>`;

const signature = (b: PocBid) =>
  `<div class="sig"><div>${b.signatory.name}<br>${b.signatory.title}, ${b.legalName}</div><div>Date: ${b.date}<br>Reference: ${b.ref}</div></div>`;

const page = (title: string, body: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body><div class="watermark">SAMPLE · FICTIONAL</div>${body}</body></html>`;

export function technicalHtml(t: PocTender, b: PocBid): string {
  const rows = t.matrix.map(([ref, req]) => {
    const [response, offered] = b.matrix[ref] ?? ["", ""];
    return [ref, req, response, offered];
  });
  const body = `
<section>
  ${letterhead(b)}
  <h1>Technical proposal (Envelope 1)</h1>
  <p class="small">Tender ${t.ref} · ${t.title}</p>
  <p>To: The Chair, Tender Committee, ${t.issuer}</p>
  <p>Having examined the tender documents for ${t.ref}, we, ${b.legalName}, submit our technical proposal. This envelope contains no prices; our prices and commercial terms are in Envelope 2.</p>
  ${signature(b)}
</section>
${b.technical.map((s, i) => `<section${i === 0 ? ' class="pb"' : ""}><h2>${i + 1}. ${s.title}</h2>${s.html}</section>`).join("\n")}
<section class="pb">
  <h2>${b.technical.length + 1}. Compliance matrix (Annex 1)</h2>
  ${tbl(["Clause", "Requirement", "Response", "Offered"], rows)}
</section>`;
  return page(`${b.name} technical proposal`, body);
}

export function bidTotals(b: PocBid) {
  const supply = b.commercial.lines.reduce((s, [, qty, unit]) => s + qty * unit, 0);
  const recurring = b.commercial.recurring.amounts.reduce((s, x) => s + x, 0);
  return { supply, recurring, total: supply + recurring };
}

export function commercialHtml(t: PocTender, b: PocBid): string {
  const c = b.commercial;
  const { supply, recurring, total } = bidTotals(b);
  const rows = [
    ...c.lines.map(
      ([d, qty, unit], i) =>
        `<tr><td>${i + 1}</td><td>${d}</td><td class="num">${qty.toLocaleString("en-US")}</td><td class="num">${usd(unit)}</td><td class="num">${usd(qty * unit)}</td></tr>`,
    ),
    `<tr class="total"><td></td><td colspan="3">Total supply and installation</td><td class="num">${usd(supply)}</td></tr>`,
    ...c.recurring.amounts.map(
      (v, i) =>
        `<tr><td>Y${i + 1}</td><td colspan="3">${c.recurring.label}, year ${i + 1}</td><td class="num">${usd(v)}</td></tr>`,
    ),
    `<tr class="total"><td></td><td colspan="3">${c.recurring.label}, ${c.recurring.amounts.length}-year total</td><td class="num">${usd(recurring)}</td></tr>`,
    `<tr class="total"><td></td><td colspan="3">Total bid price</td><td class="num">${usd(total)}</td></tr>`,
  ].join("");
  const body = `
<section>
  ${letterhead(b)}
  <h1>Commercial proposal (Envelope 2)</h1>
  <p class="small">Tender ${t.ref} · ${t.title}</p>
  <p>To: The Chair, Tender Committee, ${t.issuer}</p>
  <p>We, ${b.legalName}, offer to supply, install and support the system described in our technical proposal for the total bid price of <b>${usd(total)}</b>, as detailed in the price schedule below.</p>
  ${signature(b)}
</section>
<section>
  <h2>Price schedule</h2>
  <p class="small">All prices in United States Dollars (USD), excluding VAT.</p>
  <table><tr><th style="width:7%">Line</th><th>Description</th><th class="num" style="width:8%">Qty</th><th class="num" style="width:16%">Unit price</th><th class="num" style="width:18%">Amount</th></tr>${rows}</table>
  <h3>Notes</h3>
  <ol>${c.notes.map((n) => `<li style="margin-bottom:4pt">${n}</li>`).join("")}</ol>
</section>
<section>
  <h2>Commercial terms</h2>
  ${tbl(
    ["Item", "Our terms"],
    c.terms.map(([k, v]) => [`<b>${k}</b>`, v]),
  )}
  ${signature(b)}
</section>`;
  return page(`${b.name} commercial proposal`, body);
}
