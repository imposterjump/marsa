# Marsa — Progress Tracker

> Updated at the end of every work session. Plan details: [PHASES.md](PHASES.md).
> Legend: ⬜ not started · 🟦 in progress · ✅ done · ⏸ blocked / waiting on you · ➖ skipped / rejected

## Now
- **Current phase:** **P8 (new story after the client meeting) ✅ built → waiting for your test** (checkpoint P8.6). Committed locally, **not pushed**.
- **Name:** users see **Mizan**; "Marsa" is the codename in code and docs (see CLAUDE.md, HANDOFF G-85).
  - Guided New project form (Project → Standards → Vendors);
  - project page with one AI analysis button;
  - new pipeline (standards and RFP checked separately, 7 proposal sections, 0–100 risk score);
  - the full-width **AI analysis results** page.
- **Test it:** http://localhost:3000/projects · guide: [test-inputs/poc-inputs/README.md](../test-inputs/poc-inputs/README.md) (the meeting set, step by step).
- **Rollback point:** tag `before-rta-redesign` (commit `2daa169`) is the app before the RTA design and P8.
- **Session handoff notes:** [HANDOFF.md](HANDOFF.md) (read first every session).

## Waiting on you
| # | Item | Where |
|---|---|---|
| P8 | **Test P8**: guided form, project page, Add vendor, AI analysis results page (Overview · Compliance · Risks · Comparison · AI quality). I push after your OK | [test-inputs/poc-inputs/README.md](../test-inputs/poc-inputs/README.md) |
| M | **Meeting demo:** rehearse with POC set 1, then run set 2. Set 3 has three vendors. Test on Haiku (≈ $0.05–0.09 a run), then run Opus once (≈ $1.3–2) | [test-inputs/poc-inputs/README.md](../test-inputs/poc-inputs/README.md) |
| R | **Your Haiku run:** you start it; we go through the results together | — |
| 0 | **Test Phases 6 + 7**: analysis, mission control, results, generate with AI. Part B spends credits on Opus (≈ $2–4 / $7–10 / $0.4 per case). I push P6 + P7 after your OK | [test-inputs/phase-6/README.md](../test-inputs/phase-6/README.md) |
| 1 | **Test Phase 5 (viewer checkpoint P5.8)**: categories, reader, Analyse panel, evidence links. **UNTESTED** (pushed at your request before testing) | [test-inputs/phase-5/README.md](../test-inputs/phase-5/README.md) |
| 1b | Phase 1 design checkpoint (P1.9): no feedback received yet, assumed OK | — |
| 2 | Confirm "RDD" = the technical requirements & design document (my interpretation) | [RDD.md](RDD.md) |

## Decision log
| Date | Decision | By |
|---|---|---|
| 2026-10-24 | **Projects hero = a general welcome + overview**: never about one project or recommendation. Workflow KPI band (RFP → standards → bids → AI analysis) with workspace totals; port drawing removed (also from the empty-state art) | You |
| 2026-10-24 | **Dark hero band for the welcome: rejected** (tried, reverted). The welcome stays light | You |
| 2026-10-25 | **Run summary line (status · date · model · cost · steps) lives in AI quality**, not above the results; stopped or failed runs keep it on top with Resume | You |
| 2026-10-25 | **pdf.js is preloaded while a page with a reader is idle**: first evidence open 0.40–0.46 s → 0.26–0.30 s; search and highlight unchanged | You |
| 2026-10-23 | **Product name shown to users: Mizan** (procurement name; "Marsa" meant harbour). Only the UI changes: code, database and docs keep the codename Marsa | You |
| 2026-10-23 | **Logo: the Sharjah emblem** replaces the RTA logo (the RTA colours and fonts stay) | You |
| 2026-10-23 | POC set 4 with three vendors (customs laboratory LIMS, category Quality) | You |
| 2026-10-23 | **Open stepper:** all steps can be opened without filling anything; Create checks the required items and goes back to the exact missing one | You |
| 2026-10-23 | RFP, Standards and Risks tabs **vendor first**: a card per vendor with its score per section (previous layout tagged `before-vendor-first-layout`) | You |
| 2026-10-23 | In the RFP / Standards dropdowns, **status pills** (non-compliant · partial · not addressed · compliant) show one group of points at a time | You |
| 2026-10-23 | **No Compliance tab: RFP and Standards are tabs of their own** (Overview · RFP · Standards · Risks · Comparison · AI quality) | You |
| 2026-10-23 | **Compliance split into RFP and Standards views** (sections with points first, empty ones listed once at the end; same for Risks); **Comparison as a pricing-page table** (one column per vendor, one row per aspect); mission-control vendor boxes the same height | You |
| 2026-10-23 | **≈ $6 of credit** (you added $5): test on **Haiku**, run **Opus once** when everything is ready; you start the runs and we review them together | You |
| 2026-10-23 | All 7 sections always shown; section **names only** (no numbers); vendor names above the Comparison columns; a risk's details link to the clause/rule, the evidence and its section | You |
| 2026-10-23 | A third POC set with **three vendors** | You |
| 2026-10-23 | About **$1 of API credit left**: any paid call uses **Haiku 5.5** (superseded the same day) | You |
| 2026-10-23 | Risks tab divided like Compliance: "Section N · name", then each vendor's risks in that section | You |
| 2026-10-22 | **New story after the client meeting** (plan approved): guided New project form **Project → Standards (by category) → Vendors**; project page keeps Overview + Proposals + one AI analysis button; results on their own full-width page (sidebar collapsed) with Overview · Compliance · Risks · Comparison; vendors can be added after an analysis, then re-run | You |
| 2026-10-22 | Analysis checks **standards and RFP separately**, each point with a summary line + details; proposals follow **7 sections**; risk is a **0–100 number** calibrated so a ~90 %-compliant top vendor is not "very high" | You |
| 2026-10-22 | Overview = big recommended-vendor box + 3 mini boxes; Compliance and Risks = **section cards**; Comparison = **computed, free**; recommendation = **Marsa's formula + a short AI reason** | You |
| 2026-10-22 | **RTA company design standard** for the UI only (database and backend stay ours); everything else from the first P8 round discarded | You |
| 2026-10-22 | New standards on the spot from a **dropped rules file** (Excel / CSV / Word / text free; PDF via AI after a cost prompt) | You |
| 2026-10-21 | **AI review tab** per project (run report + confidence score + human rating saved for later improvement) and **source links** on findings (which RFP clause / standard rule a finding breaks, clickable) | You |
| 2026-10-21 | **Haiku 5.5 added** as a third model (cheap end-to-end tests); realistic cost estimate before every live run; **no spending cap for now**; live runs are started by you in the UI, never by me alone | You |
| 2026-10-21 | **Projects use the standard categories**; a project offers its own category + General standards; a General project offers all | You |
| 2026-10-21 | **Documents open in a full-screen reader** (our own, replaces the browser PDF viewer); the Commercial/Technical tabs and View open it directly | You |
| 2026-10-21 | **Push to GitHub only after you have tested a phase** | You |
| 2026-10-21 | UI language: **English, RTL-ready** (logical CSS). AI report language selectable EN/AR | You |
| 2026-10-21 | Deployment: **single Node server** with persistent disk → SQLite + local file storage | You |
| 2026-10-21 | Vendor simulation: **seed data + vendor simulator page + AI-generated proposals** | You |
| 2026-10-21 | Comparison method: **each vendor vs the field** (N steps, linear) | You |
| 2026-10-21 | Visual direction: **Harbor** (light-first, warm off-white, navy ink, sea-teal accent) + dark mode | You |
| 2026-10-21 | App name: **Marsa**, "Procurement Intelligence for Ports & Customs" | You |
| 2026-10-21 | Default AI model: **Claude Opus 5.5** (`claude-opus-5-5`), Sonnet 5.5 selectable | You |
| 2026-10-21 | Stack: Next.js 16 + Tailwind v4 + shadcn/ui + Motion · SQLite (Drizzle + better-sqlite3) · Anthropic TS SDK | Proposed (RDD §2) |
| 2026-10-21 | **All recommendations REC-01 … REC-22 approved** (incl. Phase 10 items REC-16…REC-20) | You |
| 2026-10-21 | Keep Next 16 `cacheComponents` on; every DB-reading GET handler calls `await connection()` (HANDOFF G-03) | Claude (P0) |
| 2026-10-21 | Fonts self-hosted via `@fontsource` + `next/font/local` (offline builds; HANDOFF G-05) | Claude (P0) |
| 2026-10-21 | shadcn/ui style `radix-nova` with RTL enabled | Claude (P0) |
| 2026-10-21 | **Every phase ends** with the app running + localhost link + bullet list of what's done, and generates **deep, production-like test inputs** in `test-inputs/phase-N/` | You |
| 2026-10-21 | **Test documents never help the AI**; RFP pack and standards must not contradict each other; vendor proposals must be legitimate bids | You |
| 2026-10-21 | Next 16 config redirect for `/` (not page-level `redirect()`), `devIndicators: false` | Claude (P1, HANDOFF G-21/G-29) |
| 2026-10-21 | The user tests with **PDF only** and wants **exact copy-paste values** per form | You |
| 2026-10-21 | GitHub repo `imposterjump/marsa` (private); push after every phase | You |
| 2026-10-21 | Standards: **Paste rules** (bulk, `CODE \| text \| priority`) added to P2.4 so testing doesn't require typing 38 rules | Claude (P2) |
| 2026-10-21 | E2E runs against a production build (`next build && next start`), 1 worker | Claude (P2, HANDOFF G-32) |

## Phase status
| Phase | Status | Notes |
|---|---|---|
| Planning (PRD, RDD, PHASES, PROGRESS) | ✅ | 2026-10-21 |
| P0 Foundation | ✅ | 2026-10-21. Build 0 warnings, 10 unit + 2 E2E tests green |
| P1 Design system & shell 🧑 | ✅ | 2026-10-21 · 39 unit + 10 E2E green · awaiting your review |
| P2 Settings & Standards | ✅ | 2026-10-21 · 68 unit + 13 E2E green · ingest pulled forward from P3.2 |
| P3 Projects & RFP | ✅ | 2026-10-21 · 86 unit + 15 E2E green · New project is a 4-step wizard (fading steps) instead of one scroll-spy page |
| P4 Vendor simulation | ✅ | 2026-10-21 · 95 unit + 17 E2E green · local commit, push after your test |
| P5 Proposals & viewer 🧑 | 🟦 | 2026-10-21 · built, 110 unit + 18 E2E green, pushed · **untested by you** (P5.8 checkpoint open) |
| P6 AI pipeline 💳 | ✅ | 2026-10-21 · live-verified on Sonnet 5.5 · waiting for your test |
| P7 Live progress + AI proposals | ✅ | 2026-10-21 · waiting for your test |
| P8 Guided setup + AI analysis results 🧑 | ✅ | 2026-10-23 · built (re-planned after the client meeting) · 177 unit + 20 E2E green · local commits, **waiting for your test** |
| P9 Polish & deploy | ⬜ | |
| P10 Optional | ⬜ | All RECs approved, so in scope after P9 |

## Subtasks
### P0 Foundation
- ✅ P0.1 git init + ignores
- ✅ P0.2 Next.js + TS + Tailwind + lint/format scaffold
- ✅ P0.3 shadcn/ui, lucide, motion, TanStack Query, zod
- ✅ P0.4 Env handling (`.env.example`, typed env, server-only key)
- ✅ P0.5 Drizzle schema + migrations + SQLite (WAL)
- ✅ P0.6 Storage module (traversal-safe)
- ✅ P0.7 Vitest + Playwright setup
- ✅ P0.8 `/api/health`

### P1 Design system & shell
- ✅ P1.1 Tokens + fonts + theme (no FOUC)
- ✅ P1.2 Contrast check script
- ✅ P1.3 UI primitives on `/dev/ui`
- ✅ P1.4 Data primitives (table, ring, stacked bar, stat tile)
- ✅ P1.5 Dropzone
- ✅ P1.6 Motion primitives + reduced motion
- ✅ P1.7 App shell (sidebar, topbar, titles)
- ✅ P1.8 Settings API + first-run welcome
- ⏸ P1.9 🧑 Design checkpoint: self-review done (screenshots); **your review pending**

### P2 Settings & Standards
- ✅ P2.1 Settings page
- ✅ P2.2 Standards service + API
- ✅ P2.3 Standards list page
- ✅ P2.4 Standard detail (rules editor + documents)

### P3 Projects & RFP
- ✅ P3.1 Projects service + API (lifecycle rules, `PRJ-YYYY-NNN`, standards pre-selection)
- ✅ P3.2 Document ingest + file streaming (P2) + DOCX/XLSX/TXT text extraction (P3)
- ✅ P3.3 Projects page (real stats, search, status filter, grid/list, cards)
- ✅ P3.4 New project wizard (Details → RFP documents → Standards → Review & publish; resumable draft)
- ✅ P3.5 Project layout + route tabs (header actions: publish, edit, archive/restore, move to draft, delete)
- ✅ P3.6 Overview tab (RFP documents, notes, details, standards picker, progress timeline)

### P4 Vendor simulation
- ✅ P4.1 Sample content: X-ray tender (Phase 1 pack) + Port Community System tender, 3 standards, labelled *Sample*
- ✅ P4.2 Generators + 4 vendor bids (commercial + technical PDFs, F-1/F-2/F-5/F-6), seed manifest
- ✅ P4.3 Seed / remove / reset (API + `npm run seed` / `npm run reset -- --yes`) + Settings → Demo tools
- ✅ P4.4 Vendors + proposals services/API (resubmission replaces files)
- ✅ P4.5 `/vendor-portal` simulator

### P5 Proposals & viewer
- 🟦 P5.1 Proposals table (built in P4: sortable table, View, remove; empty-state CTA. Left: score/risk columns after P6)
- ✅ P5.2 Analyse & process panel (counts, standards, 3N+2 steps, time + cost estimate, warnings; button wired in P6)
- ✅ P5.3 Proposal workspace + tabs (vendor header, ‹ › nav, Commercial/Technical open the reader, cover cards, locked analysis tabs, compact project header)
- ✅ P5.4 Sheet Stack core + page turns (full-screen `DocumentReader`, pdf.js canvas, sheet stack, page-turn animation, reduced-motion safe)
- ✅ P5.5 Filmstrip (collapsible), scrubber, floating toolbar (page input, zoom, fit, fullscreen), keyboard shortcuts incl. F
- ✅ P5.6 Sources: PDF, image, DOCX (docx-preview), XLSX/CSV (sheet per page), TXT/MD/JSON (paged), download card for others
- ✅ P5.7 Deep links (`?reader=&page=&q=`), text layer, quote highlight + 1.2 s pulse, page-break fallback
- ⏸ P5.8 🧑 Viewer checkpoint (waiting for your review)

### P6 AI pipeline
- ✅ P6.1 AI client wrapper: streaming + structured outputs + adaptive thinking + `fallbacks: "default"` verified live ($0.002)
- ✅ P6.2 zod schemas + wire formats (two shared output formats, G-58) + fixtures
- ✅ P6.3 Content builder + Files API + cache breakpoints ① ② ③ (cache reads verified live)
- ✅ P6.4 Prompts (system + 5 tasks, report language, snapshot test)
- ✅ P6.5 Planner + labels + ETA + cost from usage
- ✅ P6.6 Scoring engine incl. risk severity
- ✅ P6.7 Runner (phases, staggered concurrency, persistence, retry once, cancel, interrupt-on-boot, resume, per-step retry)
- ✅ P6.8 Runs API
- ✅ P6.9 Mock AI generator (deterministic; quotes real PDF sentences; cloud conflict)
- ✅ P6.10 💳 Real runs on Sonnet 5.5: X-ray $4.80, PCS $1.17 (Opus run = your Part B test)

### P7 Live progress + AI proposals
- ✅ P7.1 Mission control (ring, step k of T, masked activity, elapsed/ETA, phase rail, timeline, cancel)
- ✅ P7.2 Live result chips + failure states with Retry + completed-with-errors banner
- ✅ P7.3 Global RunPill + completion toast with View results + aria-live
- ✅ P7.4 Curtain lift into the results (fade under reduced motion)
- ✅ P7.5 Generate with AI (dialog, job with progress, DOCX + PDF, live-checked on Sonnet $0.19)

### P8 Guided setup + AI analysis results (re-planned 2026-10-22)
- ✅ P8.0 RTA design system (UI only)
- ✅ P8.1 Guided New project form (Project → Standards by category / new from a rules file → Vendors → Create)
- ✅ P8.2 Project page (Overview + Proposals, AI analysis button, Add vendor also after an analysis)
- ✅ P8.3 Pipeline 3N + 2 (standards and RFP separately, 7 sections, headlines, 0–100 risk score, formula + AI reason)
- ✅ P8.4 AI analysis results page (Overview, Compliance, Risks, Comparison, AI quality, run history, evidence reader)
- ✅ P8.5 Test inputs on the 7-section template + rules files, READMEs, docs
- ⏸ P8.6 🧑 Checkpoint (waiting for your test)

### P9 Polish & deploy
- ⬜ P9.1 States audit
- ⬜ P9.2 Motion + performance pass
- ⬜ P9.3 Accessibility pass
- ⬜ P9.4 Responsive pass
- ⬜ P9.5 E2E suite
- ⬜ P9.6 Code review pass
- ⬜ P9.7 Docker + README

### P10 Optional (approved RECs only)
- ⬜ P10.1 Overrides (REC-16)
- ⬜ P10.2 PDF export (REC-17)
- ⬜ P10.3 AI rule extraction (REC-18)
- ⬜ P10.4 Ask the proposal (REC-19)
- ⬜ P10.5 Arabic UI

## API spend log
| Date | Step | Model | Cost | Notes |
|---|---|---|---|---|
| 2026-10-21 | P6.1 smoke test | Sonnet 5.5 | $0.002 | Streaming + structured output + fallbacks OK |
| 2026-10-21 | P6.10 X-ray sample, 4 vendors, 14 steps | Sonnet 5.5 | $4.80 | Completed; 697k cache writes because of G-58 (fixed afterwards) |
| 2026-10-21 | PCS run (failed at step 1, 400 errors ×2) | Sonnet 5.5 | $0.00 | Schema limits found (G-58) |
| 2026-10-21 | Schema grouping probes | Sonnet 5.5 | < $0.01 | Two shared formats chosen |
| 2026-10-21 | PCS + Phase 6 bids, 3 vendors, 11 steps | Sonnet 5.5 | $1.17 | Completed; cache reads 262k vs writes 90k |
| 2026-10-21 | P7.5 generate 2 bids | Sonnet 5.5 | $0.19 | Strong + risky bids, DOCX + PDF |
| | **Total (my runs)** | | **≈ $6.17** | |
| 2026-10-23 | Balance check | — | — | You: "about 1 dollar left" (your own runs on :3001 are not logged here). P8 used **no** credits: everything was verified with the free demo AI |
| 2026-10-23 | You added $5 | — | — | ≈ $6 available |
| 2026-10-23 | Your run: POC set 3 on your data (:3000) | Haiku 5.5 | **$0.089** | Started by you |
| 2026-10-23 | POC set 3 check (3 vendors, 11 steps), throwaway server | Haiku 5.5 | **$0.094** | Sabkha recommended, all 7 sections filled; found the "Section E" leak and the Haiku estimate gap (fixed) |

## Session log
| Date | Session summary |
|---|---|
| 2026-10-23 (S6c) | After your Haiku run: Compliance is two views (RFP · Standards) with only the sections that have points, empty ones listed at the end; Risks the same; Comparison rebuilt as a pricing-page table (vendor columns, overall / RFP by section / standards by section / risks by section / commercial terms, best value marked, sections open the differing points); mission-control boxes all the same height. Your app on :3000 runs as a production build (G-84). |
| 2026-10-23 (S6b) | Your test of P8: all 7 sections now show (smarter section guess); Comparison columns carry the vendor names; a risk's "View more" opens the clause or rule, the vendor's page and its Compliance section; section numbers hidden; fixed "0 rules" after creating a standard from a file and the AI writing "Section E". New POC set 3 with three vendors. One Haiku check: $0.094. |
| 2026-10-22/23 (S6) | Client feedback → new story for P8 (plan approved). Kept the RTA look, rebuilt the rest: guided New project form (project first, standards by category or new from a dropped rules file, vendors with two drop zones), project page with one AI analysis button and Add vendor, a pipeline that checks standards and the RFP separately and files every point under 7 proposal sections, a 0–100 risk score, and the full-width AI analysis results page (Overview, Compliance and Risks by numbered section, Comparison, AI quality). POC sets rebuilt on the 7-section template with Excel/CSV rules. Fixed on the way: first RFP upload did not refresh the draft, a vendor from an earlier tender could not be retyped. 177 unit + 20 E2E green. Local commits only, no API credits used. |
| 2026-10-21 (S1) | Requirements gathered (7 decisions). Skills reviewed (epic-design, frontend, backend, architect, claude-api). UI research (dashboards, bid-comparison tools, viewers). Wrote PRD, RDD, PHASES, PROGRESS. 22 recommendations awaiting approval. |
| 2026-10-21 (S2) | Phase 0 complete: Next 16.4 + Tailwind 4 + shadcn (radix-nova, RTL) scaffold, Drizzle/SQLite schema (16 tables), typed env, traversal-safe storage, `/api/health`, Vitest + Playwright. Created HANDOFF.md. 7 environment issues found and solved (HANDOFF §4). |
| 2026-10-21 (S3) | Phase 1 complete: Harbor design system (tokens, contrast-checked), ~25 components, motion primitives, app shell, welcome/profile, settings API + page, `/dev/ui`. Test inputs generated (`test-inputs/phase-1`, realistic tender pack, no evaluator hints). Fixed during self-review: title override, reload loop, lint rules, layout bugs (HANDOFF §8). |
| 2026-10-21 (S5g) | POC inputs for your meeting: two small tenders (rehearsal: Smart Gates + POTS-2026; meeting: customs e-Seals + CTS-2026), each with 12 pasted rules, a 4–5 page RFP and 2 vendors with technical + commercial PDFs, plus copy-paste READMEs. Both checked click by click in the app (free demo AI). Pushed with the earlier commits at your request. No API credits used. |
| 2026-10-21 (S5f) | After P7, from your feedback: page no longer bounces past the end; realistic cost estimate before every live run; Haiku 5.5; new **AI review** tab (files scanned and processed, AI calls and retries, outcome, evidence check, confidence score, your star rating + verdict + comment, saved and exportable); findings now say what the proposal offers, what is required, why it falls short and which RFP clause / standard rule it breaks, with links. 160 unit + 20 E2E green. No API credits used. |
| 2026-10-21 (S5e) | Phases 6 + 7 complete (local commit, not pushed): AI pipeline with live progress (mission control, top-bar pill, completion toast), results (ranking, executive summary, per-vendor compliance / comparison / risk with evidence links), cancel / resume / retry, and Generate with AI. Live-tested on Sonnet 5.5 for ≈ $6.17; fixed a prompt-cache problem that would have cost ~$4 extra per Opus run. New test bids: `test-inputs/phase-6`. |
| 2026-10-21 (S5d) | Phase 5 complete (local commit): Analyse & process panel with time/cost estimate, compact header on proposal pages, reader for Word/Excel/CSV/text/images, selectable PDF text, evidence deep links that jump to the page and highlight the quote, fullscreen, scrubber, thumbnail toggle. |
| 2026-10-21 (S5c) | Feedback round: projects use the standard categories (General applies everywhere; PRJ-2026-001 migrated to IT & security, DB backed up); full-screen reader replaces the browser PDF viewer everywhere (filmstrip, page turns, zoom/fit, keyboard, deep links). Local commit, not pushed. |
| 2026-10-21 (S5b) | Phase 4 complete (local commit, not pushed): vendor simulator, proposals table + proposal page, vendors/proposals API, sample data + Demo tools, 4 realistic vendor bids. Fixed: paste-rules dialog taller than the screen (now scrolls inside, buttons pinned). New rule: push only after your test. |
| 2026-10-21 (S5) | Phase 3 complete: Settings as fading tabs (your feedback), projects service + API, text extraction, Projects home with real data, 4-step New project wizard, project workspace (Overview / Proposals / Evaluation). Fixed: publishing wiped the deadline (zod `.partial()` defaults, same latent bug in Phase 2 standards/rules; your data was unaffected), toasts covering footer buttons (now top-centre). Test guide: `test-inputs/phase-3/README.md`. |
| 2026-10-21 (S4) | Phase 2 complete: Settings (AI model, language, parallel steps, scoring with live example), Standards library (CRUD, rules editor, paste, reorder, undo, documents with real uploads), document ingest + streaming, dynamic breadcrumbs. Test inputs: 3 standard PDFs + copy-paste README. Fixed: hydration mismatch, Suspense build rules, scroll container, Undo toast, flaky E2E. |
