/**
 * Shared structure for the four Phase 4 vendor proposals (tender NGPA/T/2026/014).
 * Every bid follows the RFP's own structure (forms F-1 … F-6), as real bids do. The content
 * of each bid lives in its vendor file; nothing here or there is written for the evaluator
 * (HANDOFF §0 rule 3).
 */
import { DOC_CSS } from "../../lib/pdf";
import { TENDER } from "../rfp";

export type F2Status = "Comply" | "Partially comply" | "Not comply" | "";

export interface VendorSpec {
  slug: string;
  name: string;
  legalName: string;
  country: string;
  address: string;
  contact: { name: string; title: string; email: string; phone: string };
  signatory: { name: string; title: string };
  accent: string;
  accentDark: string;
  bidDate: string;
  refPrefix: string;
  technical: {
    letter: string;
    sections: { title: string; html: string }[];
    /** Form F-2: Annex B ref → [status, offered value, proposal reference]. Missing rows stay blank. */
    compliance: Record<string, [F2Status, string, string]>;
    /** Form F-6 (technical part): [RFP ref, deviation, explanation]. */
    deviations: [string, string, string][];
    /** Requirement wording the bidder copied into its own F-2 (e.g. from Annex B Rev 0). */
    rowLabels?: Record<string, string>;
  };
  commercial: {
    letter: string;
    /** Form F-5 line → USD, or null when the bidder left the line unpriced. */
    prices: Record<string, number | null>;
    cmc: (number | null)[];
    storageTb: number;
    workstations: number;
    unitWorkstation: number;
    notes: string[];
    terms: { title: string; html: string }[];
    deviations: [string, string, string][];
  };
}

/** Annex B requirements as amended by Addendum No. 1 (A2, A3, A5), in Form F-2 order. */
export const F2_ROWS: [string, string][] = [
  ["TB-01", "Steel penetration (ANSI N42.46): T1 A/B ≥ 310 mm, T2 ≥ 300 mm, relocatable ≥ 280 mm"],
  ["TB-02", "Wire detection behind 100 mm steel ≤ 1.0 mm Cu"],
  ["TB-03", "Dual-energy X-ray source"],
  ["TB-04", "Contrast sensitivity ≤ 1.0 %"],
  ["TB-05", "Material discrimination ≥ 4 classes"],
  ["TB-06", "Dual-view (top + side) imaging (optional for relocatable)"],
  [
    "TB-07",
    "Throughput, driver in cab: T1 Gate A ≥ 180/h; T1 Gate B, T2 ≥ 150/h; relocatable ≥ 120/h (A5)",
  ],
  ["TB-08", "Vehicle speed during scan 5–15 km/h"],
  ["TB-09", "Inspection tunnel ≥ 4.6 m × 3.0 m (H × W)"],
  ["TB-10", "High-energy beam never on occupied driver cab"],
  ["TB-11", "Driver dose per pass ≤ 0.25 µSv (if cab scan offered)"],
  ["TB-12", "Annual dose at controlled-area boundary ≤ 1 mSv"],
  ["TB-13", "Controlled area + exclusion zones fit the site plots"],
  ["TB-14", "Emergency stops, interlocks, beam-on lights, audible alarms"],
  ["TB-15", "Continuous operating ambient 0 … +50 °C"],
  ["TB-16", "Relative humidity ≤ 95 % non-condensing"],
  ["TB-17", "Outdoor electronics enclosures ≥ IP54"],
  ["TB-18", "Steel coating C5-M (ISO 12944)"],
  ["TB-19", "Wind survival 120 km/h"],
  ["TB-20", "Supply 400 V ±10 %, 3-phase, 50 Hz"],
  ["TB-21", "Maximum demand per system ≤ site capacity"],
  ["TB-22", "UPS autonomy, control systems and servers ≥ 60 min (A3)"],
  ["TB-23", "UPS autonomy, workstations ≥ 30 min"],
  ["TB-24", "On-premise hosting of all components incl. licensing, telemetry, updates"],
  ["TB-25", "Data residency: in-country only"],
  ["TB-26", "Online retention of images and metadata: 5 years"],
  ["TB-27", "Usable storage at CDC per RFP §4.6.3 (state usable TB)"],
  ["TB-28", "DICOS (NEMA IIC 1) export"],
  ["TB-29", "CRMS bidirectional REST/JSON integration"],
  ["TB-30", "TOS integration: EDIFACT COPARN/CODECO or REST"],
  ["TB-31", "OCR container numbers (ISO 6346) ≥ 98 %"],
  ["TB-32", "OCR licence plates, Arabic + Latin ≥ 98 %"],
  ["TB-33", "Scan-to-analyst-decision time, 90th percentile ≤ 3 min"],
  ["TB-34", "AD via LDAPS, RBAC, MFA for administrators"],
  ["TB-35", "Tamper-evident audit log retention 5 years"],
  ["TB-36", "Encryption AES-256 at rest / TLS ≥ 1.2 in transit"],
  ["TB-37", "Vendor remote access via Employer VPN, per session, recorded"],
  ["TB-38", "Operator/analyst UI in Arabic and English"],
  ["TB-39", "Hijri + Gregorian date display"],
  ["TB-40", 'Monitors: 2 × 27", ≥ 2560 × 1440 per workstation'],
  ["TB-41", "Workstations: 20 in total (A2)"],
  ["TB-42", "Relocation T1 ↔ T2 incl. re-commissioning ≤ 72 h"],
  ["TB-43", "Availability per scanner per month ≥ 98 %"],
  ["TB-44", "On-site response 24/7 ≤ 24 h"],
  ["TB-45", "Spare parts availability ≥ 10 years after PAC"],
];

/** Form F-5 lines (Annex C, Appendix 2). */
export const F5_LINES: [string, string, string][] = [
  [
    "1.1",
    "High-energy drive-through system, T1 Gate A, incl. shielding and traffic control",
    "1 lot",
  ],
  ["1.2", "High-energy drive-through system, T1 Gate B", "1 lot"],
  ["1.3", "High-energy drive-through system, T2 main gate", "1 lot"],
  ["1.4", "Relocatable high-energy system", "1 lot"],
  ["2.1", "CIAC image management and analysis platform, incl. licences", "1 lot"],
  ["2.2", "CIAC storage", "1 lot"],
  ["2.3", 'Operator/analyst workstations (dual 27")', "pcs"],
  ["3.1", "Civil and building works, T1 (both gates)", "1 lot"],
  ["3.2", "Civil and building works, T2, incl. any power reinforcement", "1 lot"],
  ["4.1", "Integration: CRMS and TOS, incl. middleware", "1 lot"],
  ["4.2", "OCR (container and plates), all lanes", "1 lot"],
  ["5.1", "Training (RFP §5.3)", "1 lot"],
  ["5.2", "FAT witnessing: travel and accommodation for 4 persons", "1 lot"],
  ["6.1", "Radiation licensing support (RFP §4.3.3–4.3.4)", "1 lot"],
  ["7.1", "Initial in-country stock of critical spare parts", "1 lot"],
];

export const usd = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export function totals(v: VendorSpec) {
  const capex = F5_LINES.reduce((s, [line]) => s + (v.commercial.prices[line] ?? 0), 0);
  const cmc = v.commercial.cmc.reduce<number>((s, x) => s + (x ?? 0), 0);
  return { capex, cmc, evaluated: capex + cmc };
}

const css = (v: VendorSpec) =>
  DOC_CSS.replaceAll("#13304d", v.accentDark).replaceAll("#0e7c7b", v.accent) +
  `
  .lh { display:flex; align-items:center; gap:10pt; }
  .lh .mark { width:30pt; height:30pt; border-radius:7pt; background:${v.accent}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12pt; letter-spacing:.5px; }
  .lh .nm { font-size:13pt; font-weight:700; color:${v.accentDark}; line-height:1.15; }
  .lh .ad { font-size:8pt; color:#5c6774; }
  .status-c { color:#1d6b3a; font-weight:600; } .status-p { color:#8a4f00; font-weight:600; } .status-n { color:#a12a20; font-weight:600; }
  .num { text-align:right; font-variant-numeric: tabular-nums; white-space:nowrap; }
  tr.total td { font-weight:700; background:#eef0f2 !important; border-top:1pt solid ${v.accentDark}; }
  `;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

function letterhead(v: VendorSpec) {
  return `<div class="lh"><div class="mark">${initials(v.name)}</div><div><div class="nm">${v.legalName}</div><div class="ad">${v.address} · ${v.contact.email}</div></div></div>`;
}

function cover(v: VendorSpec, kind: "technical" | "commercial") {
  const title = kind === "technical" ? "Technical Proposal" : "Financial Proposal";
  const env = kind === "technical" ? "Envelope 1" : "Envelope 2";
  return `
<section class="cover">
  <div>
    ${letterhead(v)}
    <div class="band" style="margin-top:28pt">
      <div style="font-size:10pt;opacity:.85;margin-bottom:6pt">${env.toUpperCase()} · ${title.toUpperCase()}</div>
      <h1>${TENDER.title}</h1>
      <div style="font-size:11pt;opacity:.9">${TENDER.port} · Tender ${TENDER.ref}</div>
    </div>
  </div>
  <table class="kv">
    <tr><td>Submitted to</td><td>${TENDER.authority}, Tender Committee Secretariat</td></tr>
    <tr><td>Bidder</td><td><b>${v.legalName}</b> (${v.country})</td></tr>
    <tr><td>Our reference</td><td>${v.refPrefix}-${kind === "technical" ? "T" : "F"}</td></tr>
    <tr><td>Date</td><td>${v.bidDate}</td></tr>
    <tr><td>Contact</td><td>${v.contact.name}, ${v.contact.title} · ${v.contact.email} · ${v.contact.phone}</td></tr>
  </table>
  <div class="warn"><b>SAMPLE DOCUMENT.</b> This bid and the company that submits it are fictional. The document was created to test procurement-evaluation software and is not a real offer.</div>
</section>`;
}

function signature(v: VendorSpec) {
  return `<div class="sig"><div>For and on behalf of ${v.legalName}<br><b>${v.signatory.name}</b>, ${v.signatory.title}</div><div>Date: ${v.bidDate}<br>Company seal</div></div>`;
}

function deviationTable(rows: [string, string, string][]) {
  if (!rows.length)
    return `<p>The Bidder declares that this proposal contains <b>no deviations</b> from the tender documents, including Addendum No. 1.</p>`;
  return `<table><tr><th style="width:14%">RFP reference</th><th style="width:38%">Deviation</th><th>Explanation</th></tr>
  ${rows.map(([r, d, e]) => `<tr><td>${r}</td><td>${d}</td><td>${e}</td></tr>`).join("")}</table>`;
}

function statusCell(s: F2Status) {
  const cls =
    s === "Comply"
      ? "status-c"
      : s === "Partially comply"
        ? "status-p"
        : s === "Not comply"
          ? "status-n"
          : "";
  return `<td class="${cls}">${s}</td>`;
}

export function technicalHtml(v: VendorSpec): string {
  const t = v.technical;
  const toc = t.sections.map((s, i) => `<div><span>${i + 1}. ${s.title}</span></div>`).join("");
  const body = `
${cover(v, "technical")}
<section class="pb">
  ${letterhead(v)}
  <h2>Form F-1 — Bid submission letter (technical)</h2>
  <p class="small">${v.refPrefix}-T · ${v.bidDate}</p>
  <p>To: The Chair, Tender Committee, ${TENDER.authority}</p>
  ${t.letter}
  ${signature(v)}
  <h2>Contents</h2>
  <div class="toc">${toc}<div><span>Annex 1. Form F-2 — Technical compliance matrix</span></div><div><span>Annex 2. Form F-6 — Statement of deviations (technical)</span></div></div>
</section>
${t.sections.map((s, i) => `<section${i === 0 ? ' class="pb"' : ""}><h2>${i + 1}. ${s.title}</h2>${s.html}</section>`).join("\n")}
<section class="pb">
  <h2>Annex 1. Form F-2 — Technical compliance matrix</h2>
  <p class="small">One row per Annex B requirement, as amended by Addendum No. 1. "Reference" points to the section of this proposal.</p>
  <table>
    <tr><th style="width:8%">Ref</th><th style="width:37%">Requirement</th><th style="width:14%">Status</th><th style="width:31%">Offered</th><th style="width:10%">Reference</th></tr>
    ${F2_ROWS.map(([ref, req]) => {
      const [s, offered, where] = t.compliance[ref] ?? ["", "", ""];
      return `<tr><td>${ref}</td><td>${t.rowLabels?.[ref] ?? req}</td>${statusCell(s)}<td>${offered}</td><td>${where}</td></tr>`;
    }).join("")}
  </table>
</section>
<section>
  <h2>Annex 2. Form F-6 — Statement of deviations (technical)</h2>
  ${deviationTable(t.deviations)}
  ${signature(v)}
</section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${v.name} technical proposal</title><style>${css(v)}</style></head><body><div class="watermark">SAMPLE · FICTIONAL</div>${body}</body></html>`;
}

export function commercialHtml(v: VendorSpec): string {
  const c = v.commercial;
  const { capex, cmc } = totals(v);
  const cell = (n: number | null | undefined) =>
    n == null ? `<td class="num">—</td>` : `<td class="num">${usd(n)}</td>`;
  const priceRows = F5_LINES.map(([line, desc, unit]) => {
    const total = c.prices[line];
    const qty =
      line === "2.3" ? `${c.workstations} pcs` : line === "2.2" ? `${c.storageTb} TB usable` : unit;
    const unitPrice = line === "2.3" ? c.unitWorkstation : total;
    return `<tr><td>${line}</td><td>${desc}</td><td>${qty}</td>${cell(total == null ? null : unitPrice)}${cell(total)}</tr>`;
  }).join("");
  const cmcRows = c.cmc
    .map(
      (x, i) =>
        `<tr><td>8.${i + 1}</td><td>CMC year ${i + 1}</td><td>1 year</td>${cell(x)}${cell(x)}</tr>`,
    )
    .join("");
  const body = `
${cover(v, "commercial")}
<section class="pb">
  ${letterhead(v)}
  <h2>Form F-1 — Bid submission letter (financial)</h2>
  <p class="small">${v.refPrefix}-F · ${v.bidDate}</p>
  <p>To: The Chair, Tender Committee, ${TENDER.authority}</p>
  ${c.letter}
  ${signature(v)}
</section>
<section class="pb">
  <h2>Form F-5 — Price schedule</h2>
  <p class="small">All prices in United States Dollars (USD). Structure as per Annex C, Appendix 2.</p>
  <table>
    <tr><th style="width:7%">Line</th><th style="width:47%">Description</th><th style="width:14%">Qty</th><th style="width:15%" class="num">Unit price</th><th style="width:17%" class="num">Total</th></tr>
    ${priceRows}
    <tr class="total"><td></td><td>TOTAL CAPEX</td><td></td><td></td><td class="num">${usd(capex)}</td></tr>
    ${cmcRows}
    <tr class="total"><td></td><td>TOTAL CMC (years 1–5)</td><td></td><td></td><td class="num">${usd(cmc)}</td></tr>
    <tr class="total"><td></td><td>TOTAL OFFER (CAPEX + CMC)</td><td></td><td></td><td class="num">${usd(capex + cmc)}</td></tr>
  </table>
  <h3>Notes to the price schedule</h3>
  <ol>${c.notes.map((n) => `<li style="margin-bottom:4pt">${n}</li>`).join("")}</ol>
</section>
${c.terms.map((s, i) => `<section${i === 0 ? ' class="pb"' : ""}><h2>${s.title}</h2>${s.html}</section>`).join("\n")}
<section>
  <h2>Form F-6 — Statement of deviations (financial)</h2>
  ${deviationTable(c.deviations)}
  ${signature(v)}
</section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${v.name} financial proposal</title><style>${css(v)}</style></head><body><div class="watermark">SAMPLE · FICTIONAL</div>${body}</body></html>`;
}

/** Small helper for spec tables inside sections. */
export function table(head: string[], rows: (string | number)[][]) {
  return `<table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")}</table>`;
}
