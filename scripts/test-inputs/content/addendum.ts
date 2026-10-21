import { clause as c, doc, tag as t } from "../lib/pdf";
import { TENDER } from "./rfp";

/** Addendum No. 1 — explicit, labelled amendments to the RFP and Annex B, plus Q&A (RFP §2.5). */
export function addendumHtml(): string {
  const body = `
<h1>Addendum No. 1</h1>
<p class="small">Tender ${TENDER.ref} · ${TENDER.title} · Issued 28 October 2026</p>
<div class="note">This Addendum forms an integral part of the RFP. In accordance with RFP §2.5.2 and §2.6.1 it prevails over the RFP main document, Annex B and Annex C wherever they differ. Bidders shall acknowledge receipt in Form F-1.</div>

<h2>Part A — Changes to the tender documents</h2>
${c("A1", `<b>Bid closing date</b> (cover page): replace "30 November 2026, 12:00" with <b>"14 December 2026, 12:00 local time"</b>. The bid validity of 120 days (RFP §2.2.1) is counted from the new closing date.`)}
${c("A2", `<b>RFP §3.3.1 and Annex B TB-41</b> are replaced by: "The Bidder shall supply <b>20 workstations</b>: 10 at the CIAC, 5 at T1, 3 at T2 and 2 spare/mobile." The workstation specification in RFP §4.10.1 is unchanged.`)}
${c("A3", `<b>RFP §4.5.2 and Annex B TB-22</b> are amended: UPS autonomy for <b>control systems and servers</b> shall be at least <b>60 minutes</b> at full load (previously 30). UPS autonomy for workstations remains 30 minutes (TB-23).`)}
${c("A4", `<b>New clause RFP §4.3.4:</b> "The Bidder shall submit with its Technical Proposal a <b>Radiation Licensing Support Plan</b> (activities, documents, responsibilities, timeline aligned with §5.1) for obtaining the national regulator's licence for every system." ${t("M")}`)}
${c("A5", `<b>Annex B TB-07</b>, relocatable unit column: replace "≥ 150" with <b>"≥ 120"</b> trucks per hour. All other columns are unchanged.`)}

<h2>Part B — Answers to clarification questions</h2>
<table>
  <tr><th style="width:5%">#</th><th style="width:40%">Question (summarised)</th><th>Answer</th></tr>
  <tr><td>Q1</td><td>Is the relocatable unit subject to the T1 penetration target when deployed at T1?</td><td>No. The relocatable unit's targets are those of the "Relocatable unit" column of Annex B wherever it is deployed (see also A5). All other requirements of the site where it is deployed apply.</td></tr>
  <tr><td>Q2</td><td>If PAC is delayed by the Employer, when does the warranty start?</td><td>The warranty starts at PAC (RFP §6.1.1). If PAC is delayed by more than 60 days for reasons solely attributable to the Employer, the warranty starts on the 61st day after successful SAT.</td></tr>
  <tr><td>Q3</td><td>Our licence requires a one-time activation. How should this be handled?</td><td>A one-time offline activation (licence file transferred by the Employer's staff) is acceptable, provided no connection outside the Employer's network is required afterwards for operation, licence renewal or updates (RFP §4.6.1).</td></tr>
  <tr><td>Q4</td><td>Are guarantees from foreign banks acceptable?</td><td>Only if confirmed by a bank licensed in the State (bid security, advance payment guarantee and performance security).</td></tr>
</table>
<div class="sig"><div>Chair, Tender Committee<br>Northern Gulf Ports Authority</div><div>Addendum No. 1 · ${TENDER.ref}<br>28 October 2026</div></div>`;
  return doc(body, `${TENDER.ref} Addendum 1`);
}

/** Annex A — T2 site plan (PNG). The plot is deliberately tight: 70 m × 28 m, 250 kVA. */
export function sitePlanHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#fff;font-family:"Segoe UI",Arial,sans-serif;color:#1b2733}
  .frame{position:absolute;inset:18px;border:2px solid #13304d}
  .title{position:absolute;right:18px;bottom:18px;width:420px;border-left:2px solid #13304d;border-top:2px solid #13304d;font-size:12px}
  .title div{border-bottom:1px solid #13304d;padding:5px 8px;display:flex;justify-content:space-between}
  .title b{color:#13304d}
  </style></head><body>
  <div class="frame"></div>
  <svg width="1600" height="1000" viewBox="0 0 1600 1000" style="position:absolute;inset:0">
    <defs>
      <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="#b8b2a6" stroke-width="2"/></pattern>
      <marker id="arr" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#13304d"/></marker>
    </defs>
    <text x="60" y="80" font-size="26" font-weight="700" fill="#13304d">ANNEX A-2 · TERMINAL 2 MAIN GATE · INSPECTION PLOT</text>
    <text x="60" y="108" font-size="15" fill="#5c6774">Tender NGPA/T/2026/014 · Scale 1:500 (indicative) · Dimensions in metres · SAMPLE / FICTIONAL</text>
    <!-- existing customs building (north) -->
    <rect x="300" y="160" width="900" height="110" fill="url(#hatch)" stroke="#5c6774" stroke-width="2"/>
    <text x="750" y="222" text-anchor="middle" font-size="18" fill="#3d4b5c">EXISTING CUSTOMS BUILDING (to remain)</text>
    <!-- plot -->
    <rect x="300" y="300" width="900" height="360" fill="#eef7f6" stroke="#0e7c7b" stroke-width="4" stroke-dasharray="14 8"/>
    <text x="750" y="340" text-anchor="middle" font-size="20" font-weight="700" fill="#0a5f5e">AVAILABLE INSPECTION PLOT · 70.0 m × 28.0 m</text>
    <text x="750" y="368" text-anchor="middle" font-size="15" fill="#0a5f5e">Controlled area incl. all shielding and exclusion zones MUST fit inside this boundary (RFP §4.3.2)</text>
    <!-- lane -->
    <rect x="300" y="450" width="900" height="70" fill="#d6d1c6" opacity="0.6"/>
    <text x="750" y="492" text-anchor="middle" font-size="16" fill="#1b2733">Inspection lane (one-way, eastbound) → </text>
    <line x1="230" y1="485" x2="290" y2="485" stroke="#13304d" stroke-width="3" marker-end="url(#arr)"/>
    <text x="150" y="480" font-size="14" fill="#3d4b5c">From T2</text><text x="150" y="498" font-size="14" fill="#3d4b5c">gate-in</text>
    <!-- RoRo lane (south) -->
    <rect x="300" y="690" width="900" height="90" fill="url(#hatch)" stroke="#5c6774" stroke-width="2"/>
    <text x="750" y="742" text-anchor="middle" font-size="18" fill="#3d4b5c">RO-RO MARSHALLING LANE (live traffic — no encroachment)</text>
    <!-- dims -->
    <line x1="300" y1="290" x2="1200" y2="290" stroke="#13304d" stroke-width="1.5" marker-start="url(#arr)" marker-end="url(#arr)"/>
    <text x="750" y="285" text-anchor="middle" font-size="15" fill="#13304d">70.0</text>
    <line x1="1230" y1="300" x2="1230" y2="660" stroke="#13304d" stroke-width="1.5" marker-start="url(#arr)" marker-end="url(#arr)"/>
    <text x="1245" y="485" font-size="15" fill="#13304d">28.0</text>
    <!-- substation -->
    <rect x="1310" y="560" width="120" height="80" fill="#fcf1de" stroke="#a15c00" stroke-width="2"/>
    <text x="1370" y="592" text-anchor="middle" font-size="15" font-weight="700" fill="#8a4f00">T2-SS2</text>
    <text x="1370" y="614" text-anchor="middle" font-size="13" fill="#8a4f00">250 kVA max</text>
    <path d="M1310 600 H1260 V640 H1200" fill="none" stroke="#a15c00" stroke-width="2" stroke-dasharray="6 5"/>
    <text x="1268" y="672" font-size="12" fill="#8a4f00">cable route ≈ 180 m (existing ducts)</text>
    <!-- north arrow -->
    <g transform="translate(1440,190)"><circle r="34" fill="none" stroke="#13304d" stroke-width="2"/><path d="M0,-28 L10,10 L0,2 L-10,10 z" fill="#13304d"/><text y="56" text-anchor="middle" font-size="16" font-weight="700" fill="#13304d">N</text></g>
    <!-- notes -->
    <text x="60" y="830" font-size="14" fill="#1b2733" font-weight="700">Notes</text>
    <text x="60" y="854" font-size="13" fill="#3d4b5c">1. Plot cannot be extended: bounded by the customs building (north) and the Ro-Ro lane (south). East/west ends reserved for queuing.</text>
    <text x="60" y="876" font-size="13" fill="#3d4b5c">2. Power available at T2-SS2: 250 kVA total for the inspection system including HVAC and cabin. Reinforcement is in the Bidder's scope and cost (RFP §3.5.2).</text>
    <text x="60" y="898" font-size="13" fill="#3d4b5c">3. Ground: asphalt over compacted fill. A geotechnical survey by the Bidder is required before foundation design.</text>
  </svg>
  <div class="title"><div><b>NORTHERN GULF PORTS AUTHORITY</b><span>SAMPLE</span></div><div><span>Drawing</span><span>A-2 · T2 inspection plot</span></div><div><span>Revision</span><span>0 · 15 Sep 2026</span></div></div>
  </body></html>`;
}
