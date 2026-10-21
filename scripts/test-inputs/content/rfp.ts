/**
 * RFP main document for the fictional tender NGPA/T/2026/014.
 * Written like a real authority's RFP: plain requirements, no evaluator hints (user rule, HANDOFF G-21).
 * Must stay consistent with Annex B/C and with the standards created in Phase 2.
 */
import { clause as c, doc, tag as t } from "../lib/pdf";

export const TENDER = {
  ref: "NGPA/T/2026/014",
  authority: "Northern Gulf Ports Authority",
  short: "NGPA",
  customs: "General Customs Directorate",
  port: "Port of Al-Noor",
  title:
    "Supply, Installation, Commissioning and Maintenance of High-Energy Cargo X-Ray Inspection Systems",
  issued: "15 September 2026",
  closingOriginal: "30 November 2026, 12:00 local time",
};

export function rfpHtml(): string {
  const body = `
<section class="cover">
  <div>
    <div class="small" style="letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8pt">${TENDER.authority} · in partnership with the ${TENDER.customs}</div>
    <div class="band">
      <div style="font-size:10pt;opacity:.85;margin-bottom:6pt">REQUEST FOR PROPOSAL · ${TENDER.ref}</div>
      <h1>${TENDER.title}</h1>
      <div style="font-size:11pt;opacity:.9">Terminal 1 (Container Terminal) and Terminal 2 (Multipurpose &amp; Ro-Ro Terminal), ${TENDER.port}</div>
    </div>
  </div>
  <table class="kv">
    <tr><td>Tender reference</td><td><b>${TENDER.ref}</b></td></tr>
    <tr><td>Procedure</td><td>Open international tender · two-envelope (technical / financial)</td></tr>
    <tr><td>Date of issue</td><td>${TENDER.issued}</td></tr>
    <tr><td>Deadline for clarification questions</td><td>20 October 2026</td></tr>
    <tr><td>Bid closing date</td><td>${TENDER.closingOriginal} <span class="small">(see any Addenda for changes)</span></td></tr>
    <tr><td>Bid opening (technical envelopes)</td><td>Immediately after closing, NGPA Headquarters, Tender Hall B</td></tr>
    <tr><td>Contact</td><td>Tender Committee Secretariat · tenders@ngpa.example · +000 0000 0000</td></tr>
  </table>
  <div class="warn"><b>SAMPLE DOCUMENT.</b> This tender, the authority, the port and all names are fictional. The document was created to test procurement-evaluation software and does not represent any real procurement.</div>
</section>

<section class="pb">
  <h2>Document control</h2>
  <table>
    <tr><th>Version</th><th>Date</th><th>Description</th></tr>
    <tr><td>1.0</td><td>15 Sep 2026</td><td>First issue to bidders</td></tr>
  </table>
  <p class="small">This RFP comprises this main document and Annexes A–F listed in Section 8. Addenda issued during the tender period form an integral part of the RFP (see §2.5 and §2.6).</p>
  <h2>Contents</h2>
  <div class="toc">
    <div><span>1. Introduction and background</span><span>3</span></div>
    <div><span>2. Instructions to bidders</span><span>3</span></div>
    <div><span>3. Scope of supply</span><span>5</span></div>
    <div><span>4. Technical requirements</span><span>7</span></div>
    <div><span>5. Implementation, acceptance and training</span><span>10</span></div>
    <div><span>6. Warranty, support and maintenance</span><span>11</span></div>
    <div><span>7. Evaluation methodology</span><span>12</span></div>
    <div><span>8. Submission forms and annexes</span><span>14</span></div>
  </div>
  <div class="note"><b>How requirements are marked.</b> ${t("M")} requirements are pass/fail: failing any one makes the bid technically non-responsive (§7.2). ${t("I")} requirements are scored and weigh heavily. ${t("D")} requirements earn additional points but their absence does not disqualify.</div>
</section>

<section class="pb">
  <h2>1. Introduction and background</h2>
  ${c("1.1", `The ${TENDER.authority} ("NGPA" or "the Employer") operates the ${TENDER.port}, which handled 2.1 million TEU in 2025. Terminal 1 (T1) is a dedicated container terminal; Terminal 2 (T2) is a multipurpose and Ro-Ro terminal handling containers, break-bulk and vehicles.`)}
  ${c("1.2", `Under the National Trade Facilitation Programme, the ${TENDER.customs} ("GCD") requires non-intrusive inspection of 100% of import containers flagged by its risk engine by 2028. Today only 8% of flagged containers are physically inspected, causing average dwell times of 6.4 days for inspected boxes.`)}
  ${c("1.3", `NGPA invites proposals for the supply, installation, commissioning, training and five years of comprehensive maintenance of high-energy drive-through cargo X-ray inspection systems, a central image analysis centre and integration with GCD and terminal systems.`)}
  ${c("1.4", `<b>Definitions.</b> <i>PAC</i>: Provisional Acceptance Certificate issued after successful Site Acceptance Test (SAT) and a 30-day trial operation. <i>FAC</i>: Final Acceptance Certificate issued 12 months after PAC. <i>CIAC</i>: Central Image Analysis Centre located in the Customs Data Center (CDC) in the capital, 118 km from the port. <i>CMC</i>: Comprehensive Maintenance Contract. <i>Relocatable unit</i>: a system that can be dismantled and re-commissioned at another site.`)}

  <h2>2. Instructions to bidders</h2>
  <h3>2.1 Eligibility</h3>
  ${c("2.1.1", `The Bidder shall be the Original Equipment Manufacturer (OEM) of the X-ray inspection systems, or a partner holding a valid OEM authorization specific to this tender (Form F-3). ${t("M")}`)}
  ${c("2.1.2", `The Bidder (or its OEM) shall demonstrate at least <b>three (3)</b> installations of high-energy cargo scanners of comparable scope completed within the last <b>seven (7) years</b>, of which at least <b>one (1)</b> is installed in a seaport with a hot and humid climate (mean summer maximum above 40 °C and relative humidity above 70%). Provide end-user references with contact details (Form F-4). ${t("M")}`)}
  ${c("2.1.3", `Joint ventures are permitted; all members are jointly and severally liable. The lead member shall hold at least 51% of the contract value.`)}
  <h3>2.2 Bid validity</h3>
  ${c("2.2.1", `Bids shall remain valid for <b>120 days</b> from the bid closing date. A bid with a shorter validity will be rejected. ${t("M")}`)}
  <h3>2.3 Bid security</h3>
  ${c("2.3.1", `Each bid shall be accompanied by a bid security of <b>USD 150,000</b> in the form of an unconditional bank guarantee issued by a bank licensed in the State, valid for 28 days beyond the bid validity period. ${t("M")}`)}
  <h3>2.4 Two-envelope submission</h3>
  ${c("2.4.1", `Bids shall be submitted in two separately sealed envelopes: <b>Envelope 1 – Technical Proposal</b> and <b>Envelope 2 – Financial Proposal</b>.`)}
  ${c("2.4.2", `<b>The Technical Proposal shall not contain any pricing information</b> (prices, discounts, rates or cost breakdowns). Any technical proposal disclosing prices will be declared non-responsive and its financial envelope returned unopened. ${t("M")}`)}
  ${c("2.4.3", `The Financial Proposal shall use the price schedule structure in Annex C, Appendix 2 (Form F-5), without alteration of line items.`)}
  <h3>2.5 Clarifications and addenda</h3>
  ${c("2.5.1", `Questions shall be submitted in writing by 20 October 2026. Answers will be circulated to all bidders as numbered Addenda without disclosing the source.`)}
  ${c("2.5.2", `Addenda form part of the RFP. Where an Addendum changes a provision, the later Addendum prevails over earlier Addenda and over all other tender documents.`)}
  <h3>2.6 Order of precedence</h3>
  ${c("2.6.1", `In case of conflict or inconsistency between tender documents, the following order of precedence applies: (1) Addenda, latest first; (2) Annex C – Draft Contract, for all commercial, contractual and legal matters; (3) Annex B – Technical Specifications, for all technical parameters and site data; (4) this RFP main document; (5) standards and documents referenced in the RFP.`)}
  ${c("2.6.2", `Where this RFP and a referenced standard (including the Employer's internal standards) both regulate the same matter, <b>the more stringent requirement applies</b>, irrespective of the order above.`)}
  <h3>2.7 Language</h3>
  ${c("2.7.1", `Bids shall be in English. Supporting documents in another language (including Arabic) shall be accompanied by an English translation, which prevails for evaluation.`)}
  <h3>2.8 Currency and prices</h3>
  ${c("2.8.1", `Prices shall be quoted in <b>United States Dollars (USD)</b>. Exchange-rate risk is borne by the Bidder.`)}
  ${c("2.8.2", `Prices shall be <b>DDP site (Incoterms 2020)</b>, inclusive of freight, insurance, import duties and all taxes <b>except VAT</b>, which will be paid by the Employer. The Employer will <b>not</b> issue customs duty exemption certificates for this contract.`)}
  ${c("2.8.3", `CAPEX prices are firm for the duration of the contract. CMC prices may escalate by no more than 3% per year (Annex C).`)}
  <h3>2.9 Deviations</h3>
  ${c("2.9.1", `Bidders shall list every deviation from the RFP in Form F-6 (Statement of Deviations).`)}
  <h3>2.10 Site visit</h3>
  ${c("2.10.1", `A site visit to T1 and T2 took place on 6 October 2026. Site data in Annex B, sheet "Site constraints", is binding regardless of attendance.`)}
</section>

<section class="pb">
  <h2>3. Scope of supply</h2>
  <h3>3.1 Inspection systems</h3>
  <table>
    <tr><th>Lot item</th><th>Location</th><th>Type</th><th>Qty</th><th>Key note</th></tr>
    <tr><td>1.1</td><td>T1 Gate A (import exit)</td><td>High-energy drive-through, dual-energy</td><td>1</td><td>Highest-volume lane</td></tr>
    <tr><td>1.2</td><td>T1 Gate B (import exit)</td><td>High-energy drive-through, dual-energy</td><td>1</td><td>—</td></tr>
    <tr><td>1.3</td><td>T2 main gate</td><td>High-energy drive-through, dual-energy</td><td>1</td><td>Plot and power as per Annex B</td></tr>
    <tr><td>1.4</td><td>T1/T2 (relocatable)</td><td>Relocatable high-energy system</td><td>1</td><td>Must be relocatable between T1 and T2 within <b>72 hours</b> ${t("M")}</td></tr>
  </table>
  ${c("3.1.1", `Each system includes the radiation source, detectors, mechanical structure, radiation shielding, traffic control (barriers, signals, vehicle detection), operator cabin, local server and all software licences for the contract duration and five years thereafter.`)}
  <h3>3.2 Central Image Analysis Centre (CIAC)</h3>
  ${c("3.2.1", `The Bidder shall supply the image management and analysis platform for the CIAC, hosted <b>on the Employer's premises at the Customs Data Center</b> (see §4.6). The Employer provides rack space, cooling and a 1 Gbps dedicated link between each terminal and the CDC; the platform shall operate correctly with up to 40 ms round-trip latency and 0.5% packet loss.`)}
  ${c("3.2.2", `Images shall be routed to analysts at the CIAC or at the terminals based on workload, with a target of <b>≤ 3 minutes</b> from end of scan to analyst decision for 90% of scans. ${t("I")}`)}
  <h3>3.3 Operator and analyst workstations</h3>
  ${c("3.3.1", `The Bidder shall supply <b>24 workstations</b>: 12 at the CIAC, 6 at T1, 4 at T2 and 2 spare/mobile. Specifications are in §4.10.`)}
  <h3>3.4 Integration</h3>
  ${c("3.4.1", `<b>Customs Risk Management System (CRMS):</b> bidirectional integration via REST/JSON over HTTPS for scan requests, inspection results, images (thumbnails and links) and analyst annotations. ${t("M")}`)}
  ${c("3.4.2", `<b>Terminal Operating System (TOS):</b> receive gate-in/gate-out and container messages via UN/EDIFACT COPARN and CODECO, or an equivalent REST interface agreed with the terminal operator. ${t("M")}`)}
  ${c("3.4.3", `<b>OCR:</b> automatic reading of container numbers per ISO 6346 including check-digit validation, and of vehicle licence plates in Arabic and Latin characters, with ≥ 98% correct-read rate under operational conditions (day, night, rain, dust). ${t("M")}`)}
  ${c("3.4.4", `Integration testing shall be performed against the Employer's test environments before SAT. The Bidder bears the cost of any middleware.`)}
  <h3>3.5 Civil and building works</h3>
  ${c("3.5.1", `The Bidder is responsible for foundations, radiation shielding walls, operator cabins, drainage, cable ducts and connection to the power and data supply points defined in Annex B. Designs shall be approved by the Employer's engineer before construction.`)}
  ${c("3.5.2", `Any reinforcement of the power supply (transformers, generators, switchgear) required beyond the capacity stated in Annex B is <b>in the Bidder's scope and at the Bidder's cost</b>.`)}
  <h3>3.6 Services</h3>
  ${c("3.6.1", `Project management, design, factory acceptance testing, transport, installation, radiation licensing support, commissioning, training, documentation, warranty and a five-year CMC following the warranty period.`)}
</section>

<section class="pb">
  <h2>4. Technical requirements</h2>
  <p>This section summarises the technical requirements. Detailed, measurable targets per site are in <b>Annex B</b>, which prevails for technical parameters (§2.6).</p>
  <h3>4.1 Imaging performance</h3>
  ${c("4.1.1", `Steel penetration, measured per ANSI N42.46-2008 test methods, of at least <b>310 mm</b> for the T1 Gate A and T1 Gate B systems, <b>300 mm</b> for the T2 system and <b>280 mm</b> for the relocatable unit. ${t("M")}`)}
  ${c("4.1.2", `Wire detection: 1.0 mm copper wire visible behind 100 mm of steel. ${t("M")}`)}
  ${c("4.1.3", `Contrast sensitivity better than or equal to 1.0%. ${t("I")}`)}
  ${c("4.1.4", `Material discrimination into at least four classes (organic, inorganic, mixed, heavy metal) across the full penetration range. ${t("I")}`)}
  ${c("4.1.5", `Dual-view (top and side) imaging. ${t("D")}`)}
  <h3>4.2 Throughput and operations</h3>
  ${c("4.2.1", `Throughput in drive-through mode, with the driver remaining in the cab, of at least <b>180 trucks per hour</b> at T1 Gate A and <b>150 trucks per hour</b> for the T1 Gate B, T2 and relocatable systems. ${t("M")}`)}
  ${c("4.2.2", `24/7 operation; mean time to repair (MTTR) of 4 hours or less for line-replaceable units. ${t("I")}`)}
  <h3>4.3 Radiation safety</h3>
  ${c("4.3.1", `<b>The high-energy beam shall not irradiate the occupied driver cab under any circumstances.</b> Cab scanning, if offered, shall use a separate low-dose source delivering ≤ 0.25 µSv per pass to the driver. ${t("M")}`)}
  ${c("4.3.2", `Annual dose at the boundary of the controlled area shall not exceed 1 mSv (public limit) at the throughput in §4.2. The controlled area, including all shielding and exclusion zones, shall fit within the plots defined in Annex B. ${t("M")}`)}
  ${c("4.3.3", `The Bidder shall prepare and submit the radiation safety licence application to the national regulator on the Employer's behalf, including shielding calculations and the radiation protection programme. ${t("I")}`)}
  <h3>4.4 Environmental conditions</h3>
  ${c("4.4.1", `Outdoor equipment shall operate continuously in ambient temperatures from 0 °C to +50 °C and relative humidity up to 95% non-condensing, in a saline coastal atmosphere. ${t("M")}`)}
  ${c("4.4.2", `Outdoor electronics enclosures: IP54 minimum. ${t("M")} Structural steel coating system for corrosivity category C5-M per ISO 12944. ${t("I")}`)}
  ${c("4.4.3", `Structures shall survive wind speeds of 120 km/h without damage (operation may stop above 60 km/h). ${t("I")}`)}
  <h3>4.5 Power supply and UPS</h3>
  ${c("4.5.1", `Available supply: 400 V ±10%, three-phase, 50 Hz. Available capacity per site is stated in Annex B. ${t("M")}`)}
  ${c("4.5.2", `UPS for control systems, servers and workstations with an autonomy of at least 30 minutes at full load, allowing orderly shutdown and preservation of images in progress. ${t("M")}`)}
</section>

<section>
  <h3>4.6 Software, hosting and data</h3>
  ${c("4.6.1", `<b>All software components</b>, including image storage, analysis, AI models, user management, licensing servers, telemetry, monitoring and update services, <b>shall be hosted on-premise</b> at the CDC and the terminals. No component may depend on a public cloud service or on connectivity to the Bidder's or OEM's systems to operate, license or update. ${t("M")}`)}
  ${c("4.6.2", `No scan image, metadata or derived data shall leave the national territory. Remote support access is governed by §4.8.6. ${t("M")}`)}
  ${c("4.6.3", `<b>Retention:</b> images and metadata shall be kept online for <b>5 years</b>. The Bidder shall size the storage for the full retention period using the volumes in Annex B (sheet "Volumes &amp; storage") with at least <b>20% headroom</b>, and state the usable capacity offered. ${t("M")}`)}
  ${c("4.6.4", `Export of images in DICOS (NEMA IIC 1) format. ${t("I")}`)}
  ${c("4.6.5", `All data, images and AI models trained on the Employer's data are the Employer's property (Annex C).`)}
  <h3>4.7 AI-assisted detection</h3>
  ${c("4.7.1", `Automated detection or anomaly highlighting for undeclared goods, weapons, cigarettes, narcotics concealment patterns and currency. ${t("D")}`)}
  ${c("4.7.2", `If offered, AI models shall run entirely on-premise (§4.6.1) and the Bidder shall not use the Employer's images to train or improve any model outside the CDC without the Employer's prior written consent. ${t("M")}`)}
  <h3>4.8 Cybersecurity</h3>
  ${c("4.8.1", `Compliance with the Employer's IT Security &amp; Data Residency Standard (provided separately) and with this section; the more stringent requirement applies (§2.6.2).`)}
  ${c("4.8.2", `Integration with the Employer's Active Directory via LDAPS; role-based access control; multi-factor authentication for all administrative access. ${t("M")}`)}
  ${c("4.8.3", `Tamper-evident audit logs of all user actions retained for 5 years. ${t("M")}`)}
  ${c("4.8.4", `Encryption at rest (AES-256) and in transit (TLS 1.2 or higher). ${t("M")}`)}
  ${c("4.8.5", `Software Bill of Materials (SBOM) and quarterly security patches during warranty and CMC. ${t("I")} Independent penetration test before go-live, with all high and critical findings closed. ${t("M")}`)}
  ${c("4.8.6", `Vendor remote access only through the Employer's VPN, per session, approved by the Employer, with full session recording. Permanent or vendor-initiated remote connections are prohibited. ${t("M")}`)}
  <h3>4.9 User interface</h3>
  ${c("4.9.1", `All operator and analyst user interfaces available in Arabic and English. ${t("M")}`)}
  ${c("4.9.2", `Display of dates in both Gregorian and Hijri calendars. ${t("D")}`)}
  <h3>4.10 Workstations</h3>
  ${c("4.10.1", `Each workstation: dual 27-inch monitors with a <b>minimum resolution of 2560 × 1440</b> each, colour-calibrated; 32 GB RAM; dedicated GPU suitable for the image analysis software. ${t("M")}`)}
</section>

<section class="pb">
  <h2>5. Implementation, acceptance and training</h2>
  <h3>5.1 Schedule</h3>
  ${c("5.1.1", `Completion of all deliverables up to PAC within <b>9 months</b> of contract effectiveness. ${t("M")}`)}
  ${c("5.1.2", `Milestone: the T1 Gate A system in trial operation by the end of <b>month 6</b>. ${t("I")}`)}
  ${c("5.1.3", `Delay damages are defined in Annex C.`)}
  <h3>5.2 Acceptance testing</h3>
  ${c("5.2.1", `Factory Acceptance Test (FAT) at the OEM factory, witnessed by four (4) Employer representatives; travel and accommodation at the Bidder's cost. ${t("I")}`)}
  ${c("5.2.2", `Site Acceptance Test (SAT) per system, followed by 30 days of trial operation with availability of at least 95%. PAC is issued per system after successful trial operation.`)}
  <h3>5.3 Training</h3>
  <table>
    <tr><th>Audience</th><th>Participants</th><th>Duration</th><th>Location</th></tr>
    <tr><td>Scanner operators</td><td>40</td><td>5 days</td><td>On site</td></tr>
    <tr><td>Image analysts</td><td>12</td><td>10 days + 20 days on-the-job coaching</td><td>CIAC</td></tr>
    <tr><td>Maintenance engineers</td><td>6</td><td>15 days</td><td>OEM factory</td></tr>
    <tr><td>System administrators</td><td>2</td><td>5 days</td><td>CDC</td></tr>
  </table>
  ${c("5.3.1", `Training shall be delivered in Arabic, or in English with simultaneous interpretation at the Bidder's cost, and include a train-the-trainer programme. ${t("I")}`)}
  <h3>5.4 Documentation</h3>
  ${c("5.4.1", `Operation and maintenance manuals in English and Arabic; as-built drawings; radiation survey reports. ${t("I")}`)}

  <h2>6. Warranty, support and maintenance</h2>
  <h3>6.1 Warranty</h3>
  ${c("6.1.1", `Warranty of <b>24 months from the date of PAC</b> of each system. ${t("M")}`)}
  ${c("6.1.2", `The warranty covers all parts, labour and travel, including the X-ray source (linear accelerator) and detector arrays. ${t("M")}`)}
  <h3>6.2 Availability</h3>
  ${c("6.2.1", `Guaranteed availability of at least <b>98% per scanner per calendar month</b>, excluding planned preventive maintenance of up to 8 hours per month agreed in advance. Availability penalties are defined in Annex C. ${t("M")}`)}
  <h3>6.3 Support and response</h3>
  ${c("6.3.1", `Remote response within 2 hours and on-site response at T1/T2 within 24 hours, 24/7. ${t("M")}`)}
  ${c("6.3.2", `A local service centre in the State with at least <b>four (4) OEM-certified engineers</b> and a stock of critical spare parts in-country from PAC. ${t("M")}`)}
  <h3>6.4 Comprehensive Maintenance Contract (CMC)</h3>
  ${c("6.4.1", `Five-year CMC starting at the end of the warranty, priced per year in Form F-5, covering preventive and corrective maintenance, all spare parts (including X-ray source replacement), software updates and the availability guarantee of §6.2. ${t("M")}`)}
  <h3>6.5 Spare parts and obsolescence</h3>
  ${c("6.5.1", `Spare parts availability for at least 10 years after PAC; 24 months' written notice of any end-of-life with a last-time-buy option. ${t("I")}`)}
</section>

<section class="pb">
  <h2>7. Evaluation methodology</h2>
  <h3>7.1 Stages</h3>
  ${c("7.1.1", `Stage 1 – Administrative compliance (pass/fail): bid security, validity, signed forms, OEM authorization, eligibility (§2.1).`)}
  ${c("7.1.2", `Stage 2 – Technical evaluation: (a) all ${t("M")} requirements pass/fail; (b) scoring of the technical proposal out of 100 using §7.2. Only bids scoring <b>at least 70 points</b> proceed to Stage 3.`)}
  ${c("7.1.3", `Stage 3 – Financial evaluation of technically responsive bids (§7.3), then the combined score (§7.4).`)}
  <h3>7.2 Technical scoring</h3>
  <table>
    <tr><th>Criterion</th><th>Weight</th><th>Main references</th></tr>
    <tr><td>Imaging performance</td><td>25</td><td>§4.1, Annex B TB-01 … TB-09</td></tr>
    <tr><td>Throughput, operations and site fit</td><td>15</td><td>§4.2, §4.3.2, Annex B site constraints</td></tr>
    <tr><td>Software, integration and cybersecurity</td><td>20</td><td>§3.4, §4.6, §4.8</td></tr>
    <tr><td>Safety and environmental resilience</td><td>10</td><td>§4.3, §4.4</td></tr>
    <tr><td>Implementation plan and training</td><td>10</td><td>§5</td></tr>
    <tr><td>Warranty, support and maintenance</td><td>15</td><td>§6</td></tr>
    <tr><td>Experience and references</td><td>5</td><td>§2.1.2</td></tr>
  </table>
  <h3>7.3 Financial evaluation</h3>
  ${c("7.3.1", `<b>Evaluated price</b> = total CAPEX (all items of Form F-5, including civil works, training and licensing support) <b>+ the sum of CMC years 1 to 5</b> + the priced value of deviations and omissions.`)}
  ${c("7.3.2", `Omitted items or quantities will be priced, for evaluation only, at the <b>highest</b> price offered for the same item by the other responsive bidders.`)}
  ${c("7.3.3", `Prices quoted on a basis other than DDP site excluding VAT will be adjusted by the Employer to that basis for comparison; costs of duties assumed to be exempt will be added.`)}
  <h3>7.4 Combined score</h3>
  ${c("7.4.1", `Financial score = (lowest evaluated price ÷ bidder's evaluated price) × 100. Combined score = 0.70 × technical score + 0.30 × financial score. The contract is awarded to the highest combined score.`)}
  <h3>7.5 Abnormally low bids</h3>
  ${c("7.5.1", `A bid whose evaluated price is below 75% of the average evaluated price of responsive bids will require a written justification; an unjustified abnormally low bid will be rejected.`)}
  <h3>7.6 Domestic preference</h3>
  ${c("7.6.1", `Bidders demonstrating at least 30% local value added (local assembly, civil works, local service centre staff) receive a 5% margin of preference: their evaluated price is reduced by 5% for the comparison only.`)}

  <h2>8. Submission forms and annexes</h2>
  <table>
    <tr><th>Form / Annex</th><th>Title</th><th>Envelope</th></tr>
    <tr><td>F-1</td><td>Bid submission letter</td><td>1</td></tr>
    <tr><td>F-2</td><td>Technical compliance matrix (one row per Annex B requirement: Comply / Partially comply / Not comply, with reference to proposal page)</td><td>1</td></tr>
    <tr><td>F-3</td><td>OEM authorization</td><td>1</td></tr>
    <tr><td>F-4</td><td>Experience and references</td><td>1</td></tr>
    <tr><td>F-5</td><td>Price schedule (Annex C, Appendix 2)</td><td>2</td></tr>
    <tr><td>F-6</td><td>Statement of deviations</td><td>1 and 2</td></tr>
    <tr><td>Annex A</td><td>Site layout drawings (T1, T2)</td><td>—</td></tr>
    <tr><td>Annex B</td><td>Technical specifications, site constraints and volumes (Excel)</td><td>—</td></tr>
    <tr><td>Annex C</td><td>Draft contract (General and Special Conditions, appendices)</td><td>—</td></tr>
  </table>
  <div class="sig"><div>For the Northern Gulf Ports Authority<br>Chair, Tender Committee</div><div>Issued: ${TENDER.issued}<br>Reference: ${TENDER.ref}</div></div>
</section>`;
  return doc(body, `${TENDER.ref} RFP`);
}
