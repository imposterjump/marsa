/**
 * Nile Gate Solutions — regional integrator for the OEM Corvanta Imaging. Fictional.
 * Values match the bidder's bilingual summary in test-inputs/phase-1/edge-cases.
 */
import { table, type VendorSpec } from "./common";

export const NILE_GATE: VendorSpec = {
  slug: "Nile-Gate-Solutions",
  name: "Nile Gate Solutions",
  legalName: "Nile Gate Solutions S.A.E.",
  country: "Egypt",
  address: "41 Corniche Road, Maadi, Cairo · Branch office: Al-Noor Business Park, Tower B",
  contact: {
    name: "Mona Fahmy",
    title: "Tender Manager",
    email: "tenders@nilegate.example",
    phone: "+20 2 0000 0000",
  },
  signatory: { name: "Hesham Abdelrahman", title: "Chief Executive Officer" },
  accent: "#0f766e",
  accentDark: "#123c38",
  bidDate: "9 December 2026",
  refPrefix: "NGS/2026/T-014",
  technical: {
    letter: `
<p>We, Nile Gate Solutions S.A.E., acting as the authorised partner of <b>Corvanta Imaging Ltd.</b> (the OEM) for this tender, submit our technical proposal for tender NGPA/T/2026/014. We acknowledge receipt of <b>Addendum No. 1</b> of 28 October 2026 and have taken it into account.</p>
<p>The tender-specific OEM authorisation (Form F-3) signed by Corvanta Imaging is enclosed. This technical envelope contains no prices. The bid is valid for 120 days from 14 December 2026. Where our offer differs from the requirements, the differences are stated openly in Form F-2 and Form F-6.</p>`,
    sections: [
      {
        title: "Company, OEM partner and experience",
        html: `
<p>Nile Gate Solutions is a systems integrator specialised in customs and port security technology. Founded in 2006 in Cairo, the company has operated a branch office in the State since 2014, with 64 permanent staff in-country, including engineers, civil works supervisors and Arabic-speaking trainers. Nile Gate has delivered 14 cargo inspection projects as Corvanta's partner in the region, and has integrated inspection systems with national customs risk engines and single-window platforms.</p>
<p><b>Corvanta Imaging Ltd.</b> manufactures the CX series of high-energy inspection systems and supplies the linear accelerators, detectors and VisionCore software. Corvanta guarantees the supply of spare parts for 10 years after PAC and supports Nile Gate with second-level engineering.</p>
<h3>Form F-4 — References (Corvanta systems delivered by Nile Gate)</h3>
${table(
  ["Site", "Scope", "Year", "Climate"],
  [
    [
      "Port of Mirsal, Bulk & General Cargo Terminal",
      "2 × CX-45 DE drive-through, local analysis room",
      "2020",
      "Mean summer max 42 °C, RH 78 %",
    ],
    [
      "Red Valley land port",
      "3 × CX-45 DE, integration with the national risk engine",
      "2022",
      "Mean summer max 44 °C, RH 25 %",
    ],
    [
      "Port of Sela, Container Terminal 1",
      "2 × CX-45 DE + relocatable CX-45 R",
      "2024",
      "Mean summer max 34 °C, RH 70 %",
    ],
  ],
)}`,
      },
      {
        title: "Offered systems",
        html: `
<p>Four Corvanta CX-series systems with a <b>4.5 MeV dual-energy</b> linear accelerator:</p>
${table(
  ["Site", "Model", "Views", "Steel penetration", "Throughput"],
  [
    ["T1 Gate A", "CX-45 DE", "Top + side", "290 mm", "160 trucks/h"],
    ["T1 Gate B", "CX-45 DE", "Top + side", "290 mm", "160 trucks/h"],
    ["T2 main gate", "CX-45 DE", "Top + side", "290 mm", "160 trucks/h"],
    ["Relocatable", "CX-45 R", "Top", "290 mm", "160 trucks/h"],
  ],
)}
<p>The 4.5 MeV source keeps the controlled area and the shielding compact, which matters especially on the 70 m × 28 m T2 plot, and lowers the electrical demand of each system.</p>`,
      },
      {
        title: "Imaging and operations",
        html: `
${table(
  ["Parameter", "Value", "Verification"],
  [
    ["Steel penetration (ANSI N42.46-2008)", "290 mm, all sites", "FAT + SAT"],
    ["Wire detection behind 100 mm steel", "1.0 mm Cu", "FAT"],
    ["Contrast sensitivity", "1.0 %", "FAT"],
    ["Material discrimination", "4 classes", "FAT"],
    ["Throughput, driver in cab", "160 trucks/h", "SAT, 4-hour test"],
    ["Scan speed", "5–12 km/h", "SAT"],
    ["Tunnel", "4.6 m × 3.0 m", "Drawing"],
    ["MTTR, line-replaceable units", "≤ 3 hours", "Maintenance records"],
  ],
)}`,
      },
      {
        title: "Radiation safety, site fit and power",
        html: `
<p>The beam starts only after the driver cab has passed the beam plane (cab detection by laser scanner and loop, redundant). No cab scan is offered. The calculated annual dose at the controlled-area boundary is 0.8 mSv at full throughput. Emergency stops, interlocks, beam-on lights, audible alarms and Arabic/English signs are provided.</p>
${table(
  ["Site", "Plot", "Controlled area", "Demand incl. HVAC", "Available"],
  [
    ["T1 Gate A / B", "95 × 36 m", "76 × 26 m", "185 kVA", "400 kVA"],
    ["T2 main gate", "70 × 28 m", "64 × 25 m", "185 kVA", "250 kVA"],
    ["Relocatable, T1 pad", "80 × 32 m", "62 × 26 m", "110 kVA", "160 kVA"],
    [
      "Relocatable, T2 pad",
      "60 × 30 m",
      "56 × 26 m",
      "110 kVA",
      "100 kVA + 150 kVA generator (Nile Gate supply)",
    ],
  ],
)}
<h3>Radiation Licensing Support Plan (Addendum No. 1, A4)</h3>
<p>Our licensed radiation protection officer, resident in the State, prepares each system's licence file (shielding report, radiation protection programme, emergency plan) in Arabic and English for submission by the Employer: T1 Gate A in month 1, the other systems in month 3. Nile Gate coordinates the regulator's inspections before each SAT and supplies personal dosimeters for operators for the first 12 months.</p>`,
      },
      {
        title: "Environmental conditions and power continuity",
        html: `
<p>Continuous operating ambient temperature <b>0 °C to +45 °C</b> (Corvanta type-test), humidity up to 95 % non-condensing, outdoor enclosures IP54, C5-M coating system, wind survival 120 km/h. Operator cabins are air-conditioned with N+1 units. Supply 400 V ±10 %, 3-phase, 50 Hz. UPS: 60 minutes for control systems and servers, 30 minutes for workstations.</p>`,
      },
      {
        title: "VisionCore software and the CIAC",
        html: `
<p>Corvanta VisionCore is installed entirely on-premise at the CDC and the terminals. The licence is activated once with an offline licence file; no telemetry, licence check or update service connects outside the Employer's network. Updates are delivered on signed media and installed by our engineers with the Employer's administrators.</p>
<p><b>Storage:</b> 1,170,000 scans × 45 MB × 5 years = 263.25 TB, plus 20 % headroom = 315.9 TB. We offer <b>330 TB usable</b> (RAID 6 + hot spares). Images and metadata are kept online for 5 years and can be exported in DICOS format. Workload routing between the CIAC and terminal analysts keeps the expected 90th-percentile decision time within 3 minutes. VisionCore Assist offers automated anomaly highlighting for undeclared goods, weapons, cigarettes and currency, running on the CDC servers only.</p>`,
      },
      {
        title: "Integration and OCR",
        html: `
<p>Nile Gate's integration team has connected inspection systems to three national customs risk engines. CRMS: bidirectional REST/JSON (requests, results, image links, annotations). TOS: UN/EDIFACT COPARN/CODECO or REST. OCR: container numbers per ISO 6346 with check digit (98.5 %) and Arabic/Latin licence plates (98.2 %). All middleware included.</p>`,
      },
      {
        title: "Cybersecurity",
        html: `
<p>AD over LDAPS with RBAC; MFA for administrators; 5-year tamper-evident audit logs forwarded to the Employer's SIEM (syslog); AES-256 at rest and TLS 1.2+ in transit; SBOM and quarterly patches during warranty and CMC; independent penetration test before go-live with critical and high findings closed; vendor remote access only through the Employer's VPN, per session and recorded.</p>`,
      },
      {
        title: "Workstations and user interface",
        html: `
<p>20 workstations (10 CIAC, 5 T1, 3 T2, 2 spare/mobile) per Addendum No. 1. Each workstation has <b>two 27-inch monitors at 1920 × 1080</b>, colour-calibrated, 32 GB RAM and a dedicated GPU. The VisionCore interface is fully bilingual (Arabic/English) and shows Gregorian and Hijri dates.</p>`,
      },
      {
        title: "Implementation and acceptance",
        html: `
${table(
  ["Milestone", "Month"],
  [
    ["Surveys, design approval, licence files", "M1–M2"],
    ["Civil works (Nile Gate's own civil team)", "M1–M5"],
    ["FAT at Corvanta factory (4 Employer witnesses, travel at our cost)", "M3"],
    ["T1 Gate A in trial operation", "M5"],
    ["All systems SAT, integration and penetration test", "M6–M7"],
    ["PAC of all systems", "M8"],
  ],
)}
<p>Our local presence allows parallel civil works on all sites from month 1, which is why we can offer PAC one month ahead of the RFP's 9-month limit.</p>`,
      },
      {
        title: "Training",
        html: `
<p>All courses are delivered in Arabic by Nile Gate's own certified trainers: operators (40 participants, 5 days, on site), analysts (12 participants, 10 days at the CIAC plus 20 days on-the-job coaching), maintenance engineers (6 participants, 15 days at the Corvanta factory, with an Arabic-speaking Nile Gate engineer) and system administrators (2 participants, 5 days at the CDC). A train-the-trainer programme is included. Documentation in Arabic and English.</p>`,
      },
      {
        title: "Warranty, support and maintenance",
        html: `
<p><b>Warranty:</b> 24 months starting from the date of shipment from the factory, covering spare parts and labour. The X-ray source (linear accelerator) is a consumable and is excluded from the warranty; replacement sources are supplied at Corvanta list price.</p>
<p><b>Support:</b> our existing service centre in the State has <b>three Corvanta-certified engineers</b> and holds critical spare parts in-country. On-site response at T1/T2 within 8 hours, remote response within 2 hours, 24/7. Guaranteed availability of 98 % per scanner per month. Spare parts available for 10 years after PAC.</p>
<p><b>CMC:</b> five years after warranty, covering preventive and corrective maintenance, spare parts (except the X-ray source) and VisionCore updates.</p>`,
      },
    ],
    compliance: {
      "TB-01": ["Partially comply", "290 mm at all sites", "§2–3"],
      "TB-02": ["Comply", "1.0 mm Cu", "§3"],
      "TB-03": ["Comply", "4.5 MeV dual-energy", "§2"],
      "TB-04": ["Comply", "1.0 %", "§3"],
      "TB-05": ["Comply", "4 classes", "§3"],
      "TB-06": ["Comply", "Top + side (fixed); top (relocatable)", "§2"],
      "TB-07": ["Partially comply", "160 trucks/h at all sites", "§3"],
      "TB-08": ["Comply", "5–12 km/h", "§3"],
      "TB-09": ["Comply", "4.6 × 3.0 m", "§3"],
      "TB-10": ["Comply", "Redundant cab detection", "§4"],
      "TB-11": ["Comply", "No cab scan offered", "§4"],
      "TB-12": ["Comply", "0.8 mSv/yr", "§4"],
      "TB-13": ["Comply", "T2: 64 × 25 m", "§4"],
      "TB-14": ["Comply", "Provided", "§4"],
      "TB-15": ["Partially comply", "0 … +45 °C", "§5"],
      "TB-16": ["Comply", "≤ 95 %", "§5"],
      "TB-17": ["Comply", "IP54", "§5"],
      "TB-18": ["Comply", "C5-M", "§5"],
      "TB-19": ["Comply", "120 km/h", "§5"],
      "TB-20": ["Comply", "400 V, 3-ph, 50 Hz", "§5"],
      "TB-21": ["Comply", "185 kVA; 110 kVA + generator at T2 pad", "§4"],
      "TB-22": ["Comply", "60 min", "§5"],
      "TB-23": ["Comply", "30 min", "§5"],
      "TB-24": ["Comply", "All on-premise, offline licence", "§6"],
      "TB-25": ["Comply", "In-country", "§6"],
      "TB-26": ["Comply", "5 years", "§6"],
      "TB-27": ["Comply", "330 TB usable", "§6"],
      "TB-28": ["Comply", "DICOS export", "§6"],
      "TB-29": ["Comply", "REST/JSON", "§7"],
      "TB-30": ["Comply", "EDIFACT or REST", "§7"],
      "TB-31": ["Comply", "98.5 %", "§7"],
      "TB-32": ["Comply", "98.2 %", "§7"],
      "TB-33": ["Comply", "≤ 3 min expected", "§6"],
      "TB-34": ["Comply", "LDAPS, RBAC, MFA", "§8"],
      "TB-35": ["Comply", "5 years", "§8"],
      "TB-36": ["Comply", "AES-256 / TLS 1.2+", "§8"],
      "TB-37": ["Comply", "Employer VPN", "§8"],
      "TB-38": ["Comply", "Arabic + English", "§9"],
      "TB-39": ["Comply", "Gregorian + Hijri", "§9"],
      "TB-40": ["Partially comply", '2 × 27" at 1920 × 1080', "§9"],
      "TB-41": ["Comply", "20", "§9"],
      "TB-42": ["Comply", "72 hours", "§2"],
      "TB-43": ["Comply", "98 %", "§12"],
      "TB-44": ["Comply", "8 hours", "§12"],
      "TB-45": ["Comply", "10 years", "§12"],
    },
    deviations: [
      [
        "RFP §4.1.1 / TB-01",
        "Steel penetration 290 mm at all sites.",
        "The 4.5 MeV source gives a compact controlled area and lower power demand; 290 mm covers the large majority of declared cargo densities at the port.",
      ],
      [
        "RFP §4.2.1 / TB-07",
        "Throughput 160 trucks/h at T1 Gate A.",
        "Meets the 150 trucks/h requirement at all other lanes.",
      ],
      [
        "RFP §4.4.1 / TB-15",
        "Operating ambient temperature up to +45 °C.",
        "Operator cabins and electronics cabinets are air-conditioned with N+1 redundancy.",
      ],
      [
        "RFP §4.10.1 / TB-40",
        "Monitors 1920 × 1080.",
        "Full-HD monitors at 27 inches are used by all our current customers' analysts.",
      ],
      [
        "RFP §6.1.1",
        "Warranty period starts on shipment from the factory.",
        "Corvanta's standard warranty terms.",
      ],
      [
        "RFP §6.1.2",
        "X-ray source excluded from warranty (consumable).",
        "Corvanta's standard warranty terms; sources are supplied at list price.",
      ],
      [
        "RFP §6.3.2",
        "Three OEM-certified engineers at the local service centre.",
        "Our existing centre with three certified engineers has served all our regional installations; additional engineers come from Cairo within 24 hours.",
      ],
    ],
  },
  commercial: {
    letter: `
<p>We offer to carry out the Contract for the prices of our Form F-5 price schedule, in USD, DDP site including import duties and excluding VAT. We acknowledge Addendum No. 1.</p>
<p>Bid validity: 120 days from 14 December 2026. Bid security: USD 150,000, unconditional bank guarantee from the Commercial Bank of Al-Noor (no. CBA/LG/2026/5521), valid until 11 May 2027.</p>
<p>We accept the payment milestones of Annex C, Appendix 1, and the Draft Contract, subject to the items in Form F-6.</p>`,
    prices: {
      "1.1": 3980000,
      "1.2": 3980000,
      "1.3": 3980000,
      "1.4": 3350000,
      "2.1": 1320000,
      "2.2": 470000,
      "2.3": 158000,
      "3.1": 1020000,
      "3.2": 690000,
      "4.1": 420000,
      "4.2": 300000,
      "5.1": 240000,
      "5.2": 34000,
      "6.1": 70000,
      "7.1": 480000,
    },
    cmc: [860000, 885800, 912374, 939745, 967937],
    storageTb: 330,
    workstations: 20,
    unitWorkstation: 7900,
    notes: [
      "DDP site, Port of Al-Noor, including import duties; VAT excluded.",
      "CMC year 1 firm; 3 % escalation per year for years 2–5.",
      "The CMC covers all spare parts except the X-ray source. Optional (not included in the totals): replacement linear accelerator, USD 410,000 per system, installed.",
      "Line 1.4 includes the 150 kVA generator for the T2 relocatable pad.",
    ],
    terms: [
      {
        title: "Commercial terms and local value added",
        html: `
${table(
  ["Item", "Offer"],
  [
    ["Payment", "Annex C, Appendix 1 (10 / 60 / 20 / 10)"],
    ["Advance payment guarantee", "From a bank licensed in the State"],
    ["Performance security", "10 % of the Contract Price"],
    ["Warranty", "24 months from shipment (see F-6)"],
    ["Liability and delay damages", "As per the Draft Contract and Special Conditions"],
  ],
)}
<p><b>Local value added: 41 %</b> (civil works by our own teams in the State, local assembly of shielding, operator cabins, local service centre staff and training), certified by an independent auditor (certificate attached). We request the 5 % margin of preference (RFP §7.6).</p>
<p>Subcontractors above 10 % of the contract value: <b>Corvanta Imaging Ltd.</b> (OEM equipment and software, about 58 %). We declare no conflict of interest.</p>`,
      },
    ],
    deviations: [
      [
        "SC 18.4",
        "The CMC does not include X-ray source replacement.",
        "The source is a consumable under Corvanta's terms; an optional replacement price is given in the notes to Form F-5.",
      ],
      [
        "RFP §6.1.1",
        "Warranty starts on shipment from the factory.",
        "See the technical Form F-6.",
      ],
    ],
  },
};
