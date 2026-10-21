# Phase 5 — Test guide

## Part 1: project categories + full-screen reader

**App:** http://localhost:3000 · **Format used:** PDF only · **No new files:** uses your PRJ-2026-001, CITS-2026 and the four Phase 4 proposals.

Two changes from your feedback:
1. **Projects have categories, the same ones as standards** (IT & security, Safety & environment, Commercial & legal, Quality, General). A project only offers standards of its own category plus **General** ones. A **General** project can use every standard.
2. **Documents open in our own full-screen reader**, which replaces the browser's PDF box everywhere: proposals, RFP documents and standard documents.

Your data was migrated automatically. **PRJ-2026-001 is now "IT & security"** (it matches CITS-2026, which stays applied). A backup of the database from before the change is in `data\backups\`.

---

## A. Main test 1: open a proposal in the reader

1. **Projects** → **PRJ-2026-001** → **Proposals** tab.
2. On **Harborline Systems**, click **View**.

   **Expected:** a full-screen dark reader opens.
   - **Top:** "HS Harborline Systems", "PRJ-2026-001 · Submitted …", a **Commercial | Technical** switch, and the ↗ (new tab), ⤓ (download) and ✕ icons.
   - **Left:** thumbnails of the 5 pages, with page 1 highlighted.
   - **Centre:** page 1, sharp, with a thin stack of sheets behind it.
   - **Bottom:** a floating toolbar `‹ 1 / 5 ›  − 100% +  ⟷`.
3. Press **→** on the keyboard. **Expected:** the page slides to page 2, the thumbnail highlight moves, and the URL ends with `&page=2`.
4. Click thumbnail **5**. **Expected:** page 5 (commercial terms, local value added and the F-6 statement). The stack behind the page is gone, because there are no pages left.
5. Type `3` in the page box and press **Enter**. **Expected:** page 3, the F-5 price schedule ending with **TOTAL OFFER 28,988,217**.
6. Click **+** twice. **Expected:** **150 %**, and the page scrolls inside the stage. Click **150 %** to reset to 100 %. Click **⟷** to fit to width, then click it again to show the whole page.
7. Click **Technical** at the top. **Expected:** the 11-page technical proposal opens at page 1. Press **End** → page 11; press **Home** → page 1.
8. Press **Esc**. **Expected:** the reader closes, and you are on Harborline's proposal page.
   - The **Technical** tab is selected.
   - A card shows the first page as a small stack of sheets (it fans out when you hover), the file name, "11 pages · … KB · AI-readable", **Open reader** and **Download**.
9. Click the **Commercial** tab. **Expected:** the reader opens again, directly on the commercial PDF.
10. *Optional:* copy the URL while the reader is open on page 3, close it, then paste the URL. **Expected:** the reader reopens on the same page.

## B. Main test 2: RFP documents use the same reader
1. **PRJ-2026-001** → **Overview** → in **RFP documents**, click the 👁 icon (or the file name) of `01-RFP-NGPA-T-2026-014.pdf`.
2. **Expected:** the same reader with 13 pages and no Commercial/Technical switch. Press **Esc** to close.

## C. Main test 3: categories filter standards
1. **PRJ-2026-001** → **Overview**. **Expected:**
   - the header says "PRJ-2026-001 · IT & SECURITY";
   - the **Standards** card reads "Only 'IT & security' and 'General' standards can apply" and lists CITS-2026.
2. Click **Edit** (header) → the **Category** select now lists the 5 standard categories. Change it to **Safety & environment** without saving. **Expected:** an amber note under it: "Saving with 'Safety & environment' removes this applied standard: **CITS-2026**". Click **Cancel**: nothing changes.
3. **Projects → New project**: Category defaults to **General**, with the hint "General: every standard can apply". *(No need to finish the wizard; use **Discard draft** if you created one.)*

> If you only have CITS-2026 in your library, the filter is easiest to see with more standards. **Settings → Demo tools → Load sample data** adds PESE-03 (Safety) and PCT-07 (Commercial). Then open the sample "Port Community System" project (**IT & security**) → **Standards → Edit**. **Expected:** only CITS-2026 is offered, plus a note "2 standards are hidden because they belong to other categories…". The sample X-ray project is **General** and offers all three. **Remove** the sample data afterwards if you like.

---

## Part 2: Analyse panel, evidence deep links, all file formats

**No new files.** Part 2 uses your PRJ-2026-001 with its 4 vendor proposals, plus (optional) the Excel, Word and image files from the Phase 1 RFP pack.

### D. Main test 4: the Analyse & process panel
1. **Projects → PRJ-2026-001 → Proposals**, then scroll below the table.
2. **Expected:** a panel titled **Analyse & process** showing:
   - "Marsa will check all 4 proposals against the RFP and 1 standard (14 rules)…";
   - **Proposals 4 · Standards CITS-2026 · Steps 14 (3 × 4 + 2) · Time ≈ 28 s · Cost Free (demo AI)**;
   - the pipeline `1 × Checklist → 4 × Analyse → 4 × Compare → 4 × Risk → 1 × Summary`;
   - a greyed-out **Analyse & process** button. Hovering it says "The AI pipeline is wired in Phase 6".
3. Hover **14 (3 × 4 + 2)**. **Expected:** a tooltip explaining the steps.

### E. Main test 5: evidence deep links (how Phase 6 evidence will open)
These links contain your own project, proposal and document ids, plus a quote (`&q=`). Click each one.

**Expected for each:**
- the reader opens on the right document and **jumps to the page** shown;
- a banner at the top reads **Evidence: "…"**;
- the sentence is **highlighted in teal**;
- the page **pulses** briefly.

| What | Quote | Link |
|---|---|---|
| Harborline · technical · page 3 | `Harborline is the OEM of all inspection systems offered` | [open](http://localhost:3000/projects/prj_kpd7293s4g6w7s/proposals/prp_f6b93m4d849bnr?tab=technical&reader=doc_3myuxbzitkzhq6&q=Harborline%20is%20the%20OEM%20of%20all%20inspection%20systems%20offered) |
| Meridian · technical · page 4 (sentence continues on page 5) | `The gateway synchronises licence entitlements with Meridian's licensing service every 90 days` | [open](http://localhost:3000/projects/prj_kpd7293s4g6w7s/proposals/prp_a5p3fbmewbckqu?tab=technical&reader=doc_nx3aunexppui3b&q=The%20gateway%20synchronises%20licence%20entitlements%20with%20Meridian%27s%20licensing%20service%20every%2090%20days) |
| Nile Gate · commercial · page 4 | `Optional (not included in the totals): replacement linear accelerator` | [open](http://localhost:3000/projects/prj_kpd7293s4g6w7s/proposals/prp_kmb78hyzn8nac6?tab=commercial&reader=doc_6k93t9g864bg52&q=Optional%20%28not%20included%20in%20the%20totals%29%3A%20replacement%20linear%20accelerator) |
| Atlas · commercial · page 2 | `Our offer is valid for ninety (90) days from the bid closing date` | [open](http://localhost:3000/projects/prj_kpd7293s4g6w7s/proposals/prp_ska5hxjwm82p6p?tab=commercial&reader=doc_fnxnancq7xfrda&q=Our%20offer%20is%20valid%20for%20ninety%20%2890%29%20days%20from%20the%20bid%20closing%20date) |
| Not found (expected warning) | `This sentence is not in the proposal` | [open](http://localhost:3000/projects/prj_kpd7293s4g6w7s/proposals/prp_f6b93m4d849bnr?tab=commercial&reader=doc_hy29zt4db2bxv9&q=This%20sentence%20is%20not%20in%20the%20proposal) |

- The Meridian quote starts at the bottom of page 4 and continues on page 5. The reader still finds it and highlights the part on page 4.
- The last link shows an amber **"Quote not found in this document"** banner, and the reader stays on page 1.
- Turning pages keeps the quote in the URL. Switching to the other envelope or closing the reader drops it.

> If you ever reset your data, these ids change. To make your own link, open a document in the reader, copy the URL and add `&q=` plus any sentence from the document.

### F. Main test 6: reader polish
On any multi-page proposal (e.g. Harborline → **View**):

| Try | Expected |
|---|---|
| Press **F** (or click ⛶ top right) | The reader goes truly full screen; **F** or **Esc** returns |
| Click the panel icon at the left of the bottom toolbar | The thumbnail strip hides; click again to bring it back |
| Click the small ticks above the toolbar (the scrubber) | Jumps to that page; the active tick is teal |
| Select text on a page with the mouse | The text is selectable (copy/paste works) |
| Watch the stack behind the page while paging to the end | Up to 3 sheets peek out; the stack thins and disappears on the last page |
| Turn pages forwards, then backwards | Forward: the page lifts off to the left and the next one rises from the stack. Back: the previous page slides in from the left |

**Compact header:** on a proposal page, the project header shrinks to one line (code, name, status, deadline). The vendor and documents come first.

### G. Optional: every file format in the reader
1. **PRJ-2026-001 → Overview → Add an addendum or annex** → **Browse files**, and select these three files together from `test-inputs\phase-1fp-pack\`:
   - `03-Annex-B-Technical-Specifications.xlsx`
   - `04-Annex-C-Draft-Contract.docx`
   - `02-Annex-A-2-T2-Site-Plan.png`
2. Click 👁 on each:

| File | Expected in the reader |
|---|---|
| `03-Annex-B….xlsx` | 6 pages, one per sheet ("Sheet: Read me", "Technical specs", "Site constraints", "Volumes & storage", "Workstations", "Revision log"), as a table with row numbers |
| `04-Annex-C….docx` | The contract rendered as Word pages (headings, numbered clauses, tables). Long pages open at reading width |
| `02-Annex-A-2….png` | The site plan as one page; the toolbar shows "1 page" with no page arrows |
| `05-Addendum-No-1.pdf` | One page, so no thumbnails, scrubber or arrows |

> Adding these files to the RFP is fine, and the AI will read them in Phase 6. If you'd rather keep the RFP as PDF only, delete them again with the 🗑 icon.

