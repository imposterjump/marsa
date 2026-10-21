# Marsa — Progress Tracker

> Updated at the end of every work session. Plan details: [PHASES.md](PHASES.md).
> Legend: ⬜ not started · 🟦 in progress · ✅ done · ⏸ blocked / waiting on you · ➖ skipped / rejected

## Now
- **Current phase:** P0 Foundation ✅ → next is **P1 Design system & shell** (starts with P1.1 Harbor tokens).
- **Session handoff notes:** [HANDOFF.md](HANDOFF.md) (read first every session).

## Waiting on you
| # | Item | Where |
|---|---|---|
| 1 | Nothing blocking. Your Anthropic key is detected in `.env` (that works, see HANDOFF G-07) | — |
| 2 | Confirm "RDD" = the technical requirements & design document (my interpretation) | [RDD.md](RDD.md) |
| 3 | Design checkpoint at the end of P1 (P1.9) | upcoming |

## Decision log
| Date | Decision | By |
|---|---|---|
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

## Phase status
| Phase | Status | Notes |
|---|---|---|
| Planning (PRD, RDD, PHASES, PROGRESS) | ✅ | 2026-10-21 |
| P0 Foundation | ✅ | 2026-10-21. Build 0 warnings, 10 unit + 2 E2E tests green |
| P1 Design system & shell 🧑 | ⬜ | |
| P2 Settings & Standards | ⬜ | |
| P3 Projects & RFP | ⬜ | |
| P4 Vendor simulation | ⬜ | |
| P5 Proposals & viewer 🧑 | ⬜ | |
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
- ⬜ P1.1 Tokens + fonts + theme (no FOUC)
- ⬜ P1.2 Contrast check script
- ⬜ P1.3 UI primitives on `/dev/ui`
- ⬜ P1.4 Data primitives (table, ring, stacked bar, stat tile)
- ⬜ P1.5 Dropzone
- ⬜ P1.6 Motion primitives + reduced motion
- ⬜ P1.7 App shell (sidebar, topbar, titles)
- ⬜ P1.8 Settings API + first-run welcome
- ⬜ P1.9 🧑 Design checkpoint

### P2 Settings & Standards
- ⬜ P2.1 Settings page
- ⬜ P2.2 Standards service + API
- ⬜ P2.3 Standards list page
- ⬜ P2.4 Standard detail (rules editor + documents)

### P3 Projects & RFP
- ⬜ P3.1 Projects service + API
- ⬜ P3.2 Document ingest + file streaming
- ⬜ P3.3 Projects page (hero, filters, cards)
- ⬜ P3.4 New project page
- ⬜ P3.5 Project layout + tabs
- ⬜ P3.6 Overview tab

### P4 Vendor simulation
- ⬜ P4.1 Sample content (fictional, labelled)
- ⬜ P4.2 File generators + 4 vendor profiles
- ⬜ P4.3 Seed / reset commands + Demo tools
- ⬜ P4.4 Vendors + proposals services/API
- ⬜ P4.5 `/vendor-portal` simulator

### P5 Proposals & viewer
- ⬜ P5.1 Proposals table
- ⬜ P5.2 Analyse & process panel
- ⬜ P5.3 Proposal workspace + tabs
- ⬜ P5.4 Sheet Stack core + page turns
- ⬜ P5.5 Filmstrip, toolbar, scrubber, keyboard
- ⬜ P5.6 Sources (PDF, DOCX, XLSX, image, text, other)
- ⬜ P5.7 Deep links + quote highlight
- ⬜ P5.8 🧑 Viewer checkpoint

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
