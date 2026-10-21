# Marsa — Session Handoff

> **Read this first in every new session**, before writing any code. It holds everything the previous sessions learned the hard way: environment quirks, gotchas, open problems, and small decisions that are not obvious from the code.
> Companion docs: [PROGRESS.md](PROGRESS.md) (status) · [PHASES.md](PHASES.md) (plan) · [RDD.md](RDD.md) (design) · [PRD.md](PRD.md) (requirements) · [../test-inputs/SCENARIO.md](../test-inputs/SCENARIO.md) (test corpus)

## How to maintain this file
1. **At the end of every coding session**, update §1 (Where we are), add or update entries in §4 (Gotchas) and §5 (Open issues), and append a dated entry to §8 (Session log).
2. **Never delete history.** When an issue is fixed, change its status to ✅ Solved and say *how*. Keep the entry so the next agent knows the trap exists.
3. Each gotcha gets an ID (`G-xx`) and each open issue an ID (`I-xx`). Reference them in commits and PROGRESS.md notes.
4. Write for an agent that has **zero memory** of earlier sessions: exact commands, exact file paths, exact error text.

Status legend: 🔴 Open · 🟡 Workaround in place · ✅ Solved · ℹ️ Rule / fact (always applies)

---

## 0. The user's standing rules (apply to every phase)
1. **End of every phase:** start the app (`npm run dev` → http://localhost:3000, `AI_MODE=mock`), give the user the **localhost link** and a **bullet list of what was done**, so they can test each feature and send feedback.
2. **Every phase generates its test inputs** in `test-inputs/phase-N/` with a `README.md` test guide (steps + expected results). Inputs must be **deep and production-like** (multi-page, real formats, realistic detail), not one-page toys.
3. **Never help the AI** in test documents: no evaluator hints, no "this is non-compliant" wording, no pre-computed answers. **The RFP pack and the standards must not contradict each other.** **Vendor proposals must be legitimate, coherent bids.** Then let the AI work. Human-only reference notes go in `test-inputs/SCENARIO.md` (never uploaded).
4. Plan → ask → build. The user approves recommendations before they are built. Report progress briefly when a phase runs long (the user asked "are you stuck?").

## 1. Where we are (update every session)
- **Last session:** 2026-10-21 (session 3, Phase 1).
- **Done:** Planning · **Phase 0** · **Phase 1** (P1.1–P1.8 built; P1.9 self-review done with screenshots; user review pending).
- **Next subtask:** wait for the user's Phase 1 feedback, then **P2.1** Settings page completion (AI model select, report language, scoring weights with live example) → P2.2–P2.4 Standards library. Phase 2 must also generate `test-inputs/phase-2/` (three standards consistent with the RFP pack, see SCENARIO.md).
- **App runs?** Yes: `npm run dev` → http://localhost:3000 (redirects to /projects; first run shows the welcome dialog). UI kit at `/dev/ui`.
- **All checks green?** `npm run check` (lint + typecheck + contrast + 39 unit tests) ✔ · `npm run test:e2e` 10/10 ✔ · `npm run build` 0 warnings (last verified in P0; rerun before P2 work).
- **User approvals:** all REC-01…REC-22 approved.

## 2. Quick start for a new session
```bash
npm install                     # if node_modules is missing
npm run dev                     # http://localhost:3000 (AI_MODE=mock from .env.local)
npm run check                   # lint + typecheck + contrast + unit tests
npm run test:e2e                # Playwright on :3200 with data/e2e (stop other `next dev` first — G-09)
npm run db:generate             # after editing src/server/db/schema.ts → commit drizzle/*.sql
npm run build                   # production build (standalone output)
npx tsx scripts/test-inputs/build-phase-1.ts   # regenerate Phase 1 test documents
npx tsx scripts/screenshots.ts http://localhost:3100 <outDir>   # design-review screenshots (server on a throwaway DATA_DIR)
```
Ports: **3000** user's dev server · **3100** my screenshot/diagnosis server · **3200** Playwright · **3300** standalone smoke test.
Data dirs: `data/` (user) · `data/test` (vitest env) · `data/e2e` (Playwright) · `data/shots`, `data/diag` (throwaway). All gitignored.

## 3. Environment facts
| Fact | Value / note |
|---|---|
| OS | Windows 11 Home. Tools: Git Bash (POSIX) and PowerShell 5.1 |
| Node / npm | Node **24.15.0** · npm **11.12.1** (`engines.node >= 24`) |
| npm script shell | **PowerShell 5.1** (user's global `~/.npmrc`). Don't change it. See G-01 |
| Repo path | `C:\work\mawane2 w gamarek`: **contains spaces**. Always quote paths |
| Git | `main`, commit per finished subtask/phase (REC-22) |
| Key versions | next 16.4.2 · react 19.3 · tailwind 4.3 · shadcn CLI 4.22 (radix-nova) · drizzle-orm 0.45 · better-sqlite3 13 · zod 4.6 · motion 14.5 · TanStack Query 5.104 · vitest 5 · Playwright 1.64 · docx 9.13 · exceljs 4.4 · pdfjs-dist 6.4.299 |
| Secrets | The user's real Anthropic key is in **`.env`** (gitignored). `.env.local` = non-secret overrides. See G-07 |
| PDF rendering for review | The Read tool can't render PDFs (no poppler). See G-24 |

## 4. Gotchas & rules
| ID | Status | Gotcha | What to do |
|---|---|---|---|
| G-01 | ✅ Solved | npm scripts run in **PowerShell 5.1**: `a && b` fails (*"The token '&&' is not a valid statement separator"*), and `FOO=1 cmd` doesn't work | Use `run-s`/`run-p` (npm-run-all2). Env vars via config (Playwright `webServer.env`) or `cross-env`. In the Bash tool, `&&` is fine |
| G-02 | ℹ️ Rule | **Next.js 16.4 is newer than training data.** | Read `node_modules/next/dist/docs/01-app/…` before using a Next API. Keep `AGENTS.md` committed (`next dev` rewrites it) |
| G-03 | ℹ️ Rule | `cacheComponents: true`. GET handlers and server components are prerendered unless they touch request-time data, and **better-sqlite3 is synchronous** | First line of every DB-reading GET handler / server component: `await connection()`. Never inside services. Check `npm run build` shows API routes as `ƒ` |
| G-04 | ℹ️ Rule | With cacheComponents, `export const runtime` is not supported | Never add it |
| G-05 | ✅ Solved | `next/font/google` timed out from the dev server → `GET /` 500. **next/font options must be static literals** (*"missing field `src`"*) | Fonts self-hosted: `@fontsource*` + `next/font/local` in `src/app/fonts.ts`, literal paths only |
| G-06 | ✅ Solved | Turbopack traced the whole repo and `data/*.db` into `.next/standalone` | `/*turbopackIgnore: true*/` on runtime fs paths (env.ts, storage/local.ts, db/connect.ts). After new fs code, check `.next/server/app/**/route.js.nft.json` |
| G-07 | 🟡 Workaround | Key is in `.env`. **`.env.local` overrides `.env`**, so an empty `ANTHROPIC_API_KEY=` there hid the key. **Next copies `.env` into `.next/standalone/`** | Never add `ANTHROPIC_API_KEY=` to `.env.local`. Never print the key (check length/prefix only). `.dockerignore` excludes `.env*`. The Dockerfile passes the key at runtime |
| G-08 | ℹ️ Rule | `import "server-only"` throws outside the React Server condition | Vitest aliases it to `empty.js`. Scripts import factories (`db/connect.ts`, `storage/local.ts`) |
| G-09 | ℹ️ Rule | One `next dev` per project folder. On Windows, TaskStop does **not** kill the `node.exe` children | Before E2E or a new server: `Get-CimInstance Win32_Process -Filter "Name='node.exe'" \| ? CommandLine -like '*mawane2 w gamarek*next*' \| % { Stop-Process -Id $_.ProcessId -Force }` (only your own) |
| G-10 | ℹ️ Fact | shadcn CLI v4 needs `-p <preset>`. Init used `-t next -b radix -p nova --rtl --pointer --no-monorepo -y`. Imports `radix-ui` + the `cn` package (shadcn's own). `shadcn add` prompts on overwrite: pipe `echo n \|` | Add components: `echo n \| npx shadcn@latest add <names>`, then restyle to Harbor |
| G-11 | 🟡 Accepted | `npm audit`: 5 high (`braces` via eslint-config-next, dev-only) | Do **not** `npm audit fix --force` |
| G-12 | ✅ Solved | Vitest ESM warning | `vitest.config.mts` with `import.meta.dirname` |
| G-13 | ℹ️ Fact | Path with spaces works for all tools | Quote paths |
| G-14 | ℹ️ Rule | Drizzle: JSON via `text(…,{mode:"json"}).$type<T>()` + `$defaultFn`; booleans `integer(…,{mode:"boolean"})`; ISO timestamps | After a schema change: `npm run db:generate` → commit SQL |
| G-15 | ℹ️ Fact | `typecheck` needs `next typegen` first | `npm run typecheck` = `run-s typegen tsc` |
| G-16 | ℹ️ Fact | Turbopack CSS rule with `@tailwindcss/turbopack` in next.config | Keep |
| G-17 | ℹ️ Rule | Prettier ignores `*.md` and `.env*` | `npm run format` before commits |
| G-18 | ℹ️ Rule | Client code must never import `src/server/**` | ESLint `no-restricted-imports` + `server-only`. Shared types live in `src/lib/api-types.ts` |
| G-19 | ℹ️ Rule | **React hooks lint (eslint-config-next 16)** errors on `setState` inside effects (`react-hooks/set-state-in-effect`) and on writing refs during render (`react-hooks/refs`) | Patterns: client-only values via **`useSyncExternalStore`** (`src/hooks/use-client-store.ts`: theme, sidebar, greeting, date). Reset form state by **remounting with `key`** (e.g. `key={settings.updatedAt}`). Callbacks fired from effects via **`useEffectEvent`** (React 19.3). Reduced-motion: compute the rendered value, don't setState |
| G-20 | ✅ Solved | On client navigation, **Next re-applies the static metadata `<title>` after our effect** (tab showed "Marsa") | `TitleSync` sets the title and re-asserts it with a `MutationObserver` on `<head>`. Pages do **not** export metadata titles; the root default is "Marsa" |
| G-21 | ✅ Solved | `redirect()` inside `app/page.tsx` → Next 16 dev error *"Route "/": Could not validate `instant` … NEXT_REDIRECT"*, and a fresh dev server **reload-looped** /projects (E2E: "5 × navigated to /projects") | `/` → `/projects` is a **config redirect** in `next.config.ts` (`redirects()`); `src/app/page.tsx` was deleted |
| G-22 | ℹ️ Rule | E2E timing: keyboard shortcuts pressed before hydration do nothing | Wait for a hydrated element first (e.g. the "Account: …" button). E2E resets first-run with `PUT /api/settings {onboarded:false}` |
| G-23 | ℹ️ Fact | Tokens: Harbor teal is shadcn **`primary`**; shadcn **`accent` = neutral hover surface** (not brand) | Use `brand`, `brand-hover`, `brand-soft`, `brand-ink`, `on-brand` for teal. Status: `ok/partial/fail/missing` (+`-soft`). Risk: `risk-*`. Elevation: `shadow-xs…lg`, `shadow-paper` |
| G-24 | ℹ️ Fact | The Read tool can't render PDFs here (*"pdftoppm is not installed"*) | Verify PDFs with pdfjs-dist text extraction (page count, text) and screenshot the source HTML with Playwright. PNGs can be viewed with Read |
| G-25 | ℹ️ Fact | Long Bash heredocs with mixed quotes failed (*"unexpected EOF while looking for matching `''"*) | Write a Python/TS helper to the scratchpad and run it with the repo path as an argument |
| G-26 | ℹ️ Fact | Git Bash rewrites arguments starting with `/` into Windows paths (curl `-w "/projects"` → `C:/Program Files/Git/projects`) | Prefix with `MSYS_NO_PATHCONV=1` when passing URL paths as standalone args |
| G-27 | ℹ️ Rule | Sidebar collapsed state = `<html data-sidebar="collapsed">`, set **pre-paint** by `bootScript` (`src/lib/theme.ts`). The Tailwind `collapsed:` variant is scoped to `.sidebar-rail` (the drawer never collapses) | Change it only via `setSidebarCollapsed()` (dispatches `marsa:sidebar`). Read it via `useSidebarCollapsed()`. Shortcut `Ctrl+B` |
| G-28 | ✅ Solved | `field-sizing-content` on Textarea sized it to its long placeholder and blew out grid columns | Removed; Textarea uses `resize-y` |
| G-29 | ✅ Solved | The Next dev indicator ("N" badge) covered the sidebar footer | `devIndicators: false` in next.config (errors still show) |
| G-30 | ℹ️ Rule | `useSyncExternalStore` subscribe functions must be **module-level constants** (otherwise React resubscribes every render) | See `subscribeSidebar` in `use-client-store.ts` |

## 5. Open issues & carry-overs
| ID | Status | Issue | Plan |
|---|---|---|---|
| I-01 | ✅ Solved | shadcn neutral tokens in globals.css | Harbor tokens (P1.1), contrast-checked by `npm run contrast` |
| I-02 | ✅ Solved | Temporary P0 landing page | Deleted. `/` → `/projects` via config redirect (G-21) |
| I-03 | ✅ Solved | Stock shadcn Button | Restyled with variants default/secondary/outline/ghost/soft/destructive/destructive-soft/link, sizes xs–xl and icon-*, plus a `loading` prop |
| I-04 | 🔴 Open | Dockerfile not written. Copy `.next/standalone` + `.next/static` + `public`; `drizzle/` is traced; **never** include `.env`; mount `/app/data` | P9.7 |
| I-05 | ✅ Solved | SQLite UNIQUE → HTTP 409 | `toErrorResponse()` in `src/server/api.ts` (unit-tested) |
| I-06 | ℹ️ Note | Sample vendor names must not match real companies | Check in P4.1 |
| I-07 | 🔴 Open | Settings → Scoring and Demo tools are placeholders; AI section is read-only | P2.1 (scoring, model, language), P4.3 (demo tools) |
| I-08 | 🔴 Open | Projects hero stats are static 0; "New project" is disabled with a "Phase 3" tooltip; the search/filter controls are disabled | P3.3 / P3.4 |
| I-09 | 🔴 Open | Topbar breadcrumb only knows static section titles (`src/components/shell/nav.ts`) | P3.5: add dynamic crumbs (project name) |
| I-10 | 🔴 Open | `#run-pill-slot` in the Topbar is an empty placeholder | P7.3 |
| I-11 | ℹ️ Note | Settings `theme` and `sidebarCollapsed` are saved to the DB, but the source of truth for display is localStorage + `<html>` attributes (per browser) | Fine for a single-user prototype |

## 6. Small decisions made while coding
- **IDs:** `prefix_` + 14 chars (no look-alikes) via `newId(kind)` in `src/lib/ids.ts`.
- **Shared vocabulary** in `src/lib/domain.ts`; **labels** in `src/lib/labels.ts`; **file rules** (blocked/legacy extensions, `checkFile`, `middleTruncate`, `formatBytes`) in `src/lib/files.ts`, shared by the Dropzone now and server ingest in P3.2.
- **API conventions:** wrap handlers with `withErrors()`. Parse bodies with `readJson(req, schema)`. Return `json(data)` (no-store). Errors are `{ error: { code, message, details? } }`. The client uses `api<T>()` from `src/lib/api-client.ts`, which throws `ApiClientError`.
- **Settings:** `GET/PUT /api/settings` returns a `SettingsDto` with `runtime: { aiMode, apiKeyConfigured, maxUploadMb }`. `appName` is read-only. Hooks `useSettings` / `useUpdateSettings` (optimistic).
- **Shell:** `AppShell` (client) = Sidebar + Topbar + inset content panel `#app-scroll` (the panel scrolls on desktop; scroll resets on navigation). `ShellContext.openProfile()` opens the profile dialog. The welcome dialog shows while `onboarded=false`. "Skip for now" stores the name `Guest`.
- **Motion primitives** (`src/components/motion/`): `Reveal`, `Stagger/StaggerItem`, `MaskedText` (`replayKey`), `CountUp`, `ScrambleText`, `DepthBackdrop` (`art` prop), `FloatLoop`; route transition in `src/app/(shell)/template.tsx`. `MotionConfig reducedMotion="user"` is global.
- **Data primitives** (`src/components/data/`): `ProgressRing` (`scoreTone`: ≥85 ok, ≥70 partial, else fail), `StackedStatusBar`, `StatTile`, `KeyValueList` (`emphasis`), `DataTable<T>` (sortable, `aria-sort`, skeleton, empty).
- **UI extras:** `Pill`/`FindingStatusPill`/`RiskPill`/`ProjectStatusPill`, `SegmentedControl` (sliding indicator), `InitialsAvatar` (deterministic tints), `FileIcon`, `Field` (label + ARIA wiring + error), `EmptyState`, `PageHeader`, `Kbd`, `Dropzone` (`upload?: (file, onProgress) => Promise`; duplicate key = name + size).
- **Illustrations:** `src/components/illustrations.tsx` (ProjectsArt, StandardsArt, DocumentsArt). Logo: `src/components/shell/brand-mark.tsx`.
- **Test-input generators** live in `scripts/test-inputs/` (HTML→PDF/PNG via Playwright Chromium in `lib/pdf.ts`; DOCX via `docx`; XLSX via `exceljs`).

## 7. Before you start a task, consider…
- **Next APIs** → bundled docs first (G-02). Caching → G-03. Titles → G-20.
- **New GET route** → `await connection()`, `withErrors`, zod.
- **New client state that comes from the browser** → `useSyncExternalStore` (G-19/G-30), not setState in an effect.
- **New fs path code** → G-06 tracing check.
- **New npm script** → no `&&` (G-01).
- **Anything calling Claude for real** → ask the user first (💳), log the cost.
- **UI work** → Harbor tokens only (G-23), 4-px spacing, logical properties, icon + label for status, reduced motion. Self-review with `scripts/screenshots.ts` before showing the user.
- **Test documents** → §0 rule 3 (no hints, consistent, legitimate). Update `test-inputs/SCENARIO.md`.
- **End of phase** → §0 rule 1: run the app, give the link and bullets.

## 8. Session log
### 2026-10-21 · Session 1: Planning
- Requirements in two question rounds. PRD, RDD, PHASES, PROGRESS, CLAUDE.md written.
- Problem: a turn ended right after announcing the RDD (user: "why did u stop again ??"). Rule: never end a turn after announcing a step.

### 2026-10-21 · Session 2: Phase 0
- All REC approved. Scaffold, schema, env, storage, health, Vitest, Playwright. This file created.
- Problems (solved): G-01, G-05, G-06, G-07, G-09, G-12.

### 2026-10-21 · Session 3: Phase 1
- Built the Harbor tokens + contrast script; restyled shadcn primitives + custom components; motion primitives (epic-design adapted); data primitives; Dropzone; app shell (sidebar/rail/drawer, topbar, theme, customer chip, title sync, welcome/profile dialog); settings API + Settings page (profile, appearance, AI status); Projects hero (preview); Standards placeholder; `/dev/ui` kit.
- Self-review with Playwright screenshots (light/dark/collapsed/mobile). Fixed: dev badge overlap, faint switch, textarea grid overflow, mobile eyebrow wrap, AI-chip tooltip auto-opening in the drawer.
- Problems hit: G-19 (React hooks lint → `useSyncExternalStore`/`key`/`useEffectEvent`), G-20 (title override → MutationObserver), G-21 (page redirect + reload loop → config redirect), G-22 (E2E hydration timing), G-24 (no PDF rendering), G-25 (heredoc quoting), G-26 (MSYS path conversion). All solved or worked around.
- **User rules added mid-phase:** end each phase with the running app + link + bullets; generate deep test inputs per phase; **don't help the AI**; RFP ↔ standards consistent; vendor proposals legitimate (§0).
- Test inputs: `test-inputs/phase-1/` (RFP pack: 13-page RFP PDF, site plan PNG, Annex B XLSX with 6 sheets, Annex C DOCX, Addendum PDF; edge cases: Arabic file name, scanned letter image, long name, legacy .doc, .exe, empty, 55 MB; 21-file bulk) + `README.md` test guide + `test-inputs/SCENARIO.md`. Hints were removed after the user's rule.
- Checks: `npm run check` ✔ (39 unit), E2E 10/10 ✔.
