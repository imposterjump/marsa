# POC set 3 (three vendors): Air Quality and Noise Monitoring Network

**Format used:** PDF proposals, rules as Excel / CSV / text · **App:** http://localhost:3000 (free demo AI, or live AI once `AI_MODE=live`, see the [overview](../README.md)).

**What it shows that sets 1 and 2 don't:**
- **Three vendors**, so the Comparison tab compares 2 or 3 at once.
- A **different category**, Safety & environment. The standards step lists different standards from sets 1 and 2.

## Files (all in this folder)
| File | What it is |
|---|---|
| `Standard-PEMS-2026-rules.xlsx` | The standard's 12 rules as an Excel sheet (Code · Rule · Priority), to drop in **New standard** |
| `Standard-PEMS-2026-rules.csv` / `.txt` | The same rules as CSV and as text (either can be dropped instead) |
| `RFP-NGPA-T-2026-052.pdf` | The RFP, 5 pages, 32 numbered clauses + compliance matrix |
| `Vendor-1-Sabkha-Environmental-Systems-Technical.pdf` / `-Commercial.pdf` | Vendor 1: technical (4 p.) and commercial (2 p.) |
| `Vendor-2-Nimbrel-Sensing-Technical.pdf` / `-Commercial.pdf` | Vendor 2: technical (4 p.) and commercial (2 p.) |
| `Vendor-3-Kaltenmoor-Messtechnik-Technical.pdf` / `-Commercial.pdf` | Vendor 3: technical (4 p.) and commercial (2 p.) |

**The proposals follow the 7-section template:**
- technical = 1 Company and references · 2 Technical solution · 3 Security and data · 4 Implementation and timeline · 5 Support, warranty and SLA;
- commercial = 6 Commercial offer and pricing · 7 Terms and deviations.

## 1. New project · Project
**Projects → New project**, then fill in:

| Field | Value |
|---|---|
| Project name | `Air Quality and Noise Monitoring Network` |
| Description *(optional)* | `Six air-quality stations, four noise terminals, a data platform with a public dashboard, and 3 years of operation and maintenance for the Port of Al-Noor and the Al-Sahil district. Tender NGPA/T/2026/052.` |
| Category | **Safety & environment** |
| Submission deadline *(optional)* | **10 December 2026** (type `10/12/2026` or `12/10/2026`, in the order your date field shows) |

Then drop `RFP-NGPA-T-2026-052.pdf` on **RFP documents**. **Expected:** "5 pages · AI-readable". Click **Continue**.

## 2. Standards
Only **Safety & environment** and **General** standards are listed, so the CTS-2026 / POTS-2026 standards of sets 1 and 2 don't show here.

1. Click **New standard** and fill in:

| Field | Value |
|---|---|
| Code | `PEMS-2026` |
| Title | `Port Environmental Monitoring Standard` |
| Category | **Safety & environment** (already selected) |
| Rules file | drop `Standard-PEMS-2026-rules.xlsx` |

   **Expected:** "12 rules found", EM-01 … EM-12. Their priorities are 6 mandatory, 5 important and 1 desirable.
2. Click **Create standard**. **PEMS-2026** is ticked, and its card reads **12 rules · 6 mandatory**.
3. Click **Continue**.

## 3. Vendors
For each vendor: fill in the form, drop the two files, click **Save vendor**. Click **Add another vendor** for the next one. Only the company name is required.

| Field | Vendor 1 | Vendor 2 | Vendor 3 |
|---|---|---|---|
| Company name | `Sabkha Environmental Systems` | `Nimbrel Sensing` | `Kaltenmoor Messtechnik` |
| Country | `Northern Gulf State` | `United Kingdom` | `Germany` |
| Contact name | `Huda Al-Rashdi` | `Oliver Grant` | `Jana Weiss` |
| Contact email | `tenders@sabkha-env.example` | `bids@nimbrel.example` | `tender@kaltenmoor.example` |
| Commercial proposal | `Vendor-1-Sabkha-Environmental-Systems-Commercial.pdf` | `Vendor-2-Nimbrel-Sensing-Commercial.pdf` | `Vendor-3-Kaltenmoor-Messtechnik-Commercial.pdf` |
| Technical proposal | `Vendor-1-Sabkha-Environmental-Systems-Technical.pdf` | `Vendor-2-Nimbrel-Sensing-Technical.pdf` | `Vendor-3-Kaltenmoor-Messtechnik-Technical.pdf` |

Click **Create project**.

## 4. Run the AI analysis
1. Click **Run AI analysis**. It runs **14 steps**:
   - 1 checklist;
   - 3 standards checks;
   - 3 RFP checks;
   - 3 risk registers;
   - 1 recommendation;
   - 3 consultant reports.
2. In live mode the confirmation shows the estimate:

   | Model | Cost | Time |
   |---|---|---|
   | Haiku | ≈ $0.11 (real Haiku run: $0.09, then $0.03 for the 3 reports) | ≈ 5 min |
   | Sonnet | ≈ $1.33 | ≈ 4 min |
   | Opus | ≈ $2.92 | ≈ 7 min |

## 5. What a good result looks like
For judging the run. Nothing here is uploaded. Checked on one real Haiku run (2026-10-23).
- **Ranking:**
  - **Sabkha Environmental Systems**, recommended. It is the most expensive at USD 2,446,848. Haiku gave it ≈ 95 % Standards and a low risk score (≈ 19).
  - **Kaltenmoor Messtechnik**, second at USD 2,174,200, with a high risk score (≈ 50).
  - **Nimbrel Sensing**, last but by far the cheapest at USD 552,600, with a critical risk score (≈ 85).
- **Sabkha: small gaps.**
  - UPS of 1 hour instead of 2 (RFP 3.4).
  - No audio recording of noise exceedances mentioned (3.3).
  - Operation and maintenance prices escalate 2.5 % a year instead of being fixed (7.1).
- **Kaltenmoor: service and delivery gaps.**
  - **Calibration:** full calibration every 6 months instead of 3 (RFP 5.2, PEMS-2026 EM-04, mandatory).
  - **Response:** engineer on site within 5 working days, spares shipped from Germany (5.3, EM-11).
  - **Delivery:** acceptance in month 8 instead of 6 (5.1).
  - **Alarms:** checked every 15 minutes, e-mail only (4.3, EM-06).
  - **Shelters:** IP54 instead of IP55 (3.4, EM-08).
  - **Dashboard and training:** no Arabic dashboard yet (4.5, EM-10); training for 4 staff in English at the factory (5.5).
  - **Local presence:** no office in the State, only a regional team (6.2).
- **Nimbrel: many mandatory breaks.**
  - **Particulates:** indicative sensors, not EN 16450 equivalent (3.1, EM-01).
  - **Gases:** electrochemical sensors, not the EN reference methods (3.2, EM-02).
  - **Noise:** Class 2 noise meters (3.3, EM-07).
  - **Hosting:** EU public cloud and 5-year retention (4.1, EM-05).
  - **Calibration:** no traceable 3-monthly calibration (5.2, EM-04).
  - **Warranty:** 12 months (5.4, EM-12).
  - **Payment:** 50 % with the order (7.2).
  - **Guarantees:** bank guarantees from a London bank (7.3, 7.4).
- **RFP and Standards tabs:** all 7 sections (By section), or every point in one list (the red **Point list**, with Status / Type / Section dropdowns per vendor).
  - **Technical solution** holds most points.
  - **Company & references** holds the qualification clauses 6.1 and 6.2.
  - **Commercial offer & pricing** and **Terms & deviations** hold the payment, price and guarantee clauses.
- **Comparison tab:** tick all 3 vendors, then **Compare 3 vendors**. Each section heads its columns with the vendor names.
- **Risks tab:** open a risk and click **View more**:
  - the RFP clause or the PEMS-2026 rule opens from **About**;
  - the vendor's page opens from **Evidence**;
  - **…see its points** jumps to the section in the RFP or Standards tab.
  - The red **Risk list** shows all of a vendor's risks, worst first, with Severity / Type / Section dropdowns.
- **Reports tab** (real Haiku reports, 2026-10-25): Sabkha **Preferred bidder**, Kaltenmoor and Nimbrel **Not recommended**. Each report is 2 pages and cites requirement codes and proposal pages; Sabkha's flags the Annex A "Comply" claims its own text contradicts.
