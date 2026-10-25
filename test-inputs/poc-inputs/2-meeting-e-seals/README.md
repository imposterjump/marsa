# POC set 2 (meeting): Electronic Seal Tracking System for Transit Cargo

**Format used:** PDF proposals, rules as Excel / CSV / text · **App:** free demo AI at http://localhost:3000, or live AI once `AI_MODE=live` (see the [overview](../README.md)).

## Files (all in this folder)
| File | What it is |
|---|---|
| `Standard-CTS-2026-rules.xlsx` | The standard's 12 rules as an Excel sheet (Code · Rule · Priority), to drop in **New standard** |
| `Standard-CTS-2026-rules.csv` / `.txt` | The same rules as CSV and as text (either can be dropped instead) |
| `RFP-GCD-T-2026-047.pdf` | The RFP, 4 pages, 29 numbered clauses + compliance matrix |
| `Vendor-1-Trakom-Security-Solutions-Technical.pdf` / `-Commercial.pdf` | Vendor 1: technical (4 p.) and commercial (2 p.) |
| `Vendor-2-Orbis-Track-Technical.pdf` / `-Commercial.pdf` | Vendor 2: technical (4 p.) and commercial (2 p.) |

**The proposals follow Mizan's 7-section template.** The technical proposal has sections 1–5:
1. Company and references;
2. Technical solution;
3. Security and data;
4. Implementation and timeline;
5. Support, warranty and SLA.

The commercial proposal has sections 6–7:
6. Commercial offer and pricing;
7. Terms and deviations.

So the results compare the two vendors section by section.

## 1. New project · Step 1 · Project
**Projects → New project**, then fill in:

| Field | Value |
|---|---|
| Project name | `Electronic Seal Tracking System for Transit Cargo` |
| Description | `Supply of 1,500 reusable GPS/GSM electronic seals, a transit monitoring platform with an officer mobile app, integration with the Customs Declaration System and 3 years of service. Tender GCD/T/2026/047.` |
| Category | **IT & security** |
| Submission deadline | **15 December 2026** (type `15/12/2026` or `12/15/2026`, in the order your date field shows) |
| Key requirements / notes | *leave empty* |

Then drop `RFP-GCD-T-2026-047.pdf` on **RFP documents**.

**Expected:**
- "Draft saved" appears under the title;
- the file shows "4 pages · AI-readable".

Click **Continue**.

## 2. Step 2 · Standards
Only standards of the project's category (**IT & security**) and **General** are listed.

1. Click **New standard** and fill in:

| Field | Value |
|---|---|
| Code | `CTS-2026` |
| Title | `Customs Transit Security Standard` |
| Category | **IT & security** (already selected) |
| Rules file | drop `Standard-CTS-2026-rules.xlsx` |

   **Expected:** "12 rules found", with TR-01 … TR-12. Their priorities are 6 mandatory, 5 important and 1 desirable (M / I / D).
2. Click **Create standard**. **CTS-2026** is now ticked in the list.
3. Untick every other standard, so only **CTS-2026** stays ticked. This matters if you rehearsed on the same server: **POTS-2026** is ticked too.
4. Click **Continue**.

**If CTS-2026 already exists** (a second run on the same server), skip **New standard** and just tick it.

## 3. Step 3 · Vendors
Fill in the vendor form, drop the two files, and click **Save vendor**. Then click **Add another vendor** for the second one.

| Field | Vendor 1 | Vendor 2 |
|---|---|---|
| Company name | `Trakom Security Solutions` | `Orbis Track` |
| Country | `Northern Gulf State` | `Germany` |
| Contact name | `Rashid Al-Balushi` | `Lena Brandt` |
| Contact email | `bids@trakom.example` | `tenders@orbistrack.example` |
| Commercial proposal | `Vendor-1-Trakom-Security-Solutions-Commercial.pdf` | `Vendor-2-Orbis-Track-Commercial.pdf` |
| Technical proposal | `Vendor-1-Trakom-Security-Solutions-Technical.pdf` | `Vendor-2-Orbis-Track-Technical.pdf` |

If the company already exists from an earlier run, typing its name reuses it, and a note says so.

Click **Create project**. The project page opens with the project ready to analyse.

## 4. Run the AI analysis
1. Click **Run AI analysis** in the project header. In live mode a dialog first shows the estimate:

   | Model | Cost | Time |
   |---|---|---|
   | Haiku | ≈ $0.07 | ≈ 4 min |
   | Sonnet | ≈ $0.86 | ≈ 4 min |

2. The **AI analysis results** page opens, and the sidebar folds away. Mission control shows the 10 steps live:
   - **Checklist:** the RFP requirements and the 12 rules, each filed under a proposal section.
   - **Standards:** each vendor against CTS-2026.
   - **RFP:** each vendor against the RFP.
   - **Risk:** each vendor's risk register.
   - **Recommendation.**
   - **Reports:** a consultant report on each vendor.
   - While it runs, open another page: the top-bar pill follows the run, and a toast says when it ends.
   - **Cancel** stops the run; finished steps stay saved, and **Resume** continues.
3. **Later vendors:** you can add a vendor afterwards (**Proposals → Add vendor**) and click **Run a new analysis**. Earlier analyses stay available under **Latest analysis ▾**.

## 5. What a good result looks like
Use this to judge a live run. Nothing here is uploaded.
- **Overview:** Trakom Security Solutions is recommended, with:
  - a high Standards % and RFP %;
  - a low risk score (under 50, "low" or "moderate").

  Orbis Track has a much lower Standards % and a high or critical risk score. Orbis is much cheaper, though: USD 1,400,400 against USD 2,397,000, before Orbis's mobile-data charges. It also promises a faster rollout (month 5 instead of 6) and 99.9 % availability.
- **Trakom: small gaps.**
  - 99.5 % availability instead of 99.7 % (RFP 4.6, section 5).
  - A spare pool of 45 seals (3 %) instead of at least 5 % (RFP 5.3, section 5).
- **Orbis: several mandatory breaks.**
  - **Cloud:** a SaaS platform in Frankfurt and Amsterdam, with only a read-only copy in the State (RFP 4.5, CTS-2026 TR-01, section 3).
  - **Battery:** 21 days at 5-minute reporting instead of 30 (3.2).
  - **Tamper alerts:** "typically within 2 minutes" instead of 60 s (3.4, TR-03).
  - **Disarming:** drivers can disarm with an SMS code (3.5).
  - **Mobile data:** not included (5.4, TR-11).
  - **Guarantees:** bid and performance securities from a Hamburg bank (6.3, 6.4, TR-12, section 7).
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
- **RFP and Standards tabs:**
  - **Security & data** should show the widest gap between the two vendors.
  - Click a vendor's header to open its card (only the first is open). **By section** shows each section's points; the red **Point list** shows all of them, worst first, with Status / Type / Section dropdowns.
  - Click **Technical … p. N** to open the vendor's sentence highlighted. Click the RFP chip to open the clause. Click a **TR-…** rule to see it in a side panel.
- **Risks tab:** Orbis's register should include data sovereignty, undetected tampering and the cost of unpriced mobile data, mostly under sections 2, 3 and 5.
- **Comparison tab:** tick both vendors, click **Compare 2 vendors**. Sections 2, 3 and 5 should list the most differences.
- **Reports tab:** Trakom should be the **Preferred bidder** and Orbis **Not recommended**. **View** opens the 2-page PDF; **Download PDF** saves it.
