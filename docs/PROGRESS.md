# Marsa — Progress Tracker

> Updated at the end of every work session. Plan details: [PHASES.md](PHASES.md).
> Legend: ⬜ not started · 🟦 in progress · ✅ done · ⏸ blocked / waiting on you · ➖ skipped / rejected

## Now
- **Current phase:** P5 Proposals & viewer ✅ → **🧑 viewer checkpoint: waiting for your test** (then push), then **P6 AI pipeline 💳**.
- **Test it:** http://localhost:3000/projects · guide: [test-inputs/phase-5/README.md](../test-inputs/phase-5/README.md) (Part 1 + Part 2)
- **Session handoff notes:** [HANDOFF.md](HANDOFF.md) (read first every session).

## Waiting on you
| # | Item | Where |
|---|---|---|
| 1 | **Test Phase 5 (viewer checkpoint P5.8)**: categories, reader, Analyse panel, evidence links. I push P4 + P5 to GitHub after your OK | [test-inputs/phase-5/README.md](../test-inputs/phase-5/README.md) |
| 1b | Phase 1 design checkpoint (P1.9): no feedback received yet, assumed OK | — |
| 2 | Confirm "RDD" = the technical requirements & design document (my interpretation) | [RDD.md](RDD.md) |

## Decision log
| Date | Decision | By |
|---|---|---|
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
| P5 Proposals & viewer 🧑 | ✅ | 2026-10-21 · 110 unit + 18 E2E green · viewer checkpoint waiting for your OK |
| P6 AI pipeline 💳 | ⬜ | |
| P7 Live progress + AI proposals | ⬜ | |
| P8 Results UX 🧑 | ⬜ | |
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
- ⬜ P6.1 AI client wrapper (+ verify streaming × structured outputs × fallbacks) 💳≈$0.01
- ⬜ P6.2 zod schemas + fixtures
- ⬜ P6.3 Content builder + Files API + cache breakpoints
- ⬜ P6.4 Prompts
- ⬜ P6.5 Planner + ETA + cost
- ⬜ P6.6 Scoring engine
- ⬜ P6.7 Runner (phases, concurrency, persistence, resume, retry, cancel)
- ⬜ P6.8 Runs API
- ⬜ P6.9 Mock AI generator
- ⬜ P6.10 💳 First real run on seed data

### P7 Live progress + AI proposals
- ⬜ P7.1 Mission control page
- ⬜ P7.2 Live result chips + failure/retry
- ⬜ P7.3 Global run pill + toast
- ⬜ P7.4 Curtain-lift to results
- ⬜ P7.5 💳 AI-generated proposals

### P8 Results UX
- ⬜ P8.1 Results hooks + run selector
- ⬜ P8.2 Compliance tab
- ⬜ P8.3 Comparison tab
- ⬜ P8.4 Risk tab
- ⬜ P8.5 Evaluation tab (leaderboard, matrix, summary)
- ⬜ P8.6 Scores in proposals table + re-run
- ⬜ P8.7 🧑 Results checkpoint

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
| — | — | — | $0.00 | Nothing spent yet |

## Session log
| Date | Session summary |
|---|---|
| 2026-10-21 (S1) | Requirements gathered (7 decisions). Skills reviewed (epic-design, frontend, backend, architect, claude-api). UI research (dashboards, bid-comparison tools, viewers). Wrote PRD, RDD, PHASES, PROGRESS. 22 recommendations awaiting approval. |
| 2026-10-21 (S2) | Phase 0 complete: Next 16.4 + Tailwind 4 + shadcn (radix-nova, RTL) scaffold, Drizzle/SQLite schema (16 tables), typed env, traversal-safe storage, `/api/health`, Vitest + Playwright. Created HANDOFF.md. 7 environment issues found and solved (HANDOFF §4). |
| 2026-10-21 (S3) | Phase 1 complete: Harbor design system (tokens, contrast-checked), ~25 components, motion primitives, app shell, welcome/profile, settings API + page, `/dev/ui`. Test inputs generated (`test-inputs/phase-1`, realistic tender pack, no evaluator hints). Fixed during self-review: title override, reload loop, lint rules, layout bugs (HANDOFF §8). |
| 2026-10-21 (S5d) | Phase 5 complete (local commit): Analyse & process panel with time/cost estimate, compact header on proposal pages, reader for Word/Excel/CSV/text/images, selectable PDF text, evidence deep links that jump to the page and highlight the quote, fullscreen, scrubber, thumbnail toggle. |
| 2026-10-21 (S5c) | Feedback round: projects use the standard categories (General applies everywhere; PRJ-2026-001 migrated to IT & security, DB backed up); full-screen reader replaces the browser PDF viewer everywhere (filmstrip, page turns, zoom/fit, keyboard, deep links). Local commit, not pushed. |
| 2026-10-21 (S5b) | Phase 4 complete (local commit, not pushed): vendor simulator, proposals table + proposal page, vendors/proposals API, sample data + Demo tools, 4 realistic vendor bids. Fixed: paste-rules dialog taller than the screen (now scrolls inside, buttons pinned). New rule: push only after your test. |
| 2026-10-21 (S5) | Phase 3 complete: Settings as fading tabs (your feedback), projects service + API, text extraction, Projects home with real data, 4-step New project wizard, project workspace (Overview / Proposals / Evaluation). Fixed: publishing wiped the deadline (zod `.partial()` defaults, same latent bug in Phase 2 standards/rules; your data was unaffected), toasts covering footer buttons (now top-centre). Test guide: `test-inputs/phase-3/README.md`. |
| 2026-10-21 (S4) | Phase 2 complete: Settings (AI model, language, parallel steps, scoring with live example), Standards library (CRUD, rules editor, paste, reorder, undo, documents with real uploads), document ingest + streaming, dynamic breadcrumbs. Test inputs: 3 standard PDFs + copy-paste README. Fixed: hydration mismatch, Suspense build rules, scroll container, Undo toast, flaky E2E. |
