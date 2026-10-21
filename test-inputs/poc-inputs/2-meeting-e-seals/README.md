# POC set 2 (meeting): Electronic Seal Tracking System for Transit Cargo

**Format used:** PDF only · **App:** live AI at http://localhost:3001 (or free demo AI at http://localhost:3000).

## Files (all in this folder)
| File | What it is |
|---|---|
| `Standard-CTS-2026-rules.txt` | The 12 rules to paste (the same block is below) |
| `RFP-GCD-T-2026-047.pdf` | The RFP, 4 pages, 29 numbered clauses + compliance matrix |
| `Vendor-1-Trakom-Security-Solutions-Technical.pdf` / `-Commercial.pdf` | Vendor 1: technical (4 p.) and commercial (2 p.) |
| `Vendor-2-Orbis-Track-Technical.pdf` / `-Commercial.pdf` | Vendor 2: technical (4 p.) and commercial (2 p.) |

## 1. Create the standard
1. **Standards → New standard**, then fill in:

| Field | Value |
|---|---|
| Code | `CTS-2026` |
| Title | `Customs Transit Security Standard` |
| Category | **IT & security** (already selected) |
| Description | `Security, data and service requirements for the electronic tracking of goods under customs transit, including e-seals, tracking platforms and their suppliers. Issued by the General Customs Directorate, Risk & Transit Control Department (v2.0, April 2026).` |
| Active | On |

2. Click **Create standard**.
3. Click **Paste rules**, paste this whole block and click **Add 12 rules**:

```text
TR-01 | Tracking data, alerts and audit records shall be stored and processed only within the State, on infrastructure controlled by the Directorate; foreign or public cloud hosting is not permitted. | mandatory
TR-02 | Electronic seals shall be certified to ISO 17712 as high-security (H) seals by an accredited laboratory, and the certificate shall be submitted with the bid. | mandatory
TR-03 | Tampering with, opening or cutting a seal shall be detected and alerted to the monitoring centre within 60 seconds. | mandatory
TR-04 | Seals shall report their position at least every 5 minutes while moving; every position and event shall carry a time stamp that cannot be altered. | important
TR-05 | Seals shall keep events in memory when out of mobile coverage and send them automatically when coverage returns. | mandatory
TR-06 | The link between seals and the platform shall be encrypted with AES-128 or stronger; users and integrations shall connect over TLS 1.2 or higher. | mandatory
TR-07 | Officers and operators shall sign in through the Directorate's Active Directory with multi-factor authentication. | important
TR-08 | Every arming, disarming and alert acknowledgement shall be recorded with the officer's identity, place and time, and kept for 5 years. | important
TR-09 | Seals shall operate from −10 °C to +60 °C and be rated IP67 or better. | important
TR-10 | User interfaces and training shall be available in Arabic and English. | desirable
TR-11 | Mobile data for the seals shall be included in the supplier's price for the whole service period. | important
TR-12 | Bid and performance securities shall be issued by a bank licensed in the State; the performance security shall be at least 10 % of the contract price. | mandatory
```

   **Expected:** the header reads **12 rules · 6 mandatory · 5 important · 1 desirable**.

## 2. Create and publish the project
1. **Projects → New project**. **Step 1 · Details:**

| Field | Value |
|---|---|
| Project name | `Electronic Seal Tracking System for Transit Cargo` |
| Description | `Supply of 1,500 reusable GPS/GSM electronic seals, a transit monitoring platform with an officer mobile app, integration with the Customs Declaration System and 3 years of service. Tender GCD/T/2026/047.` |
| Category | **IT & security** |
| Submission deadline | **15 December 2026** (type `15/12/2026` or `12/15/2026`, in the order your date field shows) |
| Key requirements / notes | *leave empty* |

   Click **Continue**.
2. **Step 2 · RFP documents:** drop `RFP-GCD-T-2026-047.pdf`. **Expected:** "4 pages · AI-readable". Click **Continue**.
3. **Step 3 · Standards:** click **None**, then tick only **CTS-2026**. **Expected:** "1 of N selected". This matters if you rehearsed on the same server: POTS-2026 is pre-ticked too. Click **Continue**.
4. **Step 4 · Review & publish:** click **Publish to vendors**.

## 3. Submit the two vendors
**Proposals** tab → **Simulate a vendor submission**. Fill in the form, then click **Submit proposal**. Do it once per vendor.

| Field | Vendor 1 | Vendor 2 |
|---|---|---|
| Vendor | **New vendor** | **New vendor** |
| Company name | `Trakom Security Solutions` | `Orbis Track` |
| Country | `Northern Gulf State` | `Germany` |
| Contact name | `Rashid Al-Balushi` | `Lena Brandt` |
| Contact email | `bids@trakom.example` | `tenders@orbistrack.example` |
| Commercial proposal | `Vendor-1-Trakom-Security-Solutions-Commercial.pdf` | `Vendor-2-Orbis-Track-Commercial.pdf` |
| Technical proposal | `Vendor-1-Trakom-Security-Solutions-Technical.pdf` | `Vendor-2-Orbis-Track-Technical.pdf` |

If you have already run this set once on the same server, choose **Existing vendor** and pick the company instead.

## 4. Analyse & process
1. Back on **Proposals**, the **Analyse & process** panel shows **2 proposals · CTS-2026 · Steps 8 (3 × 2 + 2)**, plus the time and cost. Live mode estimates ≈ $0.04 on Haiku and ≈ $0.73 on Sonnet.
2. Click **Analyse & process**, then **Start analysis** in the confirmation. Mission control shows the 8 steps live. About 2.5 minutes on Haiku, 3.5 on Sonnet.
   - While it runs, open another page: the top-bar pill follows the run, and a toast says when it ends.
   - **Cancel** stops the run; finished steps stay saved, and **Resume** continues.

## 5. What a good result looks like
Use this to judge the live run. Nothing here is uploaded.
- **Ranking:** Trakom Security Solutions first and recommended.
  - Orbis is much cheaper: USD 1,400,400 against USD 2,397,000, before Orbis's mobile-data charges. Orbis also promises a faster rollout (month 5 instead of 6) and 99.9 % availability.
- **Trakom: small gaps.**
  - 99.5 % availability instead of 99.7 % (RFP 4.6).
  - A spare pool of 45 seals (3 %) instead of at least 5 % (RFP 5.3).
- **Orbis: several mandatory breaks.**
  - **Cloud:** a SaaS platform in Frankfurt and Amsterdam, with only a read-only copy in the State (RFP 4.5, CTS-2026 TR-01).
  - **Battery:** 21 days at 5-minute reporting instead of 30 (3.2).
  - **Tamper alerts:** "typically within 2 minutes" instead of 60 s (3.4, TR-03).
  - **Disarming:** drivers can disarm with an SMS code (3.5).
  - **Mobile data:** not included (5.4, TR-11).
  - **Guarantees:** bid and performance securities from a Hamburg bank (6.3, 6.4, TR-12).
  - **Service:** 4-hour response, 10-day seal replacement and no spare pool mentioned (5.3).
  - **Partial findings:**
    - 5,000 offline events instead of 10,000 (3.3);
    - Arabic app only in Q3 2027 (4.3, TR-10);
    - CSV export only (4.4);
    - MFA not stated (TR-07);
    - records kept 24 months instead of 5 years (TR-08);
    - officers trained by the Directorate's own trainers (5.2);
    - CPI-indexed subscription (6.1);
    - 40 % at contract signature (6.2).
- **Evidence:** on any finding, click **Page N**: the vendor's sentence opens highlighted. Click an **RFP §…** or **CTS-2026 TR-…** chip under **Breaks**: it opens that clause or rule.
- **Risk:** Orbis's register should include data sovereignty, undetected tampering and the cost of unpriced mobile data.
