# Phase 4 — Test guide

**App:** http://localhost:3000 · **Format used:** PDF only

Phase 4 delivers the **vendor side**:
- a **Vendor simulator** page that plays a vendor submitting a commercial and a technical proposal;
- the project's **Proposals** table (vendor, proposal date, documents, View);
- a first **proposal page** with Commercial and Technical tabs;
- **Settings → Demo tools**: load or remove sample data, and reset everything.

> The four proposals are fictional but written like real bids. Each one answers the Phase 1 RFP (and Addendum No. 1) in the RFP's own forms: F-1 letter, F-2 compliance matrix, F-5 price schedule and F-6 deviations. Every bidder has its own natural strengths and weaknesses. Nothing in them is written for the evaluator. Human-only grading notes are in `test-inputs/SCENARIO.md`; never upload that file.

## Files
| # | Vendor | Commercial (Envelope 2) | Technical (Envelope 1) |
|---|---|---|---|
| 1 | Atlas Port Technologies | `proposals/1-Atlas-Port-Technologies-Commercial.pdf` (5 p.) | `proposals/1-Atlas-Port-Technologies-Technical.pdf` (8 p.) |
| 2 | Nile Gate Solutions | `proposals/2-Nile-Gate-Solutions-Commercial.pdf` (5 p.) | `proposals/2-Nile-Gate-Solutions-Technical.pdf` (9 p.) |
| 3 | Harborline Systems | `proposals/3-Harborline-Systems-Commercial.pdf` (5 p.) | `proposals/3-Harborline-Systems-Technical.pdf` (11 p.) |
| 4 | Meridian Scan Technologies | `proposals/4-Meridian-Scan-Technologies-Commercial.pdf` (5 p.) | `proposals/4-Meridian-Scan-Technologies-Technical.pdf` (9 p.) |

All paths below start at `C:\work\mawane2 w gamarek\test-inputs\`.

---

## A. Main test: four vendors submit to your tender

You need your published project **PRJ-2026-001** (Phase 3).

### A1 (recommended). Add Addendum No. 1 to your RFP
The bids refer to Addendum No. 1 (20 workstations, 60-minute UPS, closing date 14 Dec 2026, etc.), so the RFP should include it.

1. **Projects** → click the **PRJ-2026-001** card.
2. On **Overview**, under **RFP documents**, use the **Add an addendum or annex** box: **Browse files** → `phase-1\rfp-pack\05-Addendum-No-1.pdf`.
3. **Expected:** the list shows 2 files, with `05-Addendum-No-1.pdf` · 1 page · **AI-readable**.
4. *(Optional, to match the addendum's new closing date)* **Edit** → **Submission deadline** = **14 December 2026** → **Save changes**. **Expected:** the header shows "Closes in 54 days".

### A2. Submit vendor 1: Atlas Port Technologies
1. Click the **Proposals** tab. **Expected:** "Waiting for proposals".
2. Click **Simulate a vendor submission**. **Expected:**
   - the **Vendor simulator** page opens with a blue "Demo tool" banner;
   - under **1 Tender**, PRJ-2026-001 is already selected.
3. Under **2 Vendor** (no vendors exist yet, so the form shows directly), paste:

| Field | Value |
|---|---|
| Company name | `Atlas Port Technologies` |
| Country | `Cyprus` |
| Contact name | `Karim Haddad` |
| Contact email | `bids@atlasport.example` |

4. Under **3 Proposal documents**:
   - **Commercial proposal** → **Browse files** → `phase-4\proposals\1-Atlas-Port-Technologies-Commercial.pdf`
   - **Technical proposal** → **Browse files** → `phase-4\proposals\1-Atlas-Port-Technologies-Technical.pdf`

   **Expected:** "2 files ready" next to the button.
5. Click **Submit proposal**. **Expected:**
   - two progress bars run to 100 %, then the panel shows "Proposal submitted";
   - it reads "Atlas Port Technologies → PRJ-2026-001";
   - a toast at the top says "Atlas Port Technologies's proposal submitted to PRJ-2026-001".

### A3. Submit vendors 2, 3 and 4
For each vendor:
1. Click **Submit another**.
2. Under **2 Vendor**, click **New vendor** (vendors now exist, so the picker opens on "Existing vendor").
3. Paste the values below, browse the two files, then click **Submit proposal**.

| # | Company name | Country | Contact name | Contact email | Commercial file | Technical file |
|---|---|---|---|---|---|---|
| 2 | `Nile Gate Solutions` | `Egypt` | `Mona Fahmy` | `tenders@nilegate.example` | `phase-4\proposals\2-Nile-Gate-Solutions-Commercial.pdf` | `phase-4\proposals\2-Nile-Gate-Solutions-Technical.pdf` |
| 3 | `Harborline Systems` | `Netherlands` | `Eva Lindqvist` | `bids@harborline.example` | `phase-4\proposals\3-Harborline-Systems-Commercial.pdf` | `phase-4\proposals\3-Harborline-Systems-Technical.pdf` |
| 4 | `Meridian Scan Technologies` | `Singapore` | `Daniel Koh` | `tenders@meridianscan.example` | `phase-4\proposals\4-Meridian-Scan-Technologies-Commercial.pdf` | `phase-4\proposals\4-Meridian-Scan-Technologies-Technical.pdf` |

After the 4th submission, click **View proposals**.

### A4. The Proposals table
**Expected:**
- **Header:** "Proposals (4)", and the **Proposals** tab shows a **4** badge.
- **Rows:** one per vendor in submission order (oldest first, sorted by **Proposal date**). Each row has the vendor's initials avatar, name and country, the date and time, "1 commercial · 1 technical" with the page count, a **Simulator** source tag and a **View** button.

| Vendor | Pages shown |
|---|---|
| Atlas Port Technologies | 13 pages |
| Nile Gate Solutions | 14 pages |
| Harborline Systems | 16 pages |
| Meridian Scan Technologies | 14 pages |

- **Sorting:** click the **Vendor** header to sort A→Z, and click again for Z→A.
- **⋯** on a row offers **Remove proposal** (don't remove one now unless you want to test it).

### A5. Open a proposal
1. Click **View** on **Harborline Systems**. **Expected:**
   - the **Commercial** tab opens; the URL ends with `?tab=commercial`;
   - the breadcrumb reads Projects › PRJ-2026-001 › Harborline Systems;
   - the vendor header shows Netherlands, the submission time and "Vendor 3 of 4" with ‹ › arrows;
   - the PDF shows in the page (5 pages: F-1 letter, F-5 price schedule with **TOTAL OFFER 28,988,217**, terms, F-6).
2. Click **Technical**. **Expected:** the content fades and the 11-page technical proposal shows (sections 1–13, then the F-2 matrix).
3. Hover **Compliance**, **Comparison** or **Risk**. **Expected:** a 🔒 tooltip "Unlocks after Analyse & process" (Phase 6).
4. Click **‹** and **›**. **Expected:** you move to Nile Gate (2 of 4) and Meridian (4 of 4) on the same tab.

### A6. Check the totals elsewhere
- **Projects** home: the **Proposals received** tile shows **4**, and the PRJ-2026-001 card shows "4 proposals".
- Project **⋯** menu: **Move back to draft** is gone, because a tender with proposals can't be unpublished.

---

## B. Optional checks
| Try this | Expected |
|---|---|
| Simulator → pick **Existing vendor** → **Harborline Systems** | Amber note: "Harborline Systems already submitted to this tender. Submitting again replaces its previous files." |
| Simulator → **Submit proposal** with nothing filled in | Red messages under Vendor, Commercial and Technical |
| Simulator → **New vendor** → `harborline systems` (lower case) + two files → Submit | Inline error: a vendor with this name already exists |
| **Settings → Demo tools → Load sample data** → confirm | Two **Sample** projects appear in Projects. The X-ray sample has the same 4 vendors with proposals (Source "Sample"); the Port Community System sample is open with none. PESE-03 and PCT-07 are added as sample standards, and your CITS-2026 is reused, not changed. |
| **Settings → Demo tools → Remove** → confirm | The sample projects and sample standards disappear. Your PRJ-2026-001, CITS-2026 and the four vendors you created stay. |

> ⚠ **Reset all data** (Demo tools) deletes *everything*, including your own project and CITS-2026. It asks you to type `RESET` first. Don't use it unless you want to start over.
