# Marsa — Product Requirements Document (PRD)

> **Marsa** (مرسى, "anchorage") — *Procurement Intelligence for Ports & Customs*
> Status: **Draft v0.1 — awaiting approval of Recommendations (§9)** · Owner: Ayoub · Last updated: 2026-10-21
> Companion docs: [RDD.md](RDD.md) (technical design) · [PHASES.md](PHASES.md) (build plan) · [PROGRESS.md](PROGRESS.md) (tracker)

---

## 1. Summary

Marsa is a web application for port and customs authorities to run technical and commercial tender evaluations. A **customer** (the authority's procurement team) creates a project and uploads an RFP. **Vendors** submit a commercial proposal and a technical proposal as files. Marsa then uses Claude to evaluate every proposal against the RFP and the customer's own **standards**. For each vendor it:

- scores **compliance** (%) and lists every requirement as **compliant / partially compliant / non-compliant / not addressed**, with evidence,
- **compares** the vendor against the other vendors (advantages, disadvantages, unique offers),
- builds a **risk register** ("what goes wrong if we pick this proposal"),
- and the evaluation ends with a **ranking and recommendation**.

The analysis takes several minutes. During that time the customer sees a **live, step-by-step progress view** ("Step 4 of 11 · Comparing Vendor A against Vendor B, C"), not a spinner.

This is a **prototype**. The customer side is complete and polished. The vendor side is **simulated** (seed data, a vendor-simulator page, and AI-generated mock proposals).

## 2. Goals & non-goals

### Goals
1. A customer can go from **"new project" to a ranked, evidence-backed evaluation** of all proposals without leaving the app.
2. Every AI judgement is **explainable**: the requirement it relates to, what the vendor said (quote and page), and why it is compliant, partial, or non-compliant.
3. A **premium, calm, elegant UI**: generous spacing, a clear hierarchy, light motion, accessible (WCAG 2.1 AA), light and dark mode.
4. **Simple to run and deploy**: one Node process, a local SQLite file, and files on disk. Works the same locally and on a single server with a persistent disk.

### Non-goals (prototype)
- Authentication, roles, multi-tenancy (no sign-in; one customer profile).
- A real vendor portal, invitations, emails, notifications to vendors.
- Contract management, e-signature, payments, ERP integration.
- Full Arabic UI (the UI is English but **RTL-ready**. The AI reads Arabic documents and can write reports in Arabic).
- Preview of legacy binary formats (`.doc`, `.ppt`, `.xls`): stored and downloadable only.

## 3. Users

| Persona | Who | Needs |
|---|---|---|
| **Customer: Procurement officer** (primary) | Port/customs authority staff running a tender | Publish an RFP quickly; see who submitted; read proposals comfortably; get a defensible comparison; spot risks before awarding |
| **Customer: Evaluation committee member** | Technical/financial reviewer | Drill into a single requirement across vendors; see evidence; trust the score |
| **Vendor** (simulated) | Supplier responding to a tender | Submit a commercial and a technical proposal (any file format) |

## 4. User journey (happy path)

```
Open app ─▶ Projects (default) ─▶ New project ─▶ name + RFP files (+ standards) ─▶ Publish
   │
   ▼  (vendors submit, simulated: seed / simulator / AI-generated)
Project ▸ Proposals table (vendor · date · View) ─▶ View ─▶ Proposal workspace [Commercial] tab
   │                                                      (paginated Sheet Stack viewer)
   ▼
"Analyse & process" ─▶ Live progress (Step k / 3N+2, phase, ETA, per-step status)
   │
   ▼
Evaluation: ranking · recommendation · comparison matrix
   └─▶ per vendor: Compliance % + numbered compliant / partial / non-compliant / not-addressed lists,
                   Comparison vs field, Risk register
```

## 5. Functional requirements

Priority: **P0** = must work for the prototype demo, **P1** = should, **P2** = nice to have (approval-dependent, see §9).

### FR-1 App shell & identity (P0)
- **FR-1.1** No sign-in. The app opens directly on **Projects**.
- **FR-1.2** A left sidebar with exactly three items: **Projects**, **Standards**, **Settings**. It can be collapsed to an icon rail. The active item is clearly indicated.
- **FR-1.3** The header shows the **app name (Marsa)** and the **customer's name and organization**. The browser tab title is `{Page} · Marsa — {Customer}`.
- **FR-1.4** On first run, a welcome dialog asks once for the **customer name and organization**. These are stored locally and editable in Settings. *(REC-13)*
- **FR-1.5** Light, dark, and system themes.

### FR-2 Projects list (P0)
- **FR-2.1** Greeting header ("Good morning, {first name}") with key stats: active projects, proposals received, evaluations completed.
- **FR-2.2** Project cards (grid) or list toggle, showing name, reference (e.g. `PRJ-2026-004`), status, number of proposals, deadline, last activity, and the top score once evaluated.
- **FR-2.3** Search by name or reference. Filter by status (All · Draft · Open · Evaluating · Evaluated).
- **FR-2.4** A prominent **New project** action. An empty state with an illustration and a CTA when there are no projects.

### FR-3 Create project / RFP (P0)
- **FR-3.1** Fields: **Project name** (required), description, category (e.g. Equipment, Software, Services, Works), optional submission deadline, optional free-text "key requirements / notes".
- **FR-3.2** **RFP files**: drag-and-drop multi-file upload, any format (PDF, DOCX, XLSX, CSV, TXT, images, etc.). At least one file is required. The user sees per-file progress, size, type icon, and can remove a file.
- **FR-3.3** **Standards selection**: choose which standards from the library apply. All active standards are pre-selected.
- **FR-3.4** **Save as draft** or **Publish to vendors** (status → Open). Everything is persisted (DB plus file storage).
- **FR-3.5** Project overview tab: details, the RFP documents (opened in the viewer), selected standards, and a status timeline.

### FR-4 Vendor submissions: simulated (P0)
- **FR-4.1** **Seeded sample data**: a realistic ports & customs RFP, sample standards, and 4 fictional vendors whose PDF and DOCX proposals contain deliberate gaps. Available on first run, with reset/re-seed in Settings.
- **FR-4.2** **Vendor simulator** page (`/vendor-portal`, opened from Settings → Demo tools and from the empty Proposals tab). Pick a project and a vendor (or create one), upload **commercial** and **technical** files, and submit.
- **FR-4.3** **AI-generated proposals**: from a project, "Generate N mock proposals". Claude writes realistic proposals from the RFP with a chosen mix of profiles (strong / budget-partial / risky / incomplete). They are rendered to PDF or DOCX files and saved as real submissions. *(Uses API credits.)*
- **FR-4.4** A proposal = vendor + ≥1 commercial file + ≥1 technical file + submission timestamp. One proposal per vendor per project. Resubmitting replaces the previous files.

### FR-5 Proposals table (P0)
- **FR-5.1** Table columns: **Vendor** (avatar plus name), **Submitted** (date and time), files (count), status, and **Score** and **Risk** once analysed. A **View** button on each row.
- **FR-5.2** Sorting by any column. Rows have a hover state.
- **FR-5.3** Below the list: an **"Analyse & process"** action bar. It shows how many proposals will be evaluated, the standards in use, and the estimated number of steps (`3N+2`). It is disabled with an explanation if there are 0 proposals and warns if there is only 1 (comparison needs ≥2).
- **FR-5.4** If proposals changed since the last analysis, the bar offers **Re-run analysis**. *(REC-15)*

### FR-6 Proposal workspace (P0)
- **FR-6.1** Opens on the **Commercial** tab by default. Tabs: **Commercial · Technical · Compliance · Comparison · Risk**. The last three are enabled once an analysis exists and show a lock hint before that.
- **FR-6.2** Header: vendor name, submission date, compliance score ring, risk level badge, and previous/next vendor navigation.

### FR-7 Document viewer: "Sheet Stack" (P0)
- **FR-7.1** Shows **one page at a time** with pagination when a document has more than one page. Single-page documents show no pagination controls.
- **FR-7.2** **Unique presentation**: the current page is a paper sheet with the next pages visibly stacked behind it. Page turns animate (the sheet slides away and the stack advances). There is also a thumbnail filmstrip, a page scrubber, and a floating toolbar (prev/next, page `x / n` input, zoom, fit, download, fullscreen).
- **FR-7.3** Keyboard: ←/→, PgUp/PgDn, Home/End, +/−, `F` for fullscreen.
- **FR-7.4** If a vendor submitted several files, a **file switcher** sits above the sheet.
- **FR-7.5** Supported previews: PDF (native pages), DOCX (rendered pages), XLSX/CSV (one sheet per page, as a table), images, TXT/MD. Other formats get a download card.
- **FR-7.6** **Deep links** (`?tab=technical&doc=…&page=7`). Evidence links in the analysis open the exact page and highlight it. *(REC-05)*

### FR-8 Standards (P0)
- **FR-8.1** A library of standards, each with a title, code, category, description, and **active** toggle.
- **FR-8.2** Each standard has **rules** (code, text, priority: Mandatory / Important / Desirable) with inline add, edit, reorder, and delete, plus **Paste rules** to add many at once (one per line: `CODE | text | priority`).
- **FR-8.3** Upload **standard documents** (any file). These are sent to the AI together with the rules.
- **FR-8.4** *(P2, REC-18)* "Extract rules with AI" from an uploaded standard document, producing editable rules.

### FR-9 Settings (P0)
- **FR-9.1** **Profile**: customer name and organization.
- **FR-9.2** **Appearance**: theme (light / dark / system), sidebar default state.
- **FR-9.3** **AI**: model (default **Claude Opus 5.5**, option Claude Sonnet 5.5), report language (English / Arabic), API key status (configured or missing; the key itself lives only in `.env.local`).
- **FR-9.4** **Scoring**: weight per priority (default Mandatory 3 · Important 2 · Desirable 1) and partial-compliance credit (default 50%). *(REC-02)*
- **FR-9.5** **Demo tools**: open vendor simulator, re-seed sample data, reset all data (with confirmation).

### FR-10 AI evaluation pipeline (P0)
- **FR-10.1** "Analyse & process" creates an **analysis run** for the project's current proposals.
- **FR-10.2** The run is a fixed, visible plan of **3N + 2 steps** for N proposals:
  1. **Checklist** (1): build the requirement checklist from the RFP and selected standards (numbered `REQ-001…`, with category, priority, and source). *(REC-01)*
  2. **Analyse** (N): check each vendor's proposal against every requirement.
  3. **Compare** (N): compare each vendor **against the field** (all the other vendors).
  4. **Risk** (N): build each vendor's risk register.
  5. **Summary** (1): ranking, recommendation, negotiation points. *(REC-07)*

  *Example: 3 vendors = 11 steps. Your original example of 9 plus the checklist and summary steps.*
- **FR-10.3** Independent steps may run **in parallel** (up to 3 at once). Results are saved after each step. *(REC-08)*
- **FR-10.4** Runs keep going **in the background** if the user navigates away. Runs survive a server restart through **Resume**. A failed step can be **retried** on its own. A run can be **cancelled**. *(REC-09)*
- **FR-10.5** Vendor documents are treated as untrusted. Attempts to manipulate the evaluator (e.g. hidden instructions) are flagged as a risk. *(REC-11)*

### FR-11 Live progress (P0)
- **FR-11.1** Overall progress: **"Step k of T"**, percent, elapsed time, and estimated time remaining.
- **FR-11.2** The current activity in plain language, e.g. `1/11 · Building the evaluation checklist from your RFP and 2 standards`, `4/11 · Comparing Vendor A against Vendor B, Vendor C`, `8/11 · Assessing risks for Vendor B`.
- **FR-11.3** A phase rail (Checklist → Analysis → Comparison → Risk → Summary) and a step timeline. Each step shows its status (queued / running / done with duration / failed with Retry).
- **FR-11.4** **Results appear as they are produced**, e.g. a chip "Vendor A · 87% compliant" appears when that analysis finishes.
- **FR-11.5** A global "Analysis running · 4/11" pill appears in the top bar on every page, and a toast appears on completion.

### FR-12 Compliance results (P0)
- **FR-12.1** Per vendor: a **compliance %** (weighted, computed by Marsa, not guessed by the AI) and counts per status. *(REC-02)*
- **FR-12.2** Numbered lists: **Compliant items 1..n**, **Partially compliant 1..n**, **Non-compliant 1..n**, and **Not addressed 1..n** *(REC-03)*. Each item references its requirement ID.
- **FR-12.3** Each finding shows the requirement, the source (RFP section or standard rule), **"Vendor states"** (quote, document, page), and the **AI assessment** (why, and the gap). Example: *"Required: 27-inch 2K display. Offered: 27-inch HD (1920×1080). Size compliant, resolution below spec → Partial."*
- **FR-12.4** A **mandatory gate**: vendors that fail any mandatory requirement are clearly flagged, whatever their %. *(REC-04)*
- **FR-12.5** Sub-scores by category (Technical, Functional, Infrastructure, Security, Commercial, Delivery, Support, Legal).
- **FR-12.6** Strengths and weaknesses (pros/cons) summary, plus a **commercial snapshot**: total price, currency, payment terms, delivery time, warranty, offer validity. *(REC-06)*
- **FR-12.7** *(P2, REC-16)* Evaluator override: change a finding's status with a note. The score recomputes and the finding is marked "edited by evaluator".

### FR-13 Comparison (P0)
- **FR-13.1** Per vendor ("vs the field"): **advantages** (what it does better, and against whom), **disadvantages** (where others beat it), **unique offers** (what it has that the others don't), and its price position.
- **FR-13.2** Project-level **comparison matrix**: requirements × vendors, with a status icon per cell and the gap on hover. Filters: "differences only", "mandatory only", category.
- **FR-13.3** A side-by-side **pros/cons table** for all vendors, plus a commercial comparison (price, delivery, warranty, payment).
- **FR-13.4** **Ranking and recommendation** with rationale, conditions, and negotiation points.

### FR-14 Risk (P0)
- **FR-14.1** Per vendor **risk register**. Each risk has a title, category (Technical, Infrastructure/Deployment, Security, Commercial, Legal/Contractual, Schedule, Operational, Vendor capability, Compliance), likelihood (1–5), impact (1–5), and severity. It also has **"What happens if we go with this proposal"**, a mitigation, evidence, and related requirement IDs.
- **FR-14.2** **Environment and architecture conflicts are surfaced explicitly**, e.g. *RFP requires on-premise deployment, but the proposed platform is cloud-only (SaaS)*.
- **FR-14.3** Overall risk level (Low / Moderate / High / Critical) and a 5×5 likelihood × impact heatmap.

### FR-15 Run history (P1)
- **FR-15.1** Every run is kept. The Evaluation tab shows the latest run and lets the user open earlier runs (timestamp, model, proposals included, cost).
- **FR-15.2** Run details show token usage and estimated cost. *(REC-12)*

### FR-16 Later (P2, approval-dependent)
- Export the evaluation report to PDF *(REC-17)*.
- "Ask the proposal" Q&A chat grounded in the documents *(REC-19)*.

## 6. Non-functional requirements

| Area | Requirement |
|---|---|
| **UX quality** | Consistent 4-px spacing scale, a clear type scale, generous padding (cards ≥ 24 px, page gutters 32–40 px). No hanging spinners: every wait > 300 ms gets a skeleton or a progress state with text. |
| **Accessibility** | WCAG 2.1 AA contrast, full keyboard navigation, visible focus rings, ARIA on tabs, dialogs, and tables, status never conveyed by colour alone (icon plus label), `prefers-reduced-motion` respected. |
| **Motion** | Subtle and purposeful. Only GPU-safe properties (transform, opacity, filter, clip-path). Hover feedback ≤ 150 ms, UI transitions 200–320 ms. |
| **Responsiveness** | Desktop-first (≥ 1280 px ideal). Tablet (≥ 768 px) fully usable. Mobile gets a drawer sidebar and readable layouts. |
| **Performance** | Pages interactive < 1 s locally. The first page of a 20 MB PDF renders in < 1.5 s. Thumbnails are lazy-rendered. |
| **Uploads** | ≤ 50 MB per file, ≤ 20 files per upload (configurable). Type and size are validated, filenames sanitized, files stored under generated names. |
| **Reliability** | Run state persisted after each step. Resumable after a restart. Per-step retry. |
| **Security & privacy** | The API key exists only server-side (`.env.local`). Documents are sent to the Anthropic API for analysis. Vendor content is treated as untrusted input. |
| **Deployability** | A single Node server (Docker / Railway / Render / VPS) with a persistent volume for `data/` (SQLite DB + uploads). |
| **Cost transparency** | Token usage and estimated cost per run. A mock AI mode costs $0 for development and demos. |

## 7. Success criteria for the prototype

1. A full demo with seed data (create project → proposals → analyse → explore results) in **under 5 minutes** of clicking.
2. An analysis of **3 vendors completes in roughly 3–6 minutes**, with the live progress view updating at least every few seconds.
3. **100%** of non-compliant and partial findings include evidence (quote plus location) and a gap explanation.
4. The seeded "cloud-only vs on-premise" conflict is **always** caught as a risk.
5. No accessibility violations in an automated axe scan on the main pages. Keyboard-only walkthrough of the happy path works.
6. You sign off on the look & feel at the design checkpoint (Phase 1) and again at the end.

## 8. Assumptions & constraints

- You provide an Anthropic API key in `.env.local` (`ANTHROPIC_API_KEY`). It is never committed or sent to the browser.
- Indicative AI cost with Claude Opus 5.5 is **roughly $3–8 per 3-vendor run** for typical 20–40-page proposals (cached RFP and standards reduce this). Exact cost is shown per run.
- The largest supported input per step is bounded by the model context (1M tokens). Very large tenders (hundreds of pages per vendor) may need chunking, which is out of scope for v1 and flagged in the UI.
- Sample standards, vendors, and RFPs are **fictional** and labelled as sample data.

## 9. Recommendations (need your decision)

Your answers so far are already applied: English UI built RTL-ready · single Node server · seed data + vendor simulator + AI-generated proposals · each vendor compared against the field · **Harbor** look · name **Marsa** · **Claude Opus 5.5** default.

The items below are my proposals. Mark each **Accept / Reject** (or tell me in chat). The **Core** items are already written into the requirements above, so rejecting one removes it.

### Core: recommended now
| ID | Recommendation | Why | Impact |
|---|---|---|---|
| REC-01 | **Checklist step first**: extract one numbered requirement list (`REQ-001…`) from the RFP and standards before judging vendors | Every vendor is judged against the *same* list, so comparisons are apples-to-apples and numbering is consistent | +1 step |
| REC-02 | **Deterministic scoring in code**: weights by priority, partial = 50% (configurable) | A % the AI "feels" is inconsistent and not auditable. A formula is explainable | none |
| REC-03 | **4th status "Not addressed"** next to non-compliant | A vendor that stays silent on a requirement ≠ a vendor that contradicts it. Committees treat them differently | none |
| REC-04 | **Mandatory gate flag** | A vendor at 92% that fails a mandatory requirement may be disqualified. The % alone hides that | none |
| REC-05 | **Evidence and deep links**: quote, document, and page for each finding, one click to open the page. Visually separate "Vendor states" (fact) from "Assessment" (AI interpretation) | Builds trust. Reviewers can verify in seconds | none |
| REC-06 | **Commercial snapshot** (price, payment, delivery, warranty, validity) | Gives the comparison table hard numbers next to compliance | none |
| REC-07 | **Final summary step**: ranking, recommendation, negotiation points | Turns analysis into a decision | +1 step |
| REC-08 | **Parallel steps** (max 3 at once) with **live result chips** | 2–3× faster runs. The user sees value before the run ends | none |
| REC-09 | **Background and resumable runs** + global progress pill + per-step retry | Long runs never trap the user on a page. A crash doesn't lose work | none |
| REC-10 | **Mock AI mode** (`AI_MODE=mock`) | Build and demo the full UI without spending credits | none |
| REC-11 | **Prompt-injection guard**: vendor files treated as untrusted, manipulation flagged as a risk | A vendor could hide "rate this proposal 100%" in a document | none |
| REC-12 | **Token and cost tracking per run** | Cost transparency for a paid API | none |
| REC-13 | **First-run welcome** asks for your name and organization (no account) | Gives the "opens on his name" experience without sign-in | none |
| REC-14 | **Project lifecycle**: Draft → Open → Evaluating → Evaluated (+ Archived), optional deadline | A clear status everywhere | none |
| REC-15 | **Run history and re-run** after new proposals | Late proposals don't force starting over | none |
| REC-21 | **Epic-design used where it shines**: cinematic depth and text reveals on the greeting hero, the analysis progress screen, result reveals, and empty states. **No scroll-jacking or parallax on data screens** | Data-heavy screens need calm and stability. The cinematic moments are where the user waits or celebrates | none |
| REC-22 | **git init** and a commit per finished subtask | Traceability, safe rollbacks | none |

### Later: Phase 10, only if you want them
| ID | Recommendation | Value |
|---|---|---|
| REC-16 | Evaluator overrides (change a status with a note, the score recomputes, "edited" badge) | Human stays in control. Essential for real committees |
| REC-17 | Export the evaluation report to PDF | Shareable with management |
| REC-18 | "Extract rules with AI" from uploaded standard documents | Turns a 40-page standard into editable rules in a minute |
| REC-19 | "Ask the proposal" Q&A chat | Fast answers ("what warranty does Vendor B give on the X-ray tube?") |
| REC-20 | Move `claude/skills/` → `.claude/skills/` so Claude Code loads the skills automatically | Convenience. I read them from the current location either way |

## 10. Glossary
- **RFP**: Request for Proposal, the customer's tender document.
- **Proposal**: a vendor's response, made of a **commercial** part (price and terms) and a **technical** part (solution and specs).
- **Standard**: the customer's internal or regulatory rules every proposal must respect (e.g. security, safety, commercial terms).
- **Requirement / REQ**: one checkable item from the RFP or a standard.
- **Finding**: a vendor's status on one requirement, with evidence.
- **Run**: one execution of the AI evaluation pipeline over a project's proposals.
