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

## Vendor proposals (Phase 4), planned profiles
Four plausible bidders, each a coherent proposal with a commercial file (PDF, price schedule in the F-5 structure) and a technical file (DOCX or PDF, with an F-2 compliance matrix):

| Vendor (fictional) | Profile | Natural characteristics |
|---|---|---|
| Harborline Systems | Established OEM, premium | Strong technical compliance, highest CAPEX, full local support |
| Meridian Scan Technologies | Cost-competitive OEM | Lowest CAPEX, higher CMC, cloud-centric software heritage |
| Nile Gate Solutions | Regional integrator (OEM partner) | Good delivery time and local presence, some lower specs (see the Arabic summary) |
| Atlas Port Technologies | Smaller OEM | Incomplete in places, commercial qualifications (see the scanned letter) |

The final proposal texts will be written in Phase 4 as real bids: what each company would actually offer, without planted traps.
