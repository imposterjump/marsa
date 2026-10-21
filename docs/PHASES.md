# Marsa — Build Phases & Subtasks

> Each subtask is small enough to build and test on its own. **ID format:** `P{phase}.{n}`.
> Every subtask has a **Done when** line, which is the test that closes it. Status lives in [PROGRESS.md](PROGRESS.md).
> 🧑 = needs your review or decision · 💳 = spends Claude API credits (only with your OK)

```
P0 Foundation ─▶ P1 Design system & shell 🧑 ─▶ P2 Settings & Standards ─▶ P3 Projects & RFP
      ─▶ P4 Vendor simulation (seed + simulator) ─▶ P5 Proposals table & Sheet Stack viewer 🧑
      ─▶ P6 AI pipeline engine 💳 ─▶ P7 Live progress UX + AI-generated proposals
      ─▶ P8 Results UX (compliance · comparison · risk · evaluation) 🧑 ─▶ P9 Polish, tests, deploy
      ─▶ P10 Optional enhancements (approved RECs only)
```

---

## P0 — Foundation & tooling
Goal: an empty but correctly wired app that boots, talks to SQLite, and stores files.

| ID | Subtask | Done when |
|---|---|---|
| P0.1 | `git init`, `.gitignore` (`data/`, `.env*.local`, `.next`, `node_modules`), `.editorconfig` | `git status` is clean after the first commit |
| P0.2 | Scaffold Next.js 16 + TS (strict) + Tailwind v4 + ESLint + Prettier in the repo root, using the `src/` layout from RDD §3 | `npm run dev` serves a page. `npm run lint` and `npm run typecheck` pass |
| P0.3 | Add shadcn/ui (init only), lucide-react, motion, TanStack Query, zod. Providers file | Sample button with a Motion hover renders |
| P0.4 | Env handling: `.env.example` (`ANTHROPIC_API_KEY`, `AI_MODE=mock`, `DATA_DIR`, `MAX_UPLOAD_MB`) and a typed `env.ts` (zod) | The app fails fast with a clear message on an invalid env. The key is never imported in client code (lint rule / `server-only`) |
| P0.5 | Drizzle + better-sqlite3: full schema from RDD §4, migrations, WAL, `db/client.ts` singleton | `npm run db:migrate` creates `data/app.db` with all tables |
| P0.6 | Storage module: save/read/delete/stream with traversal-safe paths | Unit test: writes, reads, and rejects `../` paths |
| P0.7 | Vitest + Playwright setup, plus `npm run test`, `test:e2e` scripts, and one smoke test each | Both test commands pass |
| P0.8 | Health route `GET /api/health` (DB ok, storage ok, AI mode, key configured) | `curl` returns all `ok` |

## P1 — Design system & app shell 🧑
Goal: the Harbor look and feel, reusable components, and the 3-item sidebar shell. **Design checkpoint with you at the end.**

| ID | Subtask | Done when |
|---|---|---|
| P1.1 | Tokens in `globals.css` (light/dark, RDD §9.2) → Tailwind `@theme`. Fonts via `next/font` | Tokens visible on a `/dev/ui` page. Theme switch works without a flash (no FOUC) |
| P1.2 | `scripts/contrast-check.ts` verifies every text/background pair | All pairs ≥ 4.5:1 (≥ 3:1 for large text and icons) |
| P1.3 | Primitives restyled: Button (primary/secondary/ghost/danger, sizes, loading), Input, Textarea, Select, Checkbox, Switch, SegmentedControl, Badge, StatusPill (4 compliance + 4 risk + project statuses), Card, Tabs, Tooltip, Dialog, Sheet/Drawer, DropdownMenu, Toast, Skeleton, Avatar (initials + tint), EmptyState | Each is shown in all its states on `/dev/ui`. Keyboard and focus are correct |
| P1.4 | Data primitives: DataTable (sortable, sticky header, row hover, empty/loading), ProgressRing, StackedStatusBar, StatTile, KeyValue list | Rendered on `/dev/ui` with sample data |
| P1.5 | Dropzone (multi-file, drag states, per-file progress, type icons, remove, validation errors) | Drag 3 files and see progress. An oversized file shows an inline error |
| P1.6 | Motion primitives: `Reveal`, `Stagger`, `MaskedText`, `CountUp`, `DepthBackdrop`, `FloatLoop`, `ScrambleText`, route transition, global reduced-motion handling (RDD §11) | Demo on `/dev/ui`. With OS reduced-motion on, loops and parallax stop |
| P1.7 | App shell: Sidebar (Projects · Standards · Settings, collapse to icon rail, tooltips, active indicator, mobile drawer), Topbar (breadcrumb, run-pill slot, theme toggle, customer chip), `/` → `/projects`, page title `{Page} · Marsa — {Customer}` | Navigate all 3 items by keyboard. Collapsed state persists |
| P1.8 | Settings service + `GET/PUT /api/settings` and the first-run **WelcomeDialog** (name, organization) | First visit shows the dialog. After saving, the name appears in the topbar and tab title |
| P1.9 | 🧑 **Design checkpoint**: screenshots of `/dev/ui`, the shell, and light/dark sent to you for approval | You approve, or the changes you ask for are listed in PROGRESS |

## P2 — Settings & Standards
| ID | Subtask | Done when |
|---|---|---|
| P2.1 | Settings page: sections Profile · Appearance · AI (model, report language, key status) · Scoring (weights, partial credit, with a live example score) · Demo tools (placeholders until P4) · auto-save toasts | Changes persist across a reload. An invalid weight is rejected inline |
| P2.2 | Standards service + API (CRUD standards, rules CRUD + reorder, documents upload) | Integration tests pass |
| P2.3 | Standards list page: cards (code, title, category, rule count, docs count, active switch), search, `+ New standard`, empty state | Create, toggle, and delete work with optimistic UI |
| P2.4 | Standard detail: inline rules table editor (add row, edit in place, priority pill, drag reorder, delete with undo toast) + **Paste rules** (bulk `CODE \| text \| priority`) + documents dropzone + open/download | 10 rules added and reordered by keyboard. Documents upload and open. *(Done: ingest + file streaming from P3.2 were pulled forward here)* |

## P3 — Projects & RFP creation
| ID | Subtask | Done when |
|---|---|---|
| P3.1 | Projects service + API (CRUD, code generator `PRJ-YYYY-NNN`, status transitions) | Unit test for status transitions. Integration tests pass |
| P3.2 | Document ingest pipeline (RDD §5.1): validate, sniff, store, sha256, page count, text extraction (docx/xlsx/txt), `aiReadable` flag + `GET /api/documents/:id/file` with Range | Upload PDF, DOCX, XLSX, PNG, and DOC: the metadata is correct and DOC is flagged not AI-readable |
| P3.3 | Projects page: hero (MaskedText greeting, DepthBackdrop, 3 StatTiles), toolbar (search, status filter, grid/list), project cards with stagger + hover lift, empty state with an illustration | Looks right in light and dark at 1280/1024/768/390. Filter and search work |
| P3.4 | New project page: Details · RFP files · Standards · Review sections with scroll-spy, validation, `Save draft` / `Publish to vendors` | Creating a project with 2 RFP files lands on its Overview with the files listed |
| P3.5 | Project layout: header (name, code, status pill, deadline, actions menu: edit, archive, delete) + tabs Overview · Proposals · Evaluation | Tabs are deep-linkable. Evaluation shows a locked state before any run |
| P3.6 | Overview tab: details card, RFP documents list (opens the viewer in a large Sheet dialog, using a basic viewer until P5), selected standards chips, status timeline | All seeded fields are visible and editable through Edit |

## P4 — Vendor simulation (seed + simulator)
| ID | Subtask | Done when |
|---|---|---|
| P4.1 | Fictional sample content (`server/seed/data.ts`): **Project A**, "Drive-through Container X-Ray Scanning System" (4 scanners, on-premise image server, integration with the customs system). **Project B**, "Port Community System web platform" (Open, no proposals yet). Three sample standards (IT Security & Data Residency · Equipment Safety & Radiation · Commercial Terms) with 8–12 rules each | Content reviewed for realism and clearly labelled *Sample* |
| P4.2 | File generators (`pdfkit`, `docx`): multi-page RFP PDF; per vendor a commercial PDF (3–5 pages, price tables) + a technical DOCX or PDF (6–12 pages, spec tables). **Four vendors with deliberate profiles**: *Harborline Systems* (strong, expensive) · *Meridian Scan Tech* (cheap, **cloud-only image platform**, conflicts with on-prem) · *Nile Gate Solutions* (partial: lower steel penetration, HD instead of 2K operator displays) · *Atlas Port Technologies* (incomplete: no warranty or training sections) | `npm run seed` builds the files into `data/uploads` and the DB rows. The files open correctly in Acrobat and Word |
| P4.3 | Seed and reset commands + Settings → Demo tools buttons (re-seed, reset all with a typed confirmation) | Reset → empty app. Re-seed → the demo state returns |
| P4.4 | Vendors service + API. Proposals service + API (multipart commercial[] + technical[], one per vendor per project, replace on resubmit) | Integration tests pass |
| P4.5 | `/vendor-portal` simulator page: choose project (open ones) → vendor (pick or create) → two dropzones (Commercial, Technical) → Submit. Banner "Demo tool: simulates a vendor submission" | A new proposal appears in the project's Proposals tab |

## P5 — Proposals table & Sheet Stack viewer 🧑
| ID | Subtask | Done when |
|---|---|---|
| P5.1 | Proposals tab: DataTable (vendor avatar + name, submitted date/time, files, status, score/risk placeholders, **View**). Empty state with a "Simulate vendor submissions" CTA | Sorting works. View opens the workspace on **Commercial** |
| P5.2 | "Analyse & process" action panel below the table (counts, standards, `3N+2` steps, time estimate, disabled/warn states). Wired in P6 | Correct step count for 0/1/3/4 proposals |
| P5.3 | Proposal workspace layout: vendor header (avatar, name, date, score ring placeholder, risk badge, ‹ › vendor nav) + tabs Commercial · Technical · Compliance · Comparison · Risk (locked before analysis) + `?tab=` deep links | Tabs switch without a reload. Locked tabs explain why |
| P5.4 | Viewer core `SheetStackViewer`: stage, sheet, ghost stack (thins with pages left), page-turn animations, reduced-motion fallback, page label | Paging a 12-page PDF feels smooth (60 fps in DevTools) |
| P5.5 | Viewer chrome: filmstrip (lazy thumbs), floating glass toolbar (prev/next, page input, zoom, fit, download, fullscreen), scrubber, keyboard shortcuts, single-page mode | All shortcuts work. Single-page docs hide pagination |
| P5.6 | Sources: PDF (react-pdf + text layer), DOCX (docx-preview pages), XLSX/CSV (sheet = page), image, TXT/MD, download card for others. File switcher pills | Every seeded file previews correctly |
| P5.7 | Deep link `doc` + `page` + `q` with an accent pulse and quote highlight | The URL opens the exact page with a highlight |
| P5.8 | 🧑 **Viewer checkpoint**: short screen recording or screenshots for your approval | Approved or feedback logged |

## P6 — AI pipeline engine 💳
| ID | Subtask | Done when |
|---|---|---|
| P6.1 | AI client wrapper: model from settings, adaptive thinking, effort `high`, streaming + `finalMessage`, refusal fallbacks, typed error handling, `stop_reason` checks, usage capture. **Verify** that streaming, structured outputs, and fallbacks combine correctly, and check the current price sheet | A tiny live call (≈ $0.01, with your OK) returns validated JSON. Mock mode returns the same shape |
| P6.2 | zod schemas (RDD §7.5) + JSON-schema compatibility check + fixtures | Schemas compile to `output_config.format`. Fixture tests pass |
| P6.3 | Content builder (RDD §5.2, §7.3): Files API upload with `file_id` caching, text blocks for DOCX/XLSX, titles, cache breakpoints ①②③ | Unit test: the block order and breakpoints match the spec. A re-upload happens when a file_id is missing |
| P6.4 | Prompts: the system prompt (§7.4) + 5 step task prompts (checklist, analyze, compare, risk, summary), with report-language support | Prompt snapshot tests. Reviewed by you (optional) |
| P6.5 | Planner (`3N+2`, N=1 edge case, labels) + ETA + cost modules | Unit tests for N = 1, 2, 3, 10 |
| P6.6 | Scoring engine (§7.6) incl. category scores, mandatory failures, risk severity | Unit tests with hand-computed expectations |
| P6.7 | Runner: globalThis singleton, strict phases, intra-phase concurrency, persistence after each step (normalized rows), retry/backoff, cancel (AbortController), `instrumentation.ts` interrupt-on-boot, resume, per-step retry, project status updates | Integration test in mock mode: a full run, a simulated crash then resume, and a failed step retried |
| P6.8 | Runs API (§6): start/status/cancel/resume/retry/results/per-proposal/active | Integration tests pass |
| P6.9 | Mock AI generator (§7.8) with deterministic outputs and the on-prem conflict for the cloud-only vendor | A mock run on seed data gives the same scores every time |
| P6.10 | 💳 **First real run** on seed Project A (4 vendors, ≈ $4–10, with your OK). Check: on-prem conflict caught, partial-display finding, evidence pages, cache hits > 0, cost recorded | Results reviewed together. Prompt fixes logged |

## P7 — Live progress UX + AI-generated proposals
| ID | Subtask | Done when |
|---|---|---|
| P7.1 | Mission control page (RDD §10): DepthBackdrop, progress ring, "Step k of T", MaskedText current activity, elapsed/ETA, phase rail with ScrambleText, step timeline with statuses and durations, cancel | A mock run is narrated step by step without a single blank spinner |
| P7.2 | Live result chips (scores pop in as analyses finish) + failure states with Retry + `completed_with_errors` banner | Forced failure in mock mode → Retry recovers it |
| P7.3 | Global RunPill in the topbar + completion toast with "View results" + `aria-live` | Navigate away mid-run: the pill updates and the toast appears at the end |
| P7.4 | Curtain-lift transition from mission control into the Evaluation tab | Smooth at 60 fps. Instant with reduced motion |
| P7.5 | AI-generated proposals (FR-4.3, RDD §7.9): dialog (count, profile mix, cost estimate) → background job with progress → rendered PDF + DOCX → proposals saved | 💳 Generate 2 proposals (≈ $0.5–1, with your OK). They open in the viewer and analyse correctly |

## P8 — Results UX 🧑
| ID | Subtask | Done when |
|---|---|---|
| P8.1 | Results API wiring + TanStack hooks + run selector (history) | Switching runs swaps every result view |
| P8.2 | **Compliance tab**: score ring (CountUp), stacked status bar, mandatory gate banner, category bars, commercial snapshot, strengths/weaknesses, findings list (segmented filter, numbered rows, expandable: Requirement · Vendor states · Assessment · Gap · "Open in document ↗" deep link) | Each status list is numbered 1..n with REQ codes. Every evidence link opens the right page |
| P8.3 | **Comparison tab** (vendor vs field): advantages/disadvantages columns with vendor avatars, unique-offer chips, price position | Matches the run's comparison output |
| P8.4 | **Risk tab**: overall banner, 5×5 heatmap (click filters), risk cards by severity with "If we choose this proposal…" consequence + mitigation + evidence link | The seeded cloud-only vendor shows a Critical/High infrastructure risk |
| P8.5 | **Evaluation tab**: executive summary + recommendation, leaderboard cards (stagger), comparison matrix (sticky, grouped, "differences only", "mandatory only"), pros/cons table, commercial comparison, category chart (follow the dataviz skill) | The committee "who's best and why" question is answered above the fold |
| P8.6 | Proposals table shows score + risk after a run. "Re-run analysis" when proposals changed (FR-5.4) | Adding a proposal after a run surfaces Re-run |
| P8.7 | 🧑 **Results checkpoint** with you | Approved or feedback logged |

## P9 — Polish, quality, deploy
| ID | Subtask | Done when |
|---|---|---|
| P9.1 | Loading/empty/error states audit on every screen (skeletons, retry, helpful copy) | Checklist in PROGRESS is fully ticked |
| P9.2 | Motion pass (consistency, durations, reduced motion) + perf pass (lazy viewer, bundle check with the frontend skill's analyzer) | No jank in DevTools performance traces on key flows |
| P9.3 | Accessibility pass: keyboard walkthrough, axe scans, screen-reader labels, `?` shortcuts dialog | 0 axe violations on the main pages |
| P9.4 | Responsive pass (1440 / 1280 / 1024 / 768 / 390) | Screenshots logged |
| P9.5 | E2E suite (mock AI): the happy path end to end, light and dark | `npm run test:e2e` is green |
| P9.6 | Code review pass (code-reviewer skill checklist) + fixes | Review notes resolved |
| P9.7 | Dockerfile (standalone, non-root, `/app/data` volume) + `README.md` (setup, env, seed, mock vs live, deploy to Railway/Render/VPS) | `docker run` with a volume works locally. Data survives a container restart |

## P10 — Optional enhancements (only the RECs you approve)
| ID | Subtask | REC |
|---|---|---|
| P10.1 | Evaluator overrides on findings (status + note, score recompute, "edited" badge, audit trail) | REC-16 |
| P10.2 | Export evaluation report to PDF (cover, ranking, per-vendor compliance, risks) | REC-17 |
| P10.3 | "Extract rules with AI" from a standard document → editable draft rules | REC-18 |
| P10.4 | "Ask the proposal" Q&A drawer grounded in the vendor's documents | REC-19 |
| P10.5 | Arabic UI + RTL toggle (layout is already logical-property based) | — |

---

### Rough effort guide
P0 ½ day · P1 1½ days · P2 1 day · P3 1½ days · P4 1 day · P5 2 days · P6 2 days · P7 1 day · P8 2 days · P9 1½ days. That is about 14 working sessions before P10. The order puts a clickable, good-looking app in front of you early (after P3–P5) before any credits are spent.
