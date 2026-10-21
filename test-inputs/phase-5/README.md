# Phase 5 (part 1) — Test guide: project categories + full-screen reader

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
