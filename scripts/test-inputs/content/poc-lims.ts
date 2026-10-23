/**
 * POC set 4 (three vendors): Laboratory Information Management System for the Central Customs
 * Laboratory, issued by the General Customs Directorate. Standard CLQS-2026 (a rules file), RFP
 * GCD/T/2026/061, and three bids that follow the 7-section proposal template. The category is
 * Quality, so the standards step shows a different list from sets 1–3.
 * The RFP and the standard agree wherever they cover the same topic.
 */
import type { PocBid, PocStandard, PocTender } from "./poc-render";
import { p, tbl, ul } from "./poc-render";

export const LIMS_STANDARD: PocStandard = {
  code: "CLQS-2026",
  title: "Customs Laboratory Quality Standard",
  category: "Quality",
  description:
    "Quality and data-integrity requirements for the information systems of the Directorate's accredited laboratories: records, signatures, sample custody, instrument data, validation and support. Issued by the General Customs Directorate, Laboratory Affairs Department (v1.1, February 2026).",
  rules: [
    [
      "LQ-01",
      "The system shall keep a complete audit trail of every creation, change and deletion of a record, with the user, date, time and reason; audit records cannot be edited and shall be kept for 10 years.",
      "mandatory",
    ],
    [
      "LQ-02",
      "Results shall be approved with an electronic signature that asks for the user's password at the moment of signing and stays permanently linked to the signed record.",
      "mandatory",
    ],
    [
      "LQ-03",
      "Every sample shall have a chain of custody from receipt to disposal, with each transfer between people or locations recorded.",
      "mandatory",
    ],
    [
      "LQ-04",
      "The system shall support the laboratory's ISO/IEC 17025 accreditation with records of method validation, measurement uncertainty, equipment calibration and staff competence.",
      "important",
    ],
    [
      "LQ-05",
      "Instruments with a digital output shall send their results to the system directly, through a file or an interface; manual transcription of such results is not acceptable.",
      "important",
    ],
    [
      "LQ-06",
      "Laboratory data shall be stored and processed only on servers in the State controlled by the Directorate.",
      "mandatory",
    ],
    [
      "LQ-07",
      "The supplier shall validate the system (installation, operational and performance qualification) and deliver the validation documents before go-live.",
      "mandatory",
    ],
    [
      "LQ-08",
      "Users shall sign in through the Directorate's Active Directory, and roles shall separate analysts, reviewers and approvers.",
      "important",
    ],
    [
      "LQ-09",
      "Data shall be backed up every day, and a restore shall be tested at least every 6 months.",
      "important",
    ],
    [
      "LQ-10",
      "Certificates of analysis and the user interface shall be available in Arabic and English.",
      "desirable",
    ],
    ["LQ-11", "Critical faults shall get a response within 4 hours on working days.", "important"],
    [
      "LQ-12",
      "A warranty of at least 12 months after go-live shall cover the software and its configuration.",
      "mandatory",
    ],
  ],
};

export const LIMS_TENDER: PocTender = {
  ref: "GCD/T/2026/061",
  title: "Laboratory Information Management System (LIMS)",
  place: "Central Customs Laboratory, Al-Noor",
  issuer: "General Customs Directorate",
  programme: "Laboratory Affairs Department",
  issued: "14 October 2026",
  closing: "17 December 2026, 12:00 local time",
  contact: "Procurement Office · procurement@gcd.example",
  sections: [
    {
      title: "Background",
      clauses: [
        [
          "1.1",
          "The Central Customs Laboratory tests about 18,000 samples a year (food, chemicals, textiles, fuels and suspected narcotics) for tariff classification and safety checks. Results are recorded on paper worksheets and spreadsheets, and certificates are typed by hand.",
        ],
        [
          "1.2",
          "The General Customs Directorate (the Directorate) seeks a laboratory information management system (LIMS) that manages samples from receipt to certificate, connects the instruments and supports the laboratory's ISO/IEC 17025 accreditation.",
        ],
      ],
    },
    {
      title: "Scope",
      clauses: [
        [
          "2.1",
          "LIMS software for 45 named users: sample reception, analysts, reviewers and approvers.",
          "M",
        ],
        [
          "2.2",
          "Interfaces to the laboratory's 14 instruments: 3 GC-MS, 2 LC-MS, 2 ICP-OES, 3 FTIR spectrometers, 2 Karl Fischer titrators and 2 analytical balances.",
          "M",
        ],
        [
          "2.3",
          "Integration with the Customs Declaration System (CDS): sample requests come from declarations, and approved results go back to the declaration.",
          "M",
        ],
        [
          "2.4",
          "Implementation, migration of 3 years of results from the current spreadsheets, validation, training and 3 years of support.",
          "M",
        ],
      ],
    },
    {
      title: "Functional requirements",
      clauses: [
        [
          "3.1",
          "Sample reception with barcode labels, storage locations and a chain of custody from receipt to disposal.",
          "M",
        ],
        [
          "3.2",
          "Test assignment by method, worklists per analyst and instrument, and turnaround-time tracking against a target per test.",
          "I",
        ],
        [
          "3.3",
          "Results entry with automatic calculations, specification limits and out-of-specification flags.",
          "I",
        ],
        [
          "3.4",
          "Review and approval in two steps (reviewer, then approver), each with an electronic signature.",
          "M",
        ],
        [
          "3.5",
          "Certificates of analysis in Arabic and English, generated from approved results.",
          "D",
        ],
        [
          "3.6",
          "Records for ISO/IEC 17025: method validation, measurement uncertainty, equipment calibration and maintenance, staff training and competence.",
          "I",
        ],
      ],
    },
    {
      title: "Data, security and integration",
      clauses: [
        [
          "4.1",
          "The LIMS and all laboratory data shall be hosted on the Directorate's servers in its data centre.",
          "M",
        ],
        [
          "4.2",
          "A complete audit trail of every change (user, time, reason) that cannot be edited, kept for 10 years.",
          "M",
        ],
        [
          "4.3",
          "Sign-in with the Directorate's Active Directory, with separate roles for analysts, reviewers and approvers.",
          "I",
        ],
        [
          "4.4",
          "Results of the instruments in 2.2 are transferred directly; no manual transcription for instruments with a digital output.",
          "I",
        ],
        ["4.5", "CDS integration through REST APIs, in real time.", "I"],
        ["4.6", "Daily backups, and a restore test at least every 6 months.", "I"],
      ],
    },
    {
      title: "Implementation and services",
      clauses: [
        ["5.1", "Go-live within 9 months of contract signature.", "I"],
        [
          "5.2",
          "Installation, operational and performance qualification (IQ/OQ/PQ) by the supplier, with the validation documents delivered before go-live.",
          "M",
        ],
        ["5.3", "Training for the 45 users, and administrator training for 3 key users.", "D"],
        [
          "5.4",
          "Support for 3 years after go-live, with a response within 4 hours on working days for critical faults.",
          "I",
        ],
        [
          "5.5",
          "Warranty of at least 12 months after go-live on the software and its configuration.",
          "M",
        ],
      ],
    },
    {
      title: "Qualification",
      clauses: [
        [
          "6.1",
          "The bidder shall have implemented its LIMS in at least 3 laboratories accredited to ISO/IEC 17025 in the last 7 years.",
          "M",
        ],
        ["6.2", "The bidder shall have an office or an authorised partner in the State.", "I"],
      ],
    },
    {
      title: "Commercial conditions",
      clauses: [
        [
          "7.1",
          "Prices in USD, excluding VAT. Annual support shall be priced per year, and these prices shall be fixed for the 3 years.",
          "I",
        ],
        [
          "7.2",
          "Payments follow milestones. Any advance payment shall not exceed 15 % and requires an advance-payment guarantee.",
          "I",
        ],
        [
          "7.3",
          "Performance security of 10 % of the contract price, issued by a bank licensed in the State.",
          "M",
        ],
        [
          "7.4",
          "Bid validity of 120 days. Bid security of USD 20,000, issued by a bank licensed in the State.",
          "M",
        ],
      ],
    },
    {
      title: "Evaluation",
      clauses: [
        [
          "8.1",
          "Mandatory requirements are pass/fail. Compliant bids are scored 70 % technical (data integrity and quality 30, functions 25, instruments and integration 20, implementation and support 15, references 10) and 30 % financial.",
        ],
        ["8.2", "Evaluated price = supply and implementation + 3 years of support."],
        ["8.3", "Bidders shall complete the compliance matrix in Annex 1."],
      ],
    },
  ],
  matrix: [
    ["2.1", "45 named users"],
    ["2.2", "14 instrument interfaces"],
    ["2.3", "CDS integration"],
    ["2.4", "Implementation, migration, validation, training, support"],
    ["3.1", "Sample reception, barcodes, chain of custody"],
    ["3.2", "Worklists, turnaround-time tracking"],
    ["3.3", "Calculations, limits, OOS flags"],
    ["3.4", "Two-step approval with e-signatures"],
    ["3.5", "Certificates in Arabic and English"],
    ["3.6", "ISO/IEC 17025 records"],
    ["4.1", "Hosted in the Directorate's data centre"],
    ["4.2", "Audit trail, kept 10 years"],
    ["4.3", "Active Directory, separate roles"],
    ["4.4", "Direct instrument result transfer"],
    ["4.5", "CDS REST integration, real time"],
    ["4.6", "Daily backups, restore test every 6 months"],
    ["5.1", "Go-live ≤ 9 months"],
    ["5.2", "IQ/OQ/PQ by the supplier"],
    ["5.3", "Training: 45 users, 3 administrators"],
    ["5.4", "3-year support, 4 h response"],
    ["5.5", "Warranty ≥ 12 months"],
    ["6.1", "≥ 3 accredited-lab implementations"],
    ["6.2", "Office or partner in the State"],
  ],
};

export const LIMS_BIDS: PocBid[] = [
  {
    slug: "Qalamra-Lab-Systems",
    name: "Qalamra Lab Systems",
    legalName: "Qalamra Lab Systems W.L.L.",
    country: "Northern Gulf State",
    address: "Office 304, Knowledge Tower, Al-Noor Business District, Al-Noor",
    contact: { name: "Sara Al-Hashimi", email: "bids@qalamra.example" },
    signatory: { name: "Yousef Darwish", title: "Chief Executive Officer" },
    date: "15 December 2026",
    ref: "QLS/GCD/061/26",
    technical: {
      company:
        p(
          "Qalamra Lab Systems has built and supported laboratory software since 2011. Our 52 staff in Al-Noor develop QLIMS, which runs in 19 laboratories in the region, 11 of them accredited to ISO/IEC 17025.",
        ) +
        tbl(
          ["Reference", "Scope", "Year"],
          [
            [
              "National Food Control Laboratory (ISO/IEC 17025)",
              "QLIMS for 60 users, 22 instruments, certificates in Arabic and English",
              "2020",
            ],
            [
              "Petroleum Products Testing Laboratory (ISO/IEC 17025)",
              "QLIMS for 35 users, 16 instruments",
              "2022",
            ],
            [
              "Port Health Laboratory (ISO/IEC 17025)",
              "QLIMS for 28 users, integration with the port system",
              "2024",
            ],
          ],
        ),
      solution:
        p("<b>QLIMS 7</b> covers the whole laboratory workflow:") +
        ul([
          "Sample reception with barcode labels and storage locations; the chain of custody records every hand-over from receipt to disposal.",
          "Test assignment by method, worklists per analyst and per instrument, and turnaround-time dashboards against the target of each test.",
          "Results entry with calculations, specification limits and automatic out-of-specification flags.",
          "Two-step review and approval (reviewer, then approver), each signed with the user's password; the signature is stored with the record.",
          "Certificates of analysis generated in Arabic and English from approved results.",
          "ISO/IEC 17025 module: method validation, measurement uncertainty, equipment calibration and maintenance, staff training and competence.",
        ]) +
        p(
          "<b>Instruments.</b> 12 of the 14 instruments send their results to QLIMS through our instrument gateway (GC-MS, LC-MS, ICP-OES, FTIR and balances). The 2 Karl Fischer titrators have no supported interface: their results are entered by the analyst and checked by a second person.",
        ) +
        p(
          "<b>CDS integration.</b> Sample requests are imported from the CDS, and approved results are sent back, through a file exchange (SFTP) every night.",
        ),
      security:
        p(
          "<b>Hosting.</b> QLIMS is installed on the Directorate's servers in its data centre (application, database and file servers); no data leaves the Directorate.",
        ) +
        ul([
          "Every creation, change and deletion is recorded in an audit trail with user, time and reason; audit records cannot be edited and are kept for 10 years.",
          "Users sign in with their Active Directory accounts; roles separate reception, analysts, reviewers and approvers.",
          "Daily backups to the Directorate's backup system; we test a restore with the IT team every 6 months.",
        ]),
      implementation:
        tbl(
          ["Milestone", "Month"],
          [
            ["Workshops and configuration design", "1–2"],
            ["Installation, IQ and OQ", "3–4"],
            ["Instrument and CDS interfaces, data migration", "4–6"],
            ["PQ with the laboratory, validation report", "7"],
            ["Go-live", "8"],
          ],
        ) +
        p(
          "<b>Validation.</b> We perform IQ, OQ and PQ and deliver the validation plan, protocols and report before go-live.",
        ) +
        p(
          "<b>Training.</b> Courses in Arabic and English for the 45 users, and administrator training for 2 key users.",
        ),
      support:
        p(
          "<b>Warranty.</b> 12 months after go-live, covering the software and its configuration.",
        ) +
        p(
          "<b>Support for 3 years.</b> Service desk in Al-Noor on working days, with a response within 2 hours to critical faults and on-site help when needed. Updates and new versions are included.",
        ),
    },
    matrix: {
      "2.1": ["Comply", "§2"],
      "2.2": ["Partially comply", "12 of 14 interfaced (§2)"],
      "2.3": ["Comply", "§2"],
      "2.4": ["Comply", "§4"],
      "3.1": ["Comply", "§2"],
      "3.2": ["Comply", "§2"],
      "3.3": ["Comply", "§2"],
      "3.4": ["Comply", "§2"],
      "3.5": ["Comply", "§2"],
      "3.6": ["Comply", "§2"],
      "4.1": ["Comply", "§3"],
      "4.2": ["Comply", "§3"],
      "4.3": ["Comply", "§3"],
      "4.4": ["Partially comply", "Karl Fischer entered manually (§2)"],
      "4.5": ["Partially comply", "Nightly file exchange (§2)"],
      "4.6": ["Comply", "§3"],
      "5.1": ["Comply", "Go-live month 8 (§4)"],
      "5.2": ["Comply", "§4"],
      "5.3": ["Comply", "45 users, 2 administrators (§4)"],
      "5.4": ["Comply", "2 h response (§5)"],
      "5.5": ["Comply", "12 months (§5)"],
      "6.1": ["Comply", "§1"],
      "6.2": ["Comply", "Office in Al-Noor (§1)"],
    },
    commercial: {
      lines: [
        ["QLIMS 7 named-user licence (perpetual)", 45, 3_800],
        ["Instrument interfaces", 12, 6_500],
        ["CDS integration (file exchange)", 1, 65_000],
        ["Implementation and data migration", 1, 140_000],
        ["Validation (IQ, OQ, PQ) and documents", 1, 48_000],
        ["Training (Arabic and English)", 1, 18_000],
      ],
      recurring: { label: "Support and updates", amounts: [104_000, 104_000, 104_000] },
      notes: [
        "The warranty (12 months after go-live) is included in the supply prices.",
        "Support prices are fixed for 3 years.",
      ],
      terms: [
        [
          "Payment",
          "15 % advance against an advance-payment guarantee; 45 % at go-live; 40 % on acceptance of the validation report. Support invoiced yearly in arrears.",
        ],
        ["Bid validity", "120 days from the bid closing date."],
        ["Bid security", "Bank guarantee of USD 20,000 issued by Al-Noor National Bank."],
        ["Performance security", "10 % of the contract price, issued by Al-Noor National Bank."],
      ],
      deviations: [],
    },
  },
  {
    slug: "Veridane-Informatics",
    name: "Veridane Informatics",
    legalName: "Veridane Informatics B.V.",
    country: "Netherlands",
    address: "Stationsplein 9, 3511 ED Utrecht, Netherlands",
    contact: { name: "Thomas de Groot", email: "tenders@veridane.example" },
    signatory: { name: "Ingrid Vos", title: "Managing Director" },
    date: "16 December 2026",
    ref: "VI-2026-GCD-061",
    technical: {
      company:
        p(
          "Veridane Informatics develops Veridane LIMS, a cloud LIMS used by 140 laboratories in 22 countries, from food and environmental testing to customs and forensic laboratories. Our 180 staff work from Utrecht and Lisbon; in the Gulf we work with our implementation partner Crescent Digital (Al-Noor).",
        ) +
        tbl(
          ["Reference", "Scope", "Year"],
          [
            ["Northern Customs Laboratory (ISO/IEC 17025)", "120 users, 30 instruments", "2021"],
            ["Coastal Environmental Laboratory (ISO/IEC 17025)", "70 users", "2023"],
            [
              "Regional Forensic Institute (ISO/IEC 17025)",
              "90 users, chain of custody for evidence",
              "2025",
            ],
          ],
        ),
      solution:
        p("<b>Veridane LIMS</b> (software as a service) includes:") +
        ul([
          "Sample reception with barcodes, storage management and a full chain of custody.",
          "Methods, worklists, instrument queues and turnaround-time analytics.",
          "Calculations, specification limits and out-of-specification workflows.",
          "Configurable review and approval chains with electronic signatures (password re-entry, signature bound to the record).",
          "Certificate templates in any language, including Arabic.",
          "A quality module for ISO/IEC 17025: method validation, uncertainty budgets, equipment calibration, training and competence.",
        ]) +
        p(
          "<b>Instruments.</b> Veridane Connect agents installed in the laboratory send the results of all 14 instruments to the cloud.",
        ) +
        p(
          "<b>CDS integration.</b> Real-time REST and webhook integration, configured by Crescent Digital.",
        ),
      security:
        p(
          "<b>Hosting.</b> Veridane LIMS runs in our ISO 27001 certified cloud on a public cloud provider in the European Union (Ireland), with a dedicated database for the Directorate. Data is encrypted in transit and at rest.",
        ) +
        ul([
          "Every change is recorded in an audit trail (user, time, reason) that cannot be edited; it is kept for the life of the subscription and exported to the customer at the end.",
          "Sign-in with single sign-on (SAML) through the Directorate's identity provider; role-based permissions.",
          "Continuous backups with point-in-time recovery; restores are tested every quarter.",
        ]),
      implementation:
        tbl(
          ["Milestone", "Month"],
          [
            ["Tenant set-up and configuration", "1–3"],
            ["Instrument agents and CDS integration", "3–5"],
            ["Data migration, user acceptance testing", "5–6"],
            ["Go-live", "6"],
          ],
        ) +
        p(
          "<b>Validation.</b> We provide our validation pack: the vendor IQ/OQ executed on our platform, plus PQ templates for the laboratory to complete with its own data.",
        ) +
        p(
          "<b>Training.</b> Online academy for all users, and a 2-day administrator course for 3 key users.",
        ),
      support:
        p("<b>Warranty.</b> Covered by the subscription for its whole term.") +
        p(
          "<b>Support.</b> 24/7 ticket portal; response within 8 business hours (CET) for critical faults. Crescent Digital provides first-line support in Al-Noor.",
        ),
    },
    matrix: {
      "2.1": ["Comply", "§2"],
      "2.2": ["Comply", "All 14 through Veridane Connect (§2)"],
      "2.3": ["Comply", "§2"],
      "2.4": ["Comply", "§4"],
      "3.1": ["Comply", "§2"],
      "3.2": ["Comply", "§2"],
      "3.3": ["Comply", "§2"],
      "3.4": ["Comply", "§2"],
      "3.5": ["Comply", "§2"],
      "3.6": ["Comply", "§2"],
      "4.1": ["Partially comply", "EU cloud, dedicated database (§3)"],
      "4.2": ["Comply", "§3"],
      "4.3": ["Comply", "SAML single sign-on (§3)"],
      "4.4": ["Comply", "§2"],
      "4.5": ["Comply", "§2"],
      "4.6": ["Comply", "Continuous backups (§3)"],
      "5.1": ["Comply", "Go-live month 6 (§4)"],
      "5.2": ["Partially comply", "Vendor IQ/OQ; PQ templates (§4)"],
      "5.3": ["Comply", "§4"],
      "5.4": ["Partially comply", "8 business hours (§5)"],
      "5.5": ["Comply", "Subscription term (§5)"],
      "6.1": ["Comply", "§1"],
      "6.2": ["Comply", "Crescent Digital (§1)"],
    },
    commercial: {
      lines: [
        ["Tenant set-up, configuration and data migration", 1, 120_000],
        ["Veridane Connect instrument agents", 14, 4_200],
        ["CDS integration", 1, 40_000],
        ["Validation pack", 1, 15_000],
        ["Training (online academy and administrator course)", 1, 9_000],
      ],
      recurring: { label: "Subscription for 45 users", amounts: [117_000, 120_510, 124_125] },
      notes: [
        "The subscription includes hosting, support and updates.",
        "The subscription is indexed yearly to the Dutch consumer price index, capped at 3 %.",
        "The Veridane Cloud Terms of Service apply to the subscription.",
      ],
      terms: [
        [
          "Payment",
          "30 % on contract signature; 70 % at go-live. Subscription invoiced yearly in advance.",
        ],
        ["Bid validity", "90 days from the bid closing date."],
        ["Bid security", "Bank guarantee of USD 20,000 issued by Rijnbank N.V., Utrecht."],
        ["Performance security", "10 % of the contract price, issued by Rijnbank N.V., Utrecht."],
      ],
      deviations: [
        "The subscription is indexed yearly (note 2).",
        "The Veridane Cloud Terms of Service apply to the subscription (note 3).",
      ],
    },
  },
  {
    slug: "Corvantis-Business-Software",
    name: "Corvantis Business Software",
    legalName: "Corvantis Business Software Ltd",
    country: "Cyprus",
    address: "28 Makarios Avenue, 3030 Limassol, Cyprus",
    contact: { name: "Andreas Michaelides", email: "sales@corvantis.example" },
    signatory: { name: "Elena Charalambous", title: "Sales Director" },
    date: "16 December 2026",
    ref: "CBS-0061-2026",
    technical: {
      company:
        p(
          "Corvantis Business Software develops Corvantis ERP for mid-size organisations: finance, procurement, inventory and quality control. Corvantis ERP is used by 300 companies in Europe and the Middle East. Our Lab module is in use at a food producer's quality-control laboratory. In the Gulf we sell and install through our regional reseller, Bayside Systems (Al-Noor).",
        ) +
        tbl(
          ["Reference", "Scope", "Year"],
          [
            [
              "Mediterranean Foods Group",
              "ERP with the Lab module for its quality-control laboratory, 20 users",
              "2023",
            ],
            ["Bluegate Logistics", "ERP finance and inventory", "2024"],
            ["Cedarline Retail", "ERP procurement and inventory", "2025"],
          ],
        ),
      solution:
        p("<b>Corvantis Lab</b> is a module of Corvantis ERP for laboratory work:") +
        ul([
          "Sample registration with barcode labels, linked to the inventory module for storage locations.",
          "Test plans per product, worklists and due dates.",
          "Results entry with calculations and specification limits; out-of-specification results are highlighted.",
          "Approval of results by a user with the approver role.",
          "Certificates of analysis from templates, in English; other languages can be added as templates.",
        ]) +
        p(
          "<b>Instruments.</b> Results are entered by the analysts. A CSV import for instrument exports is planned for version 12.",
        ) +
        p("<b>CDS integration.</b> Through the ERP's standard REST API."),
      security:
        p("<b>Hosting.</b> Corvantis ERP is installed on the Directorate's servers (on premise).") +
        ul([
          "Changes to results are logged with the user and time; the change log is kept for 24 months.",
          "Sign-in with Active Directory; ERP roles and permissions.",
          "Backups use the Directorate's standard database backup.",
        ]),
      implementation:
        tbl(
          ["Milestone", "Month"],
          [
            ["Installation and configuration", "1–2"],
            ["Data import from spreadsheets", "3"],
            ["Training and go-live", "4"],
          ],
        ) +
        p(
          "<b>Training.</b> 3 days of on-site training for key users, who then train the other users.",
        ),
      support:
        p("<b>Warranty.</b> 6 months after go-live.") +
        p(
          "<b>Support.</b> Help desk by e-mail and phone from Limassol, Monday to Friday, with a response on the next business day.",
        ),
    },
    matrix: {
      "2.1": ["Comply", "§2"],
      "2.2": ["Partially comply", "Manual entry; CSV import planned (§2)"],
      "2.3": ["Comply", "§2"],
      "2.4": ["Comply", "§4"],
      "3.1": ["Comply", "§2"],
      "3.2": ["Comply", "§2"],
      "3.3": ["Comply", "§2"],
      "3.4": ["Comply", "Approver role (§2)"],
      "3.5": ["Comply", "Templates (§2)"],
      "3.6": ["Partially comply", "Quality control module (§2)"],
      "4.1": ["Comply", "On premise (§3)"],
      "4.2": ["Comply", "Change log (§3)"],
      "4.3": ["Comply", "§3"],
      "4.4": ["Partially comply", "CSV import planned (§2)"],
      "4.5": ["Comply", "ERP REST API (§2)"],
      "4.6": ["Comply", "§3"],
      "5.1": ["Comply", "Go-live month 4 (§4)"],
      "5.2": ["Comply", "Installation and configuration (§4)"],
      "5.3": ["Comply", "Key users (§4)"],
      "5.4": ["Comply", "§5"],
      "5.5": ["Partially comply", "6 months (§5)"],
      "6.1": ["Comply", "§1"],
      "6.2": ["Comply", "Bayside Systems, regional reseller (§1)"],
    },
    commercial: {
      lines: [
        ["Corvantis Lab module, named-user licence", 45, 900],
        ["Implementation and configuration", 1, 38_000],
        ["Data import from spreadsheets", 1, 9_500],
        ["Training", 1, 6_000],
      ],
      recurring: { label: "Annual maintenance", amounts: [22_000, 22_000, 22_000] },
      notes: ["Maintenance includes updates and help desk.", "Prices are fixed for 3 years."],
      terms: [
        ["Payment", "50 % with the order; 50 % at go-live."],
        ["Bid validity", "120 days from the bid closing date."],
        ["Bid security", "Bank guarantee of USD 20,000 issued by Al-Noor National Bank."],
        ["Performance security", "10 % of the contract price, issued by Al-Noor National Bank."],
      ],
      deviations: ["Warranty of 6 months after go-live."],
    },
  },
];
