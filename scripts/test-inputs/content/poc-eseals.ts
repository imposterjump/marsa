/**
 * POC set 2 (meeting): Electronic Seal Tracking System for transit cargo, issued by the General
 * Customs Directorate. Standard CTS-2026 (pasted as rules), RFP GCD/T/2026/047, and two bids.
 * The RFP and the standard agree wherever they cover the same topic.
 */
import type { PocBid, PocStandard, PocTender } from "./poc-render";
import { p, tbl, ul } from "./poc-render";

export const ESEALS_STANDARD: PocStandard = {
  code: "CTS-2026",
  title: "Customs Transit Security Standard",
  category: "IT & security",
  description:
    "Security, data and service requirements for the electronic tracking of goods under customs transit, including e-seals, tracking platforms and their suppliers. Issued by the General Customs Directorate, Risk & Transit Control Department (v2.0, April 2026).",
  rules: [
    [
      "TR-01",
      "Tracking data, alerts and audit records shall be stored and processed only within the State, on infrastructure controlled by the Directorate; foreign or public cloud hosting is not permitted.",
      "mandatory",
    ],
    [
      "TR-02",
      "Electronic seals shall be certified to ISO 17712 as high-security (H) seals by an accredited laboratory, and the certificate shall be submitted with the bid.",
      "mandatory",
    ],
    [
      "TR-03",
      "Tampering with, opening or cutting a seal shall be detected and alerted to the monitoring centre within 60 seconds.",
      "mandatory",
    ],
    [
      "TR-04",
      "Seals shall report their position at least every 5 minutes while moving; every position and event shall carry a time stamp that cannot be altered.",
      "important",
    ],
    [
      "TR-05",
      "Seals shall keep events in memory when out of mobile coverage and send them automatically when coverage returns.",
      "mandatory",
    ],
    [
      "TR-06",
      "The link between seals and the platform shall be encrypted with AES-128 or stronger; users and integrations shall connect over TLS 1.2 or higher.",
      "mandatory",
    ],
    [
      "TR-07",
      "Officers and operators shall sign in through the Directorate's Active Directory with multi-factor authentication.",
      "important",
    ],
    [
      "TR-08",
      "Every arming, disarming and alert acknowledgement shall be recorded with the officer's identity, place and time, and kept for 5 years.",
      "important",
    ],
    [
      "TR-09",
      "Seals shall operate from −10 °C to +60 °C and be rated IP67 or better.",
      "important",
    ],
    [
      "TR-10",
      "User interfaces and training shall be available in Arabic and English.",
      "desirable",
    ],
    [
      "TR-11",
      "Mobile data for the seals shall be included in the supplier's price for the whole service period.",
      "important",
    ],
    [
      "TR-12",
      "Bid and performance securities shall be issued by a bank licensed in the State; the performance security shall be at least 10 % of the contract price.",
      "mandatory",
    ],
  ],
};

export const ESEALS_TENDER: PocTender = {
  ref: "GCD/T/2026/047",
  title: "Electronic Seal (e-Seal) Tracking System for Transit Cargo",
  place: "Port of Al-Noor, inland customs depots and land border posts",
  issuer: "General Customs Directorate",
  programme: "Transit Control Department",
  issued: "8 October 2026",
  closing: "15 December 2026, 12:00 local time",
  contact: "Procurement Office · procurement@gcd.example",
  sections: [
    {
      title: "Background",
      clauses: [
        [
          "1.1",
          "About 420 transit movements leave the Port of Al-Noor every day for the 3 inland customs depots and the 2 land border posts. Goods in transit travel under customs control with mechanical seals, and high-risk loads are escorted by customs patrols.",
        ],
        [
          "1.2",
          "The General Customs Directorate (the Directorate) seeks an electronic seal (e-seal) tracking system that follows every transit movement in real time from departure to arrival, so that escorts are only needed in exceptional cases.",
        ],
      ],
    },
    {
      title: "Scope",
      clauses: [
        [
          "2.1",
          "Supply of 1,500 reusable GPS/GSM electronic seals, and charging stations for the 6 customs sites (the port, 3 inland depots and 2 border posts).",
        ],
        [
          "2.2",
          "A monitoring platform for the Directorate's Transit Monitoring Centre, with a mobile app for customs officers.",
        ],
        ["2.3", "Integration with the Directorate's Customs Declaration System (CDS)."],
        [
          "2.4",
          "A pilot, the full rollout, training, and 3 years of service including device maintenance and mobile data.",
        ],
      ],
    },
    {
      title: "e-Seal requirements",
      clauses: [
        [
          "3.1",
          "Seals shall be reusable, certified to ISO 17712 as high-security (H) seals, and rated IP67.",
          "M",
        ],
        [
          "3.2",
          "Battery life of at least 30 days in normal operation (one position report every 5 minutes while moving), and a full recharge in less than 4 hours.",
          "M",
        ],
        [
          "3.3",
          "GNSS positioning and 4G mobile communication with 2G fallback. Seals shall store at least 10,000 events when out of coverage and send them automatically when coverage returns.",
          "M",
        ],
        [
          "3.4",
          "Any opening, cut or tampering attempt shall raise an alert at the Transit Monitoring Centre within 60 seconds.",
          "M",
        ],
        [
          "3.5",
          "Seals shall be armed and disarmed only by authorised customs officers using the officer mobile app; drivers and carriers shall not be able to arm or disarm a seal.",
          "M",
        ],
        ["3.6", "Operating temperature from −10 °C to +60 °C.", "I"],
      ],
    },
    {
      title: "Monitoring platform",
      clauses: [
        [
          "4.1",
          "A web application for the Transit Monitoring Centre with a live map, the 12 approved transit corridors as geofences, and alerts for route deviation, stops longer than 30 minutes, tampering, low battery and loss of signal.",
          "M",
        ],
        [
          "4.2",
          "Integration with the CDS through REST APIs: a trip is opened from the transit declaration when the seal is armed, and closed when the seal is disarmed at the office of destination.",
          "M",
        ],
        [
          "4.3",
          "A mobile app for customs officers (Android), in Arabic and English, to arm and disarm seals, view trips and record inspections.",
          "I",
        ],
        [
          "4.4",
          "Reports of transit times and alerts per corridor, seal utilisation and officer actions, exportable to Excel and PDF.",
          "I",
        ],
        [
          "4.5",
          "The platform and all tracking data shall be hosted in the Directorate's data centre in the State, on virtual servers provided by the Directorate. The system shall comply with the Customs Transit Security Standard (CTS-2026).",
          "M",
        ],
        [
          "4.6",
          "Availability of the monitoring platform of at least 99.7 % per calendar month.",
          "I",
        ],
      ],
    },
    {
      title: "Implementation and services",
      clauses: [
        [
          "5.1",
          "A pilot with 200 seals on 2 corridors within 3 months of contract signature, and the full rollout of all 1,500 seals on the 12 corridors within 6 months.",
          "M",
        ],
        [
          "5.2",
          "Training of 60 customs officers and 12 monitoring-centre operators, in Arabic and English.",
          "I",
        ],
        [
          "5.3",
          "3 years of service from the full rollout: 24/7 support with a 2-hour response to platform outages, replacement of faulty seals within 5 working days, and a pool of spare seals of at least 5 % of the fleet.",
          "M",
        ],
        [
          "5.4",
          "Mobile data for all seals for the 3 years of service is part of the supplier's price.",
          "M",
        ],
      ],
    },
    {
      title: "Commercial conditions",
      clauses: [
        [
          "6.1",
          "Prices in USD, excluding VAT, fixed for the contract duration, with unit prices for seals and charging stations and a yearly service fee.",
          "M",
        ],
        [
          "6.2",
          "Payment: 25 % on acceptance of the pilot and 75 % on acceptance of the full rollout. The service fee is invoiced quarterly in arrears.",
          "I",
        ],
        [
          "6.3",
          "Performance security of 10 % of the contract price, issued by a bank licensed in the State.",
          "M",
        ],
        [
          "6.4",
          "Bid validity of 90 days. Bid security of USD 30,000, issued by a bank licensed in the State.",
          "M",
        ],
      ],
    },
    {
      title: "Evaluation",
      clauses: [
        [
          "7.1",
          "Mandatory requirements are pass/fail. Compliant bids are scored 70 % technical (device performance 30, platform and integration 25, implementation plan 20, service 15, references 10) and 30 % financial.",
        ],
        ["7.2", "Evaluated price = supply and installation + 3 years of service."],
        ["7.3", "Bidders shall complete the compliance matrix in Annex 1."],
      ],
    },
  ],
  matrix: [
    ["3.1", "Reusable, ISO 17712 H, IP67"],
    ["3.2", "Battery ≥ 30 days at 5-minute reporting; recharge < 4 h"],
    ["3.3", "GNSS, 4G with 2G fallback; ≥ 10,000 events offline"],
    ["3.4", "Tamper alert within 60 s"],
    ["3.5", "Arm/disarm by officers only"],
    ["3.6", "−10 °C to +60 °C"],
    ["4.1", "Live map, 12 corridors, alerts"],
    ["4.2", "CDS integration (REST)"],
    ["4.3", "Officer app (Android), Arabic and English"],
    ["4.4", "Reports, Excel and PDF export"],
    ["4.5", "Hosted in the Directorate's data centre; CTS-2026"],
    ["4.6", "Availability ≥ 99.7 %"],
    ["5.1", "Pilot ≤ 3 months; full rollout ≤ 6 months"],
    ["5.2", "Training: 60 officers, 12 operators"],
    ["5.3", "3-year service: 2 h response, 5-day replacement, 5 % spare pool"],
    ["5.4", "Mobile data included for 3 years"],
  ],
};

export const ESEALS_BIDS: PocBid[] = [
  {
    slug: "Trakom-Security-Solutions",
    name: "Trakom Security Solutions",
    legalName: "Trakom Security Solutions W.L.L.",
    country: "Northern Gulf State",
    address: "Building 47, Customs Road, Al-Noor Logistics Park, Al-Noor",
    contact: { name: "Rashid Al-Balushi", email: "bids@trakom.example" },
    signatory: { name: "Nadia Haddad", title: "Chief Executive Officer" },
    date: "20 October 2026",
    ref: "TSS/GCD/047/26",
    technical: [
      {
        title: "Company and references",
        html:
          p(
            "Trakom Security Solutions designs and operates electronic cargo-tracking systems for customs administrations. Founded in 2012, we have 120 staff, and our TrakSeal e-seals and TrakView platform monitor more than 1.1 million transit trips a year in 4 countries.",
          ) +
          tbl(
            ["Reference", "Scope", "Year"],
            [
              [
                "Eastern Province Customs, Al-Waha transit corridors",
                "2,000 e-seals, 9 corridors, monitoring centre, declaration-system integration",
                "2021",
              ],
              ["Free Zone Authority, bonded transport", "600 e-seals, 4 corridors", "2023"],
              ["Ras Hadd Port Customs", "900 e-seals, 2 border posts, CDS integration", "2025"],
            ],
          ),
      },
      {
        title: "The TrakSeal G4 e-seal",
        html:
          p(
            "TrakSeal G4 is a reusable cable seal with a 5 mm steel cable and a locking body of glass-fibre reinforced polymer. It is certified to ISO 17712:2013 as a high-security (H) seal by an accredited laboratory (certificate ISO17712-H-23-0418, attached as Appendix B). It is rated IP67 and operates from −20 °C to +70 °C.",
          ) +
          ul([
            "<b>Battery:</b> 45 days with one position report every 5 minutes while moving and every 60 minutes when stationary. Full recharge in 2.5 hours.",
            "<b>Positioning and communication:</b> GPS, GLONASS and Galileo; 4G LTE with automatic 2G fallback. Up to 25,000 events are stored when out of coverage and sent automatically on reconnection.",
            "<b>Tamper detection:</b> cable cut, cable removal and opening of the housing. Alerts are sent immediately; in our installations the median time to the monitoring screen is 12 seconds, and 99.9 % of alerts arrive within 45 seconds.",
            "<b>Arming and disarming:</b> only an officer signed in to the TrakView Officer app can arm or disarm a seal, by NFC contact with the seal. Each action is linked to the transit declaration number. Drivers have no means to arm or disarm a seal.",
            "<b>Security:</b> AES-256 encryption between seal and platform; every position and event is signed on the seal with its GNSS time stamp.",
            "<b>Charging:</b> 6 charging racks with 50 slots each, one per customs site.",
          ]),
      },
      {
        title: "The TrakView monitoring platform",
        html:
          p(
            "TrakView is installed on the Directorate's virtual servers in its data centre (production) and in its disaster-recovery site; it needs 8 virtual machines (sizing in Appendix C). No data leaves the Directorate's infrastructure. Licences are perpetual and activated offline.",
          ) +
          ul([
            "Live map with the 12 corridors as geofences. Alerts for route deviation, stops longer than 30 minutes (configurable), tampering, low battery, loss of signal, and a seal opened away from its destination, with an acknowledgement workflow.",
            "CDS integration through REST APIs: the trip opens automatically from the transit declaration when the officer arms the seal, and closes when it is disarmed at the office of destination. Discrepancies are reported back to the CDS. We have built this integration with two declaration systems in our references.",
            "Officer app for Android, in Arabic and English.",
            "Reports of transit times and alerts per corridor, seal utilisation and officer actions, exported to Excel and PDF.",
            "Officers and operators sign in with their Active Directory accounts and the Directorate's multi-factor authentication. Users and integrations connect over TLS 1.3.",
            "All arming, disarming and acknowledgement records are kept for 5 years.",
          ]) +
          p(
            "TrakView runs active–standby across the two sites. We commit to 99.5 % availability per calendar month.",
          ),
      },
      {
        title: "Implementation, training and service",
        html:
          tbl(
            ["Milestone", "Month"],
            [
              ["Platform installed, CDS integration tested", "2"],
              ["Pilot: 200 seals on 2 corridors, pilot acceptance", "3"],
              ["Rollout to the 12 corridors", "4–5"],
              ["Full-rollout acceptance", "6"],
            ],
          ) +
          p(
            "<b>Training.</b> 60 officers (5 sessions of 12) and 12 monitoring-centre operators, in Arabic and English, with manuals in both languages.",
          ) +
          p(
            "<b>Service for 3 years.</b> 24/7 service desk in Al-Noor with a 1-hour response to platform outages. Faulty seals are replaced within 3 working days from our local stock, and a pool of 45 spare seals is kept at the Directorate's sites. SIM cards from a national operator, with data plans for all 1,500 seals for the 3 years, are included.",
          ),
      },
    ],
    matrix: {
      "3.1": ["Comply", "ISO 17712:2013 H certificate, IP67 (§2)"],
      "3.2": ["Comply", "45 days; recharge 2.5 h (§2)"],
      "3.3": ["Comply", "25,000 events (§2)"],
      "3.4": ["Comply", "Median 12 s, 99.9 % within 45 s (§2)"],
      "3.5": ["Comply", "Officer app with NFC (§2)"],
      "3.6": ["Comply", "−20 °C to +70 °C (§2)"],
      "4.1": ["Comply", "§3"],
      "4.2": ["Comply", "§3"],
      "4.3": ["Comply", "§3"],
      "4.4": ["Comply", "§3"],
      "4.5": ["Comply", "Directorate data centre and DR site (§3)"],
      "4.6": ["Partially comply", "99.5 % (§3)"],
      "5.1": ["Comply", "Pilot month 3, rollout month 6 (§4)"],
      "5.2": ["Comply", "§4"],
      "5.3": ["Comply", "1 h response, 3-day replacement, 45 spare seals (§4)"],
      "5.4": ["Comply", "National operator SIMs included (§4)"],
    },
    commercial: {
      lines: [
        ["TrakSeal G4 reusable e-seal", 1_500, 690],
        ["Charging rack, 50 slots", 6, 7_500],
        ["TrakView platform licence (perpetual) and officer app", 1, 310_000],
        ["Integration with the Customs Declaration System", 1, 120_000],
        ["Pilot and rollout services (12 corridors)", 1, 165_000],
        ["Training and manuals (Arabic and English)", 1, 38_000],
      ],
      recurring: { label: "Service fee", amounts: [228_000, 228_000, 228_000] },
      notes: [
        "The yearly service fee covers 24/7 support, platform maintenance, seal repair and replacement, and mobile data for 1,500 seals.",
        "All prices are fixed for the contract duration.",
      ],
      terms: [
        [
          "Payment",
          "25 % on pilot acceptance; 75 % on full-rollout acceptance. Service fee invoiced quarterly in arrears.",
        ],
        ["Bid validity", "90 days from the bid closing date."],
        ["Bid security", "Bank guarantee of USD 30,000 issued by Al-Noor National Bank."],
        ["Performance security", "10 % of the contract price, issued by Al-Noor National Bank."],
      ],
    },
  },
  {
    slug: "Orbis-Track",
    name: "Orbis Track",
    legalName: "Orbis Track GmbH",
    country: "Germany",
    address: "Hafenstrasse 88, 20359 Hamburg, Germany",
    contact: { name: "Lena Brandt", email: "tenders@orbistrack.example" },
    signatory: { name: "Markus Feld", title: "Managing Director" },
    date: "20 October 2026",
    ref: "OT-GCD-2026-047",
    technical: [
      {
        title: "Company and references",
        html:
          p(
            "Orbis Track provides cloud-based cargo tracking for logistics companies, insurers and customs administrations. Our Orbis eSeal One devices and the Orbis Cloud platform track more than 40,000 shipments a month in Europe and Africa.",
          ) +
          tbl(
            ["Reference", "Scope", "Year"],
            [
              ["Northern European cargo insurers' pool", "3,500 devices, cloud tracking", "2022"],
              ["West Coast customs transit corridor", "800 e-seals, Orbis Cloud", "2024"],
              ["Baltic rail freight operator", "1,200 devices", "2025"],
            ],
          ),
      },
      {
        title: "The Orbis eSeal One",
        html:
          p(
            "Orbis eSeal One is a reusable bolt-and-cable seal certified to ISO 17712 as a high-security (H) seal (certificate attached). It is rated IP67 and operates from −20 °C to +65 °C.",
          ) +
          ul([
            "<b>Battery:</b> 21 days with one position report every 5 minutes, and up to 60 days with one report every 15 minutes. Full recharge in 3 hours.",
            "<b>Positioning and communication:</b> GPS and Galileo; 4G LTE-M / NB-IoT with 2G fallback. 5,000 events are stored when out of coverage and sent on reconnection.",
            "<b>Tamper detection:</b> opening and cable cut. Alerts reach the platform typically within 2 minutes, depending on network conditions.",
            "<b>Arming and disarming:</b> seals are armed with the officer app. At destination, a seal can be disarmed with the officer app, or by the driver with a one-time code sent by SMS from the monitoring centre, which saves officer time at remote destinations.",
            "<b>Security:</b> AES-128 encryption on the device link; TLS 1.2 or higher for users and integrations.",
            "<b>Charging:</b> 6 charging stations with 20 slots each.",
          ]),
      },
      {
        title: "The Orbis Cloud platform",
        html:
          p(
            "Orbis Cloud is a multi-tenant SaaS platform hosted in our data centres in Frankfurt (primary) and Amsterdam (backup), certified to ISO 27001. The Directorate receives a dedicated tenant, and its data is stored in the European Union under the GDPR. A read-only replica of the trip data can be installed on a server in the Directorate's data centre for reporting.",
          ) +
          ul([
            "Live map with corridors as geofences, and alerts for route deviation, stop time, tampering, battery level and loss of signal.",
            "CDS integration through REST and webhook APIs: trips open from the transit declaration and close when the seal is disarmed. The integration is delivered by our professional-services team.",
            "Officer app for Android and iOS in English, French and Portuguese; an Arabic interface is planned for Q3 2027.",
            "Standard dashboards with CSV export.",
            "Directorate users sign in with SAML single sign-on.",
            "Arming, disarming and alert records are kept for 24 months.",
            "Availability: 99.9 % per calendar month (SLA).",
          ]),
      },
      {
        title: "Implementation, training and service",
        html:
          tbl(
            ["Milestone", "Month"],
            [
              ["Tenant ready, corridors configured", "1"],
              ["Pilot: 200 seals on 2 corridors", "2"],
              ["Full rollout of 1,500 seals", "5"],
            ],
          ) +
          p(
            "<b>Training.</b> Our online academy (English) and a 3-day train-the-trainer course on site for the 12 monitoring-centre operators; customs officers are then trained by the Directorate's own trainers.",
          ) +
          p(
            "<b>Service.</b> 24/7 platform support from Hamburg, with a response within 4 hours to platform outages. Faulty seals are replaced within 10 working days from our Hamburg warehouse.",
          ) +
          p(
            "<b>Mobile data.</b> The seals use SIM cards provided by the Directorate, or Orbis global IoT SIMs charged at cost (see our commercial proposal).",
          ),
      },
    ],
    matrix: {
      "3.1": ["Comply", "ISO 17712 H, IP67 (§2)"],
      "3.2": ["Partially comply", "21 days at 5 min, 60 days at 15 min (§2)"],
      "3.3": ["Comply", "5,000 events (§2)"],
      "3.4": ["Comply", "Typically within 2 minutes (§2)"],
      "3.5": ["Comply", "Officer app; driver code at destination (§2)"],
      "3.6": ["Comply", "−20 °C to +65 °C (§2)"],
      "4.1": ["Comply", "§3"],
      "4.2": ["Comply", "§3"],
      "4.3": ["Partially comply", "Arabic planned Q3 2027 (§3)"],
      "4.4": ["Comply", "Dashboards, CSV (§3)"],
      "4.5": ["Partially comply", "EU cloud; local read-only replica (§3)"],
      "4.6": ["Comply", "99.9 % (§3)"],
      "5.1": ["Comply", "Pilot month 2, rollout month 5 (§4)"],
      "5.2": ["Comply", "Train-the-trainer (§4)"],
      "5.3": ["Comply", "24/7 support (§4)"],
      "5.4": ["Partially comply", "Directorate SIMs or Orbis IoT SIMs (§4)"],
    },
    commercial: {
      lines: [
        ["Orbis eSeal One reusable e-seal", 1_500, 420],
        ["Charging station, 20 slots", 6, 4_900],
        ["Tenant set-up, corridor configuration and CDS integration", 1, 95_000],
        ["Pilot and rollout services", 1, 70_000],
        ["Training (online academy and train-the-trainer)", 1, 18_000],
      ],
      recurring: { label: "Orbis Cloud subscription", amounts: [186_000, 186_000, 186_000] },
      notes: [
        "The subscription includes hosting, platform support and the device warranty.",
        "Mobile data is not included: Orbis global IoT SIMs are charged at USD 0.85 per MB, or the Directorate provides the SIM cards.",
        "Option: licence for the on-premise read-only replica server, USD 24,000 one-time.",
        "The subscription is indexed yearly to the German consumer price index, capped at 3 %.",
        "The Orbis Cloud Terms of Service apply to the subscription.",
      ],
      terms: [
        [
          "Payment",
          "40 % on contract signature; 60 % on full rollout. Subscription invoiced yearly in advance.",
        ],
        ["Bid validity", "90 days from the bid closing date."],
        ["Bid security", "Bank guarantee of USD 30,000 issued by Nordhafen Bank AG, Hamburg."],
        [
          "Performance security",
          "10 % of the contract price, issued by Nordhafen Bank AG, Hamburg.",
        ],
      ],
    },
  },
];
