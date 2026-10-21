/**
 * POC set 1 (rehearsal): Smart Gate Automation for the Container Terminal 2 truck gates.
 * Standard POTS-2026 (pasted as rules), RFP NGPA/T/2026/031, and two bids. The RFP and the
 * standard agree wherever they cover the same topic.
 */
import type { PocBid, PocStandard, PocTender } from "./poc-render";
import { p, tbl, ul } from "./poc-render";

export const GATES_STANDARD: PocStandard = {
  code: "POTS-2026",
  title: "Port Operational Technology Standard",
  category: "IT & security",
  description:
    "Requirements for operational technology (OT) systems installed at the Authority's terminals, such as gate automation, CCTV, access control and crane automation. Issued by the NGPA Technology Directorate (v1.2, May 2026).",
  rules: [
    [
      "OT-01",
      "All data captured by OT systems (images, video, plate and container numbers, logs) shall be stored and processed only in the Authority's own server rooms and data centres; no public cloud service may be used.",
      "mandatory",
    ],
    [
      "OT-02",
      "OT systems shall run on a network segment separated from the corporate network by the Authority's firewalls, with no direct connection to the internet.",
      "mandatory",
    ],
    [
      "OT-03",
      "User accounts shall be managed through the Authority's Active Directory; administrative accounts shall use multi-factor authentication.",
      "mandatory",
    ],
    [
      "OT-04",
      "Audit logs of user and system events shall be kept for at least 3 years and forwarded in real time to the Authority's SIEM.",
      "important",
    ],
    [
      "OT-05",
      "Field equipment installed outdoors shall be rated IP66 or better and for continuous operation from 0 °C to +55 °C.",
      "mandatory",
    ],
    [
      "OT-06",
      "Critical OT systems shall reach at least 99.5 % availability per calendar month, with no single point of failure in servers, network or power, and UPS autonomy of at least 30 minutes.",
      "important",
    ],
    [
      "OT-07",
      "The supplier shall keep a spare-parts stock in the State and respond on site within 4 hours, 24/7, to faults that stop operations.",
      "important",
    ],
    [
      "OT-08",
      "A warranty of at least 24 months from acceptance shall cover all equipment and software, including parts and labour.",
      "mandatory",
    ],
    [
      "OT-09",
      "Interfaces shall use open, documented protocols (REST/JSON, UN/EDIFACT or OPC UA); the documentation shall be delivered to the Authority.",
      "important",
    ],
    [
      "OT-10",
      "Operator and maintenance training, and the user and maintenance manuals, shall be provided in Arabic and English.",
      "desirable",
    ],
    [
      "OT-11",
      "Payments for equipment shall follow delivery and acceptance milestones; any advance payment shall not exceed 20 % and requires an advance-payment guarantee.",
      "important",
    ],
    [
      "OT-12",
      "Maintenance after the warranty shall be priced per year, and these prices shall be fixed for at least 3 years.",
      "important",
    ],
  ],
};

export const GATES_TENDER: PocTender = {
  ref: "NGPA/T/2026/031",
  title: "Smart Gate Automation System for the Terminal 2 Truck Gates",
  place: "Port of Al-Noor · Container Terminal 2",
  issuer: "Northern Gulf Ports Authority",
  programme: "Terminal Modernisation Programme",
  issued: "5 October 2026",
  closing: "30 November 2026, 12:00 local time",
  contact: "Tender Committee Secretariat · tenders@ngpa.example",
  sections: [
    {
      title: "Background",
      clauses: [
        [
          "1.1",
          "Container Terminal 2 handles about 2,800 truck visits per day through 4 in-gate lanes and 2 out-gate lanes. Gate clerks check container numbers, seals, truck plates and documents by hand; a transaction takes 4 minutes on average and at peak hours queues reach the port access road.",
        ],
        [
          "1.2",
          "The Northern Gulf Ports Authority (the Authority) seeks a Smart Gate Automation System that identifies trucks and containers automatically, checks every visit against the truck appointment and the customs release, and opens the barrier without clerk intervention when everything is in order.",
        ],
      ],
    },
    {
      title: "Scope of supply",
      clauses: [
        [
          "2.1",
          "OCR portals for all 6 lanes, reading container numbers and ISO type codes, truck licence plates and seal presence, and taking damage-inspection images of every container.",
        ],
        [
          "2.2",
          "UHF RFID readers on every lane and 3,000 windscreen RFID tags for the registered haulier fleet.",
        ],
        [
          "2.3",
          "A self-service kiosk on every lane, with a touchscreen, an intercom to the gate control room and a gate-pass printer.",
        ],
        [
          "2.4",
          "A Gate Operating System (GOS) for lane control, exception handling and reporting, with workstations for 4 clerks in the gate control room.",
        ],
        [
          "2.5",
          "Integration with the Terminal 2 Terminal Operating System (TOS), the Vehicle Booking System of the Port Community System (PCS) and the customs release status.",
        ],
        [
          "2.6",
          "Design, supply, civil works for the portal foundations, installation, testing, training, a 24-month warranty and 3 years of maintenance after the warranty.",
        ],
      ],
    },
    {
      title: "Technical requirements",
      clauses: [
        [
          "3.1",
          "The OCR shall read container numbers (with ISO 6346 check-digit validation) with an accuracy of at least 98 %, and truck plates with Arabic and Latin characters with an accuracy of at least 97 %, by day and night, at truck speeds up to 15 km/h.",
          "M",
        ],
        [
          "3.2",
          "Damage-inspection images of the four sides and the roof of each container shall be taken at 5 megapixels or more and kept online for at least 90 days.",
          "I",
        ],
        [
          "3.3",
          "UHF RFID readers shall comply with ISO/IEC 18000-63 (EPC Gen2). The supplier shall deliver 3,000 tamper-evident windscreen tags.",
          "M",
        ],
        [
          "3.4",
          "For a pre-booked truck with no exception, the in-gate transaction, from arrival at the portal to the barrier opening, shall take no more than 60 seconds on average.",
          "M",
        ],
        [
          "3.5",
          "Kiosks shall offer an Arabic and English interface and an intercom to the gate control room, and print a gate pass showing the assigned yard position.",
          "I",
        ],
        [
          "3.6",
          "The GOS shall provide lane control, an exception-handling workstation showing all images of the transaction, and dashboards of transactions per hour, average transaction time and exceptions by type.",
          "I",
        ],
        [
          "3.7",
          "Real-time integration with the T2 TOS (REST or UN/EDIFACT CODECO/COARRI), the PCS Vehicle Booking System (appointment check) and the customs release status provided through the PCS. A truck shall not be let in without a valid appointment, nor a container out without customs release.",
          "M",
        ],
        [
          "3.8",
          "All servers, storage and software shall be installed in the Authority's Terminal 2 server room, with a standby server in the Authority's main data centre. The system shall comply with the Authority's Port Operational Technology Standard (POTS-2026).",
          "M",
        ],
        [
          "3.9",
          "Availability of at least 99.5 % per calendar month. When the GOS is unavailable, the lanes shall switch to a manual mode operated from the kiosks and the control room.",
          "M",
        ],
        [
          "3.10",
          "Outdoor equipment shall be rated IP66 or better, for continuous operation from 0 °C to +55 °C in a saline coastal atmosphere.",
          "M",
        ],
      ],
    },
    {
      title: "Implementation",
      clauses: [
        [
          "4.1",
          "All 6 lanes shall be in operation within 8 months of contract signature. Lanes are cut over one pair at a time; at least 4 lanes shall stay open during the works.",
          "M",
        ],
        [
          "4.2",
          "Acceptance follows a Site Acceptance Test and a 30-day performance test in live operation, which measures OCR accuracy and transaction times against clauses 3.1 and 3.4.",
          "M",
        ],
        [
          "4.3",
          "Training of 20 gate clerks and control-room operators, and of 6 maintenance technicians of the Authority.",
          "I",
        ],
      ],
    },
    {
      title: "Warranty and maintenance",
      clauses: [
        [
          "5.1",
          "Warranty of 24 months from acceptance, covering all equipment and software, parts and labour.",
          "M",
        ],
        [
          "5.2",
          "Maintenance for 3 years after the warranty, including preventive maintenance, software updates and repairs, priced per year.",
          "M",
        ],
        [
          "5.3",
          "On-site response within 4 hours, 24 hours a day and 7 days a week, to any fault that stops a lane, from a spare-parts stock held in the State.",
          "I",
        ],
      ],
    },
    {
      title: "Commercial conditions",
      clauses: [
        [
          "6.1",
          "Prices in United States Dollars (USD), excluding VAT, fixed for the duration of the contract, including the maintenance years.",
          "M",
        ],
        [
          "6.2",
          "Payment schedule: 15 % advance against an advance-payment guarantee, 45 % on delivery of the equipment to site, 40 % on acceptance. Maintenance is invoiced yearly.",
          "I",
        ],
        [
          "6.3",
          "Performance security of 10 % of the contract price, valid until 28 days after the end of the warranty.",
          "M",
        ],
        [
          "6.4",
          "Bid validity of 120 days. Bid security of USD 40,000, issued or confirmed by a bank licensed in the State.",
          "M",
        ],
      ],
    },
    {
      title: "Evaluation",
      clauses: [
        [
          "7.1",
          "Bids are first checked against the mandatory requirements. Compliant bids are scored 70 % technical (solution 30, measured performance 20, implementation plan 20, maintenance and support 15, references 15) and 30 % commercial.",
        ],
        [
          "7.2",
          "Evaluated price = supply and installation + 3 years of maintenance after the warranty.",
        ],
        [
          "7.3",
          "Bidders shall complete the compliance matrix in Annex 1 and give the section of their technical proposal where each requirement is answered.",
        ],
      ],
    },
  ],
  matrix: [
    ["3.1", "OCR accuracy: containers ≥ 98 %, plates (Arabic and Latin) ≥ 97 %, up to 15 km/h"],
    ["3.2", "Damage images, 4 sides and roof, ≥ 5 MP, 90 days online"],
    ["3.3", "UHF RFID ISO/IEC 18000-63, 3,000 tags"],
    ["3.4", "Average in-gate transaction ≤ 60 s"],
    ["3.5", "Kiosk: Arabic and English, intercom, gate pass"],
    ["3.6", "GOS: lane control, exceptions, dashboards"],
    ["3.7", "Integration: TOS, PCS Vehicle Booking System, customs release"],
    ["3.8", "On-premise in T2 server room and main data centre; POTS-2026"],
    ["3.9", "Availability ≥ 99.5 %; manual mode"],
    ["3.10", "IP66, 0 °C to +55 °C"],
    ["4.1", "All 6 lanes in operation within 8 months"],
    ["4.2", "SAT and 30-day performance test"],
    ["4.3", "Training: 20 operators, 6 technicians"],
    ["5.1", "Warranty 24 months"],
    ["5.2", "3 years of maintenance after warranty"],
    ["5.3", "On-site within 4 h, 24/7; spare parts in the State"],
  ],
};

export const GATES_BIDS: PocBid[] = [
  {
    slug: "Sahel-Gate-Technologies",
    name: "Sahel Gate Technologies",
    legalName: "Sahel Gate Technologies L.L.C.",
    country: "Northern Gulf State",
    address: "Unit 14, Al-Noor Logistics Park, Port Road, Al-Noor",
    contact: { name: "Faisal Al-Hinai", email: "tenders@sahelgate.example" },
    signatory: { name: "Mariam Al-Kuwari", title: "General Manager" },
    date: "19 October 2026",
    ref: "SGT-T2G-2026-11",
    technical: [
      {
        title: "Company and references",
        html:
          p(
            "Sahel Gate Technologies is a systems integrator founded in 2009 in Al-Noor, with 85 staff. We specialise in terminal gates, access control and CCTV for ports and free zones. We are the certified partner in the State for the ClearLane OCR product line, and we run a service centre and spare-parts store in the Al-Noor Logistics Park, 6 km from Terminal 2.",
          ) +
          tbl(
            ["Reference", "Scope", "Year"],
            [
              [
                "Port of Ras Hadd, Container Terminal",
                "8 lanes: OCR, RFID, Gate Operating System, TOS integration",
                "2022",
              ],
              [
                "Free Zone Logistics Gate",
                "4 lanes with kiosks, Vehicle Booking System integration",
                "2024",
              ],
              ["Al-Waha Inland Container Depot", "3 lanes: OCR and damage imaging", "2025"],
            ],
          ),
      },
      {
        title: "Lane equipment",
        html:
          p(
            "Each lane gets a ClearLane OCR portal: a galvanised steel gantry with 2 plate cameras (front and rear), 4 container-number cameras and 5 damage-inspection cameras of 12 megapixels covering the four sides and the roof, with infrared illumination for night operation. Cameras are rated IP67 and the lane cabinets IP66, for operation from 0 °C to +55 °C, with marine-grade coating for the coastal atmosphere.",
          ) +
          p(
            "<b>Measured OCR performance.</b> Over 12 months at the Port of Ras Hadd (1.9 million transactions), container numbers were read correctly in 99.1 % of transactions, with ISO 6346 check-digit validation, and truck plates with Arabic and Latin characters in 98.2 %. Readings are valid at speeds up to 20 km/h, by day and night.",
          ) +
          p(
            "<b>Damage images.</b> Images are stored on the gate storage array and kept online for 60 days. Older images are moved to the Authority's backup system and can be restored on request.",
          ) +
          p(
            "<b>RFID.</b> Two UHF readers per lane (ISO/IEC 18000-63) and 3,000 tamper-evident windscreen tags that break when removed.",
          ) +
          p(
            "<b>Kiosks.</b> Stainless-steel kiosk rated IP66, with a 15-inch sunlight-readable touchscreen, Arabic and English interface, an intercom to the gate control room and a thermal printer for the gate pass with the assigned yard position.",
          ) +
          p(
            "<b>Transaction time.</b> At Ras Hadd, the average in-gate time of a pre-booked truck without exceptions is 38 seconds from arrival at the portal to the barrier opening.",
          ),
      },
      {
        title: "Gate Operating System and integrations",
        html:
          p(
            "The ClearLane Gate Operating System controls the lanes, barriers, traffic lights and kiosks. Exceptions (no appointment, unreadable number, damage, no customs release) go to the exception workstation, which shows all images and readings of the transaction. Dashboards show transactions per hour, average transaction time per lane and exceptions by type.",
          ) +
          p(
            "The GOS checks every visit against the appointment in the PCS Vehicle Booking System (REST API) and against the customs release status received through the PCS. The TOS integration uses REST web services and UN/EDIFACT CODECO. The barrier opens only when the appointment, the TOS work order and, for exits, the customs release are valid.",
          ),
      },
      {
        title: "Architecture and security",
        html:
          p(
            "Two GOS application servers in a cluster and a storage array in the Terminal 2 server room, and a standby server in the Authority's main data centre with database replication. Two UPS units with 60 minutes of autonomy and redundant network switches per lane group. We commit to 99.7 % availability per calendar month. If the GOS is unavailable, the kiosks switch to manual mode and the control room opens the barriers, with the OCR readings still displayed.",
          ) +
          ul([
            "All equipment sits on a dedicated OT network segment behind the Authority's firewalls, with no internet access. All data stays in the Authority's server rooms; no cloud service is used.",
            "Users sign in with their Active Directory accounts; administrator accounts use multi-factor authentication.",
            "Audit logs of all user and system events are kept for 3 years and forwarded in real time to the Authority's SIEM in syslog format.",
            "Interfaces use REST/JSON and UN/EDIFACT. The API documentation and the GOS database schema are delivered to the Authority.",
          ]),
      },
      {
        title: "Implementation, training and maintenance",
        html:
          tbl(
            ["Milestone", "Month"],
            [
              ["Design approval", "1"],
              ["Civil works and portal foundations", "2–3"],
              ["Lanes 1 and 2 in operation", "4"],
              ["Lanes 3 and 4 in operation", "5"],
              ["Lanes 5 and 6 in operation, Site Acceptance Test", "6"],
              ["30-day performance test and acceptance", "7"],
            ],
          ) +
          p("At least 4 lanes stay open throughout the works.") +
          p(
            "<b>Training.</b> 20 gate clerks and control-room operators (3 courses) and 6 maintenance technicians (2 weeks, including on-the-job training). Courses are given in Arabic and English. The operator manual is provided in Arabic and English; the maintenance and technical manuals are in English.",
          ) +
          p(
            "<b>Warranty and maintenance.</b> 24-month warranty from acceptance, parts and labour. Three years of maintenance after the warranty: quarterly preventive maintenance, software updates, a 24/7 hotline, and on-site response within 4 hours from our Al-Noor service centre, which holds a stock of critical spare parts (cameras, readers, barrier controllers, kiosk printers).",
          ),
      },
    ],
    matrix: {
      "3.1": ["Comply", "99.1 % containers, 98.2 % plates, up to 20 km/h (§2)"],
      "3.2": ["Comply", "5 cameras of 12 MP; online storage and archive (§2)"],
      "3.3": ["Comply", "2 readers per lane, 3,000 tags (§2)"],
      "3.4": ["Comply", "38 s average at Ras Hadd (§2)"],
      "3.5": ["Comply", "§2"],
      "3.6": ["Comply", "§3"],
      "3.7": ["Comply", "TOS, VBS and customs release (§3)"],
      "3.8": ["Comply", "T2 server room + main data centre (§4)"],
      "3.9": ["Comply", "99.7 %, manual mode (§4)"],
      "3.10": ["Comply", "IP66/IP67, 0 to +55 °C (§2)"],
      "4.1": ["Comply", "Month 7 (§5)"],
      "4.2": ["Comply", "§5"],
      "4.3": ["Comply", "§5"],
      "5.1": ["Comply", "24 months (§5)"],
      "5.2": ["Comply", "§5"],
      "5.3": ["Comply", "Al-Noor service centre (§5)"],
    },
    commercial: {
      lines: [
        ["ClearLane OCR portal with plate, container and damage cameras (per lane)", 6, 185_000],
        ["UHF RFID readers", 12, 6_500],
        ["Tamper-evident windscreen RFID tags", 3_000, 9],
        ["Self-service kiosk with intercom and printer", 6, 28_000],
        ["ClearLane Gate Operating System licence (perpetual, site)", 1, 420_000],
        ["Servers, storage, network and UPS (T2 server room and standby)", 1, 265_000],
        ["Integration with TOS, PCS Vehicle Booking System and customs release", 1, 240_000],
        ["Civil works, installation, cabling and commissioning", 1, 390_000],
        ["Training and documentation", 1, 45_000],
      ],
      recurring: {
        label: "Maintenance after warranty",
        amounts: [210_000, 216_300, 222_789],
      },
      notes: [
        "The warranty (24 months from acceptance) is included in the supply prices.",
        "Maintenance prices for years 2 and 3 include an escalation of 3 % per year.",
        "Supply and installation prices are fixed for the duration of the contract.",
      ],
      terms: [
        [
          "Payment",
          "15 % advance against an advance-payment guarantee; 45 % on delivery of the equipment to site; 40 % on acceptance. Maintenance invoiced yearly in advance.",
        ],
        ["Bid validity", "120 days from the bid closing date."],
        ["Bid security", "Bank guarantee of USD 40,000 issued by Al-Noor National Bank."],
        [
          "Performance security",
          "10 % of the contract price, issued by Al-Noor National Bank, valid until 28 days after the end of the warranty.",
        ],
      ],
    },
  },
  {
    slug: "Vector-OCR-Systems",
    name: "Vector OCR Systems",
    legalName: "Vector OCR Systems B.V.",
    country: "Netherlands",
    address:
      "Waalhaven Zuidzijde 21, Rotterdam, Netherlands · Local agent: Gulf Harbour Trading, Al-Noor",
    contact: { name: "Joost van Dijk", email: "bids@vectorocr.example" },
    signatory: { name: "Sanne Verhoeven", title: "Sales Director, Middle East" },
    date: "20 October 2026",
    ref: "VOS-2026-NGPA-031",
    technical: [
      {
        title: "Company and references",
        html:
          p(
            "Vector OCR Systems develops AI-based OCR for terminal gates and cranes. VectorVision is installed at 14 container terminals in Europe and Asia and processes more than 30 million gate transactions a year. In the Gulf, our products are delivered and serviced through our local agent, Gulf Harbour Trading (Al-Noor).",
          ) +
          tbl(
            ["Reference", "Scope", "Year"],
            [
              ["Delta Container Terminal, Rotterdam", "22 lanes: OCR and damage detection", "2021"],
              ["Baltic Gateway Terminal, Gdansk", "10 lanes with kiosks", "2023"],
              ["Eastern Seaboard Terminal C", "12 lanes: OCR and RFID", "2024"],
            ],
          ),
      },
      {
        title: "Lane equipment",
        html:
          p(
            "Each lane gets a VectorVision portal with 6 cameras (2 plate cameras, 4 cameras for container numbers and damage), infrared LED lighting and an edge computer in the lane cabinet.",
          ) +
          p(
            "<b>Recognition.</b> Container recognition runs on the edge computer. Licence-plate recognition uses the VectorVision Cloud service, where our deep-learning plate models are retrained continuously on the latest plate formats. Only the cropped plate image is sent, and the result returns within 1 second.",
          ) +
          p(
            "<b>Accuracy.</b> Container numbers 98.6 % (check-digit validated). Latin plates 97.5 %; Arabic plates 94 %, and the Arabic plate model will be extended with data from this project. Readings are valid at speeds up to 10 km/h.",
          ) +
          p(
            "<b>Damage images.</b> 4 cameras of 5 megapixels cover the sides and the rear of the container; a roof camera is offered as an option. Images are kept for 90 days on the on-premise storage.",
          ) +
          p("<b>RFID.</b> One UHF reader per lane (ISO/IEC 18000-63) and 3,000 windscreen tags.") +
          p(
            "<b>Kiosks.</b> Kiosk VK-200 rated IP65, operating range 0 °C to +50 °C, with a 19-inch touchscreen, English interface with an Arabic language pack, an intercom and a gate-pass printer.",
          ) +
          p(
            "<b>Transaction time.</b> The average in-gate transaction takes 70 seconds, including the driver's interaction at the kiosk (signature and gate-pass printing).",
          ),
      },
      {
        title: "Gate Operating System and integrations",
        html:
          p(
            "VectorGate GOS provides lane control, an exception workstation and KPI dashboards (transactions per hour, transaction times, exceptions).",
          ) +
          p(
            "The TOS is integrated through UN/EDIFACT CODECO and COARRI messages, and the Vehicle Booking System through the PCS REST API. A customs release check can be added after go-live as a change request, once the PCS customs interface is specified.",
          ),
      },
      {
        title: "Architecture and security",
        html:
          p(
            "Two virtualised GOS servers in the Terminal 2 server room. The lane edge computers use an outbound HTTPS connection to VectorVision Cloud (EU region, Frankfurt) for plate recognition and for licence and model updates.",
          ) +
          p(
            "Availability 99.5 % per calendar month. Each lane cabinet has a UPS with 15 minutes of autonomy. In manual mode, clerks enter the data at the exception workstation.",
          ) +
          ul([
            "Active Directory integration through LDAP; administrators use multi-factor authentication with the Vector Authenticator app.",
            "Interfaces are documented (REST/JSON and UN/EDIFACT).",
          ]),
      },
      {
        title: "Implementation, training and support",
        html:
          tbl(
            ["Milestone", "Month"],
            [
              ["Factory acceptance test in Rotterdam", "3"],
              ["Lanes 1 to 4 in operation", "6"],
              ["Lanes 5 and 6 in operation, Site Acceptance Test", "9"],
              ["Performance test and acceptance", "10"],
            ],
          ) +
          p(
            "<b>Training.</b> Access to our online training academy (English) and 3 days of on-site training for operators and technicians.",
          ) +
          p(
            "<b>Warranty.</b> 12 months from acceptance. An extended warranty for a second year is offered as an option in our commercial proposal.",
          ) +
          p(
            "<b>Support.</b> Remote support from our Rotterdam service desk, Monday to Friday, 08:00–18:00 CET. On-site intervention by Gulf Harbour Trading engineers on the next business day. Spare parts are shipped from Rotterdam within 3 working days.",
          ),
      },
    ],
    matrix: {
      "3.1": ["Comply", "98.6 % containers, 97.5 % Latin plates (§2)"],
      "3.2": ["Comply", "4 cameras of 5 MP, roof camera optional (§2)"],
      "3.3": ["Comply", "§2"],
      "3.4": ["Comply", "70 s including kiosk interaction (§2)"],
      "3.5": ["Comply", "Arabic language pack (§2)"],
      "3.6": ["Comply", "§3"],
      "3.7": ["Partially comply", "Customs release as change request (§3)"],
      "3.8": ["Comply", "GOS servers in T2 server room (§4)"],
      "3.9": ["Comply", "99.5 % (§4)"],
      "3.10": ["Comply", "§2"],
      "4.1": ["Partially comply", "Lanes 1–4 month 6, lanes 5–6 month 9 (§5)"],
      "4.2": ["Comply", "§5"],
      "4.3": ["Comply", "Online academy and on-site training (§5)"],
      "5.1": ["Comply (option)", "12 months + optional second year (§5)"],
      "5.2": ["Comply", "See commercial proposal"],
      "5.3": ["Partially comply", "Next business day through local agent (§5)"],
    },
    commercial: {
      lines: [
        ["VectorVision OCR portal with edge computer (per lane)", 6, 142_000],
        ["UHF RFID readers", 6, 5_800],
        ["Windscreen RFID tags", 3_000, 7],
        ["Kiosk VK-200", 6, 19_500],
        ["VectorGate GOS licence", 1, 310_000],
        ["Servers and network equipment", 1, 140_000],
        ["Integration with TOS and PCS Vehicle Booking System", 1, 120_000],
        ["Installation and commissioning (civil works by our local agent)", 1, 285_000],
        ["Training", 1, 30_000],
      ],
      recurring: { label: "Maintenance", amounts: [165_000, 165_000, 165_000] },
      notes: [
        "VectorVision Cloud plate-recognition subscription: USD 46,000 per year from go-live, invoiced separately.",
        "Option: roof damage cameras, 6 × USD 9,500 = USD 57,000.",
        "Option: extended warranty for a second year, USD 95,000.",
        "Customs release integration: change request after go-live, priced once the interface is specified.",
        "Maintenance prices are fixed for 3 years.",
      ],
      terms: [
        [
          "Payment",
          "30 % advance on contract signature; 50 % on shipment from Rotterdam; 20 % on acceptance.",
        ],
        ["Bid validity", "90 days from the bid closing date."],
        ["Bid security", "Bank guarantee of USD 40,000 issued by Maasstad Bank N.V., Rotterdam."],
        ["Performance security", "10 % of the contract price."],
      ],
    },
  },
];
