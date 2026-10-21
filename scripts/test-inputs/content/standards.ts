/**
 * Phase 2 test standards. Single source for the PDFs AND the README copy-paste blocks.
 * Rules repeat the RFP pack where they overlap (same values, same priority) and only ADD
 * requirements on topics the RFP doesn't regulate — never contradict it (HANDOFF §0 rule 3).
 */
import { clause as c, doc } from "../lib/pdf";

export type Prio = "mandatory" | "important" | "desirable";
export interface StdRule {
  code: string;
  text: string;
  priority: Prio;
}
export interface StdSection {
  title: string;
  intro?: string;
  rules: string[] /* rule codes */;
  extra?: string[];
}
export interface StandardSpec {
  file: string;
  code: string;
  title: string;
  category: "IT & security" | "Safety & environment" | "Commercial & legal";
  description: string;
  issuer: string;
  version: string;
  effective: string;
  purpose: string;
  scope: string;
  definitions: [string, string][];
  sections: StdSection[];
  rules: StdRule[];
  verification: string[];
}

export const STANDARDS: StandardSpec[] = [
  {
    file: "STD-1-CITS-2026-IT-Security-and-Data-Residency.pdf",
    code: "CITS-2026",
    title: "Customs IT Security & Data Residency Standard",
    category: "IT & security",
    description:
      "Security and data-residency requirements for every system that processes customs data, including systems supplied and maintained by vendors. Issued by the General Customs Directorate, Information Security Office (v3.1, March 2026).",
    issuer: "General Customs Directorate · Information Security Office",
    version: "3.1",
    effective: "1 March 2026",
    purpose:
      "This standard protects the confidentiality, integrity and availability of customs data. It sets the minimum security controls for any information system that captures, stores, processes or transmits customs data.",
    scope:
      "It applies to all systems operated by or for the Directorate, including systems procured through tenders, supplied by vendors, hosted at port authority premises, and maintained remotely by suppliers. Tender documents may add requirements; they may not lower them.",
    definitions: [
      [
        "Customs data",
        "Any data produced or used in customs control, including inspection images, metadata, risk scores, analyst annotations, logs and backups.",
      ],
      [
        "Directorate infrastructure",
        "Data centres, networks and equipment owned or controlled by the Directorate or the port authority within the national territory.",
      ],
      ["SIEM", "The Directorate's Security Information and Event Management platform."],
      [
        "Critical / high vulnerability",
        "A vulnerability rated 9.0–10.0 / 7.0–8.9 on the CVSS v3.1 base score.",
      ],
    ],
    sections: [
      {
        title: "Data classification and residency",
        intro: "Customs data is classified CONFIDENTIAL – CUSTOMS by default.",
        rules: ["SEC-01"],
      },
      {
        title: "Hosting and connectivity",
        rules: ["SEC-02"],
        extra: [
          "Connections between systems and external networks pass through the Directorate's managed firewalls. Inbound connections from the internet are not permitted.",
        ],
      },
      { title: "Identity and access management", rules: ["SEC-03", "SEC-04", "SEC-05"] },
      {
        title: "Logging and monitoring",
        rules: ["SEC-06"],
        extra: [
          "Clocks of all components are synchronised with the Directorate's NTP servers so that events can be correlated.",
        ],
      },
      { title: "Cryptography", rules: ["SEC-07"] },
      { title: "Vulnerability and patch management", rules: ["SEC-08", "SEC-09"] },
      { title: "Backup and continuity", rules: ["SEC-11"] },
      { title: "Supplier personnel and remote support", rules: ["SEC-10", "SEC-12"] },
      { title: "Secure development and documentation", rules: ["SEC-13", "SEC-14"] },
    ],
    rules: [
      {
        code: "SEC-01",
        priority: "mandatory",
        text: "All customs data (scan images, metadata, analyst annotations, logs and backups) shall be stored and processed only within the national territory.",
      },
      {
        code: "SEC-02",
        priority: "mandatory",
        text: "Systems shall run on Directorate infrastructure; no component may depend on a public cloud service for operation, licensing, telemetry or updates.",
      },
      {
        code: "SEC-03",
        priority: "mandatory",
        text: "Users shall authenticate through the Directorate's Active Directory over LDAPS, with role-based access control mapped to job functions.",
      },
      {
        code: "SEC-04",
        priority: "mandatory",
        text: "Multi-factor authentication is required for all administrative accounts and for any remote access.",
      },
      {
        code: "SEC-05",
        priority: "important",
        text: "Local accounts shall enforce passwords of at least 12 characters and lock after 5 failed attempts; interactive sessions shall lock after 15 minutes of inactivity.",
      },
      {
        code: "SEC-06",
        priority: "mandatory",
        text: "Tamper-evident audit logs of all user and administrator actions shall be retained for 5 years and forwarded in real time to the Directorate's SIEM using syslog or CEF.",
      },
      {
        code: "SEC-07",
        priority: "mandatory",
        text: "Data shall be encrypted at rest with AES-256 and in transit with TLS 1.2 or higher, using certificates issued by the Directorate's PKI.",
      },
      {
        code: "SEC-08",
        priority: "important",
        text: "In addition to routine patch releases, critical vulnerabilities shall be remediated within 14 days and high-severity vulnerabilities within 30 days of disclosure, throughout warranty and maintenance.",
      },
      {
        code: "SEC-09",
        priority: "mandatory",
        text: "An independent penetration test shall be performed before go-live; all critical and high findings shall be closed before acceptance.",
      },
      {
        code: "SEC-10",
        priority: "mandatory",
        text: "Vendor remote access is allowed only through the Directorate's VPN, approved per session, with the full session recorded.",
      },
      {
        code: "SEC-11",
        priority: "important",
        text: "Backups shall be taken daily, encrypted, and stored on-premise at a second site, with a recovery point objective of 24 hours or better and a recovery time objective of 8 hours or better for image management platforms.",
      },
      {
        code: "SEC-12",
        priority: "important",
        text: "Vendor staff with administrative access shall pass the Directorate's security vetting and sign a confidentiality undertaking before access is granted.",
      },
      {
        code: "SEC-13",
        priority: "important",
        text: "A Software Bill of Materials (SBOM) shall be delivered for all supplied software and updated with every release.",
      },
      {
        code: "SEC-14",
        priority: "desirable",
        text: "Architecture, data-flow and hardening documentation shall be delivered before the Site Acceptance Test.",
      },
    ],
    verification: [
      "Compliance is verified during design review, Site Acceptance Test and the pre-go-live penetration test.",
      "Exceptions require the written approval of the Director of Information Security, with a remediation date.",
    ],
  },
  {
    file: "STD-2-PESE-03-Equipment-Safety-and-Environment.pdf",
    code: "PESE-03",
    title: "Port Equipment Safety & Environmental Standard",
    category: "Safety & environment",
    description:
      "Health, safety and environmental requirements for equipment installed and operated in the port, including radiation-emitting inspection systems. Issued by the NGPA Health, Safety & Environment Department (v2.0, January 2026).",
    issuer: "Northern Gulf Ports Authority · Health, Safety & Environment Department",
    version: "2.0",
    effective: "1 January 2026",
    purpose:
      "This standard protects port workers, drivers, the public and the environment from hazards created by equipment installed in the port, during construction, operation, maintenance and decommissioning.",
    scope:
      "It applies to all fixed and relocatable equipment installed in NGPA terminals and to the works needed to install it, whether performed by NGPA staff or by suppliers and their subcontractors.",
    definitions: [
      [
        "Controlled area",
        "An area where special radiation protection measures apply, delimited by physical barriers and signage.",
      ],
      [
        "ALARA",
        "As Low As Reasonably Achievable: the principle of keeping exposure as low as reasonably achievable.",
      ],
      [
        "HSE officer",
        "A qualified health, safety and environment professional with authority to stop unsafe work.",
      ],
    ],
    sections: [
      {
        title: "Radiation protection",
        intro:
          "These provisions apply to all equipment generating ionising radiation, including X-ray and linear-accelerator inspection systems.",
        rules: ["SAF-01", "SAF-02", "SAF-03", "SAF-04", "SAF-05", "SAF-06"],
      },
      {
        title: "Environmental resilience of equipment",
        intro: "Port terminals are exposed to high temperatures, humidity, salt spray and dust.",
        rules: ["SAF-07", "SAF-08"],
      },
      { title: "Noise and environmental protection", rules: ["SAF-09", "SAF-10"] },
      {
        title: "Construction safety",
        rules: ["SAF-11"],
        extra: [
          "Hot work, work at height and excavation require a permit to work issued by the terminal operator.",
        ],
      },
      { title: "Fire safety", rules: ["SAF-12"] },
    ],
    rules: [
      {
        code: "SAF-01",
        priority: "mandatory",
        text: "No radiation-emitting equipment may be operated before it is licensed by the national radiation regulator.",
      },
      {
        code: "SAF-02",
        priority: "mandatory",
        text: "The annual dose at the boundary of any controlled area shall not exceed 1 mSv (public limit); occupational exposure shall be kept as low as reasonably achievable (ALARA).",
      },
      {
        code: "SAF-03",
        priority: "mandatory",
        text: "Occupied vehicle cabs shall never be exposed to the primary high-energy beam; any cab scanning shall use a low-dose mode delivering 0.25 µSv or less per pass.",
      },
      {
        code: "SAF-04",
        priority: "mandatory",
        text: "Controlled areas shall be marked with bilingual (Arabic and English) radiation warning signs, beam-on warning lights and audible alarms.",
      },
      {
        code: "SAF-05",
        priority: "mandatory",
        text: "Emergency stop buttons, interlocked with the radiation source, shall be reachable within 10 metres from any point inside the controlled area.",
      },
      {
        code: "SAF-06",
        priority: "important",
        text: "The supplier shall provide personal dosimeters for operators during the first 12 months of operation and train all operators in radiation protection.",
      },
      {
        code: "SAF-07",
        priority: "mandatory",
        text: "Outdoor equipment shall be rated for continuous operation from 0 °C to +50 °C and up to 95% relative humidity in a saline atmosphere, with electronics enclosures of at least IP54.",
      },
      {
        code: "SAF-08",
        priority: "important",
        text: "Structural steel shall be protected for corrosivity category C5-M (ISO 12944) with a design durability of at least 15 years.",
      },
      {
        code: "SAF-09",
        priority: "important",
        text: "Noise from equipment, including HVAC units and generators, shall not exceed 70 dB(A) at 1 metre from operator cabins.",
      },
      {
        code: "SAF-10",
        priority: "important",
        text: "Hazardous waste (oils, batteries, lead shielding off-cuts and decommissioned sources) shall be removed by the supplier through licensed contractors, with disposal certificates.",
      },
      {
        code: "SAF-11",
        priority: "important",
        text: "Before civil works start, method statements and risk assessments shall be approved by the HSE Department, and the supplier shall keep a full-time HSE officer on site.",
      },
      {
        code: "SAF-12",
        priority: "desirable",
        text: "Operator cabins and electrical rooms shall have fire detection; server and electrical rooms shall have clean-agent fire suppression.",
      },
    ],
    verification: [
      "Radiation surveys are performed at Site Acceptance Test and annually by a qualified expert.",
      "The HSE Department may stop any work that does not comply with this standard.",
    ],
  },
  {
    file: "STD-3-PCT-07-Commercial-and-Contract-Terms.pdf",
    code: "PCT-07",
    title: "Procurement Commercial & Contract Terms Standard",
    category: "Commercial & legal",
    description:
      "Commercial, financial-security and contractual rules that apply to every NGPA procurement. Issued by the NGPA Procurement Directorate (v7.0, July 2025).",
    issuer: "Northern Gulf Ports Authority · Procurement Directorate",
    version: "7.0",
    effective: "1 July 2025",
    purpose:
      "This standard sets uniform commercial and contractual conditions for NGPA procurements so that bids are comparable and the Authority's financial and legal interests are protected.",
    scope:
      "It applies to all tenders and contracts of the Authority. Tender documents set the specific values (currency, percentages, periods) within the limits of this standard.",
    definitions: [
      ["Licensed bank", "A bank licensed by the Central Bank of the State."],
      [
        "Local value added",
        "The share of the contract value produced in the State (labour, assembly, materials, services).",
      ],
    ],
    sections: [
      { title: "Financial securities", rules: ["COM-01", "COM-03", "COM-05"] },
      { title: "Prices and payments", rules: ["COM-02", "COM-04", "COM-09"] },
      { title: "Transparency and integrity", rules: ["COM-06", "COM-10", "COM-08"] },
      { title: "Contract conditions", rules: ["COM-07", "COM-12"] },
      { title: "Invoicing", rules: ["COM-11"] },
    ],
    rules: [
      {
        code: "COM-01",
        priority: "mandatory",
        text: "Bid securities, advance payment guarantees and performance securities shall be issued or confirmed by a bank licensed in the State.",
      },
      {
        code: "COM-02",
        priority: "mandatory",
        text: "Prices shall be quoted in the currency stated in the tender documents; capital prices are firm unless the contract provides otherwise.",
      },
      {
        code: "COM-03",
        priority: "mandatory",
        text: "Advance payments are made only against an advance payment guarantee of equal value.",
      },
      {
        code: "COM-04",
        priority: "important",
        text: "Apart from the advance payment, no milestone payment may exceed the value of the work delivered or accepted at that milestone.",
      },
      {
        code: "COM-05",
        priority: "mandatory",
        text: "A performance security of at least 10% of the contract price, valid until 28 days after final acceptance, is required.",
      },
      {
        code: "COM-06",
        priority: "important",
        text: "Bidders shall disclose every subcontractor performing more than 10% of the contract value and any conflict of interest.",
      },
      {
        code: "COM-07",
        priority: "mandatory",
        text: "The supplier's own general terms and conditions do not apply to Authority contracts.",
      },
      {
        code: "COM-08",
        priority: "important",
        text: "Bidders claiming local value added shall provide a breakdown certified by an independent auditor.",
      },
      {
        code: "COM-09",
        priority: "important",
        text: "Maintenance, spare-part and support prices for the maintenance period shall be quoted per year; any annual escalation shall not exceed the cap stated in the tender documents.",
      },
      {
        code: "COM-10",
        priority: "mandatory",
        text: "Bidders shall sign the Authority's integrity pledge; any breach leads to disqualification and may lead to debarment.",
      },
      {
        code: "COM-11",
        priority: "desirable",
        text: "Invoices shall be in English, quote the tender reference, follow the line items of the price schedule and show the supplier's tax registration number.",
      },
      {
        code: "COM-12",
        priority: "important",
        text: "Contracts are governed by the laws of the State, with arbitration seated in the capital.",
      },
    ],
    verification: [
      "The Procurement Directorate checks compliance during bid evaluation and contract award.",
      "Deviations require the prior written approval of the Tender Committee and must be recorded in the evaluation report.",
    ],
  },
];

const PRIO_LABEL: Record<Prio, string> = {
  mandatory: "Mandatory",
  important: "Important",
  desirable: "Desirable",
};

export function standardHtml(s: StandardSpec): string {
  const byCode = new Map(s.rules.map((r) => [r.code, r]));
  let secNo = 2;
  const sections = s.sections
    .map((sec) => {
      secNo++;
      const n = secNo;
      const items = sec.rules
        .map((code, i) => {
          const r = byCode.get(code)!;
          return c(
            `${n}.${i + 1}`,
            `<b>${r.code}</b> — ${r.text} <span class="small">(${PRIO_LABEL[r.priority]})</span>`,
          );
        })
        .join("");
      const extra = (sec.extra ?? [])
        .map((e, i) => c(`${n}.${sec.rules.length + i + 1}`, e))
        .join("");
      return `<h2>${n}. ${sec.title}</h2>${sec.intro ? `<p>${sec.intro}</p>` : ""}${items}${extra}`;
    })
    .join("");

  const body = `
  <div class="small" style="letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6pt">${s.issuer}</div>
  <h1>${s.title}</h1>
  <table class="kv" style="margin-bottom:10pt">
    <tr><td>Document code</td><td><b>${s.code}</b></td></tr>
    <tr><td>Version</td><td>${s.version}</td></tr>
    <tr><td>Effective date</td><td>${s.effective}</td></tr>
    <tr><td>Classification</td><td>Internal: may be shared with bidders</td></tr>
  </table>
  <div class="warn"><b>SAMPLE DOCUMENT.</b> Fictional standard created to test procurement-evaluation software.</div>
  <h2>1. Purpose and scope</h2>
  ${c("1.1", s.purpose)}
  ${c("1.2", s.scope)}
  ${c("1.3", "Requirements are identified by a code (e.g. " + s.rules[0].code + ") and a priority: Mandatory requirements must be met; Important requirements are expected and weigh heavily in evaluations; Desirable requirements are good practice.")}
  <h2>2. Definitions</h2>
  <table><tr><th style="width:28%">Term</th><th>Meaning</th></tr>${s.definitions.map(([t, d]) => `<tr><td><b>${t}</b></td><td>${d}</td></tr>`).join("")}</table>
  ${sections}
  <h2>${secNo + 1}. Compliance verification and exceptions</h2>
  ${s.verification.map((v, i) => c(`${secNo + 1}.${i + 1}`, v)).join("")}
  <h2>Annex: requirements register</h2>
  <table><tr><th style="width:12%">Code</th><th>Requirement</th><th style="width:14%">Priority</th></tr>
  ${s.rules.map((r) => `<tr><td><b>${r.code}</b></td><td>${r.text}</td><td>${PRIO_LABEL[r.priority]}</td></tr>`).join("")}
  </table>`;
  return doc(body, `${s.code} ${s.title}`);
}

/** The README copy-paste block for the "Paste rules" dialog. */
export function pasteBlock(s: StandardSpec): string {
  return s.rules.map((r) => `${r.code} | ${r.text} | ${r.priority}`).join("\n");
}
