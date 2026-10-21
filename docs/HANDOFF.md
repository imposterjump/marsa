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
2. **Every phase generates its test inputs** in `test-inputs/phase-N/` with a `README.md` test guide (steps + expected results). Inputs must be **deep and production-like** (multi-page, real formats, realistic detail), not one-page toys. **The user tests with ONE format for now: PDF.** The primary path is the RFP PDF `test-inputs/phase-1/rfp-pack/01-RFP-NGPA-T-2026-014.pdf` and, from Phase 4, vendor proposals as PDF. Always give the user exact copy-paste values for every form field. Other formats are optional extras.
3. **Never help the AI** in test documents: no evaluator hints, no "this is non-compliant" wording, no pre-computed answers. **The RFP pack and the standards must not contradict each other.** **Vendor proposals must be legitimate, coherent bids.** Then let the AI work. Human-only reference notes go in `test-inputs/SCENARIO.md` (never uploaded).
4. Plan → ask → build. The user approves recommendations before they are built. Report progress briefly when a phase runs long (the user asked "are you stuck?").
5. **Don't push to GitHub until the user has tested the phase themselves** (user, after Phase 3: "next time dont push unless i test the phase myself"). Commit locally; push when they confirm. Each phase hand-over also includes the **exact click-by-click main working case** (go here → press this → paste this → expect that).

## 1. Where we are (update every session)
- **Last session:** 2026-10-21 (session 5, Phases 3 + 4).
- **Done:** Planning · P0 · P1 · P2 · P3 (tested by the user: "works fine") · **P4 built, waiting for the user's test**. Phase 4 = vendors + proposals service/API, vendor simulator `/vendor-portal`, Proposals table + first proposal page (Commercial/Technical tabs; P5.1/P5.3 pulled forward in basic form), sample data (seed manifest + Demo tools + `npm run seed`/`reset`), four vendor proposal PDFs. Also fixed the user's report "paste-rules dialog too tall, Add button off-screen" (G-46).
- **Git:** P3 was pushed (8c61011). **P4 is committed locally only; push after the user confirms testing** (§0 rule 5).
- **User's own data (`data/`):** CITS-2026 (14 rules) + PRJ-2026-001 (open, 1 RFP PDF). The user will now add the Addendum PDF and submit the 4 vendors through the simulator (`test-inputs/phase-4/README.md`).
- **Next subtask:** wait for Phase 4 feedback → push → **Phase 5**: Sheet Stack viewer (P5.4–P5.7), Analyse & process panel (P5.2), proposal workspace polish (P5.3: compact project header on proposal pages, I-18), viewer checkpoint 🧑 (P5.8).
- **App runs?** `npm run dev` → http://localhost:3000.
- **All checks green?** `npm run check` ✔ (lint, typecheck, contrast, **95 unit**) · `npm run test:e2e` ✔ **17/17** · `npm run build` ✔.

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
| Git | `main`, commit per finished subtask/phase (REC-22). Remote **origin = https://github.com/imposterjump/marsa.git** (private). Push **only after the user has tested the phase** (§0 rule 5; how: G-31) |
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
| G-31 | ℹ️ Rule | No `gh` CLI. The user's global git `credential.helper` is `wincred`, so a plain push in a non-interactive shell can't prompt for a login | Push with: `GIT_TERMINAL_PROMPT=0 git -c credential.helper= -c credential.helper=manager push` (Git Credential Manager; it popped a GitHub sign-in once, and is now cached). Before every push, scan history: `git log -p --all \| grep -cE 'sk-ant-[A-Za-z0-9_-]{10,}'` must be 0 |
| G-32 | ✅ Solved | **E2E against `next dev` was flaky**: a cold dev server intermittently **reload-looped** the first page (*"7 × navigated to /projects"*). Parallel spec files also reset each other's data in the shared SQLite DB | `playwright.config.ts` now builds and runs a **production server** (`npx next build && npx next start -p 3200`; the "next start does not work with output: standalone" warning is harmless). Settings: `workers: 1`, `reuseExistingServer: false`. 13/13 green and stable on repeat runs. Kill leftover project `node.exe` before a run if port 3200 is busy (G-09) |
| G-33 | ℹ️ Rule | **TanStack Query skips per-call `mutate(…, { onSuccess })` callbacks when the component unmounts.** An optimistic delete removes the row → its toast/Undo never showed | Fire follow-ups from a component that stays mounted, using `mutateAsync().then(...)` (see `deleteWithUndo` in `rules-editor.tsx`) |
| G-34 | ℹ️ Rule | **Hydration mismatch with client-fetched data**: the server renders loading states, but a query can resolve before React hydrates a later subtree → *"Hydration failed because the server rendered HTML didn't match"* (seen on /settings and /projects) | Every query hook returns `useHydrationSafe(useQuery(...))` (`src/hooks/hydration-safe.ts`): no data until hydration finishes. **New query hooks must use it.** `useHydrated()` lives in `use-client-store.ts` |
| G-35 | ℹ️ Rule | With cacheComponents, **`usePathname()` outside `<Suspense>` makes the production build fail on routes with dynamic params** (*"Next.js encountered URL data `usePathname()` in a Client Component outside of `<Suspense>`"*) | All shell pathname readers sit in small Suspense boundaries: `LiveNavLinks` (fallback: no active item), `LiveTrail` (empty breadcrumb), `TitleSync` + `ScrollReset` (null). Keep new `usePathname`/`useParams`/`useSearchParams` readers inside Suspense |
| G-36 | ℹ️ Rule | Reading `params` in a page outside `<Suspense>` → *"Next.js encountered runtime data during prerendering"* | Pattern (see `src/app/(shell)/standards/[standardId]/page.tsx`): the page returns `<Suspense fallback={<Skeleton/>}><FromParams params={params}/></Suspense>` and the async child awaits `params`. Build shows the route as ◐ Partial Prerender |
| G-37 | ✅ Solved | **The window scrolled instead of the content panel** (flex `flex-1` overrode the panel height), so the sticky topbar and settings section nav scrolled away (missed in the P1 review) | At `lg` the frame is `h-dvh overflow-hidden`, the right column `min-h-0`, and `#app-scroll` (`flex-1 min-h-0 overflow-y-auto`) is the only scroller. Scroll programmatically via `#app-scroll`. `ScrollReset` skips the first load and honours `#section` hashes |
| G-38 | ℹ️ Fact | pdfjs-dist **6.4** in Node: use `pdfjs-dist/legacy/build/pdf.mjs`. `isEvalSupported` was removed. `destroy()` is on the **loading task** (`task.destroy()`), not the document. Must be in `serverExternalPackages` | See `src/server/documents/pdf-meta.ts` (page count; encrypted → `aiReadable=false`) |
| G-39 | ℹ️ Rule | Uploads: **one file per request** via XHR (`src/lib/upload.ts`, real progress events). Server: `await req.formData()` (no proxy, so no 10 MB proxy limit). `ingestDocument()` sniffs magic bytes; a renamed file → 415 `file_content_mismatch`; storage is atomic, and the file is deleted again if the DB insert fails | Reuse `ingestDocument()` for RFP and proposal uploads (owners `rfp` / `commercial` / `technical`) |
| G-40 | ℹ️ Fact | `api()` returns `undefined` for HTTP 204 (DELETE endpoints return 204 or the deleted row) | — |
| G-41 | ✅ Solved | Inserting an import **above `"use client"`** turned the directive into a plain expression (Prettier printed `("use client");`), so the file silently became a server component | `"use client"` must stay the **first line**. When adding imports with a script, insert them after it. Grep for `("use client")` if in doubt |
| G-42 | ✅ Solved | **zod 4 `.partial()` still applies `.default()`s.** `projectPatchSchema = projectInputSchema.partial()` made PATCH `{status:"open"}` reset deadline/description/notes/category. The same latent bug existed since Phase 2 (`standardPatchSchema`: toggling Active wiped the description; `rulePatchSchema`: editing text reset priority to Important) | Patch schemas are now built from **default-free field objects** (`projectFields`, `standardFields`, `ruleFields`); only the create schema adds defaults. Regression tests in `projects.test.ts` / `standards.test.ts`. Never derive a patch schema from a schema with defaults |
| G-43 | ✅ Solved | Toasts at **bottom-right** covered primary buttons in footers (wizard **Continue**; paste dialog **Add 14 rules**, reported by the user), and sonner **pauses a hovered toast**, so it never left | Toaster is `position="top-center"` (`src/components/ui/sonner.tsx`). Don't add toasts that only repeat what the page already shows (the wizard's upload toast was removed) |
| G-44 | ℹ️ Fact | `TaskStop` on a backgrounded `npx next start` kills the shell but can leave the **node child** listening (EADDRINUSE on restart) | Find the PID (`netstat -ano`, grep the port), check its command line (`Get-CimInstance Win32_Process`), and stop it only if it is the server you started |
| G-46 | ✅ Solved | Tall dialogs overflowed the viewport: with 14 pasted rules the **Add 14 rules** button was below the fold (user report) | `DialogContent` is capped at `100dvh − 2rem` and scrolls by default. Tall dialogs use `<DialogContent scrollable>` + `<DialogBody>`: header and footer stay pinned, only the body scrolls. Wrap forms as `flex min-h-0 flex-1 flex-col` so the height passes down |
| G-47 | ℹ️ Rule | **Sample data = test inputs.** `scripts/test-inputs/build-phase-4.ts` writes `test-inputs/seed/manifest.json`; `src/server/seed` ingests the files it lists from `SEED_DIR` (default `./test-inputs`). The seed reuses standards/vendors with the same name or code (the user's CITS-2026 is linked, never changed) and replaces only `is_sample` projects | Regenerate PDFs → rerun the builder → the manifest stays in sync. Docker (P9.7) must copy `test-inputs/` or set `SEED_DIR` |
| G-48 | ℹ️ Fact | New route folders → `RouteContext<"/api/…">` / `PageProps<…>` fail typecheck until the route types are regenerated | Run `npx next typegen` (also part of `npm run typecheck`) after adding routes |
| G-49 | ℹ️ Fact | E2E specs reset the workspace with `POST /api/dev/reset {confirm:"RESET"}` (deletes projects, standards, vendors, files; keeps settings) | Use it in `beforeEach` instead of deleting entities one by one |
| G-45 | ℹ️ Rule | *(Superseded by G-50.)* Tab content under `/projects/[projectId]` reads the project with `useProjectContext()` | See G-50 for the current structure |
| G-50 | ✅ Solved | Dev log: "Route /projects/[projectId]: Could not validate that a segment in your UI has instant navigation … Dropped segment: page.tsx". The layout awaited `params` in a Suspense boundary that **wrapped `{children}`**, so the tab pages were never part of the static shell | The layout renders `<Suspense><ProjectHeader/></Suspense>` and `{children}` **side by side**. Each page wraps its content in `<ProjectRoute params fallback>` (server: own Suspense + await params → client `ProjectGate` providing `useProjectContext()`). The tab fade moved to `[projectId]/template.tsx`. Never pass `{children}` into a component that awaits params |

## 5. Open issues & carry-overs
| ID | Status | Issue | Plan |
|---|---|---|---|
| I-01 | ✅ Solved | shadcn neutral tokens in globals.css | Harbor tokens (P1.1), contrast-checked by `npm run contrast` |
| I-02 | ✅ Solved | Temporary P0 landing page | Deleted. `/` → `/projects` via config redirect (G-21) |
| I-03 | ✅ Solved | Stock shadcn Button | Restyled with variants default/secondary/outline/ghost/soft/destructive/destructive-soft/link, sizes xs–xl and icon-*, plus a `loading` prop |
| I-04 | 🔴 Open | Dockerfile not written. Copy `.next/standalone` + `.next/static` + `public`; `drizzle/` is traced; **never** include `.env`; mount `/app/data` | P9.7 |
| I-05 | ✅ Solved | SQLite UNIQUE → HTTP 409 | `toErrorResponse()` in `src/server/api.ts` (unit-tested) |
| I-06 | ✅ Solved | Sample vendor names must not match real companies | Web-checked 2026-10-21: no real company named Harborline Systems, Meridian Scan Technologies, Nile Gate Solutions or Atlas Port Technologies |
| I-07 | ✅ Solved | Settings sections | Demo tools built in P4.3 (simulator link, load/reload/remove sample data, reset with typed RESET) |
| I-08 | ✅ Solved | Projects hero stats / New project / search & filter were placeholders | Real data in P3.3 (active = draft + open + evaluating; proposals = sum; evaluated = count) |
| I-09 | ✅ Solved | Dynamic breadcrumbs | `BreadcrumbProvider` + `<SetBreadcrumbs crumbs={[...]}/>` in detail pages (used by standards; reuse for projects) |
| I-10 | 🔴 Open | `#run-pill-slot` in the Topbar is an empty placeholder | P7.3 |
| I-12 | ✅ Solved | Text extraction for DOCX/XLSX/TXT | `src/server/documents/extract-text.ts` (mammoth → HTML → markdown-like text; exceljs → `## Sheet:` + pipe rows with formula results; text formats as UTF-8; 2 M char cap). Called by `ingestDocument()` for AI-readable non-PDF files. PDFs/images go to Claude natively (null) |
| I-13 | ✅ Obsolete | Settings scroll-spy | Settings became fading tabs (user feedback) |
| I-14 | ℹ️ Note | `DocumentPreviewDialog` and the proposal page (`proposal-workspace.tsx` → `DocumentPane`) show PDFs in the browser's viewer (iframe) and offer download for DOCX/XLSX. The custom paginated "Sheet Stack" viewer replaces both | P5.4–P5.6 |
| I-16 | ℹ️ Minor | The Proposals table scrolls horizontally on phones (390 px) | P9.4 responsive pass (card list on mobile) |
| I-17 | ℹ️ Note | The analysis tabs on the proposal page (Compliance, Comparison, Risk) are locked placeholders; `?tab=` only accepts commercial/technical for now | P6/P8 |
| I-18 | ℹ️ Minor | On proposal pages the full project header (description, status, actions) pushes the document below the fold | P5.3: compact project header on `/proposals/[id]` |
| I-15 | ℹ️ Note | Project lifecycle rules live in `assertTransition()`: publish needs ≥1 RFP; open→draft only with 0 proposals; no archive/delete while evaluating. RFP delete is blocked for archived/evaluating/evaluated and for the last RFP of an open tender (`assertRfpRemovable`, called by `DELETE /api/documents/:id`); uploads are blocked while archived/evaluating | P4/P6 must respect them (e.g. only the analysis runner sets `evaluating`) |
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
- **Standards:** codes are uppercase and unique (DB index). Rule codes are unique per standard (case-insensitive). An empty code gets `PREFIX-NN` (prefix from the last rule, else the standard code's first part). Bulk paste format: `CODE | text | priority` (or TAB-separated; M/I/D aliases; code optional), parser in `src/lib/rules-parse.ts`. Delete = immediate plus an Undo toast that re-creates the rule at its old `sortOrder`.
- **Priority pills** (`PriorityPill`): Mandatory = info/blue, Important = brand/teal, Desirable = neutral. Deliberately not red/amber/green, so priority never reads as a compliance status.
- **Scoring:** `src/lib/scoring.ts` `computeScore()` / `computeCategoryScores()` is pure and shared with P6. The Settings live example uses 10 fixed findings: defaults → 66.7%.
- **Documents API:** `GET /api/documents/:id/file` (inline; `?download=1`; single Range → 206; RFC 5987 UTF-8 filename for Arabic names), `GET/DELETE /api/documents/:id`. DTO via `toDocumentDto()` (never exposes storage paths).
- **Projects:** codes `PRJ-YYYY-NNN` (UTC year, sequential, retried once on a UNIQUE clash). New projects start as `draft` with **all active standards pre-selected**. Wizard state lives in the URL (`/projects/new?id=&step=`), so a refresh resumes the draft; the draft is created when leaving step 1. Deadline `YYYY-MM-DD`, not in the past (an unchanged past deadline may be kept on edit). `deadlineLabel()` → "Closes in N days" / "Closes today" / "Closed N days ago".
- **Settings tabs:** the selected tab is the URL hash (`#settings-ai` etc.) read with `useSyncExternalStore`; `selectTab` uses `history.replaceState` + a synthetic `hashchange`. Only the active section renders; `AnimatePresence mode="wait"` fades it (0.2 s).
- **Shared documents UI:** `src/components/documents/document-row.tsx` (omit `onDelete` → read-only) and `document-preview-dialog.tsx`, used by standards and projects.
- **Vendors & proposals:** vendor names are unique ignoring case (409). One proposal per vendor per project; `POST /api/projects/:id/proposals {vendorId}` returns 201 (new) or 200 + `replaced:true` (resubmission: old files deleted, `submittedAt` = now). Files follow one per request on `POST /api/proposals/:id/documents` (multipart `file` + `kind` = commercial|technical). Only **open** tenders accept proposals or files (409 otherwise). `useSubmitProposal` orchestrates create + uploads with per-file progress and returns failed files instead of throwing.
- **Proposal source** (`seed` · `simulator` · `ai`) is shown as a pill ("Sample" · "Simulator" · "AI-generated").
- **Vendor simulator** (`/vendor-portal`, not in the sidebar; reached from the Proposals tab and Demo tools): `?project=` preselects the tender; the vendor picker opens on "New vendor" while no vendors exist.
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

### 2026-10-21 · Session 4: Phase 2
- Built: Settings (AI model cards, report language, parallel steps, scoring weights + partial credit + live example), Standards list (search, filter, cards, active toggle, delete with type-to-confirm), standard detail (rules editor: inline edit, priority select, drag + Alt+arrow reorder, delete with Undo, Paste rules dialog with live validation), documents panel (real uploads with progress, open/download/delete), dynamic breadcrumbs. Server: document ingest (sniffing, sha256, PDF page count), file streaming with Range, standards/rules/documents APIs.
- Test inputs: `test-inputs/phase-2/` (3 standard PDFs consistent with the RFP pack, README with exact copy-paste blocks generated from the same data).
- Problems hit (all solved, see §4): G-32 (flaky dev-server E2E → production build), G-33 (unmount skips mutate callbacks → Undo toast missing), G-34 (hydration mismatch from early-resolving queries), G-35/G-36 (cacheComponents Suspense rules for `usePathname`/`params`; the build would have failed), G-37 (window scrolled instead of the panel; sticky header/nav broken since P1), G-38 (pdf.js v6 API changes), and a mobile overflow in the rules card.
- Checks: 68 unit ✔, 13 E2E ✔ (twice), build ✔.

### 2026-10-21 · Session 5: Phase 3
- User feedback first: Settings now switches sections as fading tabs (no scroll jump).
- Built: text extraction (I-12); projects service (lifecycle rules, codes, standards pre-selection, cascade delete) + API (`/api/projects`, `/[id]`, `/[id]/standards`, `/[id]/documents`); Projects home with real stats, search, status filter (only existing statuses), grid/list toggle, cards; New project wizard (4 fading steps, URL-resumable draft, discard draft); project workspace (`layout.tsx` + `ProjectShell` context; header with publish / restore / edit / ⋯ archive, move to draft, delete with type-to-confirm; status banner; route tabs with sliding underline + fade); Overview (RFP documents + add-more dropzone, notes, details, standards + picker dialog, progress timeline); Proposals and Evaluation placeholders.
- Problems hit (all solved): G-41 (`"use client"` below an import), **G-42 (zod `.partial()` keeps defaults: publishing wiped the deadline; Phase 2 standards/rules had the same latent bug; the user's CITS-2026 was checked read-only and is intact)**, G-43 (toasts covering footer buttons, also reported by the user for the paste dialog → top-center), G-44 (TaskStop left a node server running).
- Test inputs: `test-inputs/phase-3/README.md` (reuses the Phase 1 RFP PDF + CITS-2026; exact copy-paste values; expected results).
- Checks: 86 unit ✔, 15 E2E ✔, build ✔. Screenshots reviewed (desktop + 390 px).
- **Phase 4 (same session, after the user tested Phase 3):** fixed the user's report (paste dialog too tall → G-46 scrollable dialogs). Built vendors/proposals service + API, Proposals table, proposal page (Commercial/Technical, locked analysis tabs, ‹ › vendor nav), vendor simulator, seed module + Demo tools + `npm run seed`/`reset`, 4 vendor bids (commercial + technical PDFs, RFP form structure, consistent with the Phase 1 Arabic summary and scanned letter), a short PCS RFP for the second sample project, `SCENARIO.md` grading notes, README with click-by-click steps. Vendor names web-checked (I-06).
- User rule added: **don't push until the user has tested the phase** (§0 rule 5). Phase 4 committed locally only.
- Checks: 95 unit ✔, 17 E2E ✔, build ✔. Screenshots reviewed (desktop + 390 px).
