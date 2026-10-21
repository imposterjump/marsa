# Test scenario: tender NGPA/T/2026/014 (fictional)

> **For humans only. Never upload this file into Marsa.** It describes the test corpus so we can judge the AI's output. The documents themselves contain no hints for the evaluator.

## Rules for the corpus (user decision, 2026-10-21)
1. **Don't help the AI.** Documents state requirements the way a real authority writes them. No evaluator notes, no "this is non-compliant" wording, no pre-computed answers.
2. **The RFP pack and the standards must not contradict each other.** The RFP main body, Annex B and Annex C are mutually consistent. Addendum No. 1 changes values only through explicit, labelled amendments ("RFP §3.3.1 is replaced by…"). The Phase 2 standards complement the RFP and never conflict with it.
3. **Vendor proposals are legitimate, coherent documents.** Each one is a plausible bid from a plausible company, with its own natural strengths and weaknesses. No planted tricks, translation tricks or injected instructions. Then we let the AI evaluate.

## The tender
The fictional *Northern Gulf Ports Authority* (with the *General Customs Directorate*) buys four high-energy cargo X-ray inspection systems for the fictional *Port of Al-Noor*:
- two drive-through lanes at T1 Gate A and Gate B;
- one at T2;
- one relocatable unit;
- plus a central image analysis centre (on-premise at the Customs Data Center), 20 workstations after Addendum No. 1, CRMS/TOS integration, training, a 24-month warranty and a 5-year maintenance contract.

| Document | Format | Phase built |
|---|---|---|
| RFP main document (13 pages) | PDF | 1 |
| Annex A-2: T2 site plan | PNG | 1 |
| Annex B: technical specifications, site constraints, volumes | XLSX (6 sheets) | 1 |
| Annex C: draft contract (GC + SC + appendices) | DOCX | 1 |
| Addendum No. 1 | PDF | 1 |
| Standards: IT Security & Data Residency · Equipment Safety & Environment · Commercial & Contract Terms | PDF/DOCX + rules | 2 |
| Vendor proposals: 4 bidders × (commercial + technical) | PDF/DOCX/XLSX | 4 |

Generator: `scripts/test-inputs/` (re-runnable; content lives in `content/*.ts`).

## Reviewer reference: what a careful evaluator should notice
These are facts *in the documents*, kept here to grade the AI later. They are not written into the documents as hints.

**Values that differ per site or were amended**
- Penetration: 310 mm at T1 (both gates), 300 mm at T2, 280 mm for the relocatable unit (RFP §4.1.1 = Annex B TB-01).
- Throughput: 180/h at T1 Gate A; 150/h elsewhere. The relocatable unit is 150/h in the RFP and Annex B, then reduced to **120/h** by Addendum A5.
- Workstations: 24 in the RFP and Annex B, changed to **20** by Addendum A2. Every workstation needs 2 × 27″ at ≥ 2560×1440.
- UPS for control systems and servers: 30 min, changed to **60 min** by Addendum A3. Workstations stay at 30 min.
- Closing date moved to 14 Dec 2026 (Addendum A1). Bid validity of 120 days counts from the new date.
- New **mandatory** Radiation Licensing Support Plan (Addendum A4).

**Rules that need reasoning or calculation**
- Storage: 1,170,000 scans/yr × 45 MB × 5 yr = 263.25 TB raw, × 1.2 headroom = **≈ 316 TB usable minimum** (RFP §4.6.3 + Annex B "Volumes & storage").
- T2 plot is 70 m × 28 m, and the controlled area must fit inside it. T2 power is 250 kVA; any excess must be reinforced at the bidder's cost (RFP §3.5.2).
- Warranty is 24 months **from PAC**. The Addendum Q2 exception applies only if PAC is delayed more than 60 days solely by the Employer. IT hardware warranty is 36 months (Annex C SC 9.2).
- Delay damages: SC 7.1 (0.1 %/day, cap 10 %) amends GC 7.2 (0.05 %/5 %).
- Evaluated price = CAPEX + CMC years 1–5 + priced deviations. Omitted items are priced at the highest other responsive bid. A 5 % domestic preference applies, and bids below 75 % of the average are abnormally low (RFP §7.3–7.6).
- Prices are DDP excluding VAT, and **no duty exemption** is granted (RFP §2.8.2 / GC 4.1).
- On-premise only, including licensing, telemetry and updates (RFP §4.6.1). A one-time *offline* activation is OK (Addendum Q3).
- Technical envelope must contain no prices (RFP §2.4.2); the minimum technical score is 70 (§7.1.2).

**Edge-case documents (Phase 1 folder)**
- *Arabic summary* (Nile Gate Solutions, bilingual, faithful translation): 290 mm penetration, 1920×1080 monitors, 0–45 °C, warranty from shipment, X-ray source excluded as a consumable, 3 engineers.
- *Scanned letter* (Atlas Port Technologies, image only): 90-day validity, assumes a duty exemption, liability capped at 15 %, 5-day maintenance training.

## Vendor proposals (Phase 4), as built
Files: `phase-4/proposals/N-Vendor-Commercial.pdf` (Envelope 2, 5 pages: F-1, F-5 price schedule, terms, F-6) and `N-Vendor-Technical.pdf` (Envelope 1, 8–11 pages: F-1, sections following the RFP, F-2 matrix for TB-01…TB-45, F-6). Generator: `scripts/test-inputs/content/proposals/*.ts`. All four bids acknowledge Addendum No. 1. None of them contains evaluator hints; each states its own offer the way that company would.

| Vendor | CAPEX (USD) | CMC 1–5 (USD) | Offer total (USD) |
|---|---|---|---|
| 1 Atlas Port Technologies | 19,366,400 | 2,843,628 (years 4–5 not priced) | 22,210,028 |
| 2 Nile Gate Solutions | 20,492,000 | 4,565,856 | 25,057,856 |
| 3 Harborline Systems | 24,794,000 | 4,194,217 | 28,988,217 |
| 4 Meridian Scan Technologies | 18,217,000 | 6,264,780 | 24,481,780 |

### Reviewer reference: what a careful evaluator should notice (never put in the documents)
**Harborline Systems (premium OEM).** Complies with every mandatory item, including the addendum (20 workstations, 60-min UPS, Radiation Licensing Support Plan). Storage 340 TB ≥ 316 TB. T2 fits (68 × 27 m, 238 kVA ≤ 250). Highest price. Claims 32 % local value added → 5 % preference. Dual-view is not offered on the relocatable unit (allowed: "Optional").
**Meridian Scan Technologies (cheapest CAPEX, highest CMC).**
- §6 says licences sync with **Meridian's cloud every 90 days**, with a 30-day grace period. Updates also come through the cloud gateway, and hourly health telemetry goes to an **EU-hosted** service. This conflicts with RFP §4.6.1 / TB-24 ("licensing servers, telemetry, monitoring and update services … on-premise"; Addendum Q3 allows only a *one-time offline* activation) and with CITS-2026 SEC-02. Meridian still marks TB-24 "Comply".
- Security patches come only twice a year (RFP §4.8.5 asks for quarterly; CITS SEC-08 asks for critical fixes within 14 days, while Meridian commits to 30).
- Not compliant on TB-06 dual-view (D) or TB-39 Hijri (D).
- Commercial deviation on payment terms: 20/50/20/10 vs SC 5.1, which accepts no other terms.
- Relocatable penetration 290 mm ≥ 280 mm is OK.

**Nile Gate Solutions (integrator, honest about gaps).** These match the Phase 1 Arabic summary, and Nile Gate declares them itself in F-2/F-6:
- 290 mm penetration (fails 310 at T1 and 300 at T2; OK for the relocatable unit).
- 160 trucks/h (fails 180 at T1 Gate A).
- 0–45 °C (fails 0–50).
- 1920 × 1080 monitors (fails 2560 × 1440).
- Warranty from **shipment**, not PAC.
- **X-ray source excluded** as a consumable (fails §6.1.2, GC 9.1, SC 18.4; an optional USD 410k per source is not in the totals).
- 3 engineers instead of 4.

Strengths: PAC at 8 months, Arabic training, 41 % local value added.

**Atlas Port Technologies (smaller OEM, incomplete).**
- Penetration is strong at 320 mm, but throughput is "up to 165 trucks/h", which **fails 180 at T1 Gate A**. Its F-2 says "Comply" because it copied the Rev 0 wording.
- **UPS 30 min** for servers misses Addendum A3 (60 min).
- 24 workstations (pre-addendum; over-supply, not a failure).
- **No Radiation Licensing Support Plan** (Addendum A4, mandatory).
- **No warranty/support section** in the technical proposal; F-2 rows TB-39 to TB-45 are blank.
- T1 Gate A trial operation is in **month 7**, which misses the month-6 milestone (§5.1.2, SC 7.2).
- Maintenance training is 5 days at a regional centre instead of 15 days at the OEM factory.
- Commercial issues:
  - 90-day validity (fails the 120 days required; the bid security is also short).
  - Prices exclude import duties on an assumed exemption (RFP §2.8.2: no exemption → the duties are added for evaluation, §7.3.3).
  - Liability capped at 15 % (GC 10.1: 100 %).
  - CMC years 4–5 not priced: omitted lines are priced at the highest other bid (§7.3.2).

These qualifications match the Phase 1 scanned letter.

## Second tender: NGPA/T/2026/021 Port Community System (Phase 6 bids)
Built by `scripts/test-inputs/build-phase-6.ts` into `test-inputs/phase-6/pcs-proposals/`. RFP: `phase-4/sample-pcs/PCS-RFP-NGPA-T-2026-021.pdf` (§3.1–3.9, §4.1–4.3, §5). Standard applied: CITS-2026 only. Reviewer notes, never uploaded:

| Bid | Implementation | Support (3 years) | Total |
|---|---|---|---|
| 1 Qasr Digital Systems | 3,480,000 | 1,230,000 | 4,710,000 |
| 2 Bluewave Port Software | 1,910,000 | 1,680,000 (Option A subscription) | 3,590,000 |
| 3 Corniche Logistics IT | 2,310,000 | 810,000 | 3,120,000 |

**Qasr Digital Systems (local integrator, fully compliant, highest price).** Both Authority data centres, offline licence; 99.8 %; load test 5,000 / 800 / 300,000 per day at p95 3.2 s; AD over LDAPS + MFA; CEF to the SIEM, 5-year logs; Authority PKI; 14/30-day patching; CREST pen test before go-live; VPN with recorded sessions; RPO/RTO 4 h; vetting; CycloneDX SBOM; integrations month 9, VBS month 11; severity 1 in 30 min / 4 h. Nothing material is missing.

**Bluewave Port Software (product vendor, managed service).**
- Base offer (Option A) is hosted in Manama, Bahrain, with disaster recovery in Dublin: fails RFP §3.1 and CITS-2026 SEC-01/SEC-02. Its matrix says "Comply (Option B)".
- Option B (on-premise) still contacts the Bluewave Update Service over the internet monthly for updates and licence entitlements: still fails SEC-02. Option B costs +520,000 one-time and 230,000 per year (not in the total).
- SAML federation with ADFS instead of AD over LDAPS (SEC-03 partial); certificates managed by Bluewave, not the Authority PKI (SEC-07 partial); audit logs kept 12 months and exported every 15 minutes through an API, not 5 years in real time via syslog/CEF (SEC-06); yearly platform pen test instead of a project test before go-live (SEC-09 partial); no VPN/session recording or vetting statement (SEC-10, SEC-12 not addressed); backups only in its own sites (SEC-11).
- Commercial: 90-day validity (RFP §5.3 asks 120); own subscription agreement with liability capped at 12 months of fees; CPI indexation.
- Strengths: fastest plan (integrations month 8, VBS month 9), 99.9 % SLA, large references.

**Corniche Logistics IT (lowest price, on-premise, several shortfalls).**
- On-premise with offline licences: hosting compliant.
- Availability 99.5 % (fails §3.2, 99.8 %); tested to 400 concurrent / 180,000 messages per day (fails §3.3 as offered; the upgrade is an optional 95,000 line, not in the total).
- Customs Risk Management System integration in month 13 (fails §4.1, 10 months); VBS and Android app month 12 (OK); iOS app month 18 (§3.8 desirable, partial).
- Severity 1: 2 h response / 8 h restoration (fails §4.3, 1 h / 4 h).
- SBOM only on request (SEC-13 partial); RPO 24 h / RTO 12 h; pen test excluded from the price (the Authority would contract it).
- Release lead-time reports "configured during implementation" (§3.7 partial at most).
- Commercial: 20 % advance payment against a guarantee.

A careful evaluator ranks Qasr first (only fully compliant bid), then has to choose between Bluewave (hosting fails a mandatory rule in both options) and Corniche (several mandatory performance shortfalls).

## POC tenders (meeting demo): NGPA/T/2026/031 Smart Gates and GCD/T/2026/047 e-Seals
Built by `scripts/test-inputs/build-poc.ts` into `test-inputs/poc-inputs/`. Each set has 1 standard (12 rules, pasted), a 4–5 page RFP and 2 two-envelope bids → 8 steps. Reviewer notes, never uploaded: the expected findings per vendor are in each set's README, section 5 "What a good result looks like".

| Set | Strong bid (total) | Cheaper bid with mandatory breaks (total) |
|---|---|---|
| 1 Smart Gates (POTS-2026) | Sahel Gate Technologies, USD 3,392,089: 60-day image retention, 3 % maintenance escalation, English-only maintenance manuals | Vector OCR Systems, USD 2,404,800: cloud plate OCR (Frankfurt), Arabic plates 94 % at ≤ 10 km/h, 70 s transactions, IP65 kiosks, no customs release check, 10 months, 12-month warranty, 90-day validity, foreign bank, next-business-day support, 30 % advance |
| 2 e-Seals (CTS-2026) | Trakom Security Solutions, USD 2,397,000: 99.5 % availability, 3 % spare pool | Orbis Track, USD 1,400,400: EU SaaS hosting, 21-day battery, 2-minute alerts, driver disarming, mobile data excluded, Hamburg bank guarantees, 4 h / 10-day service, plus partials |
