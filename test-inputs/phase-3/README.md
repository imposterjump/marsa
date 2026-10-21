# Phase 3 — Test guide

**App:** http://localhost:3000 · **Format used:** PDF only

Phase 3 delivers **Projects**: a 4-step wizard to create a tender (details → RFP documents → standards → review & publish), the Projects home with real data, and the project workspace (Overview / Proposals / Evaluation tabs, edit, publish, archive/restore, delete).

> No new files this phase. You reuse the Phase 1 RFP PDF and the CITS-2026 standard you already created in Phase 2. The RFP and CITS-2026 are consistent with each other (same data-residency, on-premise and security positions), and neither contains hints for the AI.

## Files used
| File | Where it comes from |
|---|---|
| `test-inputs/phase-1/rfp-pack/01-RFP-NGPA-T-2026-014.pdf` | Phase 1 (13 pages) |
| Standard **CITS-2026** | Already in your Standards library (Phase 2) |

## A. Create the project — copy-paste values

1. **Projects → New project**.
2. **Step 1 · Details**. Copy-paste:

| Field | Value |
|---|---|
| Project name | `High-Energy Cargo X-Ray Inspection Systems — Port of Al-Noor` |
| Description | `Supply, installation, commissioning and 5-year maintenance of four high-energy drive-through cargo X-ray inspection systems (T1 Gate A, T1 Gate B, T2 and one relocatable unit) with a central image analysis centre. Tender NGPA/T/2026/014.` |
| Category | **Equipment** (already selected) |
| Submission deadline | **30 November 2026** (type `30/11/2026` or `11/30/2026`, whichever order your browser's date field shows, or use the calendar) |
| Key requirements / notes | *leave empty* (the RFP PDF is the source of truth) |

   Click **Continue**.
   **Expected:** a toast at the **top centre** says "Draft PRJ-2026-001 created"; the eyebrow reads "PRJ-2026-001 · Draft saved"; the URL now holds `?id=…&step=2`; the deadline hint said "Closes in 40 days".

3. **Step 2 · RFP documents.** **Expected:** **Continue** is disabled (hover: "Upload at least one RFP document").
   Drop **only** `test-inputs/phase-1/rfp-pack/01-RFP-NGPA-T-2026-014.pdf`.
   **Expected:** it appears in the list with "187 KB · 13 pages" and **AI-readable**. The 👁 icon previews it in-app.
   *Optional:* press **F5**. You come back to the same draft on step 2 with the file still there.
   Click **Continue**.

4. **Step 3 · Standards.** **Expected:** **CITS-2026** is ticked (active standards are pre-selected) and "1 of 1 selected" shows. Keep it ticked. Click **Continue**.

5. **Step 4 · Review & publish.** **Expected:**
   - Details: name, reference `PRJ-2026-001`, Equipment, 30 Nov 2026, description.
   - RFP documents (1): `01-RFP-NGPA-T-2026-014.pdf · 13 p.`
   - Standards (1): `CITS-2026 · Customs IT Security & Data Residency Standard`.
   - Readiness: all five lines green.

   Click **Publish to vendors**.

## B. The project workspace — what to check

After publishing you land on the project page.

| Check | Expected |
|---|---|
| Header | "PRJ-2026-001 · EQUIPMENT", the full name, the description, then **Open for proposals** and "Closes in 40 days" |
| Breadcrumb | Projects › PRJ-2026-001 |
| Overview → RFP documents | The PDF with **no delete icon**: a published tender must keep at least one RFP file. Below it: "Add an addendum or annex" dropzone |
| Overview → Details | Reference, category, 30 Nov 2026 (Closes in 40 days), Created / Published / Last activity |
| Overview → Standards | CITS-2026 card (click it to open the standard). **Edit** opens a picker dialog |
| Overview → Progress | ✓ Draft created, ✓ Published to vendors, ● Proposals received ("Vendors respond until 30 Nov 2026"), ○ Evaluation completed |
| Tabs | Overview / Proposals / Evaluation switch with a sliding underline and a fade; the URL changes (`/proposals`, `/evaluation`) |
| Proposals tab | "Waiting for proposals" (the vendor simulator arrives in Phase 4) |
| Evaluation tab | "Evaluation is locked" until proposals arrive |
| **Edit** (header) | Dialog with the same fields. Change nothing, **Cancel** |
| **⋯** menu | Move back to draft · Archive project · Delete project |

## C. Projects home

Go to **Projects** in the sidebar.

| Check | Expected |
|---|---|
| Stat tiles | Active projects **1** · Proposals received **0** · Evaluations completed **0** |
| Card | `PRJ-2026-001` + "Open for proposals" pill, the name, two lines of description, "Equipment • Closes in 40 days", footer "1 RFP · 1 std · 0 proposals" |
| Search | Type `al-noor` → the card stays; type `zzz` → "No projects match" with **Clear filters** |
| Status filter | "All 1 · Open for proposals 1" (filters only show statuses that exist) |
| Grid / list toggle | The two icons on the right switch to a compact list |

## D. Fixes in this phase (from your feedback)

| What you saw | What changed |
|---|---|
| Settings jumped (scrolled) to the section picked in the mini nav | Settings is now tabs: only the chosen section shows; switching fades the current one out and the new one in. The URL hash keeps your tab on reload |
| A toast covered the paste dialog's **Add 14 rules** button (and did not go away while the mouse was over it) | All toasts now appear at the **top centre**, away from every dialog and form footer |

Also found and fixed while testing (Phase 2 bug, your data was not affected; I checked CITS-2026: 14 rules, 8 mandatory, description intact):
- Switching a standard **Active / Inactive** cleared its description, and editing a rule's text could reset its priority to *Important*. Fixed, with regression tests.

## E. Optional extra checks (only if you want)

1. **Archive / restore:** ⋯ → Archive project → confirm. **Expected:** "archived and read-only" banner, no Edit, no dropzone; **Restore** brings it back as *Open for proposals*.
2. **Draft resume:** start another **New project**, fill step 1, continue, then close the tab. Re-open it from Projects (status *Draft*): the page shows a draft banner, and **Publish to vendors** stays disabled until an RFP file is uploaded. Delete it via ⋯ → Delete project and type its code (e.g. `PRJ-2026-002`).
