# POC set 1 (rehearsal): Smart Gate Automation, Container Terminal 2

**Format used:** PDF proposals, rules as Excel / CSV / text · **App:** free demo AI at http://localhost:3000, or live AI once `AI_MODE=live` (see the [overview](../README.md)).

## Files (all in this folder)
| File | What it is |
|---|---|
| `Standard-POTS-2026-rules.xlsx` | The standard's 12 rules as an Excel sheet (Code · Rule · Priority), to drop in **New standard** |
| `Standard-POTS-2026-rules.csv` / `.txt` | The same rules as CSV and as text (either can be dropped instead) |
| `RFP-NGPA-T-2026-031.pdf` | The RFP, 5 pages, 31 numbered clauses + compliance matrix |
| `Vendor-1-Sahel-Gate-Technologies-Technical.pdf` / `-Commercial.pdf` | Vendor 1: technical (4 p.) and commercial (2 p.) |
| `Vendor-2-Vector-OCR-Systems-Technical.pdf` / `-Commercial.pdf` | Vendor 2: technical (4 p.) and commercial (2 p.) |

**The proposals follow Marsa's 7-section template.** The technical proposal has sections 1–5:
1. Company and references;
2. Technical solution;
3. Security and data;
4. Implementation and timeline;
5. Support, warranty and SLA.

The commercial proposal has sections 6–7:
6. Commercial offer and pricing;
7. Terms and deviations.

## 1. New project · Step 1 · Project
**Projects → New project**, then fill in:

| Field | Value |
|---|---|
| Project name | `Smart Gate Automation — Container Terminal 2` |
| Description | `Supply, installation and maintenance of OCR portals, RFID readers, self-service kiosks and a Gate Operating System for the 6 truck lanes of Container Terminal 2. Tender NGPA/T/2026/031.` |
| Category | **IT & security** |
| Submission deadline | **30 November 2026** (type `30/11/2026` or `11/30/2026`, in the order your date field shows) |
| Key requirements / notes | *leave empty* |

Then drop `RFP-NGPA-T-2026-031.pdf` on **RFP documents**.

**Expected:**
- "Draft saved" appears under the title;
- the file shows "5 pages · AI-readable".

Click **Continue**.

## 2. Step 2 · Standards
1. Click **New standard** and fill in:

| Field | Value |
|---|---|
| Code | `POTS-2026` |
| Title | `Port Operational Technology Standard` |
| Category | **IT & security** (already selected) |
| Rules file | drop `Standard-POTS-2026-rules.xlsx` |

   **Expected:** "12 rules found", with OT-01 … OT-12. Their priorities are 5 mandatory, 6 important and 1 desirable.
2. Click **Create standard**. **POTS-2026** is now ticked in the list.
3. Untick every other standard, so only **POTS-2026** stays ticked.
4. Click **Continue**.

**If POTS-2026 already exists**, skip **New standard** and just tick it.

**Also try:** **Skip** leaves the project with no standard. The analysis then checks the RFP only (6 steps instead of 8), and the results show no Standards column.

## 3. Step 3 · Vendors
Fill in the vendor form, drop the two files, and click **Save vendor**. Then click **Add another vendor** for the second one.

| Field | Vendor 1 | Vendor 2 |
|---|---|---|
| Company name | `Sahel Gate Technologies` | `Vector OCR Systems` |
| Country | `Northern Gulf State` | `Netherlands` |
| Contact name | `Faisal Al-Hinai` | `Joost van Dijk` |
| Contact email | `tenders@sahelgate.example` | `bids@vectorocr.example` |
| Commercial proposal | `Vendor-1-Sahel-Gate-Technologies-Commercial.pdf` | `Vendor-2-Vector-OCR-Systems-Commercial.pdf` |
| Technical proposal | `Vendor-1-Sahel-Gate-Technologies-Technical.pdf` | `Vendor-2-Vector-OCR-Systems-Technical.pdf` |

Click **Create project**. The project page opens.

**To rehearse adding a vendor later:** save only Sahel here and create the project. Then add Vector under **Proposals → Add vendor**.

## 4. Run the AI analysis
1. Click **Run AI analysis**. In live mode a dialog first shows the estimate:

   | Model | Cost | Time |
   |---|---|---|
   | Haiku | ≈ $0.03 | ≈ 2 min |
   | Sonnet | ≈ $0.66 | ≈ 3 min |

2. The **AI analysis results** page opens (the sidebar folds away). Mission control shows the 8 steps live: Checklist → Standards → RFP → Risk → Recommendation.
3. When it ends, the tabs appear: **Overview · Compliance · Risks · Comparison · AI quality**.

## 5. What a good result looks like
Use this to judge a live run. Nothing here is uploaded.
- **Overview:** Sahel Gate Technologies is recommended, with a lower risk score than Vector. Sahel is dearer, though: USD 3,392,089 against USD 2,404,800 for Vector. Vector's figure leaves out a cloud subscription of USD 46,000 a year and options.
- **Sahel: small gaps.**
  - Damage images are kept online 60 days instead of 90 (RFP 3.2).
  - Maintenance prices escalate 3 % a year instead of being fixed (RFP 6.1, POTS-2026 OT-12, section 6).
  - The maintenance manuals are in English only (OT-10).
- **Vector: several mandatory breaks.**
  - **Cloud:** licence-plate OCR runs in VectorVision Cloud in Frankfurt, through an internet connection (RFP 3.8, OT-01, OT-02, section 3).
  - **OCR:** Arabic plates 94 % instead of 97 %, and valid only up to 10 km/h (3.1).
  - **Gate time:** 70 s per transaction instead of 60 s (3.4).
  - **Kiosks:** IP65 and 0–50 °C (3.10, OT-05).
  - **Customs release:** offered only as a change request (3.7).
  - **Delivery:** all lanes at month 9–10 instead of 8 (4.1, section 4).
  - **Warranty:** 12 months instead of 24 (5.1, OT-08, section 5).
  - **Bid:** valid 90 days instead of 120, with a bid security from a Rotterdam bank (6.4, section 7).
  - **Smaller items:**
    - support next business day (5.3, OT-07);
    - a 30 % advance (6.2, OT-11);
    - UPS for 15 minutes (OT-06);
    - SIEM log forwarding not mentioned (OT-04);
    - no roof camera (3.2).
- **Compliance tab:** open a vendor's row in a section to see its points, shortfalls first. In each point:
  - **Technical … p. N** opens the vendor's sentence highlighted;
  - the RFP chip opens the clause;
  - an **OT-…** rule opens in the standard.
- **Risks tab:** Vector's register should include data leaving the country, warranty exposure and a delivery delay.
- **Comparison tab:** tick both vendors and click **Compare 2 vendors**. Only the points where they differ are listed, section by section.
