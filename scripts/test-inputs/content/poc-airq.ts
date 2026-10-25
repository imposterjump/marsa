/**
 * POC set 3 (three vendors): Air Quality and Noise Monitoring Network for the Port of Al-Noor,
 * issued by the Northern Gulf Ports Authority. Standard PEMS-2026 (a rules file), RFP
 * NGPA/T/2026/052, and three bids that follow the 7-section proposal template. The category is
 * Safety & environment, so the standards step shows a different list from sets 1 and 2.
 * The RFP and the standard agree wherever they cover the same topic.
 */
import type { PocBid, PocStandard, PocTender } from "./poc-render";
import { p, tbl, ul } from "./poc-render";

export const AIRQ_STANDARD: PocStandard = {
  code: "PEMS-2026",
  title: "Port Environmental Monitoring Standard",
  category: "Safety & environment",
  description:
    "Requirements for continuous ambient air-quality and noise monitoring at the Authority's ports and their neighbouring districts, including analysers, stations, data platforms and their operation. Issued by the NGPA Health, Safety & Environment Directorate (v1.0, March 2026).",
  rules: [
    [
      "EM-01",
      "PM10 and PM2.5 analysers shall be certified as equivalent to the EN reference method (EN 16450) by an accredited body; the certificates shall be submitted with the bid.",
      "mandatory",
    ],
    [
      "EM-02",
      "Gas analysers shall use the EN reference principles: chemiluminescence for NO2 (EN 14211), UV fluorescence for SO2 (EN 14212) and UV photometry for O3 (EN 14625).",
      "mandatory",
    ],
    [
      "EM-03",
      "Each station shall achieve at least 90 % valid hourly data for every pollutant in every calendar quarter.",
      "important",
    ],
    [
      "EM-04",
      "Analysers shall be calibrated at least every 3 months with gases and transfer standards traceable to a laboratory accredited to ISO/IEC 17025; calibration records shall be kept for 5 years.",
      "mandatory",
    ],
    [
      "EM-05",
      "Monitoring data shall be stored and processed on servers in the State controlled by the Authority; raw and validated data shall be kept for at least 10 years.",
      "mandatory",
    ],
    [
      "EM-06",
      "An exceedance of a limit value shall raise an alarm to the HSE duty officer within 5 minutes of the end of the averaging period.",
      "important",
    ],
    [
      "EM-07",
      "Noise monitoring terminals shall be Class 1 sound level meters to IEC 61672-1 and shall be verified every year.",
      "mandatory",
    ],
    [
      "EM-08",
      "Station enclosures shall be air-conditioned, rated IP55 or better, and operate in ambient temperatures from 0 °C to +50 °C.",
      "important",
    ],
    [
      "EM-09",
      "Stations shall keep at least 7 days of data locally and send it automatically after a communication outage.",
      "important",
    ],
    [
      "EM-10",
      "Data for the public shall be published through an open, documented API and a public dashboard in Arabic and English.",
      "desirable",
    ],
    [
      "EM-11",
      "The supplier shall respond on site within 48 hours to a station failure and keep spare analysers in the State.",
      "important",
    ],
    [
      "EM-12",
      "A warranty of at least 24 months from acceptance shall cover all equipment and software.",
      "mandatory",
    ],
  ],
};

export const AIRQ_TENDER: PocTender = {
  ref: "NGPA/T/2026/052",
  title: "Air Quality and Noise Monitoring Network",
  place: "Port of Al-Noor and the neighbouring district of Al-Sahil",
  issuer: "Northern Gulf Ports Authority",
  programme: "Health, Safety & Environment Directorate",
  issued: "12 October 2026",
  closing: "10 December 2026, 12:00 local time",
  contact: "Tenders Office · tenders@ngpa.example",
  sections: [
    {
      title: "Background",
      clauses: [
        [
          "1.1",
          "The Port of Al-Noor borders the residential district of Al-Sahil. The port's environmental permit, renewed in 2026, requires continuous monitoring of air quality and noise at the port boundary and in Al-Sahil, with monthly and annual reports to the Environment Agency.",
        ],
        [
          "1.2",
          "The Northern Gulf Ports Authority (the Authority) seeks a monitoring network, its data platform and three years of operation and maintenance. Today the port relies on two portable samplers and quarterly noise surveys.",
        ],
      ],
    },
    {
      title: "Scope",
      clauses: [
        [
          "2.1",
          "Six fixed air-quality stations (sites AQ-1 to AQ-6: four at the port boundary, two in Al-Sahil) measuring PM10, PM2.5, NO2, SO2 and O3, each with meteorological sensors for wind speed and direction, temperature and humidity.",
          "M",
        ],
        ["2.2", "Four permanent noise monitoring terminals (sites N-1 to N-4).", "M"],
        [
          "2.3",
          "A data platform for data collection, validation, alarms, reports and a public dashboard.",
          "M",
        ],
        [
          "2.4",
          "Three years of operation and maintenance after acceptance, including calibration, consumables, repairs and data validation.",
          "M",
        ],
      ],
    },
    {
      title: "Station requirements",
      clauses: [
        [
          "3.1",
          "PM10 and PM2.5 analysers shall be certified as equivalent to the EN reference method (EN 16450) by an accredited body. Certificates shall be attached to the bid.",
          "M",
        ],
        [
          "3.2",
          "NO2 shall be measured by chemiluminescence (EN 14211), SO2 by UV fluorescence (EN 14212) and O3 by UV photometry (EN 14625).",
          "M",
        ],
        [
          "3.3",
          "Noise terminals shall be Class 1 to IEC 61672-1, with an all-weather microphone kit, 1/3-octave spectra and audio recording of exceedances.",
          "M",
        ],
        [
          "3.4",
          "Each station shall be housed in an air-conditioned shelter rated IP55 or better, for ambient temperatures from 0 °C to +50 °C, with a UPS of at least 2 hours.",
          "I",
        ],
        [
          "3.5",
          "Stations shall store at least 7 days of data locally and resend it automatically after an outage. Communication over 4G with a backup link (second operator or fixed line).",
          "I",
        ],
        [
          "3.6",
          "Data capture of at least 90 % valid hourly data for every pollutant in every calendar quarter.",
          "I",
        ],
      ],
    },
    {
      title: "Data platform",
      clauses: [
        [
          "4.1",
          "The platform and all monitoring data shall be hosted on the Authority's servers in its data centre. Raw and validated data shall be kept for 10 years.",
          "M",
        ],
        [
          "4.2",
          "Automatic validation (range, rate of change, flat-line checks) and manual validation, with an audit trail of every change.",
          "I",
        ],
        [
          "4.3",
          "Alarms for limit-value exceedances to the HSE duty officer by SMS and e-mail within 5 minutes of the end of the averaging period.",
          "I",
        ],
        [
          "4.4",
          "Monthly and annual reports in the format of the environmental permit, exported to Excel and PDF.",
          "I",
        ],
        [
          "4.5",
          "A public dashboard in Arabic and English and an open, documented REST API for the published data.",
          "D",
        ],
        ["4.6", "Users sign in with their accounts in the Authority's Active Directory.", "I"],
      ],
    },
    {
      title: "Implementation and services",
      clauses: [
        [
          "5.1",
          "All stations and terminals shall be in operation within 6 months of contract signature, followed by a 30-day trial run before acceptance.",
          "I",
        ],
        [
          "5.2",
          "Analysers shall be calibrated at least every 3 months with gases traceable to a laboratory accredited to ISO/IEC 17025. Calibration records shall be kept for 5 years.",
          "M",
        ],
        [
          "5.3",
          "On-site response within 48 hours to a station failure, with spare analysers kept in the State.",
          "I",
        ],
        [
          "5.4",
          "Warranty of 24 months from acceptance on all equipment and software, and 3 years of operation and maintenance.",
          "M",
        ],
        [
          "5.5",
          "Training of 6 HSE staff in station operation and data validation, in Arabic and English.",
          "D",
        ],
      ],
    },
    {
      title: "Qualification",
      clauses: [
        [
          "6.1",
          "The bidder shall have installed at least 3 similar monitoring networks (4 or more stations each) in the last 7 years, with client contacts.",
          "M",
        ],
        [
          "6.2",
          "The bidder shall have an office or an authorised service partner in the State.",
          "I",
        ],
      ],
    },
    {
      title: "Commercial conditions",
      clauses: [
        [
          "7.1",
          "Prices in USD, excluding VAT. Operation and maintenance shall be priced per year, and these prices shall be fixed for the 3 years.",
          "I",
        ],
        [
          "7.2",
          "Payments follow delivery and acceptance milestones. Any advance payment shall not exceed 20 % and requires an advance-payment guarantee.",
          "I",
        ],
        [
          "7.3",
          "Performance security of 10 % of the contract price, issued by a bank licensed in the State.",
          "M",
        ],
        [
          "7.4",
          "Bid validity of 120 days. Bid security of USD 25,000, issued by a bank licensed in the State.",
          "M",
        ],
      ],
    },
    {
      title: "Evaluation",
      clauses: [
        [
          "8.1",
          "Mandatory requirements are pass/fail. Compliant bids are scored 70 % technical (measurement quality 30, data platform 20, operation and maintenance 30, references 20) and 30 % financial.",
        ],
        [
          "8.2",
          "Evaluated price = supply and installation + 3 years of operation and maintenance.",
        ],
        ["8.3", "Bidders shall complete the compliance matrix in Annex 1."],
      ],
    },
  ],
  matrix: [
    ["2.1", "Six AQ stations: PM10, PM2.5, NO2, SO2, O3 + meteorology"],
    ["2.2", "Four noise terminals"],
    ["3.1", "PM analysers certified equivalent (EN 16450)"],
    ["3.2", "Gas analysers to EN reference methods"],
    ["3.3", "Noise Class 1, 1/3-octave, audio recording of exceedances"],
    ["3.4", "Shelter IP55, 0 to +50 °C, UPS ≥ 2 h"],
    ["3.5", "7 days local storage, back-fill, backup link"],
    ["3.6", "≥ 90 % valid hourly data per quarter"],
    ["4.1", "Authority data centre; 10-year retention"],
    ["4.2", "Validation with audit trail"],
    ["4.3", "Alarms within 5 min (SMS, e-mail)"],
    ["4.4", "Monthly / annual permit reports (Excel, PDF)"],
    ["4.5", "Public dashboard AR/EN + REST API"],
    ["4.6", "Active Directory sign-in"],
    ["5.1", "In operation ≤ 6 months; 30-day trial"],
    ["5.2", "Calibration every 3 months, ISO/IEC 17025 traceable"],
    ["5.3", "48 h on-site response; spares in the State"],
    ["5.4", "24-month warranty; 3-year O&M"],
    ["5.5", "Training of 6 HSE staff, AR/EN"],
    ["6.1", "≥ 3 similar networks in 7 years"],
    ["6.2", "Office or service partner in the State"],
  ],
};

export const AIRQ_BIDS: PocBid[] = [
  {
    slug: "Sabkha-Environmental-Systems",
    name: "Sabkha Environmental Systems",
    legalName: "Sabkha Environmental Systems W.L.L.",
    country: "Northern Gulf State",
    address: "Plot 112, Industrial Area 3, Al-Noor",
    contact: { name: "Huda Al-Rashdi", email: "tenders@sabkha-env.example" },
    signatory: { name: "Khalid Al-Mansoori", title: "Managing Director" },
    date: "8 December 2026",
    ref: "SES/NGPA/052/26",
    technical: {
      company:
        p(
          "Sabkha Environmental Systems was founded in 2006 in Al-Noor and has 64 staff. We design, install and operate air-quality and noise monitoring networks for industrial cities, municipalities and ports. We are the authorised partner in the State for the Vireo Instruments analyser range, and we run a calibration laboratory in Al-Noor accredited to ISO/IEC 17025 (accreditation no. NGAC-CAL-0417).",
        ) +
        tbl(
          ["Reference", "Scope", "Year"],
          [
            [
              "Ras Hadd Industrial City, ambient air network",
              "8 stations, data platform, 5-year operation and maintenance",
              "2021",
            ],
            [
              "Al-Waha Municipality, air quality and noise",
              "5 stations, 6 noise terminals, public dashboard",
              "2023",
            ],
            [
              "Eastern Province Ports, boundary monitoring",
              "4 stations, 3 noise terminals, permit reporting",
              "2025",
            ],
          ],
        ),
      solution:
        p("<b>Air-quality stations.</b> Each of the six stations contains:") +
        ul([
          "a Vireo PM-2 dual-channel beta-attenuation monitor for PM10 and PM2.5, certified by TÜV as equivalent to the EN reference method (EN 16450); certificates in Appendix B;",
          "a Vireo NX-1 chemiluminescence NO2 analyser (EN 14211), a Vireo SX-1 UV-fluorescence SO2 analyser (EN 14212) and a Vireo OX-1 UV-photometric O3 analyser (EN 14625), all type-approved;",
          "a 10 m meteorological mast with an ultrasonic wind sensor, temperature, humidity and pressure sensors;",
          "a data logger that stores 30 days of minute data and resends it automatically after an outage, with a 4G router using two SIM cards from different operators.",
        ]) +
        p(
          "<b>Shelters.</b> Insulated GRP shelters with two redundant air-conditioning units, rated IP55, for ambient temperatures from 0 °C to +50 °C. A UPS keeps each station running for 1 hour after a power cut and shuts the analysers down safely.",
        ) +
        p(
          "<b>Noise terminals.</b> SonoGuard N1 Class 1 sound level meters to IEC 61672-1, with an all-weather microphone kit (wind screen, bird spike, rain protection). Each terminal stores 1-second LAeq values and 1/3-octave spectra and sends them every minute.",
        ) +
        p(
          "<b>Data capture.</b> We guarantee at least 90 % valid hourly data for every pollutant in every calendar quarter. Our Al-Waha network averaged 96 % in 2025.",
        ) +
        p(
          "<b>EnviroDesk platform.</b> Automatic validation (range, rate of change, flat-line) and manual validation with a full audit trail. Limit-value alarms go to the HSE duty officer by SMS and e-mail within 2 minutes of the end of the averaging period. Monthly and annual reports follow the permit format and export to Excel and PDF. The public dashboard is in Arabic and English, and the published data is available through a REST API documented in OpenAPI.",
        ),
      security:
        p(
          "<b>Hosting.</b> EnviroDesk is installed on two virtual servers in the Authority's data centre, with a replica in its disaster-recovery site. No data leaves the Authority's infrastructure.",
        ) +
        ul([
          "Users sign in with their Active Directory accounts.",
          "Raw and validated data are kept for 10 years; calibration records for 5 years.",
          "The stations connect to the data centre over a private APN with encrypted tunnels.",
        ]),
      implementation:
        tbl(
          ["Milestone", "Month"],
          [
            ["Site surveys, permits and foundations", "1–2"],
            ["Shelters and analysers delivered to site", "3"],
            ["Stations and noise terminals commissioned", "4–5"],
            ["30-day trial run", "5–6"],
            ["Acceptance", "6"],
          ],
        ) +
        p(
          "<b>Training.</b> 5 days for the Authority's 6 HSE staff, in Arabic and English, covering station operation, data validation and reporting. Manuals in both languages.",
        ),
      support:
        p("<b>Warranty.</b> 24 months from acceptance on all equipment and software.") +
        p(
          "<b>Operation and maintenance for 3 years.</b> Monthly preventive visits, calibration of every analyser every 3 months with certified gases and transfer standards traceable to our accredited laboratory, yearly verification of the noise terminals, consumables and repairs. Calibration records are kept for 5 years.",
        ) +
        p(
          "<b>Response.</b> An engineer is on site within 24 hours of a station failure. One spare analyser of each type is kept in our Al-Noor store.",
        ),
    },
    matrix: {
      "2.1": ["Comply", "§2"],
      "2.2": ["Comply", "§2"],
      "3.1": ["Comply", "TÜV EN 16450 certificates, Appendix B (§2)"],
      "3.2": ["Comply", "§2"],
      "3.3": ["Comply", "SonoGuard N1 Class 1 (§2)"],
      "3.4": ["Comply", "IP55, 0 to +50 °C, UPS 1 h (§2)"],
      "3.5": ["Comply", "30 days, dual-SIM 4G (§2)"],
      "3.6": ["Comply", "90 % guaranteed (§2)"],
      "4.1": ["Comply", "Authority data centre + DR site (§3)"],
      "4.2": ["Comply", "§2"],
      "4.3": ["Comply", "Within 2 minutes (§2)"],
      "4.4": ["Comply", "§2"],
      "4.5": ["Comply", "§2"],
      "4.6": ["Comply", "§3"],
      "5.1": ["Comply", "Acceptance month 6 (§4)"],
      "5.2": ["Comply", "Every 3 months, accredited lab (§5)"],
      "5.3": ["Comply", "24 h, spares in Al-Noor (§5)"],
      "5.4": ["Comply", "§5"],
      "5.5": ["Comply", "§4"],
      "6.1": ["Comply", "3 networks (§1)"],
      "6.2": ["Comply", "Office in Al-Noor (§1)"],
    },
    commercial: {
      lines: [
        ["Air-quality station complete (shelter, PM, NO2, SO2, O3, meteorology)", 6, 212_000],
        ["SonoGuard N1 Class 1 noise terminal", 4, 18_500],
        ["EnviroDesk platform licence (perpetual) and public dashboard", 1, 145_000],
        ["Servers, integration with Active Directory and SMS gateway", 1, 48_000],
        ["Civil works, installation and commissioning", 1, 160_000],
        ["Training and manuals (Arabic and English)", 1, 22_000],
      ],
      recurring: {
        label: "Operation and maintenance",
        amounts: [236_000, 241_900, 247_948],
      },
      notes: [
        "The warranty (24 months from acceptance) is included in the supply prices.",
        "Operation and maintenance prices for years 2 and 3 include an escalation of 2.5 % per year.",
        "Operation and maintenance include calibration gases, consumables, spare parts and data validation.",
      ],
      terms: [
        [
          "Payment",
          "10 % advance against an advance-payment guarantee; 60 % on delivery of the stations to site; 30 % on acceptance. Operation and maintenance invoiced quarterly in arrears.",
        ],
        ["Bid validity", "120 days from the bid closing date."],
        ["Bid security", "Bank guarantee of USD 25,000 issued by Al-Noor National Bank."],
        ["Performance security", "10 % of the contract price, issued by Al-Noor National Bank."],
      ],
      deviations: [
        "Operation and maintenance prices for years 2 and 3 include an escalation of 2.5 % per year (note 2).",
      ],
    },
  },
  {
    slug: "Nimbrel-Sensing",
    name: "Nimbrel Sensing",
    legalName: "Nimbrel Sensing Ltd",
    country: "United Kingdom",
    address: "Unit 7, Harbour Innovation Park, Southampton, United Kingdom",
    contact: { name: "Oliver Grant", email: "bids@nimbrel.example" },
    signatory: { name: "Priya Natarajan", title: "Commercial Director" },
    date: "9 December 2026",
    ref: "NS-NGPA-052",
    technical: {
      company:
        p(
          "Nimbrel Sensing builds dense, low-cost air-quality and noise sensor networks for cities, ports and road operators. Founded in 2017, we have 40 staff and more than 2,000 sensor pods in 14 countries. In the State, installation and first-line maintenance are carried out by our partner Gulf Smart Systems (Al-Noor).",
        ) +
        tbl(
          ["Reference", "Scope", "Year"],
          [
            [
              "City of Westhaven, smart-city air network",
              "120 sensor pods, public dashboard",
              "2022",
            ],
            ["Northbay Port, fence-line monitoring", "18 sensor pods, 6 noise nodes", "2024"],
            ["Coastal Highways Agency, roadside monitoring", "40 sensor pods", "2025"],
          ],
        ),
      solution:
        p("<b>AQ-Pod S5.</b> One compact pod per site, mounted on a pole or a wall, with:") +
        ul([
          "an optical particle counter for PM1, PM2.5 and PM10; the AQ-Pod S5 is certified under MCERTS for indicative ambient particulate monitors;",
          "electrochemical sensors for NO2, SO2 and O3, corrected by our machine-learning calibration models;",
          "wind, temperature and humidity sensors;",
          "a solar panel and battery, so no mains power or air-conditioning is needed; the pod is rated IP65 and operates from −20 °C to +60 °C;",
          "14 days of local storage, with automatic back-fill over 4G.",
        ]) +
        p(
          "<b>Data quality.</b> Each pod is first co-located for two weeks with a reference station, and its calibration model is then updated monthly from the network. Typical hourly uncertainty is ±25 % for PM2.5 and ±30 % for NO2. Our networks achieve 95 % data capture.",
        ) +
        p(
          "<b>NoiseNode C2.</b> Class 2 sound level meters to IEC 61672-1, with 1/3-octave spectra and 10-second audio clips of exceedances.",
        ) +
        p(
          "<b>Nimbrel Cloud.</b> Dashboards, automatic quality checks, alarms by push notification, SMS and e-mail within 1 minute of the end of the averaging period, monthly reports in PDF and CSV, a public dashboard in Arabic and English, and an open REST API.",
        ),
      security:
        p(
          "<b>Hosting.</b> Nimbrel Cloud runs on a public cloud provider in the European Union (Dublin region) and is certified to ISO 27001. Data is encrypted in transit and at rest.",
        ) +
        ul([
          "Authority users sign in with single sign-on (SAML) through the Authority's identity provider.",
          "Data is kept online for 5 years and archived to the Authority on request.",
        ]),
      implementation:
        tbl(
          ["Milestone", "Month"],
          [
            ["Pods and noise nodes shipped", "1"],
            ["All sites installed, co-location calibration", "2"],
            ["Network live, trial period", "3"],
            ["Acceptance", "4"],
          ],
        ) + p("<b>Training.</b> Two online sessions (English) for the Authority's users."),
      support:
        p("<b>Warranty.</b> 12 months from acceptance.") +
        p(
          "<b>Service.</b> We monitor every pod remotely. Faulty pods are replaced from our UK stock within 5 working days; Gulf Smart Systems visits a site within 72 hours when needed. Sensor cartridges are replaced every 12 months, and calibration models are updated every month.",
        ),
    },
    matrix: {
      "2.1": ["Comply", "AQ-Pod S5 at 6 sites (§2)"],
      "2.2": ["Comply", "NoiseNode C2 (§2)"],
      "3.1": ["Partially comply", "MCERTS indicative (§2)"],
      "3.2": ["Partially comply", "Electrochemical sensors with calibration models (§2)"],
      "3.3": ["Partially comply", "Class 2, audio clips (§2)"],
      "3.4": ["Comply", "IP65, solar, no shelter needed (§2)"],
      "3.5": ["Comply", "14 days, 4G (§2)"],
      "3.6": ["Comply", "95 % (§2)"],
      "4.1": ["Partially comply", "Nimbrel Cloud, EU region (§3)"],
      "4.2": ["Comply", "§2"],
      "4.3": ["Comply", "Within 1 minute (§2)"],
      "4.4": ["Comply", "PDF and CSV (§2)"],
      "4.5": ["Comply", "§2"],
      "4.6": ["Comply", "SAML single sign-on (§3)"],
      "5.1": ["Comply", "Acceptance month 4 (§4)"],
      "5.2": ["Comply", "Co-location and monthly model updates (§2, §5)"],
      "5.3": ["Partially comply", "Partner within 72 h (§5)"],
      "5.4": ["Partially comply", "12 months (§5)"],
      "5.5": ["Comply", "Online sessions (§4)"],
      "6.1": ["Comply", "§1"],
      "6.2": ["Comply", "Gulf Smart Systems (§1)"],
    },
    commercial: {
      lines: [
        ["AQ-Pod S5 sensor pod with meteorology and solar power", 6, 24_500],
        ["NoiseNode C2 noise node", 4, 7_900],
        ["Nimbrel Cloud set-up, public dashboard and API", 1, 38_000],
        ["Installation and co-location calibration (by Gulf Smart Systems)", 1, 42_000],
        ["Online training", 1, 6_000],
      ],
      recurring: { label: "Nimbrel Cloud and data service", amounts: [96_000, 96_000, 96_000] },
      notes: [
        "The data service includes cloud hosting, calibration model updates, sensor cartridge replacements and remote support.",
        "Prices are fixed for 3 years.",
      ],
      terms: [
        [
          "Payment",
          "50 % with the order; 50 % on installation. Data service invoiced yearly in advance.",
        ],
        ["Bid validity", "120 days from the bid closing date."],
        ["Bid security", "Bank guarantee of USD 25,000 issued by Thamesbridge Bank plc, London."],
        [
          "Performance security",
          "10 % of the contract price, issued by Thamesbridge Bank plc, London.",
        ],
      ],
      deviations: ["Payment: 50 % with the order and 50 % on installation."],
    },
  },
  {
    slug: "Kaltenmoor-Messtechnik",
    name: "Kaltenmoor Messtechnik",
    legalName: "Kaltenmoor Messtechnik GmbH",
    country: "Germany",
    address: "Industriestrasse 14, 26135 Oldenburg, Germany",
    contact: { name: "Jana Weiss", email: "tender@kaltenmoor.example" },
    signatory: { name: "Dr. Henrik Brandes", title: "Managing Director" },
    date: "8 December 2026",
    ref: "KM-2026-NGPA-052",
    technical: {
      company:
        p(
          "Kaltenmoor Messtechnik has manufactured air-quality analysers and turnkey monitoring stations since 1994. With 210 staff, we have delivered more than 900 stations in 30 countries. Our regional service team (2 engineers) covers the Gulf from outside the State; civil works for this contract will be carried out by a local subcontractor.",
        ) +
        tbl(
          ["Reference", "Scope", "Year"],
          [
            ["Lower Elbe Port Authority", "6 stations, data platform", "2020"],
            ["Rhine-Ruhr industrial district", "12 stations", "2022"],
            ["Baltic Sea Ferry Terminal", "3 stations, 4 noise terminals", "2024"],
          ],
        ),
      solution:
        p(
          "<b>Air-quality stations.</b> Each station is built and tested in our Oldenburg factory:",
        ) +
        ul([
          "AK-PM 300 monitor for PM10 and PM2.5, certified by TÜV as equivalent to the EN reference method (EN 16450); certificates attached;",
          "AK-NOx chemiluminescence analyser (EN 14211), AK-SO2 UV-fluorescence analyser (EN 14212) and AK-O3 UV-photometric analyser (EN 14625);",
          "meteorological sensors for wind speed and direction, temperature and humidity;",
          "a data logger with 7 days of local storage and automatic back-fill, and a 4G router that switches automatically to a second operator.",
        ]) +
        p(
          "<b>Shelters.</b> Air-conditioned steel shelters rated IP54, for ambient temperatures from 0 °C to +50 °C, with a 2-hour UPS.",
        ) +
        p(
          "<b>Noise terminals.</b> AK-Sound 61 Class 1 sound level meters to IEC 61672-1, with an all-weather microphone kit, 1/3-octave spectra and audio recording of exceedances.",
        ) +
        p("<b>Data capture.</b> At least 90 % valid hourly data per pollutant and quarter.") +
        p(
          "<b>AirBase platform.</b> Automatic and manual validation with an audit trail. The alarm module checks the hourly averages every 15 minutes and sends e-mails to the duty officer. Monthly and annual reports export to Excel and PDF. The public dashboard is available in English and German; an Arabic version can be produced on request. Published data is available through a documented REST API.",
        ),
      security: p(
        "<b>Hosting.</b> AirBase is installed on the Authority's servers in its data centre. Users sign in with their Active Directory accounts through LDAP. Raw and validated data are kept for 10 years.",
      ),
      implementation:
        tbl(
          ["Milestone", "Month"],
          [
            ["Factory acceptance test in Oldenburg", "4"],
            ["Shipment", "5"],
            ["Installation and commissioning", "6–7"],
            ["30-day trial run and acceptance", "8"],
          ],
        ) +
        p(
          "<b>Training.</b> 5 days at our Oldenburg factory for 4 of the Authority's staff, in English.",
        ),
      support:
        p("<b>Warranty.</b> 24 months from acceptance on all equipment and software.") +
        p(
          "<b>Operation and maintenance for 3 years.</b> Automatic zero and span checks every 2 weeks, and a full multipoint calibration every 6 months with gases traceable to an ISO/IEC 17025 laboratory. Records are kept for 5 years. Noise terminals are verified every year.",
        ) +
        p(
          "<b>Response.</b> Remote diagnosis within 4 hours; an engineer on site within 5 working days. Spare analysers are shipped from Oldenburg.",
        ),
    },
    matrix: {
      "2.1": ["Comply", "§2"],
      "2.2": ["Comply", "§2"],
      "3.1": ["Comply", "TÜV EN 16450 (§2)"],
      "3.2": ["Comply", "§2"],
      "3.3": ["Comply", "AK-Sound 61 (§2)"],
      "3.4": ["Comply", "IP54, 2 h UPS (§2)"],
      "3.5": ["Comply", "§2"],
      "3.6": ["Comply", "§2"],
      "4.1": ["Comply", "§3"],
      "4.2": ["Comply", "§2"],
      "4.3": ["Partially comply", "E-mail, 15-minute checks (§2)"],
      "4.4": ["Comply", "§2"],
      "4.5": ["Partially comply", "English and German; Arabic on request (§2)"],
      "4.6": ["Comply", "LDAP (§3)"],
      "5.1": ["Partially comply", "Acceptance month 8 (§4)"],
      "5.2": ["Comply", "Checks every 2 weeks, calibration every 6 months (§5)"],
      "5.3": ["Partially comply", "5 working days (§5)"],
      "5.4": ["Comply", "§5"],
      "5.5": ["Comply", "Factory training (§4)"],
      "6.1": ["Comply", "§1"],
      "6.2": ["Partially comply", "Regional team, local subcontractor (§1)"],
    },
    commercial: {
      lines: [
        ["Air-quality station complete (shelter, PM, NO2, SO2, O3, meteorology)", 6, 198_000],
        ["AK-Sound 61 Class 1 noise terminal", 4, 16_800],
        ["AirBase platform licence (perpetual)", 1, 120_000],
        ["Installation and commissioning (civil works by a local subcontractor)", 1, 175_000],
        ["Training at the Oldenburg factory", 1, 30_000],
      ],
      recurring: { label: "Operation and maintenance", amounts: [198_000, 198_000, 198_000] },
      notes: [
        "The warranty (24 months from acceptance) is included in the supply prices.",
        "Operation and maintenance prices are fixed for 3 years and include travel, calibration gases and consumables.",
      ],
      terms: [
        [
          "Payment",
          "20 % advance against an advance-payment guarantee; 50 % on shipment; 30 % on acceptance. Operation and maintenance invoiced yearly in arrears.",
        ],
        ["Bid validity", "120 days from the bid closing date."],
        [
          "Bid security",
          "Bank guarantee of USD 25,000 issued by Al-Noor National Bank on the instruction of Weser Handelsbank AG.",
        ],
        [
          "Performance security",
          "10 % of the contract price, issued by Al-Noor National Bank on the instruction of Weser Handelsbank AG.",
        ],
      ],
      deviations: [],
    },
  },
];
