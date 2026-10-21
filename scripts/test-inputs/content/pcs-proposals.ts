/**
 * Phase 6 test inputs: three bids for the second sample tender, NGPA/T/2026/021 Port Community
 * System (pcs-rfp.ts; standard CITS-2026). Short, two-envelope bids written the way vendors
 * write them: each states what it offers in its own words. Nothing in them is written for the
 * evaluator (HANDOFF §0 rule 3); expected outcomes for humans are in test-inputs/SCENARIO.md.
 */
import { DOC_CSS } from "../lib/pdf";
import { PCS } from "./pcs-rfp";

export interface PcsBid {
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
  /** RFP §3 / §4 compliance table: [ref, requirement, response, offered]. */
  matrix: [string, string, string, string][];
  commercial: {
    lines: [string, string, number][];
    support: [number, number, number];
    notes: string[];
    terms: [string, string][];
  };
}

export const usd = (n: number) => `USD ${n.toLocaleString("en-US")}`;

const p = (s: string) => `<p>${s}</p>`;
const ul = (items: string[]) =>
  `<ul>${items.map((i) => `<li style="margin-bottom:3pt">${i}</li>`).join("")}</ul>`;
const tbl = (head: string[], rows: string[][]) =>
  `<table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`;

const RFP_ROWS: [string, string][] = [
  ["3.1", "Hosting in the Authority's data centres in the State; no public cloud dependency"],
  ["3.2", "Availability 99.8 % per calendar month (portal and messaging hub)"],
  ["3.3", "4,500 users, 600 concurrent, 250,000 messages/day, p95 < 5 s"],
  ["3.4", "MFA for all external users; Active Directory for internal users"],
  ["3.5", "Full Arabic and English UI incl. right-to-left"],
  ["3.6", "Open REST APIs (OpenAPI 3) with sandbox"],
  ["3.7", "Dashboards: dwell time, gate waiting, release lead times"],
  ["3.8", "Haulier mobile app (Android and iOS)"],
  ["3.9", "Compliance with CITS-2026"],
  ["4.1", "Go-live portal, hub, customs/TOS integrations ≤ 10 months; VBS ≤ 12 months"],
  ["4.2", "Training 30 staff; onboarding ≥ 150 companies"],
  ["4.3", "24/7 severity-1: 1 h response, 4 h restoration; 3 years support priced per year"],
];

export const PCS_BIDS: PcsBid[] = [
  {
    slug: "Qasr-Digital-Systems",
    name: "Qasr Digital Systems",
    legalName: "Qasr Digital Systems L.L.C.",
    country: "Northern Gulf State",
    address: "Office 1204, Al-Noor Trade Tower, Corniche Street, Al-Noor",
    contact: { name: "Hessa Al-Mazrouei", email: "tenders@qasrdigital.example" },
    signatory: { name: "Khalid Al-Rashdi", title: "Managing Director" },
    date: "12 January 2027",
    ref: "QDS-PCS-2027-004",
    technical: [
      {
        title: "Company and references",
        html:
          p(
            "Qasr Digital Systems is a systems integrator registered in the State since 2011, with 140 staff in Al-Noor and the capital. We implement the PortLink PCS product under a regional licence from its developer and operate the product's regional support centre.",
          ) +
          tbl(
            ["Reference", "Scope", "Year"],
            [
              [
                "Port of Ras Hadd PCS",
                "Portal, EDIFACT hub, TOS and customs integration, 2,900 users",
                "2023",
              ],
              [
                "Free Zone Logistics Portal",
                "Truck appointments for 3 gates, Arabic/English app",
                "2024",
              ],
              ["Inland Depot Authority", "Messaging hub upgrade, 180,000 messages/day", "2025"],
            ],
          ),
      },
      {
        title: "Solution and architecture",
        html:
          p(
            "The PCS runs entirely in the Authority's two data centres: an active site and a standby site with database replication. All components (portal, messaging hub, integration adapters, monitoring, backup) are installed on Authority infrastructure. Licences are perpetual and activated with an offline licence file; updates are delivered as signed packages through the Authority's change process. The system has no runtime dependency on any external service.",
          ) +
          p(
            "The messaging hub converts UN/EDIFACT (BAPLIE, COPARN, CODECO, CUSCAR, CUSRES), XML and JSON/REST with guaranteed delivery, retry queues and end-to-end message tracking. Integration adapters are included for both terminal operating systems, the Customs Risk Management System, the Maritime Single Window and the Authority's ERP.",
          ) +
          p(
            "Sizing: 6 application servers and a 3-node database cluster per site. Our load test on this configuration (report attached as Appendix A) reached 5,000 registered users, 800 concurrent sessions and 300,000 messages per day with a 95th-percentile processing time of 3.2 seconds.",
          ),
      },
      {
        title: "Security (CITS-2026)",
        html: ul([
          "Internal users sign in through the Authority's Active Directory over LDAPS; roles map to job functions. External users use multi-factor authentication (authenticator app or SMS one-time code); MFA is also enforced for every administrative account.",
          "Local accounts: minimum 12 characters, lock-out after 5 failed attempts, session lock after 15 minutes of inactivity.",
          "Audit logs of all user and administrator actions are hash-chained, kept for 5 years and forwarded in real time to the Authority's SIEM in CEF format.",
          "AES-256 encryption at rest; TLS 1.3 in transit with certificates from the Authority's PKI.",
          "Critical vulnerabilities fixed within 14 days and high within 30 days, during the whole support period.",
          "An independent penetration test by a CREST-accredited firm before go-live; critical and high findings closed before acceptance.",
          "Remote support only through the Authority's VPN, approved per session and recorded.",
          "Daily encrypted backups replicated to the standby site; RPO 4 hours, RTO 4 hours.",
          "Our administrators will complete the Authority's security vetting and sign its confidentiality undertaking.",
          "A CycloneDX SBOM is delivered with every release; architecture, data-flow and hardening documents before the Site Acceptance Test.",
        ]),
      },
      {
        title: "Implementation plan and support",
        html:
          tbl(
            ["Milestone", "Month"],
            [
              ["Design sign-off", "2"],
              ["Portal and messaging hub in production", "7"],
              ["TOS, customs, Maritime Single Window and ERP integrations live", "9"],
              ["Vehicle booking system and haulier app (Android, iOS) live", "11"],
              ["Data migration of 3 years of vessel calls", "8"],
            ],
          ) +
          p(
            "Training: 30 Authority administrators and helpdesk staff (2 courses), and onboarding sessions for 160 community companies in Arabic and English.",
          ) +
          p(
            "Support: 24/7 service desk in Al-Noor. Severity 1: 30-minute response and 4-hour restoration. Availability commitment 99.8 % per calendar month for the portal and the messaging hub, measured by the Authority's monitoring system, with service credits.",
          ) +
          p(
            "Dashboards for container dwell time, gate waiting times and release lead times are part of the standard product. All REST APIs are published in OpenAPI 3 with a sandbox environment for community developers. The whole user interface, including the haulier app, is available in Arabic (right-to-left) and English.",
          ),
      },
    ],
    matrix: [
      ["3.1", "", "Comply", "Both Authority data centres, offline licence"],
      ["3.2", "", "Comply", "99.8 % monthly, service credits"],
      ["3.3", "", "Comply", "Tested 5,000 / 800 / 300,000 per day, p95 3.2 s"],
      ["3.4", "", "Comply", "MFA (app or SMS) external; AD over LDAPS internal"],
      ["3.5", "", "Comply", "Arabic RTL and English"],
      ["3.6", "", "Comply", "OpenAPI 3, sandbox"],
      ["3.7", "", "Comply", "Standard dashboards"],
      ["3.8", "", "Comply", "Android and iOS"],
      ["3.9", "", "Comply", "See section 3"],
      ["4.1", "", "Comply", "Integrations month 9, VBS month 11"],
      ["4.2", "", "Comply", "30 staff, 160 companies"],
      ["4.3", "", "Comply", "30 min / 4 h, priced per year"],
    ],
    commercial: {
      lines: [
        ["1", "PortLink PCS licences (perpetual, 4,500 named users)", 1_150_000],
        ["2", "Infrastructure software and database licences (2 sites)", 420_000],
        ["3", "Implementation, integration adapters and data migration", 1_380_000],
        ["4", "Vehicle booking system and haulier mobile app", 310_000],
        ["5", "Training and community onboarding", 120_000],
        ["6", "Penetration test (independent firm) and security documentation", 100_000],
      ],
      support: [410_000, 410_000, 410_000],
      notes: [
        "Servers, storage and network equipment are provided by the Authority, as stated in the RFP; our sizing is in the technical proposal.",
        "Prices are fixed for the contract duration and exclude VAT.",
      ],
      terms: [
        [
          "Payment terms",
          "Payments against milestones: 10 % at design sign-off, 40 % at portal and hub go-live, 30 % at integrations go-live, 20 % at final acceptance. Support invoiced yearly in advance.",
        ],
        ["Bid validity", "120 days from the bid closing date."],
        [
          "Bid security",
          "Unconditional bank guarantee of USD 50,000 issued by Al-Noor National Bank, a bank licensed in the State, valid for 150 days.",
        ],
      ],
    },
  },
  {
    slug: "Bluewave-Port-Software",
    name: "Bluewave Port Software",
    legalName: "Bluewave Port Software Ltd.",
    country: "Ireland",
    address: "4 Grand Canal Quay, Dublin D02, Ireland · Regional office: Manama, Bahrain",
    contact: { name: "Ciaran Doyle", email: "bids@bluewaveport.example" },
    signatory: { name: "Aoife Brennan", title: "Chief Commercial Officer" },
    date: "13 January 2027",
    ref: "BW-NGPA-021",
    technical: [
      {
        title: "Company and product",
        html:
          p(
            "Bluewave Port Software develops Bluewave PCS, a port community platform used by 11 ports in Europe, the Gulf and South-East Asia. Bluewave PCS is a multi-tenant platform delivered as a managed service; customers receive new features every quarter without upgrade projects.",
          ) +
          tbl(
            ["Reference", "Scope", "Users"],
            [
              ["Port of Cork Community Platform", "Portal, hub, customs integration", "3,100"],
              ["Gulf Container Gateway", "Portal, VBS, mobile app", "5,400"],
              ["Port of Klang Logistics Hub", "Messaging hub", "2,200"],
            ],
          ),
      },
      {
        title: "Solution and hosting",
        html:
          p(
            "<b>Base offer (Option A): managed service.</b> Bluewave PCS for the Authority is operated by Bluewave from its Gulf regional data centre in Manama, Bahrain (Tier III, ISO 27001), with a disaster-recovery copy in our Dublin data centre. The Authority's systems connect through a dedicated encrypted link. Availability commitment: 99.9 % per calendar month.",
          ) +
          p(
            "<b>Option B: on-premise installation.</b> Bluewave PCS can be installed in the Authority's data centres. In this option the Authority's operations team runs the platform with our third-line support. Product updates and licence entitlements are delivered through the Bluewave Update Service, which the installation contacts over the internet once a month.",
          ) +
          p(
            "The messaging hub supports UN/EDIFACT (BAPLIE, COPARN, CODECO, CUSCAR, CUSRES), XML and REST with guaranteed delivery and message tracking. Standard connectors exist for the two TOS products used at the port; customs, Maritime Single Window and ERP integrations are built with our integration toolkit.",
          ) +
          p(
            "Capacity: the platform serves 5,400 users at our largest customer; a dedicated tenant for the Authority is sized for 4,500 users, 600 concurrent users and 250,000 messages per day with a p95 processing time below 2 seconds.",
          ),
      },
      {
        title: "Security",
        html: ul([
          "MFA for all users. Internal users sign in through SAML 2.0 federation with the Authority's Active Directory Federation Services.",
          "Password policy: 12 characters minimum, lock-out after 5 attempts, 15-minute idle timeout.",
          "Audit logs are kept for 12 months in the platform and can be exported to the Authority's SIEM through our audit API every 15 minutes.",
          "Encryption at rest (AES-256) and in transit (TLS 1.2+). Certificates are managed by Bluewave.",
          "Critical vulnerabilities patched within 7 days on the managed service.",
          "Independent penetration tests of the platform every year; the latest report and our SOC 2 Type II report are available under NDA.",
          "Daily backups with 30-day retention, replicated to the disaster-recovery site; RPO 1 hour, RTO 4 hours.",
          "An SBOM is available for each quarterly release.",
        ]),
      },
      {
        title: "Implementation and support",
        html:
          tbl(
            ["Milestone", "Month"],
            [
              ["Tenant set-up and configuration", "2"],
              ["Portal and messaging hub live", "5"],
              ["TOS, customs, Maritime Single Window and ERP integrations live", "8"],
              ["Vehicle booking system and haulier app (Android, iOS) live", "9"],
            ],
          ) +
          p(
            "Training of 30 Authority staff through our online academy plus two on-site workshops; community onboarding webinars for all companies, in English and Arabic.",
          ) +
          p(
            "Support: 24/7 follow-the-sun service desk. Severity 1: 1-hour response, 4-hour restoration. The portal and the haulier app are available in English and Arabic with right-to-left layout. REST APIs are documented in OpenAPI 3 and a sandbox tenant is included. Standard dashboards cover dwell time, gate waiting times and release lead times.",
          ),
      },
    ],
    matrix: [
      ["3.1", "", "Comply (Option B)", "See section 2"],
      ["3.2", "", "Comply", "99.9 % (managed service)"],
      ["3.3", "", "Comply", "Dedicated tenant sized to the RFP"],
      ["3.4", "", "Comply", "MFA all users; SAML federation with ADFS"],
      ["3.5", "", "Comply", "Arabic RTL and English"],
      ["3.6", "", "Comply", "OpenAPI 3, sandbox tenant"],
      ["3.7", "", "Comply", "Standard dashboards"],
      ["3.8", "", "Comply", "Android and iOS"],
      ["3.9", "", "Comply", "See section 3"],
      ["4.1", "", "Comply", "Integrations month 8, VBS month 9"],
      ["4.2", "", "Comply", "Online academy, workshops, webinars"],
      ["4.3", "", "Comply", "1 h / 4 h"],
    ],
    commercial: {
      lines: [
        ["1", "Platform set-up, configuration and tenant provisioning", 640_000],
        ["2", "Integrations (TOS, customs, Maritime Single Window, ERP)", 780_000],
        ["3", "Vehicle booking system and haulier mobile app", 260_000],
        ["4", "Data migration (3 years of vessel calls)", 140_000],
        ["5", "Training and community onboarding", 90_000],
      ],
      support: [560_000, 560_000, 560_000],
      notes: [
        "Yearly amounts are the managed-service subscription (Option A), including hosting, support, maintenance and quarterly upgrades for 4,500 users.",
        "Option B (on-premise installation in the Authority's data centres) adds USD 520,000 one-time for installation and licences, and USD 230,000 per year for third-line support and the Bluewave Update Service, replacing the hosting part of the subscription.",
        "Prices exclude VAT. Subscription prices are indexed yearly to the Irish CPI, capped at 4 %.",
      ],
      terms: [
        [
          "Payment terms",
          "30 % on contract signature, 40 % at portal and hub go-live, 30 % at final acceptance. Subscription invoiced quarterly in advance.",
        ],
        ["Bid validity", "90 days from the bid closing date."],
        [
          "Bid security",
          "Bank guarantee of USD 50,000 issued by Bank of Ireland and confirmed by Al-Noor National Bank.",
        ],
        [
          "Governing law",
          "Our standard subscription agreement (attached) applies to the managed service; liability is capped at 12 months of subscription fees.",
        ],
      ],
    },
  },
  {
    slug: "Corniche-Logistics-IT",
    name: "Corniche Logistics IT",
    legalName: "Corniche Logistics IT S.A.E.",
    country: "Egypt",
    address:
      "22 Abdel Hamid Badawi Street, Heliopolis, Cairo · Al-Noor branch: Business Park, Tower C",
    contact: { name: "Mona Fahmy", email: "tenders@cornichelit.example" },
    signatory: { name: "Tarek El-Sayed", title: "Chief Executive Officer" },
    date: "14 January 2027",
    ref: "CLIT/T/27/021",
    technical: [
      {
        title: "Company and references",
        html:
          p(
            "Corniche Logistics IT has built port and logistics software since 2006 and runs a branch office with 25 engineers in Al-Noor. Our product, CornichePort, is in use at four ports in Egypt and the Gulf.",
          ) +
          tbl(
            ["Reference", "Scope", "Year"],
            [
              ["Damietta Port Community Portal", "Portal and messaging, 2,100 users", "2022"],
              ["Sokhna Logistics Zone", "Truck appointments, Android app", "2024"],
            ],
          ),
      },
      {
        title: "Solution and architecture",
        html:
          p(
            "CornichePort is installed in the Authority's data centres (primary and secondary site). All application, database, integration and monitoring components run on Authority infrastructure; licences are perpetual and do not require any connection outside the Authority's network.",
          ) +
          p(
            "The messaging hub handles UN/EDIFACT (BAPLIE, COPARN, CODECO, CUSCAR, CUSRES), XML and JSON with guaranteed delivery. TOS and ERP adapters are part of the product; the Customs Risk Management System and Maritime Single Window adapters will be developed for this project.",
          ) +
          p(
            "The proposed configuration (4 application servers, 2 database servers) was tested with 400 concurrent users and 180,000 messages per day at a 95th-percentile processing time of 4.1 seconds. Growth beyond this is handled by adding application servers (see the optional line in the financial proposal).",
          ) +
          p(
            "Availability: we commit to 99.5 % per calendar month for the portal and the messaging hub.",
          ),
      },
      {
        title: "Security",
        html: ul([
          "Internal users authenticate against the Authority's Active Directory over LDAPS with role-based access. External users and administrators use SMS one-time codes as a second factor.",
          "Passwords: 12 characters, lock after 5 failed attempts, 15-minute session lock.",
          "Audit logs for 5 years, forwarded to the SIEM by syslog in real time; log records are signed.",
          "AES-256 at rest, TLS 1.2 in transit with Authority PKI certificates.",
          "Critical vulnerabilities fixed within 14 days, high within 30 days.",
          "Independent penetration test before go-live; findings fixed before acceptance.",
          "Remote access only through the Authority VPN with per-session approval and recording.",
          "Daily encrypted backups to the secondary site; RPO 24 hours, RTO 12 hours.",
          "Staff vetting and confidentiality undertakings accepted. SBOM provided on request.",
        ]),
      },
      {
        title: "Implementation and support",
        html:
          tbl(
            ["Milestone", "Month"],
            [
              ["Design sign-off", "2"],
              ["Portal, messaging hub and TOS integration live", "9"],
              ["ERP and Maritime Single Window integration live", "10"],
              [
                "Customs Risk Management System integration live (after the customs interface specification is issued)",
                "13",
              ],
              ["Vehicle booking system and Android haulier app live", "12"],
              ["iOS haulier app", "18"],
            ],
          ) +
          p(
            "Training for 30 Authority staff and onboarding sessions for 150 companies. The full user interface is available in Arabic (right-to-left) and English.",
          ) +
          p(
            "Support: 24/7 hotline. Severity 1: 2-hour response, 8-hour restoration. REST APIs are documented in OpenAPI 3 and a test environment is provided. Dashboards for dwell time and gate waiting times are standard; release lead-time reports will be configured during implementation.",
          ),
      },
    ],
    matrix: [
      ["3.1", "", "Comply", "Authority data centres, offline licences"],
      ["3.2", "", "Partially comply", "99.5 %"],
      ["3.3", "", "Comply", "Scalable by adding servers"],
      ["3.4", "", "Comply", "SMS OTP; AD over LDAPS"],
      ["3.5", "", "Comply", "Arabic RTL and English"],
      ["3.6", "", "Comply", "OpenAPI 3, test environment"],
      ["3.7", "", "Comply", "Dashboards and configured reports"],
      ["3.8", "", "Partially comply", "Android month 12, iOS month 18"],
      ["3.9", "", "Comply", "See section 3"],
      ["4.1", "", "Partially comply", "Customs integration month 13"],
      ["4.2", "", "Comply", "30 staff, 150 companies"],
      ["4.3", "", "Partially comply", "2 h / 8 h"],
    ],
    commercial: {
      lines: [
        ["1", "CornichePort licences (perpetual, unlimited users)", 780_000],
        ["2", "Implementation, adapters and data migration", 1_240_000],
        ["3", "Vehicle booking system and Android app", 220_000],
        ["4", "Training and onboarding", 70_000],
      ],
      support: [260_000, 270_000, 280_000],
      notes: [
        "Optional (not included in the total): 2 additional application servers' software licences and configuration for 600 concurrent users and 250,000 messages per day, USD 95,000.",
        "The iOS haulier app is included at no extra cost (delivery month 18).",
        "Prices exclude VAT and the independent penetration test, which we propose the Authority contracts directly.",
      ],
      terms: [
        [
          "Payment terms",
          "20 % advance against an advance-payment guarantee, 50 % at go-live of the portal and hub, 30 % at final acceptance.",
        ],
        ["Bid validity", "120 days from the bid closing date."],
        ["Bid security", "Bank guarantee of USD 50,000 from Al-Noor National Bank."],
      ],
    },
  },
];

const css = `${DOC_CSS}
  .letterhead { display:flex; justify-content:space-between; border-bottom:1.5pt solid #13304d; padding-bottom:6pt; margin-bottom:12pt; }
  .letterhead b { font-size: 13pt; color:#13304d; }
  td.num, th.num { text-align:right; white-space:nowrap; }
  tr.total td { font-weight:700; background:#eef2f6 !important; }`;

const letterhead = (b: PcsBid) =>
  `<div class="letterhead"><div><b>${b.legalName}</b><br><span class="small">${b.address}</span></div><div class="small" style="text-align:right">${b.contact.name}<br>${b.contact.email}</div></div>`;

const signature = (b: PcsBid) =>
  `<div class="sig"><div>${b.signatory.name}<br>${b.signatory.title}, ${b.legalName}</div><div>Date: ${b.date}<br>Reference: ${b.ref}</div></div>`;

const page = (title: string, body: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body><div class="watermark">SAMPLE · FICTIONAL</div>${body}</body></html>`;

export function pcsTechnicalHtml(b: PcsBid): string {
  const rows = RFP_ROWS.map(([ref, req]) => {
    const m = b.matrix.find((x) => x[0] === ref);
    return [ref, req, m?.[2] ?? "", m?.[3] ?? ""];
  });
  const body = `
<section>
  ${letterhead(b)}
  <h1>Technical proposal (Envelope 1)</h1>
  <p class="small">Tender ${PCS.ref} · ${PCS.title}</p>
  <p>To: The Chair, Tender Committee, Northern Gulf Ports Authority</p>
  <p>Having examined the tender documents for ${PCS.ref}, we, ${b.legalName}, submit our technical proposal for the Port Community System. This envelope contains no prices. We confirm that our bid is valid as stated in our financial proposal.</p>
  ${signature(b)}
</section>
${b.technical.map((s, i) => `<section${i === 0 ? ' class="pb"' : ""}><h2>${i + 1}. ${s.title}</h2>${s.html}</section>`).join("\n")}
<section class="pb">
  <h2>${b.technical.length + 1}. Compliance with RFP sections 3 and 4</h2>
  ${tbl(["Ref", "Requirement", "Response", "Offered"], rows)}
</section>`;
  return page(`${b.name} technical proposal`, body);
}

export function pcsCommercialHtml(b: PcsBid): string {
  const c = b.commercial;
  const impl = c.lines.reduce((s, l) => s + l[2], 0);
  const sup = c.support.reduce((s, x) => s + x, 0);
  const rows = [
    ...c.lines.map(
      ([n, d, v]) => `<tr><td>${n}</td><td>${d}</td><td class="num">${usd(v)}</td></tr>`,
    ),
    `<tr class="total"><td></td><td>Total implementation</td><td class="num">${usd(impl)}</td></tr>`,
    ...c.support.map(
      (v, i) =>
        `<tr><td>S${i + 1}</td><td>Support and maintenance, year ${i + 1}</td><td class="num">${usd(v)}</td></tr>`,
    ),
    `<tr class="total"><td></td><td>Total support (3 years)</td><td class="num">${usd(sup)}</td></tr>`,
    `<tr class="total"><td></td><td>Total bid price (implementation + 3 years support)</td><td class="num">${usd(impl + sup)}</td></tr>`,
  ].join("");
  const body = `
<section>
  ${letterhead(b)}
  <h1>Financial proposal (Envelope 2)</h1>
  <p class="small">Tender ${PCS.ref} · ${PCS.title}</p>
  <p>To: The Chair, Tender Committee, Northern Gulf Ports Authority</p>
  <p>We, ${b.legalName}, offer to supply, implement and support the Port Community System described in our technical proposal for the total bid price of <b>${usd(impl + sup)}</b>, as detailed in the price schedule below.</p>
  ${signature(b)}
</section>
<section>
  <h2>Price schedule</h2>
  <p class="small">All prices in United States Dollars (USD).</p>
  <table><tr><th style="width:8%">Line</th><th>Description</th><th class="num" style="width:22%">Amount</th></tr>${rows}</table>
  <h3>Notes</h3>
  <ol>${c.notes.map((n) => `<li style="margin-bottom:4pt">${n}</li>`).join("")}</ol>
</section>
<section>
  ${c.terms.map(([t, h]) => `<h2>${t}</h2><p>${h}</p>`).join("")}
  ${signature(b)}
</section>`;
  return page(`${b.name} financial proposal`, body);
}

export const bidTotal = (b: PcsBid) =>
  b.commercial.lines.reduce((s, l) => s + l[2], 0) +
  b.commercial.support.reduce((s, x) => s + x, 0);
