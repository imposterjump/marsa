/**
 * Annex B — Technical specifications (Excel). Rev 0 as issued; Addendum No. 1 later changes
 * TB-07 (relocatable), TB-22 and TB-41 explicitly — the workbook is the Rev 0 issue, as in a real tender pack.
 */
import ExcelJS from "exceljs";
import { TENDER } from "./rfp";

type Row = [
  ref: string,
  area: string,
  requirement: string,
  unit: string,
  t1a: string,
  t1b: string,
  t2: string,
  reloc: string,
  prio: "M" | "I" | "D",
  verify: string,
  notes?: string,
];

const SPECS: Row[] = [
  [
    "TB-01",
    "Imaging",
    "Steel penetration (ANSI N42.46-2008)",
    "mm",
    "≥ 310",
    "≥ 310",
    "≥ 300",
    "≥ 280",
    "M",
    "FAT + SAT",
  ],
  [
    "TB-02",
    "Imaging",
    "Wire detection behind 100 mm steel",
    "mm Cu",
    "≤ 1.0",
    "≤ 1.0",
    "≤ 1.0",
    "≤ 1.0",
    "M",
    "FAT",
  ],
  [
    "TB-03",
    "Imaging",
    "Dual-energy X-ray source (material discrimination)",
    "—",
    "Dual-energy",
    "Dual-energy",
    "Dual-energy",
    "Dual-energy",
    "M",
    "Datasheet",
  ],
  ["TB-04", "Imaging", "Contrast sensitivity", "%", "≤ 1.0", "≤ 1.0", "≤ 1.0", "≤ 1.0", "I", "FAT"],
  [
    "TB-05",
    "Imaging",
    "Material discrimination classes",
    "count",
    "≥ 4",
    "≥ 4",
    "≥ 4",
    "≥ 4",
    "I",
    "FAT",
  ],
  [
    "TB-06",
    "Imaging",
    "Dual-view (top + side) imaging",
    "—",
    "Yes",
    "Yes",
    "Yes",
    "Optional",
    "D",
    "Datasheet",
  ],
  [
    "TB-07",
    "Throughput",
    "Drive-through throughput, driver remains in cab",
    "trucks/h",
    "≥ 180",
    "≥ 150",
    "≥ 150",
    "≥ 150",
    "M",
    "SAT (4-hour test)",
  ],
  [
    "TB-08",
    "Throughput",
    "Vehicle speed during scan (drive-through)",
    "km/h",
    "5–15",
    "5–15",
    "5–15",
    "5–15",
    "I",
    "SAT",
  ],
  [
    "TB-09",
    "Throughput",
    "Minimum inspection tunnel (H × W)",
    "m",
    "4.6 × 3.0",
    "4.6 × 3.0",
    "4.6 × 3.0",
    "4.6 × 3.0",
    "M",
    "Drawing",
    "Must accept 45' high-cube containers on standard chassis.",
  ],
  [
    "TB-10",
    "Safety",
    "High-energy beam on occupied driver cab",
    "—",
    "Never",
    "Never",
    "Never",
    "Never",
    "M",
    "Design review + SAT",
  ],
  [
    "TB-11",
    "Safety",
    "Driver dose per pass (only if low-dose cab scan offered)",
    "µSv",
    "≤ 0.25",
    "≤ 0.25",
    "≤ 0.25",
    "≤ 0.25",
    "M",
    "Radiation survey",
  ],
  [
    "TB-12",
    "Safety",
    "Annual dose at controlled-area boundary",
    "mSv/yr",
    "≤ 1",
    "≤ 1",
    "≤ 1",
    "≤ 1",
    "M",
    "Radiation survey",
  ],
  [
    "TB-13",
    "Safety",
    "Controlled area + exclusion zones fit the plot (sheet 'Site constraints')",
    "—",
    "Yes",
    "Yes",
    "Yes",
    "Yes",
    "M",
    "Layout drawing",
    "Bidder to submit dimensioned layout per site.",
  ],
  [
    "TB-14",
    "Safety",
    "Emergency stops, interlocks, beam-on warning lights and audible alarms",
    "—",
    "Yes",
    "Yes",
    "Yes",
    "Yes",
    "M",
    "SAT",
  ],
  [
    "TB-15",
    "Environment",
    "Continuous operating ambient temperature",
    "°C",
    "0 … +50",
    "0 … +50",
    "0 … +50",
    "0 … +50",
    "M",
    "Type-test certificate",
  ],
  [
    "TB-16",
    "Environment",
    "Relative humidity (non-condensing)",
    "%",
    "≤ 95",
    "≤ 95",
    "≤ 95",
    "≤ 95",
    "M",
    "Type-test certificate",
  ],
  [
    "TB-17",
    "Environment",
    "Outdoor electronics enclosure rating",
    "IP",
    "≥ IP54",
    "≥ IP54",
    "≥ IP54",
    "≥ IP54",
    "M",
    "Certificate",
  ],
  [
    "TB-18",
    "Environment",
    "Steel coating corrosivity category (ISO 12944)",
    "—",
    "C5-M",
    "C5-M",
    "C5-M",
    "C5-M",
    "I",
    "Coating spec",
  ],
  [
    "TB-19",
    "Environment",
    "Wind survival speed",
    "km/h",
    "120",
    "120",
    "120",
    "120",
    "I",
    "Structural calc.",
  ],
  [
    "TB-20",
    "Power",
    "Supply voltage",
    "—",
    "400 V ±10%, 3-ph, 50 Hz",
    "400 V ±10%, 3-ph, 50 Hz",
    "400 V ±10%, 3-ph, 50 Hz",
    "400 V ±10%, 3-ph, 50 Hz",
    "M",
    "Datasheet",
  ],
  [
    "TB-21",
    "Power",
    "Maximum demand per system incl. HVAC and cabin",
    "kVA",
    "≤ site capacity",
    "≤ site capacity",
    "≤ site capacity",
    "≤ site capacity",
    "M",
    "Load calc.",
    "See RFP §3.5.2.",
  ],
  [
    "TB-22",
    "Power",
    "UPS autonomy: control systems and servers",
    "min",
    "≥ 30",
    "≥ 30",
    "≥ 30",
    "≥ 30",
    "M",
    "Test",
  ],
  [
    "TB-23",
    "Power",
    "UPS autonomy: workstations",
    "min",
    "≥ 30",
    "≥ 30",
    "≥ 30",
    "≥ 30",
    "M",
    "Test",
  ],
  [
    "TB-24",
    "Software",
    "Hosting of all components (incl. licensing, telemetry, updates)",
    "—",
    "On-premise",
    "On-premise",
    "On-premise",
    "On-premise",
    "M",
    "Architecture doc.",
    "See RFP §4.6.1.",
  ],
  [
    "TB-25",
    "Software",
    "Data residency",
    "—",
    "In-country only",
    "In-country only",
    "In-country only",
    "In-country only",
    "M",
    "Architecture doc.",
  ],
  [
    "TB-26",
    "Software",
    "Online retention of images + metadata",
    "years",
    "5",
    "5",
    "5",
    "5",
    "M",
    "Sizing calc.",
  ],
  [
    "TB-27",
    "Software",
    "Usable storage capacity at CDC (after RAID/replication)",
    "TB",
    "Per RFP §4.6.3",
    "",
    "",
    "",
    "M",
    "Sizing calc.",
    "Bidder to state usable TB. Volumes in sheet 'Volumes & storage'.",
  ],
  [
    "TB-28",
    "Software",
    "DICOS (NEMA IIC 1) image export",
    "—",
    "Yes",
    "Yes",
    "Yes",
    "Yes",
    "I",
    "Demo",
  ],
  [
    "TB-29",
    "Integration",
    "CRMS bidirectional REST/JSON",
    "—",
    "Yes",
    "Yes",
    "Yes",
    "Yes",
    "M",
    "Integration test",
  ],
  [
    "TB-30",
    "Integration",
    "TOS: UN/EDIFACT COPARN/CODECO or REST",
    "—",
    "Yes",
    "Yes",
    "Yes",
    "Yes",
    "M",
    "Integration test",
  ],
  [
    "TB-31",
    "Integration",
    "OCR container number (ISO 6346 incl. check digit)",
    "% correct",
    "≥ 98",
    "≥ 98",
    "≥ 98",
    "≥ 98",
    "M",
    "SAT (7-day)",
  ],
  [
    "TB-32",
    "Integration",
    "OCR licence plates, Arabic + Latin",
    "% correct",
    "≥ 98",
    "≥ 98",
    "≥ 98",
    "≥ 98",
    "M",
    "SAT (7-day)",
  ],
  [
    "TB-33",
    "Integration",
    "Scan-to-analyst-decision time, 90th percentile",
    "min",
    "≤ 3",
    "≤ 3",
    "≤ 3",
    "≤ 3",
    "I",
    "Trial operation",
  ],
  [
    "TB-34",
    "Security",
    "AD via LDAPS, RBAC, MFA for administrators",
    "—",
    "Yes",
    "Yes",
    "Yes",
    "Yes",
    "M",
    "Security test",
  ],
  [
    "TB-35",
    "Security",
    "Tamper-evident audit log retention",
    "years",
    "5",
    "5",
    "5",
    "5",
    "M",
    "Config review",
  ],
  [
    "TB-36",
    "Security",
    "Encryption at rest / in transit",
    "—",
    "AES-256 / TLS ≥ 1.2",
    "AES-256 / TLS ≥ 1.2",
    "AES-256 / TLS ≥ 1.2",
    "AES-256 / TLS ≥ 1.2",
    "M",
    "Security test",
  ],
  [
    "TB-37",
    "Security",
    "Vendor remote access",
    "—",
    "Employer VPN, per session, recorded",
    "Employer VPN, per session, recorded",
    "Employer VPN, per session, recorded",
    "Employer VPN, per session, recorded",
    "M",
    "Procedure",
  ],
  [
    "TB-38",
    "UI",
    "Operator/analyst UI languages",
    "—",
    "Arabic + English",
    "Arabic + English",
    "Arabic + English",
    "Arabic + English",
    "M",
    "Demo",
  ],
  ["TB-39", "UI", "Hijri + Gregorian date display", "—", "Yes", "Yes", "Yes", "Yes", "D", "Demo"],
  [
    "TB-40",
    "Workstations",
    "Monitors per workstation",
    "—",
    '2 × 27", ≥ 2560×1440',
    '2 × 27", ≥ 2560×1440',
    '2 × 27", ≥ 2560×1440',
    '2 × 27", ≥ 2560×1440',
    "M",
    "Datasheet",
  ],
  [
    "TB-41",
    "Workstations",
    "Total quantity (see sheet 'Workstations')",
    "pcs",
    "24 (total)",
    "",
    "",
    "",
    "M",
    "Delivery note",
  ],
  [
    "TB-42",
    "Relocation",
    "Relocation time between T1 and T2 incl. re-commissioning",
    "hours",
    "—",
    "—",
    "—",
    "≤ 72",
    "M",
    "Demonstration",
  ],
  [
    "TB-43",
    "Support",
    "Availability per scanner per calendar month",
    "%",
    "≥ 98",
    "≥ 98",
    "≥ 98",
    "≥ 98",
    "M",
    "Monthly report",
  ],
  [
    "TB-44",
    "Support",
    "On-site response time, 24/7",
    "hours",
    "≤ 24",
    "≤ 24",
    "≤ 24",
    "≤ 24",
    "M",
    "SLA",
  ],
  [
    "TB-45",
    "Support",
    "Spare parts availability after PAC",
    "years",
    "≥ 10",
    "≥ 10",
    "≥ 10",
    "≥ 10",
    "I",
    "Undertaking",
  ],
];

const NAVY = "FF13304D";
const TEAL = "FF0E7C7B";
const LIGHT = "FFF7F6F3";

function headerRow(ws: ExcelJS.Worksheet, rowNo: number) {
  const row = ws.getRow(rowNo);
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  row.height = 30;
}

function title(ws: ExcelJS.Worksheet, text: string, sub: string) {
  ws.getCell("A1").value = text;
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: NAVY } };
  ws.getCell("A2").value = sub;
  ws.getCell("A2").font = { italic: true, size: 9, color: { argb: "FF5C6774" } };
}

export async function buildAnnexB(outFile: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Northern Gulf Ports Authority (SAMPLE)";
  wb.created = new Date("2026-09-15T08:00:00Z");

  // ── Read me ──
  const rm = wb.addWorksheet("Read me", { properties: { tabColor: { argb: TEAL } } });
  title(
    rm,
    `Annex B — Technical Specifications · ${TENDER.ref}`,
    "SAMPLE / FICTIONAL tender for software testing · Revision 0 · issued 15 September 2026",
  );
  const notes = [
    "1. This Annex prevails over the RFP main document for all technical parameters and site data (RFP §2.6.1). Addenda prevail over this Annex.",
    "2. Targets are given per site: T1 Gate A, T1 Gate B, T2 main gate and the relocatable unit. Where a column is blank, the requirement is system-wide.",
    "3. Priority: M = mandatory (pass/fail), I = important (scored), D = desirable (bonus).",
    "4. Bidders shall answer every row in Form F-2 (Comply / Partially comply / Not comply) with a page reference to their proposal.",
    "5. Storage sizing (TB-27) per RFP §4.6.3, using the volumes in sheet 'Volumes & storage'.",
    "6. Site data in 'Site constraints' is binding (RFP §2.10.1).",
  ];
  notes.forEach((n, i) => {
    rm.getCell(`A${4 + i}`).value = n;
    rm.getCell(`A${4 + i}`).alignment = { wrapText: true };
  });
  rm.getColumn(1).width = 130;

  // ── Technical specs ──
  const ws = wb.addWorksheet("Technical specs", {
    views: [{ state: "frozen", ySplit: 4, xSplit: 3 }],
  });
  title(ws, "Technical specifications per site", "Rev 0 · values may be superseded by Addenda");
  ws.addRow([]);
  ws.getRow(4).values = [
    "Ref",
    "Area",
    "Requirement",
    "Unit",
    "T1 Gate A",
    "T1 Gate B",
    "T2 main gate",
    "Relocatable unit",
    "Priority",
    "Verification",
    "Notes",
  ];
  headerRow(ws, 4);
  SPECS.forEach((r) => {
    const row = ws.addRow(r.map((v) => v ?? ""));
    row.alignment = { vertical: "top", wrapText: true };
    const prio = row.getCell(9);
    prio.font = {
      bold: true,
      color: { argb: r[8] === "M" ? "FFA12A20" : r[8] === "I" ? "FF8A4F00" : "FF1F5FA8" },
    };
    prio.alignment = { horizontal: "center", vertical: "top" };
    if (row.number % 2 === 0)
      row.eachCell(
        (c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } }),
      );
  });
  [9, 12, 46, 9, 18, 18, 18, 18, 9, 18, 52].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  ws.autoFilter = { from: "A4", to: "K4" };

  // ── Site constraints ──
  const sc = wb.addWorksheet("Site constraints");
  title(
    sc,
    "Site constraints (binding)",
    "Controlled area incl. shielding and exclusion zones must fit within the plot (TB-13). Power capacity applies to TB-21.",
  );
  sc.addRow([]);
  sc.getRow(4).values = [
    "Site",
    "Plot length (m)",
    "Plot width (m)",
    "Power available (kVA)",
    "Supply point",
    "Cable distance (m)",
    "Ground",
    "Notes",
  ];
  headerRow(sc, 4);
  [
    ["T1 Gate A", 95, 36, 400, "SS-T1A", 60, "Reinforced concrete pavement", ""],
    ["T1 Gate B", 95, 36, 400, "SS-T1B", 45, "Reinforced concrete pavement", ""],
    [
      "T2 main gate",
      70,
      28,
      250,
      "T2-SS2",
      180,
      "Asphalt over compacted fill (geotechnical survey required)",
      "Plot cannot be extended: customs building to the north, live Ro-Ro lane to the south (Annex A-2).",
    ],
    [
      "Relocatable: T1 pad",
      80,
      32,
      160,
      "SS-T1C (temporary)",
      30,
      "Concrete pad",
      "Diesel generator permitted if demand exceeds 160 kVA (Bidder's supply).",
    ],
    ["Relocatable: T2 pad", 60, 30, 100, "T2-SS1", 25, "Concrete pad", "Generator permitted."],
  ].forEach((r) => (sc.addRow(r).alignment = { vertical: "top", wrapText: true }));
  [22, 14, 14, 18, 20, 16, 34, 70].forEach((w, i) => (sc.getColumn(i + 1).width = w));

  // ── Volumes & storage (live formulas) ──
  const vs = wb.addWorksheet("Volumes & storage");
  title(vs, "Expected volumes (2028)", "Planning volumes for storage sizing (RFP §4.6.3).");
  vs.addRow([]);
  vs.getRow(4).values = ["Site", "Scans per day", "Operating days / year", "Scans per year"];
  headerRow(vs, 4);
  const sites: [string, number, number][] = [
    ["T1 Gate A", 1400, 360],
    ["T1 Gate B", 1000, 360],
    ["T2 main gate", 600, 360],
    ["Relocatable unit", 300, 300],
  ];
  sites.forEach(([s, perDay, days], i) => {
    const r = 5 + i;
    vs.getRow(r).values = [s, perDay, days];
    vs.getCell(`D${r}`).value = { formula: `B${r}*C${r}`, result: perDay * days };
  });
  const totalScans = sites.reduce((a, [, d, n]) => a + d * n, 0); // 1,170,000
  const rows: [string, ExcelJS.CellValue][] = [
    ["Total scans per year", { formula: "SUM(D5:D8)", result: totalScans }],
    ["Average data per scan: both views + metadata (MB)", 45],
    ["Online retention (years)", 5],
  ];
  rows.forEach(([label, value], i) => {
    const r = 10 + i;
    vs.getCell(`A${r}`).value = label;
    vs.getCell(`C${r}`).value = value;
  });
  [44, 16, 20, 18].forEach((w, i) => (vs.getColumn(i + 1).width = w));
  ["B", "C", "D"].forEach((col) => (vs.getColumn(col).numFmt = "#,##0"));

  // ── Workstations (Rev 0 — superseded by Addendum 1, A2) ──
  const wk = wb.addWorksheet("Workstations");
  title(wk, "Workstation allocation (Rev 0)", "Quantities as issued with the RFP.");
  wk.addRow([]);
  wk.getRow(4).values = ["Location", "Quantity", "Purpose"];
  headerRow(wk, 4);
  [
    ["CIAC (Customs Data Center)", 12, "Central image analysis"],
    ["T1 operator cabins", 6, "Operation + local analysis"],
    ["T2 operator cabin", 4, "Operation + local analysis"],
    ["Spare / mobile", 2, "Relocatable unit and spares"],
  ].forEach((r) => wk.addRow(r));
  wk.addRow(["Total", { formula: "SUM(B5:B8)", result: 24 }, ""]).font = { bold: true };
  [32, 12, 34].forEach((w, i) => (wk.getColumn(i + 1).width = w));

  // ── Revision log ──
  const rl = wb.addWorksheet("Revision log");
  title(rl, "Revision log", "");
  rl.addRow([]);
  rl.getRow(4).values = ["Rev", "Date", "Change"];
  headerRow(rl, 4);
  rl.addRow([0, "15 Sep 2026", "First issue with the RFP."]);
  [8, 16, 80].forEach((w, i) => (rl.getColumn(i + 1).width = w));

  await wb.xlsx.writeFile(outFile);
  return { minUsableTb: Math.ceil(((totalScans * 45 * 5) / 1e6) * 1.2), totalScans };
}
