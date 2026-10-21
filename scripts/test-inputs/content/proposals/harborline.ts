/** Harborline Systems — established OEM, premium offer. Fictional. */
import { table, type VendorSpec } from "./common";

export const HARBORLINE: VendorSpec = {
  slug: "Harborline-Systems",
  name: "Harborline Systems",
  legalName: "Harborline Systems B.V.",
  country: "Netherlands",
  address: "Havenstraat 112, 3011 AL Rotterdam, Netherlands",
  contact: {
    name: "Eva Lindqvist",
    title: "Bid Manager, Middle East",
    email: "bids@harborline.example",
    phone: "+31 10 000 0000",
  },
  signatory: { name: "Pieter van Doorn", title: "Managing Director" },
  accent: "#1f6fb2",
  accentDark: "#0f2f52",
  bidDate: "10 December 2026",
  refPrefix: "HLS/NGPA/2026/014",
  technical: {
    letter: `
<p>Having examined the tender documents for tender NGPA/T/2026/014, including <b>Addendum No. 1 dated 28 October 2026</b>, receipt of which we hereby acknowledge, we offer to supply, install, commission and maintain the High-Energy Cargo X-Ray Inspection Systems for the Port of Al-Noor in conformity with the tender documents.</p>
<p>Harborline Systems B.V. is the Original Equipment Manufacturer of the HX-series inspection systems offered. Our technical proposal comprises this document and its annexes; it contains no pricing information, in accordance with RFP §2.4.2. Our financial proposal is submitted separately in Envelope 2.</p>
<p>We confirm that our bid is valid for 120 days from the bid closing date of 14 December 2026, that we have signed the Authority's integrity pledge, and that we accept the Draft Contract (Annex C) including its Special Conditions without reservation.</p>`,
    sections: [
      {
        title: "Company profile and experience",
        html: `
<p>Harborline Systems designs and manufactures high-energy X-ray inspection systems for ports, land borders and free zones. Founded in 1998, the company employs 1,150 people, of whom 310 work in research and development, and operates a factory and radiation test bunker in Rotterdam and a regional service hub serving the Gulf. Since 2012 Harborline has delivered 96 high-energy cargo scanners in 31 countries.</p>
<p>Harborline is the OEM of all inspection systems offered (Form F-3 not applicable). The detector arrays, image chain and HX Sentinel software are developed in-house; the linear accelerators are produced by our long-term supplier under a supply agreement that guarantees parts for 15 years.</p>
<h3>Form F-4 — Relevant references (last seven years)</h3>
${table(
  ["Site", "Scope", "Commissioned", "Climate", "End-user contact"],
  [
    [
      "Port of Mirsal, Container Terminal 2",
      "3 × HX-6 drive-through, central analysis centre, 18 workstations",
      "2021",
      "Mean summer max 43 °C, RH 76 %",
      "Head of Customs Inspection, Mirsal Customs",
    ],
    [
      "Kharif Bay Container Terminal",
      "2 × HX-6 drive-through + 1 × HX-6R relocatable",
      "2022",
      "Mean summer max 41 °C, RH 72 %",
      "Port Security Director, Kharif Bay Port Co.",
    ],
    [
      "Al-Wadi land border crossing",
      "2 × HX-6 drive-through, integration with national risk engine",
      "2023",
      "Mean summer max 45 °C, RH 30 %",
      "Director of Border Technology, Customs Authority",
    ],
    [
      "Port of Sela, Ro-Ro terminal",
      "1 × HX-6 drive-through on a constrained plot (66 m × 27 m)",
      "2024",
      "Mean summer max 34 °C, RH 70 %",
      "Terminal Manager, Sela Ro-Ro",
    ],
    [
      "Duqah Free Zone",
      "2 × HX-6, 5-year comprehensive maintenance (ongoing)",
      "2025",
      "Mean summer max 44 °C, RH 74 %",
      "Head of Operations, Duqah Free Zone Authority",
    ],
  ],
)}
<p>Three of these installations are in seaports with a mean summer maximum above 40 °C and humidity above 70 % (Mirsal, Kharif Bay, Duqah). Contact details for all references are provided in the separately sealed reference envelope.</p>`,
      },
      {
        title: "Solution overview",
        html: `
<p>We offer three <b>HX-6 DualView</b> drive-through systems (T1 Gate A, T1 Gate B and T2 main gate) and one <b>HX-6R</b> relocatable system, all with a 6 MeV dual-energy linear accelerator, together with the <b>HX Sentinel</b> image management and analysis platform hosted at the Customs Data Center (CDC).</p>
${table(
  ["Site", "System", "Source", "Views", "Penetration (steel)", "Throughput (driver in cab)"],
  [
    [
      "T1 Gate A",
      "HX-6 DualView",
      "6 MeV dual-energy linac",
      "Top + side",
      "320 mm",
      "200 trucks/h",
    ],
    [
      "T1 Gate B",
      "HX-6 DualView",
      "6 MeV dual-energy linac",
      "Top + side",
      "320 mm",
      "200 trucks/h",
    ],
    [
      "T2 main gate",
      "HX-6 DualView (compact shielding)",
      "6 MeV dual-energy linac",
      "Top + side",
      "320 mm",
      "180 trucks/h",
    ],
    ["Relocatable", "HX-6R", "6 MeV dual-energy linac", "Top", "300 mm", "150 trucks/h"],
  ],
)}
<p>Drivers remain in their cabs. The HX-6 uses a cab-gating sensor array that starts the high-energy beam only after the cab has passed the beam plane; the cab itself can be imaged by an optional separate low-dose 450 kV source (see §4).</p>`,
      },
      {
        title: "Imaging and throughput performance",
        html: `
${table(
  ["Parameter", "T1 Gate A / B", "T2", "Relocatable", "Verification"],
  [
    ["Steel penetration (ANSI N42.46-2008)", "320 mm", "320 mm", "300 mm", "FAT + SAT"],
    ["Wire detection behind 100 mm steel", "0.8 mm Cu", "0.8 mm Cu", "1.0 mm Cu", "FAT"],
    ["Contrast sensitivity", "0.8 %", "0.8 %", "1.0 %", "FAT"],
    [
      "Material discrimination",
      "5 classes (organic, light inorganic, inorganic, mixed, heavy metal)",
      "5 classes",
      "4 classes",
      "FAT",
    ],
    ["Scan speed", "5–15 km/h", "5–15 km/h", "5–12 km/h", "SAT"],
    ["Tunnel (H × W)", "4.8 m × 3.2 m", "4.8 m × 3.2 m", "4.7 m × 3.1 m", "Drawing"],
  ],
)}
<p>Throughput values are measured as 4-hour sustained averages with mixed 20' and 40' traffic at 8 km/h, matching the SAT method of Annex B. The T2 value is lower than at T1 because the shorter T2 approach limits queue spacing; it remains above the 150 trucks/h requirement. All lanes accept 45' high-cube containers on standard chassis.</p>
<p>The HX Sentinel software provides edge enhancement, density mapping, material colouring, and a library of 1,400 reference images for analyst training.</p>`,
      },
      {
        title: "Site layouts, power and radiation safety",
        html: `
<p>Dimensioned layout drawings are included in the drawings folio (drawings HLS-014-L01 to L05). The controlled area, including shielding walls and exclusion zones, fits every plot of Annex B, sheet "Site constraints":</p>
${table(
  [
    "Site",
    "Plot (Annex B)",
    "Controlled area offered",
    "Shielding concept",
    "Max. demand incl. HVAC",
    "Available power",
  ],
  [
    [
      "T1 Gate A",
      "95 × 36 m",
      "86 × 30 m",
      "Modular steel-concrete walls 1.6 m",
      "212 kVA",
      "400 kVA",
    ],
    [
      "T1 Gate B",
      "95 × 36 m",
      "86 × 30 m",
      "Modular steel-concrete walls 1.6 m",
      "212 kVA",
      "400 kVA",
    ],
    [
      "T2 main gate",
      "70 × 28 m",
      "68 × 27 m",
      "High-density concrete walls (3.4 t/m³), roof beam stop",
      "238 kVA",
      "250 kVA",
    ],
    [
      "Relocatable, T1 pad",
      "80 × 32 m",
      "74 × 30 m",
      "Transportable shielding blocks",
      "146 kVA",
      "160 kVA",
    ],
    [
      "Relocatable, T2 pad",
      "60 × 30 m",
      "58 × 28 m",
      "Transportable blocks + beam-stop container",
      "146 kVA",
      "100 kVA + 200 kVA generator (Harborline supply)",
    ],
  ],
)}
<p>At the T2 relocatable pad the available 100 kVA is insufficient; a 200 kVA containerised diesel generator is included in our scope, as permitted by Annex B. No grid reinforcement is needed at T2 main gate, where our demand of 238 kVA stays within the 250 kVA available.</p>
<p><b>Radiation safety.</b> The high-energy beam is never directed at an occupied cab (dual redundant cab-gating sensors, safety PLC to SIL 2). The optional cab scan uses a separate 450 kV source delivering <b>0.12 µSv per pass</b>. Annual dose at the controlled-area boundary is calculated at 0.6 mSv at 200 trucks/h (shielding calculation report HLS-014-R02). Emergency stops are placed so that one is reachable within 8 m from any point in the controlled area. Beam-on warning lights, audible alarms and bilingual (Arabic/English) signs are provided. Personal dosimeters are supplied for all operators during the first 12 months.</p>`,
      },
      {
        title: "Radiation Licensing Support Plan (Addendum No. 1, A4)",
        html: `
${table(
  ["Step", "Activity", "Responsible", "Timing (month from effectiveness)"],
  [
    [
      "1",
      "Pre-application meeting with the national radiation regulator",
      "Harborline + Employer",
      "M1",
    ],
    [
      "2",
      "Shielding calculations, radiation protection programme, local rules",
      "Harborline (Radiation Protection Adviser)",
      "M1–M2",
    ],
    [
      "3",
      "Licence application per system, signed by the Employer as licensee",
      "Harborline prepares, Employer submits",
      "M2 (T1 Gate A), M3 (others)",
    ],
    ["4", "Import permit for the radiation sources", "Harborline", "M3"],
    [
      "5",
      "Commissioning surveys and regulator inspection",
      "Harborline + regulator",
      "Before each SAT",
    ],
    [
      "6",
      "Licence issued; operation authorised",
      "Regulator",
      "Before trial operation of each system",
    ],
  ],
)}
<p>No system is operated before it is licensed. A qualified Radiation Protection Adviser remains assigned until the last licence is issued.</p>`,
      },
      {
        title: "Environmental design and power continuity",
        html: `
<p>All outdoor equipment is type-tested for continuous operation from <b>−5 °C to +55 °C</b> at up to 95 % relative humidity in saline atmosphere (test certificate TC-HX-2023-07). Outdoor electronics enclosures are <b>IP55</b> with air-to-air heat exchangers; structural steel uses a C5-M coating system (zinc-rich epoxy primer, epoxy intermediate, polyurethane topcoat, 320 µm DFT) for a durability of more than 15 years. Structures are designed for a wind survival speed of <b>130 km/h</b>; scanning stops automatically above 60 km/h.</p>
<p>Supply: 400 V ±10 %, 3-phase, 50 Hz. UPS autonomy is <b>60 minutes</b> for control systems and servers (Addendum No. 1, A3) and <b>30 minutes</b> for workstations, with orderly shutdown that preserves images in progress. Noise at 1 m from operator cabins is below 65 dB(A).</p>`,
      },
      {
        title: "Software, Central Image Analysis Centre and data",
        html: `
<p><b>Hosting.</b> HX Sentinel runs entirely on servers installed at the CDC and at each terminal. Licensing uses an offline licence file activated once by the Employer's staff (Addendum No. 1, Q3); no connection outside the Employer's network is required for operation, licence renewal, monitoring or updates. Updates are delivered as signed packages and installed by the Employer's administrators or by our engineers on site. No telemetry leaves the Employer's network.</p>
<p><b>Storage sizing</b> (RFP §4.6.3, Annex B "Volumes & storage"):</p>
${table(
  ["Item", "Value"],
  [
    ["Scans per year (all sites, 2028 volumes)", "1,170,000"],
    ["Average data per scan (both views + metadata)", "45 MB"],
    ["Data per year", "52.65 TB"],
    ["5-year online retention", "263.25 TB"],
    ["+ 20 % headroom", "315.9 TB"],
    [
      "<b>Usable capacity offered (after RAID 6)</b>",
      "<b>340 TB</b>, expandable to 680 TB in the same racks",
    ],
  ],
)}
<p>Images are stored in DICOS (NEMA IIC 1) natively and exported in DICOS, TIFF and JPEG. Workload-based routing sends each scan to the first free analyst at the CIAC or the terminals; the measured 90th-percentile scan-to-decision time at Port of Mirsal is <b>2.4 minutes</b>.</p>
<p><b>AI-assisted detection</b> (RFP §4.7): HX Sentinel Detect highlights anomalies for undeclared goods, weapons, cigarettes, narcotics concealment patterns and currency. All models run on GPU servers at the CDC. The Employer's images are never used to train models outside the CDC; models fine-tuned at the CDC are the Employer's property (GC 12.2).</p>
<p><b>Backup.</b> Daily encrypted backups to a second on-premise site designated by the Employer; RPO 24 hours, RTO 6 hours for the image platform.</p>`,
      },
      {
        title: "Integration and OCR",
        html: `
<p><b>CRMS:</b> bidirectional REST/JSON over HTTPS (scan requests, results, thumbnails with image links, analyst annotations), with an OpenAPI specification delivered at design review. <b>TOS:</b> UN/EDIFACT COPARN and CODECO (D.95B) through the HX Integration Hub, or REST if agreed with the terminal operator. All middleware is included. Integration tests run against the Employer's test environments before SAT.</p>
<p><b>OCR:</b> container numbers per ISO 6346 with check-digit validation (<b>99.1 %</b> correct reads at Port of Mirsal over 12 months) and licence plates in Arabic and Latin characters (<b>98.4 %</b>), with infrared illumination for night operation and wipers for dust.</p>`,
      },
      {
        title: "Cybersecurity",
        html: `
<p>HX Sentinel complies with RFP §4.8 and with the Employer's IT Security &amp; Data Residency Standard:</p>
<ul>
<li>Authentication through the Employer's Active Directory over LDAPS; role-based access control mapped to job functions; multi-factor authentication for all administrative and remote access (RADIUS integration with the Employer's MFA service).</li>
<li>Tamper-evident (hash-chained) audit logs of all user and administrator actions, retained for 5 years and forwarded in real time to the Employer's SIEM in syslog/CEF format.</li>
<li>Encryption at rest with AES-256 and in transit with TLS 1.3 (TLS 1.2 minimum), using certificates from the Employer's PKI.</li>
<li>Software Bill of Materials (CycloneDX) for every release; quarterly security patches; critical vulnerabilities remediated within 14 days and high within 30 days, during warranty and CMC.</li>
<li>Independent penetration test before go-live by an accredited third party; all critical and high findings closed before acceptance.</li>
<li>Vendor remote access only through the Employer's VPN, approved per session, with full session recording. No permanent or vendor-initiated connections.</li>
<li>Engineers with administrative access undergo the Directorate's security vetting and sign the confidentiality undertaking.</li>
</ul>`,
      },
      {
        title: "Workstations and user interface",
        html: `
<p>We supply <b>20 workstations</b> (Addendum No. 1, A2): 10 at the CIAC, 5 at T1, 3 at T2 and 2 spare/mobile. Each has <b>two 27-inch colour-calibrated monitors at 2560 × 1440</b>, 64 GB RAM and an NVIDIA RTX-class GPU with 16 GB memory. The operator and analyst interfaces are fully available in Arabic and English, switchable per user, with dates shown in both Gregorian and Hijri calendars.</p>`,
      },
      {
        title: "Implementation plan and acceptance",
        html: `
${table(
  ["Milestone", "Month"],
  [
    ["Design review and site surveys (incl. geotechnical survey at T2)", "M1–M2"],
    ["Civil works T1 Gate A", "M2–M4"],
    ["FAT of all systems in Rotterdam (4 Employer witnesses, travel at our cost)", "M3–M4"],
    ["T1 Gate A installed, SAT and start of trial operation", "M5"],
    ["T1 Gate B, T2 and relocatable SAT", "M6–M7"],
    ["CIAC platform, integration tests, penetration test", "M5–M7"],
    ["PAC of all systems after 30-day trial operation (≥ 95 % availability)", "M9"],
  ],
)}
<p>Civil works are carried out by our local partner Al-Bina Contracting under Harborline's management. Method statements and risk assessments are submitted to the HSE Department before works start, and a full-time HSE officer is on site.</p>`,
      },
      {
        title: "Training and documentation",
        html: `
${table(
  ["Audience", "Participants", "Duration", "Location", "Language"],
  [
    ["Scanner operators", "40", "5 days", "On site", "Arabic"],
    ["Image analysts", "12", "10 days + 20 days on-the-job coaching", "CIAC", "Arabic"],
    [
      "Maintenance engineers",
      "6",
      "15 days",
      "Harborline factory, Rotterdam",
      "English with simultaneous Arabic interpretation",
    ],
    ["System administrators", "2", "5 days", "CDC", "English"],
  ],
)}
<p>A train-the-trainer programme certifies four Employer instructors. Operation and maintenance manuals are delivered in English and Arabic, with as-built drawings and radiation survey reports.</p>`,
      },
      {
        title: "Warranty, support and maintenance",
        html: `
<p><b>Warranty:</b> 24 months from the PAC of each system, covering all parts, labour and travel, including the linear accelerator and detector arrays; 36 months from PAC for workstations, servers, storage and network equipment (SC 9.2).</p>
<p><b>Service:</b> Harborline Al-Noor Service Centre opens in the State three months before the first SAT with <b>six OEM-certified engineers</b> and an in-country stock of critical spare parts. Remote response within 2 hours and on-site response at T1/T2 within <b>12 hours</b>, 24/7.</p>
<p><b>Availability:</b> guaranteed ≥ 98 % per scanner per calendar month (penalties per Annex C, Appendix 3). <b>CMC:</b> five years after warranty, including preventive and corrective maintenance, all spare parts, one linear accelerator replacement per system if needed (SC 18.4) and software updates. Spare parts are guaranteed for <b>15 years</b> after PAC, with 24 months' notice of any end-of-life.</p>`,
      },
    ],
    compliance: {
      "TB-01": ["Comply", "320 mm (T1, T2); 300 mm (relocatable)", "§3"],
      "TB-02": ["Comply", "0.8 mm Cu (fixed); 1.0 mm Cu (relocatable)", "§3"],
      "TB-03": ["Comply", "6 MeV dual-energy linac", "§2"],
      "TB-04": ["Comply", "0.8 % (fixed); 1.0 % (relocatable)", "§3"],
      "TB-05": ["Comply", "5 classes (fixed); 4 (relocatable)", "§3"],
      "TB-06": ["Comply", "Top + side at T1 and T2; top only on relocatable", "§2"],
      "TB-07": ["Comply", "200/h T1 A/B; 180/h T2; 150/h relocatable", "§3"],
      "TB-08": ["Comply", "5–15 km/h (relocatable 5–12)", "§3"],
      "TB-09": ["Comply", "4.8 × 3.2 m (relocatable 4.7 × 3.1)", "§3"],
      "TB-10": ["Comply", "Redundant cab gating, SIL 2", "§4"],
      "TB-11": ["Comply", "0.12 µSv per pass (optional cab scan)", "§4"],
      "TB-12": ["Comply", "0.6 mSv/yr calculated", "§4"],
      "TB-13": ["Comply", "All plots; T2 68 × 27 m", "§4"],
      "TB-14": ["Comply", "E-stop within 8 m; lights, alarms, signs", "§4"],
      "TB-15": ["Comply", "−5 … +55 °C", "§6"],
      "TB-16": ["Comply", "≤ 95 %", "§6"],
      "TB-17": ["Comply", "IP55", "§6"],
      "TB-18": ["Comply", "C5-M, 320 µm", "§6"],
      "TB-19": ["Comply", "130 km/h", "§6"],
      "TB-20": ["Comply", "400 V ±10 %, 3-ph, 50 Hz", "§6"],
      "TB-21": ["Comply", "212 / 212 / 238 / 146 kVA; generator at T2 pad", "§4"],
      "TB-22": ["Comply", "60 min", "§6"],
      "TB-23": ["Comply", "30 min", "§6"],
      "TB-24": ["Comply", "All on-premise; offline licence file; no telemetry", "§7"],
      "TB-25": ["Comply", "In-country only", "§7"],
      "TB-26": ["Comply", "5 years online", "§7"],
      "TB-27": ["Comply", "340 TB usable (required ≈ 316 TB)", "§7"],
      "TB-28": ["Comply", "Native DICOS", "§7"],
      "TB-29": ["Comply", "REST/JSON, OpenAPI", "§8"],
      "TB-30": ["Comply", "EDIFACT COPARN/CODECO D.95B", "§8"],
      "TB-31": ["Comply", "99.1 % (reference site)", "§8"],
      "TB-32": ["Comply", "98.4 % Arabic + Latin", "§8"],
      "TB-33": ["Comply", "2.4 min (reference site)", "§7"],
      "TB-34": ["Comply", "LDAPS, RBAC, RADIUS MFA", "§9"],
      "TB-35": ["Comply", "5 years, hash-chained", "§9"],
      "TB-36": ["Comply", "AES-256 / TLS 1.3", "§9"],
      "TB-37": ["Comply", "Employer VPN, per session, recorded", "§9"],
      "TB-38": ["Comply", "Arabic + English", "§10"],
      "TB-39": ["Comply", "Gregorian + Hijri", "§10"],
      "TB-40": ["Comply", '2 × 27", 2560 × 1440, calibrated', "§10"],
      "TB-41": ["Comply", "20 workstations", "§10"],
      "TB-42": ["Comply", "48 hours", "§2"],
      "TB-43": ["Comply", "≥ 98 %", "§13"],
      "TB-44": ["Comply", "12 hours", "§13"],
      "TB-45": ["Comply", "15 years", "§13"],
    },
    deviations: [],
  },
  commercial: {
    letter: `
<p>Having examined the tender documents including Addendum No. 1, we offer to execute the Contract for the total amount stated in our price schedule (Form F-5), <b>DDP site (Incoterms 2020), inclusive of freight, insurance, import duties and all taxes except VAT</b>.</p>
<p>Our bid is valid for <b>120 days</b> from the bid closing date of 14 December 2026. The bid security of <b>USD 150,000</b> is enclosed as an unconditional bank guarantee issued by Gulf Commerce Bank, a bank licensed in the State (guarantee no. GCB/BG/2026/88412), valid until 11 May 2027.</p>
<p>We accept the payment milestones of Annex C, Appendix 1, the Special Conditions and all other terms of the Draft Contract without reservation.</p>`,
    prices: {
      "1.1": 4680000,
      "1.2": 4520000,
      "1.3": 4760000,
      "1.4": 3940000,
      "2.1": 1880000,
      "2.2": 640000,
      "2.3": 284000,
      "3.1": 1160000,
      "3.2": 860000,
      "4.1": 560000,
      "4.2": 390000,
      "5.1": 320000,
      "5.2": 42000,
      "6.1": 98000,
      "7.1": 660000,
    },
    cmc: [790000, 813700, 838111, 863254, 889152],
    storageTb: 340,
    workstations: 20,
    unitWorkstation: 14200,
    notes: [
      "Prices are DDP site, Port of Al-Noor, including import duties; VAT is excluded and payable by the Employer.",
      "Line 1.3 includes high-density concrete shielding walls required by the T2 plot; no power reinforcement is required at T2 main gate (maximum demand 238 kVA).",
      "Line 1.4 includes the 200 kVA containerised generator for the T2 relocatable pad.",
      "Line 2.2: 340 TB usable after RAID 6.",
      "CMC prices: year 1 firm; years 2–5 escalated by 3 % per year (the cap of SC 18.2). The CMC includes one linear-accelerator replacement per system if required (SC 18.4).",
    ],
    terms: [
      {
        title: "Commercial terms",
        html: `
${table(
  ["Item", "Our offer"],
  [
    ["Currency", "USD; exchange-rate risk borne by Harborline"],
    ["Incoterms", "DDP site, Port of Al-Noor (Incoterms 2020), duties included, VAT excluded"],
    [
      "Payment",
      "Per Annex C, Appendix 1: 10 % advance against an advance payment guarantee from a bank licensed in the State; 60 % on delivery; 20 % at PAC; 10 % at FAC",
    ],
    ["Performance security", "10 % of the Contract Price, valid until 28 days after the last FAC"],
    ["Delay damages", "Accepted as per SC 7.1 and SC 7.2"],
    ["Liability", "Accepted as per GC 10.1 and SC 10.1"],
    ["Warranty", "24 months from PAC; 36 months for IT equipment (SC 9.2)"],
    [
      "Insurance",
      "Contractor's all risks until PAC; third-party liability USD 5,000,000 per occurrence",
    ],
    ["Bid validity", "120 days from 14 December 2026"],
  ],
)}`,
      },
      {
        title: "Local value added and subcontractors",
        html: `
<p>Local value added is <b>32 %</b> of the Contract Price (civil works, local assembly of shielding modules, service-centre staff), as certified by an independent auditor (certificate enclosed). We therefore request the 5 % margin of preference (RFP §7.6).</p>
${table(
  ["Subcontractor", "Scope", "Share of contract value"],
  [["Al-Bina Contracting W.L.L. (the State)", "Civil and building works T1 and T2", "11 %"]],
)}
<p>No other subcontractor performs more than 10 % of the contract value. We declare no conflict of interest.</p>`,
      },
    ],
    deviations: [],
  },
};
