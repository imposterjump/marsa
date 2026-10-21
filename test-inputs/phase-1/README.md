# Phase 1 — Test guide

**App:** http://localhost:3000 · **UI kit:** http://localhost:3000/dev/ui

Phase 1 delivers the design system, the app shell and the first-run experience. Uploads are **simulated** in this phase: the dropzone validates files and shows progress, but nothing is stored until Phase 3.

> All documents here are a **fictional** tender (NGPA/T/2026/014). The RFP pack is written like a real port authority's tender: plain requirements with no hints for the evaluator. It is consistent with itself, and Addendum No. 1 amends it explicitly. Phase 3 reuses the same pack to create a real project, and Phase 6 uses it to test the AI.

## Folder contents

| Folder / file | What it is | Used in |
|---|---|---|
| `rfp-pack/01-RFP-NGPA-T-2026-014.pdf` | Main RFP, 13 pages: instructions, scope, technical requirements, warranty, evaluation method | P1 dropzone · P3 project · P6 AI |
| `rfp-pack/02-Annex-A-2-T2-Site-Plan.png` | Site drawing of the T2 inspection plot (70 m × 28 m, 250 kVA) | P1 · P3 · P6 (image input) |
| `rfp-pack/03-Annex-B-Technical-Specifications.xlsx` | 45 technical requirements per site, site constraints, planning volumes (6 sheets) | P1 · P3 · P6 |
| `rfp-pack/04-Annex-C-Draft-Contract.docx` | Draft contract: General + Special Conditions, payment milestones, price-schedule structure, penalties | P1 · P3 · P6 |
| `rfp-pack/05-Addendum-No-1.pdf` | Addendum No. 1: new closing date, fewer workstations, longer UPS, new licensing plan, Q&A | P1 · P3 · P6 |
| `edge-cases/عرض-فني-مختصر.pdf` | Arabic file name; 2-page bilingual bidder summary (Arabic + English) | P1 · P5 viewer · P6 |
| `edge-cases/scanned-clarification-letter.png` | A bidder's letter as a scanned image only (no selectable text) | P1 · P6 (AI vision) |
| `edge-cases/NGPA-…ISSUED-FOR-TENDER.xlsx` | Same as Annex B with a 120-character file name | P1 (name truncation) |
| `edge-cases/Legacy-Technical-Note.doc` | Legacy Word format | P1 (accepted with a warning) |
| `edge-cases/blocked-setup.exe` | Plain text with an `.exe` name (harmless) | P1 (must be blocked) |
| `edge-cases/empty-file.txt` | 0 bytes | P1 (must be rejected) |
| `edge-cases/oversized-55MB.pdf` | 55 MB, above the 50 MB limit. Not in git: regenerate with `npx tsx scripts/test-inputs/build-phase-1.ts` | P1 (must be rejected) |
| `bulk-21-files/` | 21 small text files (bidder questions) | P1 (20-file limit) |

## Test checklist

### 1. First run and profile (FR-1.1, FR-1.4)
1. Open http://localhost:3000. **Expected:** you land on **/projects** and a **Welcome to Marsa** dialog appears over a blurred workspace.
2. Press `Esc` or click outside. **Expected:** the dialog stays (first run must be completed or skipped).
3. Clear the name and click **Enter workspace**. **Expected:** "Please enter your name." under the field.
4. Enter `Layla Mansour` and `Northern Gulf Ports Authority — Procurement Directorate`, then submit. **Expected:**
   - A toast: "Welcome aboard, Layla."
   - The hero greeting animates in ("Good morning/afternoon/evening, Layla.").
   - The header shows your name and organization (long organization truncated with "…").
   - The browser tab reads `Projects · Marsa — Layla Mansour`.
5. Header → your name → **Edit profile**. Change the name to `ليلى منصور` (Arabic). **Expected:** it saves, renders right-to-left correctly in the header, and the avatar shows Arabic initials.

### 2. Navigation and layout (FR-1.2, FR-1.3)
1. Sidebar shows exactly **Projects · Standards · Settings**. The active item has a white pill and a teal bar, which slides when you switch pages.
2. Press `Ctrl + B`. **Expected:** the sidebar collapses to an icon rail, hovering an icon shows a tooltip, and the state survives a page reload. Press again to expand.
3. Resize the window below ~1024 px. **Expected:** the sidebar is replaced by a ☰ button that opens a drawer.
4. Keyboard only: press `Tab` from the top of the page. **Expected:** "Skip to content" appears first, and every control shows a visible teal focus ring.

### 3. Theme (FR-1.5)
1. Header sun/moon icon → **Dark**. **Expected:** the whole UI switches in one frame (no colour "wave"). Reload: still dark, with no white flash.
2. **System** follows your Windows setting (Settings → Personalization → Colors).
3. Settings → Appearance has the same control.

### 4. Settings (P1 subset)
- **Profile:** edit, then **Reset** restores the saved values; **Save profile** is disabled until something changes.
- **Appearance:** theme + compact sidebar switch (stays in sync with `Ctrl + B`).
- **AI & runtime:** shows *Mock mode*, *API key configured* (your key in `.env` is detected but never displayed), *Claude Opus 5.5*, *50 MB*.
- *Scoring* and *Demo tools* are labelled Phase 2 and Phase 4.

### 5. Design system: http://localhost:3000/dev/ui
Check every section in **light and dark**: colours, typography (including the Arabic sample line), buttons (click **Click to load** for the loading state), form controls (the error state on *Reference*), status pills, dialogs, sheet, menu, toasts, tabs, data display (scroll down: the rings draw and numbers count up), data table (click headers to sort; **Show loading state**), motion (**Replay animations**; move your pointer over the depth panel), empty states.

### 6. Dropzone (P1.5) — use the files in this folder
In **/dev/ui → Dropzone**, use the left panel ("With simulated upload"). Drag files in, or use **Browse files**.

| Drop this | Expected result |
|---|---|
| All 5 files of `rfp-pack/` at once | 5 rows with type icons (PDF red, PNG teal, XLSX green, DOCX blue). Each uploads with a progress bar, then shows **✓ Uploaded**. Counter shows `5 / 20 files · 459 KB` |
| `edge-cases/عرض-فني-مختصر.pdf` | Accepted; the Arabic name renders correctly |
| `edge-cases/NGPA-…ISSUED-FOR-TENDER.xlsx` | Accepted; the name is shortened in the middle (extension kept) and the full name appears in a tooltip on hover/focus |
| `edge-cases/Legacy-Technical-Note.doc` | Accepted with an amber warning: legacy format, can't be previewed or read by the AI |
| `edge-cases/blocked-setup.exe` | **Not added**: ".exe files are not allowed" |
| `edge-cases/empty-file.txt` | **Not added**: "This file is empty (0 bytes)." |
| `edge-cases/oversized-55MB.pdf` | **Not added**: "55.0 MB exceeds the 50 MB limit per file." |
| The same RFP PDF again | **Not added**: "This file is already in the list." |
| All 21 files of `bulk-21-files/` into an empty dropzone (reload the page first) | 20 accepted; the 21st shows "Limit reached: at most 20 files per upload." |
| Any file renamed to include `fail` (e.g. `fail-test.pdf`) | Upload stops at 60% with an error and a **Retry** link |
| `edge-cases/scanned-clarification-letter.png` | Accepted as an image |

Also check:
- **✕ removes a row** (with a short animation).
- **Screen reader:** a polite announcement such as "3 files added, 1 rejected".

### 7. Accessibility and motion
- Windows → Settings → Accessibility → Visual effects → **Animation effects: Off**, then reload. **Expected:** no floating, sliding or count-up animations; content appears immediately.
- Everything reachable and operable by keyboard; status always shown as icon + text (never colour only).

## Reporting feedback
For anything that looks off, note the **page**, **light/dark**, **window width**, and a screenshot if possible.
