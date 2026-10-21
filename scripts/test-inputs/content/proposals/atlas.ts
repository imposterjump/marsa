/**
 * Atlas Port Technologies — smaller OEM. Fictional. Its commercial qualifications match the
 * bidder's clarification letter in test-inputs/phase-1/edge-cases (scanned image, 3 Dec 2026).
 */
import { table, type VendorSpec } from "./common";

export const ATLAS: VendorSpec = {
  slug: "Atlas-Port-Technologies",
  name: "Atlas Port Technologies",
  legalName: "Atlas Port Technologies Ltd.",
  country: "Cyprus",
  address: "27 Makariou Avenue, 3030 Limassol, Cyprus",
  contact: {
    name: "Karim Haddad",
    title: "Bid Manager",
    email: "bids@atlasport.example",
    phone: "+357 25 000 000",
  },
  signatory: { name: "Karim Haddad", title: "Bid Manager" },
  accent: "#7c3aed",
  accentDark: "#2a1650",
  bidDate: "2 December 2026",
  refPrefix: "APT/NGPA/014",
  technical: {
    letter: `
<p>Atlas Port Technologies submits the enclosed technical proposal for the supply and installation of high-energy cargo X-ray inspection systems at the Port of Al-Noor, tender NGPA/T/2026/014. We acknowledge receipt of Addendum No. 1.</p>
<p>Atlas designs and manufactures the Sentinel 6D systems offered. No prices are included in this technical proposal.</p>`,
    sections: [
      {
        title: "Company and references",
        html: `
<p>Atlas Port Technologies was founded in 2009 by engineers from the cargo-inspection industry. The company designs and assembles the Sentinel range of high-energy and mobile X-ray systems in Limassol, with 140 employees. Atlas focuses on high image quality and rugged design for hot climates.</p>
${table(
  ["Site", "Scope", "Year", "Climate"],
  [
    [
      "Port of Ras Tamar, Container Terminal",
      "2 × Sentinel 6D drive-through",
      "2021",
      "Mean summer max 43 °C, RH 74 %",
    ],
    ["Eastern Highway border post", "1 × Sentinel 6D", "2023", "Mean summer max 39 °C, RH 30 %"],
    [
      "Port of Velar, Ro-Ro terminal",
      "1 × Sentinel 6D + 1 × Sentinel 6R",
      "2025",
      "Mean summer max 33 °C, RH 75 %",
    ],
  ],
)}`,
      },
      {
        title: "Sentinel 6D inspection systems",
        html: `
<p>Atlas offers three Sentinel 6D drive-through systems (T1 Gate A, T1 Gate B, T2) and one Sentinel 6R relocatable system. All use a <b>6 MeV dual-energy</b> linear accelerator.</p>
${table(
  ["Site", "Model", "Views", "Penetration", "Throughput"],
  [
    ["T1 Gate A", "Sentinel 6D", "Top + side", "320 mm", "up to 165 trucks/h"],
    ["T1 Gate B", "Sentinel 6D", "Top + side", "320 mm", "up to 165 trucks/h"],
    ["T2 main gate", "Sentinel 6D", "Top + side", "320 mm", "up to 165 trucks/h"],
    ["Relocatable", "Sentinel 6R", "Top + side", "300 mm", "up to 140 trucks/h"],
  ],
)}`,
      },
      {
        title: "Image quality",
        html: `
<p>Atlas image chains use cadmium-tungstate detectors with 16-bit acquisition, giving a contrast sensitivity of <b>0.9 %</b>, wire detection of 1.0 mm Cu behind 100 mm of steel and discrimination of 5 material classes. The tunnel measures 4.8 m × 3.2 m and accepts 45' high-cube containers. Scan speed 5–12 km/h.</p>`,
      },
      {
        title: "Safety and site layout",
        html: `
<p>The primary beam is started by the cab-detection system only after the cab has passed; no cab scanning is offered. Boundary dose below 1 mSv per year. Emergency stops and interlocks on all doors and the lane, beam-on lights and sirens, signage in Arabic and English.</p>
${table(
  ["Site", "Plot", "Controlled area", "Demand"],
  [
    ["T1 Gate A / B", "95 × 36 m", "88 × 32 m", "220 kVA"],
    ["T2 main gate", "70 × 28 m", "70 × 28 m", "220 kVA"],
    ["Relocatable", "80 × 32 m / 60 × 30 m", "72 × 30 m / 58 × 29 m", "150 kVA"],
  ],
)}`,
      },
      {
        title: "Environment and power",
        html: `
<p>Operating range 0 °C to +52 °C, humidity up to 95 %, IP55 enclosures, C5-M coating system, wind survival 140 km/h. Power supply 400 V three-phase 50 Hz. UPS autonomy of 30 minutes for control systems, servers and workstations at full load, as required by RFP §4.5.2.</p>`,
      },
      {
        title: "Atlas Vision software",
        html: `
<p>Atlas Vision is installed on servers at the Customs Data Center and the terminals, licensed with an offline licence file; it does not require any internet connection. Storage: 1,170,000 scans × 45 MB × 5 years = 263 TB; with 20 % headroom 316 TB; we offer <b>320 TB usable</b>. Five-year online retention, DICOS export, workload routing between the CIAC and the terminals (expected decision time about 3 minutes). Optional AI module "Atlas Detect" for weapons and cigarettes.</p>`,
      },
      {
        title: "Integration",
        html: `
<p>REST/JSON interface to the CRMS; EDIFACT COPARN/CODECO interface to the TOS; OCR of container numbers (ISO 6346, check digit) and Arabic/Latin licence plates with ≥ 98 % read rates.</p>`,
      },
      {
        title: "Cybersecurity",
        html: `
<p>Active Directory over LDAPS, role-based access, MFA for administrators, audit logs kept 5 years, AES-256 encryption at rest and TLS 1.2 in transit, remote access only through the Employer's VPN with session recording. Penetration testing before go-live.</p>`,
      },
      {
        title: "Workstations",
        html: `
<p>24 workstations as per RFP §3.3.1 (12 CIAC, 6 T1, 4 T2, 2 spare), each with two 27-inch 2560 × 1440 monitors, 32 GB RAM and a dedicated GPU. Arabic and English user interface.</p>`,
      },
      {
        title: "Schedule",
        html: `
${table(
  ["Activity", "Month"],
  [
    ["Design and site surveys", "M1–M2"],
    ["Manufacturing and FAT in Limassol", "M2–M5"],
    ["Civil works", "M3–M6"],
    ["T1 Gate A installation and start of trial operation", "M7"],
    ["Other systems and CIAC", "M7–M8"],
    ["PAC", "M9"],
  ],
)}`,
      },
      {
        title: "Training",
        html: `
<p>Operator training for 40 participants (5 days, on site) and analyst training for 12 participants (10 days at the CIAC) in English with Arabic interpretation. Maintenance training for 6 engineers is delivered at our regional training centre (5 days).</p>`,
      },
    ],
    compliance: {
      "TB-01": ["Comply", "320 mm; 300 mm relocatable", "§2"],
      "TB-02": ["Comply", "1.0 mm Cu", "§3"],
      "TB-03": ["Comply", "6 MeV dual-energy", "§2"],
      "TB-04": ["Comply", "0.9 %", "§3"],
      "TB-05": ["Comply", "5 classes", "§3"],
      "TB-06": ["Comply", "Top + side, all systems", "§2"],
      "TB-07": ["Comply", "Up to 165 trucks/h", "§2"],
      "TB-08": ["Comply", "5–12 km/h", "§3"],
      "TB-09": ["Comply", "4.8 × 3.2 m", "§3"],
      "TB-10": ["Comply", "Cab detection", "§4"],
      "TB-11": ["Comply", "No cab scan", "§4"],
      "TB-12": ["Comply", "< 1 mSv", "§4"],
      "TB-13": ["Comply", "See layout table", "§4"],
      "TB-14": ["Comply", "Yes", "§4"],
      "TB-15": ["Comply", "0 … +52 °C", "§5"],
      "TB-16": ["Comply", "95 %", "§5"],
      "TB-17": ["Comply", "IP55", "§5"],
      "TB-18": ["Comply", "C5-M", "§5"],
      "TB-19": ["Comply", "140 km/h", "§5"],
      "TB-20": ["Comply", "400 V 3-ph 50 Hz", "§5"],
      "TB-21": ["Comply", "220 / 150 kVA", "§4"],
      "TB-22": ["Comply", "30 min", "§5"],
      "TB-23": ["Comply", "30 min", "§5"],
      "TB-24": ["Comply", "On-premise, offline licence", "§6"],
      "TB-25": ["Comply", "Yes", "§6"],
      "TB-26": ["Comply", "5 years", "§6"],
      "TB-27": ["Comply", "320 TB", "§6"],
      "TB-28": ["Comply", "Yes", "§6"],
      "TB-29": ["Comply", "REST/JSON", "§7"],
      "TB-30": ["Comply", "EDIFACT", "§7"],
      "TB-31": ["Comply", "≥ 98 %", "§7"],
      "TB-32": ["Comply", "≥ 98 %", "§7"],
      "TB-33": ["Comply", "About 3 min", "§6"],
      "TB-34": ["Comply", "Yes", "§8"],
      "TB-35": ["Comply", "5 years", "§8"],
      "TB-36": ["Comply", "AES-256 / TLS 1.2", "§8"],
      "TB-37": ["Comply", "Employer VPN", "§8"],
      "TB-38": ["Comply", "Arabic + English", "§9"],
    },
    rowLabels: {
      "TB-07": "Throughput, driver in cab: T1 Gate A ≥ 180/h; others ≥ 150/h",
      "TB-22": "UPS autonomy, control systems and servers ≥ 30 min",
      "TB-41": "Workstations: 24 in total",
    },
    deviations: [],
  },
  commercial: {
    letter: `
<p>Atlas Port Technologies offers to supply the systems and services described in its technical proposal for the prices in the attached Form F-5 price schedule, in USD, <b>DDP site, excluding VAT and import duties</b> (see note 1).</p>
<p>Our offer is valid for <b>ninety (90) days</b> from the bid closing date. A bid security of USD 150,000 is enclosed (Arab Maritime Bank, Al-Noor branch, guarantee no. AMB-0412-26, valid until 11 April 2027).</p>`,
    prices: {
      "1.1": 3760000,
      "1.2": 3760000,
      "1.3": 3820000,
      "1.4": 3150000,
      "2.1": 1190000,
      "2.2": 380000,
      "2.3": 206400,
      "3.1": 980000,
      "3.2": 760000,
      "4.1": 450000,
      "4.2": 280000,
      "5.1": 150000,
      "5.2": 30000,
      "6.1": 60000,
      "7.1": 390000,
    },
    cmc: [920000, 947600, 976028, null, null],
    storageTb: 320,
    workstations: 24,
    unitWorkstation: 8600,
    notes: [
      "Prices assume that the Employer provides a customs duty exemption certificate for the imported equipment; import duties are therefore not included.",
      "CMC years 4 and 5 will be agreed with the Employer before the end of CMC year 3, based on the condition of the equipment.",
      "Workstations: 24 units as per RFP §3.3.1.",
    ],
    terms: [
      {
        title: "Commercial conditions",
        html: `
${table(
  ["Item", "Offer"],
  [
    ["Validity", "90 days from the bid closing date"],
    ["Payment", "As per Annex C, Appendix 1"],
    ["Import duties", "Excluded (duty exemption certificate to be provided by the Employer)"],
    ["Liability", "Limited to 15 % of the Contract Price"],
    ["Warranty", "24 months from PAC"],
    ["Performance security", "10 % of the Contract Price"],
  ],
)}`,
      },
    ],
    deviations: [
      [
        "RFP §2.2.1",
        "Bid validity 90 days.",
        "Component price volatility; any extension is subject to price review.",
      ],
      [
        "RFP §2.8.2 / GC 4.1",
        "Prices exclude import duties.",
        "Based on a customs duty exemption certificate to be issued by the Employer.",
      ],
      [
        "GC 10.1",
        "Liability limited to 15 % of the Contract Price.",
        "Atlas standard limitation of liability.",
      ],
      [
        "Annex C, Appendix 2 (lines 8.4–8.5)",
        "CMC years 4–5 not priced.",
        "To be agreed before the end of CMC year 3.",
      ],
    ],
  },
};
