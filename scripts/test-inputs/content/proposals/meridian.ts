/** Meridian Scan Technologies — cost-competitive OEM with a cloud-centric software heritage. Fictional. */
import { table, type VendorSpec } from "./common";

export const MERIDIAN: VendorSpec = {
  slug: "Meridian-Scan-Technologies",
  name: "Meridian Scan Technologies",
  legalName: "Meridian Scan Technologies Pte. Ltd.",
  country: "Singapore",
  address: "18 Science Park Drive, #04-20, Singapore 118229",
  contact: {
    name: "Daniel Koh",
    title: "Regional Sales Director, MEA",
    email: "tenders@meridianscan.example",
    phone: "+65 0000 0000",
  },
  signatory: {
    name: "Daniel Koh",
    title: "Regional Sales Director, MEA (under power of attorney)",
  },
  accent: "#c2410c",
  accentDark: "#3b1d0e",
  bidDate: "11 December 2026",
  refPrefix: "MST-MEA-26-0914",
  technical: {
    letter: `
<p>Meridian Scan Technologies is pleased to submit its technical proposal for tender NGPA/T/2026/014. We have examined the RFP, its Annexes and <b>Addendum No. 1</b>, which we acknowledge, and we offer the Meridian HE-6 inspection systems and the Meridian ClearView image platform in accordance with these documents.</p>
<p>Meridian is the OEM of the systems offered. This envelope contains no prices (RFP §2.4.2). We confirm a bid validity of 120 days from the closing date of 14 December 2026 and have signed the Authority's integrity pledge.</p>`,
    sections: [
      {
        title: "About Meridian",
        html: `
<p>Meridian Scan Technologies was founded in 2011 and designs X-ray inspection systems and the software that connects them. Meridian has installed 58 high-energy cargo systems in 19 countries and manages a fleet of more than 400 inspection systems through its ClearView platform. Production takes place in our Singapore facility; final integration and radiation testing for the Middle East are performed in our Jebel facility.</p>
<h3>Form F-4 — References</h3>
${table(
  ["Customer / site", "Systems", "Year", "Climate", "Reference contact"],
  [
    [
      "Tamarind Coast Port, Container Terminal",
      "2 × HE-6 drive-through",
      "2020",
      "Mean summer max 42 °C, RH 80 %",
      "Chief of Customs Technology",
    ],
    [
      "Northern Corridor rail-road border post",
      "2 × HE-6, 1 × HE-6R",
      "2022",
      "Mean summer max 38 °C, RH 45 %",
      "Border Agency Programme Director",
    ],
    [
      "Port of Velar, Free Zone gate",
      "1 × HE-6",
      "2023",
      "Mean summer max 33 °C, RH 75 %",
      "Free Zone Security Manager",
    ],
    [
      "Island Logistics Hub",
      "3 × HE-6 with ClearView Cloud analysis",
      "2025",
      "Mean summer max 31 °C, RH 82 %",
      "Head of Inspection Operations",
    ],
  ],
)}`,
      },
      {
        title: "Proposed solution",
        html: `
<p>Our solution combines four high-energy systems with <b>Meridian ClearView</b>, a single platform for image review, workload routing, equipment monitoring and AI-assisted detection (ThreatSense).</p>
${table(
  ["Site", "Model", "Energy", "View", "Penetration", "Throughput"],
  [
    ["T1 Gate A", "HE-6 Drive", "6 MeV dual-energy", "Top", "310 mm", "190 trucks/h"],
    ["T1 Gate B", "HE-6 Drive", "6 MeV dual-energy", "Top", "310 mm", "190 trucks/h"],
    ["T2 main gate", "HE-6 Drive", "6 MeV dual-energy", "Top", "310 mm", "190 trucks/h"],
    ["Relocatable", "HE-6R", "4.5/6 MeV interlaced dual-energy", "Top", "290 mm", "140 trucks/h"],
  ],
)}
<p>The HE-6 family is single-view by design: our image chain uses a high-resolution top-view detector (2.5 mm pixel pitch) which, in our experience, gives analysts the information they need while reducing the controlled-area footprint and the cost of shielding.</p>`,
      },
      {
        title: "Imaging and throughput",
        html: `
${table(
  ["Parameter", "HE-6 Drive (T1, T2)", "HE-6R (relocatable)"],
  [
    ["Steel penetration (ANSI N42.46-2008)", "310 mm", "290 mm"],
    ["Wire detection behind 100 mm steel", "1.0 mm Cu", "1.0 mm Cu"],
    ["Contrast sensitivity", "1.0 %", "1.0 %"],
    ["Material discrimination", "4 classes", "4 classes"],
    ["Scan speed", "5–15 km/h", "5–10 km/h"],
    ["Tunnel (H × W)", "4.7 m × 3.1 m", "4.6 m × 3.0 m"],
  ],
)}
<p>Throughput is stated as a sustained rate with the driver in the cab and 12 m spacing between trucks. All lanes accept 45' high-cube containers.</p>`,
      },
      {
        title: "Radiation safety, site fit and power",
        html: `
<p>The primary beam is interlocked with a cab-detection light curtain and two inductive loops: it switches on only after the cab has fully passed the beam plane. As an option, the cab can be scanned by a separate low-dose source at <b>0.2 µSv per pass</b>. The annual dose at the controlled-area boundary is below 1 mSv at full throughput (calculation MST-RP-0914). Emergency stops, interlocks, beam-on lights, sirens and bilingual signage are standard.</p>
${table(
  ["Site", "Plot", "Controlled area", "Demand incl. HVAC", "Supply available"],
  [
    ["T1 Gate A / B", "95 × 36 m", "82 × 28 m", "196 kVA", "400 kVA"],
    ["T2 main gate", "70 × 28 m", "69 × 27.5 m", "196 kVA", "250 kVA"],
    ["Relocatable, T1 pad", "80 × 32 m", "70 × 30 m", "120 kVA", "160 kVA"],
    [
      "Relocatable, T2 pad",
      "60 × 30 m",
      "58 × 29 m",
      "120 kVA",
      "100 kVA + 150 kVA generator (Meridian supply)",
    ],
  ],
)}
<p><b>Radiation Licensing Support Plan (Addendum No. 1, A4).</b> Meridian's radiation protection team prepares the shielding calculations, radiation protection programme and licence application for each system for submission by the Employer, coordinates the regulator's inspections before each SAT, and keeps a radiation protection officer on site until all licences are granted. Application for the T1 Gate A system is planned in month 2, the others in month 4.</p>`,
      },
      {
        title: "Environmental performance and UPS",
        html: `
<p>Operating range 0 °C to +50 °C, humidity up to 95 % non-condensing; outdoor cabinets IP54 with closed-loop cooling; structural steel coated to ISO 12944 C5-M (high durability); wind survival 120 km/h. Power supply 400 V ±10 %, 3-phase, 50 Hz. UPS autonomy: <b>60 minutes</b> for control systems and servers, <b>30 minutes</b> for workstations.</p>`,
      },
      {
        title: "Meridian ClearView platform",
        html: `
<p><b>Deployment.</b> ClearView image servers, the database and the analysis applications are installed on-premise at the Customs Data Center (CIAC) with edge servers at each terminal. All scan images, analyst annotations and inspection results are stored and processed at the CDC and never leave the Employer's network.</p>
<p><b>Licensing and updates.</b> ClearView licences are managed by the <b>Meridian Cloud Gateway</b>, a virtual appliance installed in the Employer's DMZ. The gateway synchronises licence entitlements with Meridian's licensing service every 90 days over an outbound HTTPS connection and downloads digitally signed software and ThreatSense model updates, which the Employer's administrators approve before installation. If the connection is unavailable, a 30-day grace period applies before analysis features are restricted.</p>
<p><b>Equipment health monitoring.</b> Meridian Insight sends equipment health data every hour (component temperatures, error codes, dose-rate logs, uptime counters; no images or cargo data) through the gateway to Meridian's monitoring service hosted in the EU, allowing our support centre to plan preventive maintenance and pre-position spare parts.</p>
<p><b>Storage.</b> 1,170,000 scans/year × 45 MB × 5 years = 263.25 TB; with 20 % headroom 315.9 TB. We offer <b>320 TB usable</b> (erasure-coded object storage, 3 nodes). Retention is 5 years online; export in DICOS (NEMA IIC 1).</p>
<p><b>Workload routing</b> distributes scans across CIAC and terminal analysts; expected 90th-percentile scan-to-decision time is 2.8 minutes. <b>ThreatSense</b> AI highlights anomalies for undeclared goods, weapons, cigarettes, narcotics and currency; models run on the CDC GPU servers. The Employer's images are not used for training outside the CDC without written consent.</p>`,
      },
      {
        title: "Integration",
        html: `
<p>CRMS: bidirectional REST/JSON over HTTPS (scan requests, decisions, image links, annotations). TOS: REST adapter or UN/EDIFACT COPARN/CODECO via the ClearView Integration Bus; all middleware included. OCR: ISO 6346 container numbers with check digit (≥ 98.5 %) and Arabic/Latin licence plates (≥ 98 %), validated over 7 days during SAT.</p>`,
      },
      {
        title: "Cybersecurity",
        html: `
<ul>
<li>Active Directory integration over LDAPS, RBAC with 9 predefined roles, MFA for administrators (TOTP).</li>
<li>Tamper-evident audit trail retained 5 years; syslog export to the Employer's SIEM.</li>
<li>AES-256 encryption at rest; TLS 1.2+ in transit.</li>
<li>SBOM (SPDX) per release. Cumulative security updates are released <b>twice a year</b>; critical vulnerabilities are fixed by emergency patch within 30 days.</li>
<li>Independent penetration test before go-live; critical and high findings closed before acceptance.</li>
<li>Remote support sessions through the Employer's VPN, approved per session and recorded.</li>
</ul>`,
      },
      {
        title: "Workstations and user interface",
        html: `
<p>20 workstations (10 CIAC, 5 T1, 3 T2, 2 spare) per Addendum No. 1, each with two 27-inch 2560 × 1440 calibrated displays, 32 GB RAM and a dedicated GPU. The ClearView user interface is available in Arabic and English. Dates are displayed in the Gregorian calendar; Hijri display is planned for the ClearView 8 release.</p>`,
      },
      {
        title: "Project schedule",
        html: `
${table(
  ["Phase", "Months"],
  [
    ["Design, surveys, licence applications", "M1–M3"],
    ["FAT in Singapore (4 Employer witnesses, travel at Meridian's cost)", "M3"],
    ["Civil works T1 / T2", "M2–M6"],
    ["T1 Gate A installation, SAT, trial operation starts", "M6"],
    ["Other systems, CIAC, integration", "M6–M8"],
    ["PAC of all systems", "M9"],
  ],
)}`,
      },
      {
        title: "Training",
        html: `
<p>Operators (40 × 5 days, on site), analysts (12 × 10 days plus 20 days coaching at the CIAC), maintenance engineers (6 × 15 days at our Singapore factory) and system administrators (2 × 5 days at the CDC). Courses are delivered in English with simultaneous Arabic interpretation at Meridian's cost, and include a train-the-trainer track. Manuals in English and Arabic.</p>`,
      },
      {
        title: "Warranty and service",
        html: `
<p>Warranty of 24 months from PAC per system, covering all parts, labour and travel including the X-ray source and detectors; 36 months for IT equipment. A local service centre will be established before PAC with four OEM-certified engineers (two transferred from our regional office, two recruited locally and certified at our factory) and an in-country stock of critical spares. Remote response within 2 hours through Meridian Insight alarms, on-site response within 24 hours, 24/7. Guaranteed availability of 98 % per scanner per month. Spare parts are available for 10 years after PAC. The five-year CMC covers preventive and corrective maintenance, spares including one source replacement per system if required, and ClearView and ThreatSense updates.</p>`,
      },
    ],
    compliance: {
      "TB-01": ["Comply", "310 mm (T1, T2); 290 mm (relocatable)", "§2–3"],
      "TB-02": ["Comply", "1.0 mm Cu", "§3"],
      "TB-03": ["Comply", "Dual-energy 6 MeV; interlaced 4.5/6 MeV (relocatable)", "§2"],
      "TB-04": ["Comply", "1.0 %", "§3"],
      "TB-05": ["Comply", "4 classes", "§3"],
      "TB-06": ["Not comply", "Single view (top), high-resolution", "§2"],
      "TB-07": ["Comply", "190/h (T1, T2); 140/h (relocatable)", "§2"],
      "TB-08": ["Comply", "5–15 km/h (relocatable 5–10)", "§3"],
      "TB-09": ["Comply", "4.7 × 3.1 m; 4.6 × 3.0 m", "§3"],
      "TB-10": ["Comply", "Light curtain + loops interlock", "§4"],
      "TB-11": ["Comply", "0.2 µSv (optional cab scan)", "§4"],
      "TB-12": ["Comply", "< 1 mSv/yr", "§4"],
      "TB-13": ["Comply", "T2: 69 × 27.5 m", "§4"],
      "TB-14": ["Comply", "Standard", "§4"],
      "TB-15": ["Comply", "0 … +50 °C", "§5"],
      "TB-16": ["Comply", "≤ 95 %", "§5"],
      "TB-17": ["Comply", "IP54", "§5"],
      "TB-18": ["Comply", "C5-M", "§5"],
      "TB-19": ["Comply", "120 km/h", "§5"],
      "TB-20": ["Comply", "400 V, 3-ph, 50 Hz", "§5"],
      "TB-21": ["Comply", "196 kVA; 120 kVA + generator at T2 pad", "§4"],
      "TB-22": ["Comply", "60 min", "§5"],
      "TB-23": ["Comply", "30 min", "§5"],
      "TB-24": [
        "Comply",
        "ClearView on-premise at CDC; licensing and updates via Meridian Cloud Gateway (no image data)",
        "§6",
      ],
      "TB-25": ["Comply", "Images and results stay at CDC", "§6"],
      "TB-26": ["Comply", "5 years", "§6"],
      "TB-27": ["Comply", "320 TB usable", "§6"],
      "TB-28": ["Comply", "DICOS export", "§6"],
      "TB-29": ["Comply", "REST/JSON", "§7"],
      "TB-30": ["Comply", "REST or EDIFACT", "§7"],
      "TB-31": ["Comply", "≥ 98.5 %", "§7"],
      "TB-32": ["Comply", "≥ 98 %", "§7"],
      "TB-33": ["Comply", "2.8 min expected", "§6"],
      "TB-34": ["Comply", "LDAPS, RBAC, TOTP MFA", "§8"],
      "TB-35": ["Comply", "5 years", "§8"],
      "TB-36": ["Comply", "AES-256 / TLS 1.2+", "§8"],
      "TB-37": ["Comply", "Employer VPN per session, recorded", "§8"],
      "TB-38": ["Comply", "Arabic + English", "§9"],
      "TB-39": ["Not comply", "Gregorian only (Hijri planned)", "§9"],
      "TB-40": ["Comply", '2 × 27" 2560 × 1440', "§9"],
      "TB-41": ["Comply", "20", "§9"],
      "TB-42": ["Comply", "60 hours", "§2"],
      "TB-43": ["Comply", "98 %", "§12"],
      "TB-44": ["Comply", "24 hours", "§12"],
      "TB-45": ["Comply", "10 years", "§12"],
    },
    deviations: [],
  },
  commercial: {
    letter: `
<p>We offer to execute the Contract for the prices in our Form F-5 price schedule, quoted in USD, <b>DDP site, Port of Al-Noor, including import duties and excluding VAT</b>, in accordance with RFP §2.8 and Addendum No. 1.</p>
<p>The offer is valid for 120 days from 14 December 2026. Our bid security of USD 150,000 is provided as an unconditional bank guarantee from Al-Noor National Bank (ref. ANB-G-77310), valid until 11 May 2027.</p>
<p>Our offer is subject only to the payment terms set out in Form F-6 below.</p>`,
    prices: {
      "1.1": 3420000,
      "1.2": 3420000,
      "1.3": 3510000,
      "1.4": 2980000,
      "2.1": 1240000,
      "2.2": 410000,
      "2.3": 196000,
      "3.1": 940000,
      "3.2": 720000,
      "4.1": 380000,
      "4.2": 260000,
      "5.1": 210000,
      "5.2": 36000,
      "6.1": 75000,
      "7.1": 420000,
    },
    cmc: [1180000, 1215400, 1251862, 1289418, 1328100],
    storageTb: 320,
    workstations: 20,
    unitWorkstation: 9800,
    notes: [
      "DDP site including import duties; VAT excluded.",
      "Line 1.4 includes a 150 kVA generator for the T2 relocatable pad.",
      "Line 2.1 includes perpetual ClearView licences for all users, the Meridian Cloud Gateway appliance and ThreatSense for the warranty period. During the CMC, ThreatSense and Meridian Insight subscriptions are included in the CMC price.",
      "CMC year 1 firm; years 2–5 escalated by 3 % per year.",
    ],
    terms: [
      {
        title: "Commercial conditions",
        html: `
${table(
  ["Item", "Offer"],
  [
    ["Prices", "USD, firm (CAPEX); CMC escalation 3 % per year from year 2"],
    ["Incoterms", "DDP site (Incoterms 2020), duties included, VAT excluded"],
    ["Payment", "See Form F-6: 20 % advance / 50 % delivery / 20 % PAC / 10 % FAC"],
    ["Advance payment guarantee", "Issued by a bank licensed in the State"],
    ["Performance security", "10 % of the Contract Price, valid until 28 days after the last FAC"],
    ["Warranty", "24 months from PAC (IT equipment 36 months)"],
    ["Liability, delay damages", "As per the Draft Contract and Special Conditions"],
  ],
)}
<p>Meridian does not claim the domestic preference margin. Civil works will be performed by Coastline Builders (the State), representing approximately 9 % of the contract value; no subcontractor exceeds 10 %. We declare no conflict of interest.</p>`,
      },
    ],
    deviations: [
      [
        "Annex C, Appendix 1; SC 5.1",
        "Payment milestones of 20 % advance, 50 % on delivery, 20 % at PAC and 10 % at FAC, instead of 10 % / 60 % / 20 % / 10 %.",
        "A higher advance allows Meridian to secure linear-accelerator production slots and to offer the prices in Form F-5. The advance is covered by an advance payment guarantee of equal value.",
      ],
    ],
  },
};
