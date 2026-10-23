# POC set 4 (three vendors): Laboratory Information Management System (LIMS)

**Format used:** PDF proposals, rules as Excel / CSV / text · **App:** http://localhost:3000 (see the [overview](../README.md)).

**What it shows:**
- three vendors, in the category **Quality**, so the standards step lists a different set from sets 1–3;
- a software tender, where data integrity, validation and hosting decide more than the price.

## Files (all in this folder)
| File | What it is |
|---|---|
| `Standard-CLQS-2026-rules.xlsx` | The standard's 12 rules as an Excel sheet (Code · Rule · Priority), to drop in **New standard** |
| `Standard-CLQS-2026-rules.csv` / `.txt` | The same rules as CSV and as text (either can be dropped instead) |
| `RFP-GCD-T-2026-061.pdf` | The RFP, 5 pages, 32 numbered clauses + compliance matrix |
| `Vendor-1-Qalamra-Lab-Systems-Technical.pdf` / `-Commercial.pdf` | Vendor 1: technical (4 p.) and commercial (2 p.) |
| `Vendor-2-Veridane-Informatics-Technical.pdf` / `-Commercial.pdf` | Vendor 2: technical (4 p.) and commercial (2 p.) |
| `Vendor-3-Corvantis-Business-Software-Technical.pdf` / `-Commercial.pdf` | Vendor 3: technical (4 p.) and commercial (2 p.) |

**The proposals follow the 7-section template:**
- technical = 1 Company and references · 2 Technical solution · 3 Security and data · 4 Implementation and timeline · 5 Support, warranty and SLA;
- commercial = 6 Commercial offer and pricing · 7 Terms and deviations.

## 1. New project · Project
**Projects → New project**, then fill in:

| Field | Value |
|---|---|
| Project name | `Laboratory Information Management System (LIMS)` |
| Description *(optional)* | `LIMS for the Central Customs Laboratory: 45 users, 14 instrument interfaces, integration with the Customs Declaration System, validation, training and 3 years of support. Tender GCD/T/2026/061.` |
| Category | **Quality** |
| Submission deadline *(optional)* | **17 December 2026** (type `17/12/2026` or `12/17/2026`, in the order your date field shows) |

Then drop `RFP-GCD-T-2026-061.pdf` on **RFP documents**. **Expected:** "5 pages · AI-readable". Click **Continue**.

## 2. Standards
Only **Quality** and **General** standards are listed.

1. Click **New standard** and fill in:

| Field | Value |
|---|---|
| Code | `CLQS-2026` |
| Title | `Customs Laboratory Quality Standard` |
| Category | **Quality** (already selected) |
| Rules file | drop `Standard-CLQS-2026-rules.xlsx` |

   **Expected:** "12 rules found", LQ-01 … LQ-12. Their priorities are 6 mandatory, 5 important and 1 desirable.
2. Click **Create standard**. **CLQS-2026** is ticked, and its card reads **12 rules · 6 mandatory**.
3. Click **Continue**.

## 3. Vendors
For each vendor: fill in the form, drop the two files, click **Save vendor**. Click **Add another vendor** for the next one. Only the company name is required.

| Field | Vendor 1 | Vendor 2 | Vendor 3 |
|---|---|---|---|
| Company name | `Qalamra Lab Systems` | `Veridane Informatics` | `Corvantis Business Software` |
| Country | `Northern Gulf State` | `Netherlands` | `Cyprus` |
| Contact name | `Sara Al-Hashimi` | `Thomas de Groot` | `Andreas Michaelides` |
| Contact email | `bids@qalamra.example` | `tenders@veridane.example` | `sales@corvantis.example` |
| Commercial proposal | `Vendor-1-Qalamra-Lab-Systems-Commercial.pdf` | `Vendor-2-Veridane-Informatics-Commercial.pdf` | `Vendor-3-Corvantis-Business-Software-Commercial.pdf` |
| Technical proposal | `Vendor-1-Qalamra-Lab-Systems-Technical.pdf` | `Vendor-2-Veridane-Informatics-Technical.pdf` | `Vendor-3-Corvantis-Business-Software-Technical.pdf` |

Click **Create project**.

## 4. Run the AI analysis
Click **Run AI analysis**. It runs **11 steps**:
- 1 checklist;
- 3 standards checks;
- 3 RFP checks;
- 3 risk registers;
- 1 recommendation.

| Model | Cost | Time |
|---|---|---|
| Haiku | ≈ $0.08 | ≈ 4–5 min |
| Sonnet | ≈ $0.92 | — |
| Opus | ≈ $2.05 | — |

## 5. What a good result looks like
For judging the run. Nothing here is uploaded.
- **Ranking:**
  - **Qalamra Lab Systems** recommended, despite the highest price (USD 832,000), with a low risk score.
  - **Veridane Informatics** second (USD 604,435), with a high risk score.
  - **Corvantis Business Software** last but by far the cheapest (USD 160,000), with a critical risk score.
- **Qalamra: small gaps.**
  - 2 Karl Fischer titrators entered by hand (RFP 2.2, 4.4, CLQS-2026 LQ-05).
  - CDS results exchanged by a nightly file instead of real-time REST (4.5).
  - Administrator training for 2 key users instead of 3 (5.3).
- **Veridane: hosting, validation and contract breaks.**
  - **Hosting:** an EU public cloud (Ireland) instead of the Directorate's data centre (4.1, LQ-06, mandatory).
  - **Validation:** the vendor runs IQ/OQ, but PQ is left to the laboratory (5.2, LQ-07, mandatory).
  - **Records and support:**
    - audit trail kept only for the subscription term instead of 10 years (4.2, LQ-01);
    - response within 8 business hours in CET instead of 4 hours (5.4, LQ-11).
  - **Commercial and contract:**
    - 30 % at signature with no advance-payment guarantee (7.2);
    - bid validity of 90 days instead of 120 (7.4);
    - bid and performance securities from a Dutch bank (7.3, 7.4);
    - a subscription indexed to inflation (7.1).
- **Corvantis: many mandatory breaks.**
  - **Audit trail:** only result changes are logged, kept 24 months, with no reason recorded (4.2, LQ-01).
  - **Approval:** one approval step, with no electronic signature (3.4, LQ-02).
  - **Chain of custody:** none described (3.1, LQ-03).
  - **Instruments:** no interfaces, results typed in (2.2, 4.4, LQ-05).
  - **Accreditation records:** no ISO/IEC 17025 records (3.6, LQ-04).
  - **Validation:** none offered (5.2, LQ-07).
  - **Warranty:** 6 months (5.5, LQ-12).
  - **References:** a single non-accredited laboratory (6.1).
  - **Commercial and service:**
    - certificates in English only (3.5, LQ-10);
    - next-business-day support (5.4, LQ-11);
    - 50 % with the order (7.2).
