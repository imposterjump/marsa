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
7. **Never start live (paid) AI runs on your own.** The user starts them from the UI so they can watch the progress (user: "dont run the ai analysis alone i want to see the ui while its running"). Prepare the server, model and estimate, then hand over. Free mock runs and E2E are fine.
6. **Live AI tests run on Sonnet 5.5 first**, to keep failed runs cheap; switch to Opus 5.5 (the default model) only once things work (user, Phase 6: "make tests using sonnet first so we minimize failure prices then when its ready switch to opus"). Live tests use the throwaway `data/live-test/` (G-60), never the user's `data/`. **Update 2026-10-23:** the user added $5, so about **$6** is left. Testing runs on **Haiku 5.5**; **Opus runs once** when everything is ready (user: "we will keep running haiku to test and when everything is ready we can run oppus once"). The user starts the runs and reviews the results with me (user: "let me do the ai run … check the results w me").

## 1. Where we are (update every session)
- **Last session:** 2026-10-22/23 (session 6: client feedback → P8 re-planned and built).
- **Done:** Planning · P0–P7 · **P8 (new story)**. P8 is **waiting for the user's test** (checkpoint P8.6). P5–P7 were never formally tested by the user, and the client meeting replaced their results UI anyway.
- **What P8 is** (the user's story after the client meeting; plan in `C:\Users\impos\.claude\plans\zazzy-humming-thunder.md`):
  - **RTA design system**, the user's company standard (`rta standard/`, untracked, never commit it). UI only: database and backend stay ours.
  - **Guided New project form**, Project → Standards → Vendors (`new-project-wizard.tsx`):
    - **Project** is mandatory: title, category, RFP drop zone. The first upload creates the draft.
    - **Standards** shows the category's standards. **New standard** creates one from a dropped rules file (`new-standard-dialog.tsx`, `server/standards/rules-file.ts`). Skippable.
    - **Vendors**: each vendor has two drop zones (`vendors-editor.tsx`). Skippable.
    - **Create** publishes the project and opens it.
  - **Project page:** Overview + Proposals only. One AI analysis button (`AiAnalysisAction`). **Add vendor** dialog, also after an analysis.
  - **Pipeline 3N + 2:** checklist → standards per vendor → RFP per vendor → risk per vendor → recommendation.
    - Every point has a one-line `headline` and a proposal `section`, both stored in the new table `analysis_meta`.
    - Marsa computes the scores, the 0–100 risk score and the pick; the AI writes only the reason (§6).
  - **Results page** `/analysis/<projectId>` (`components/analysis/`). The sidebar collapses while it is open. Mission control shows while a run is active. Tabs: Overview · Compliance · Risks · Comparison · AI quality.
  - The old `/projects/:id/evaluation` and `/ai-review` URLs redirect to it.
- **Git:**
  - local commits `af6f4bd` (P8.0), `3ecfb09` (P8.3), `a43b28d` (P8.1–P8.4), plus the P8.5 commit (test inputs, tests, docs);
  - **not pushed** (§0 rule 5);
  - rollback point: tag `before-rta-redesign` = `2daa169`.
- **POC inputs** (`test-inputs/poc-inputs/`, built by `scripts/test-inputs/build-poc.ts`):
  - proposals follow the 7-section template: technical = sections 1–5, commercial = 6–7 with "Terms and deviations";
  - rules come as `.xlsx`, `.csv` and `.txt`;
  - READMEs walk through the guided form;
  - set 3 `3-three-vendors-air-quality`: PEMS-2026, RFP NGPA/T/2026/052, 3 vendors, 11 steps;
  - estimates for the 2-vendor sets: Haiku ≈ $0.05, Sonnet ≈ $0.60–0.66, Opus ≈ $1.3–1.45. Set 3: Haiku ≈ $0.08 (real $0.094), Sonnet ≈ $0.92, Opus ≈ $2.05.
- **User's budget:** about **$6** (user, 2026-10-23). Haiku for tests, Opus once at the end, and the user starts the runs (§0 rules 6–7).
  - Spent this session: one Haiku check of POC set 3 at **$0.094**, on a throwaway server with its own data folder (`data/haiku-check`).
  - That run: Sabkha recommended (95 % standards, risk 19), Kaltenmoor 2nd (risk 51), Nimbrel last (risk 84); all 7 sections filled.
- **Feedback round after the first P8 test (2026-10-23), all fixed:**
  - only 4 sections showed: every tab now lists all 7, and the section guess scores keywords (G-81);
  - Comparison columns are headed with the vendor names in every section;
  - a risk's "View more" links the RFP clause or rule, the vendor's evidence, and its section in Compliance;
  - section numbers are hidden (names only);
  - a new standard from a dropped file showed "0 rules" (G-82);
  - "Section E" appeared in the AI's text (G-83).
  - **New POC set 3** (three vendors, Safety & environment).
- **User's own data (`data/`):**
  - CITS-2026 and PRJ-2026-001 (IT & security, open, 2 RFP PDFs, 4 vendor proposals);
  - DB backup in `data/backups/`;
  - the throwaway live-test DB is `data/live-test/`.
- **Port 3001 (the user's own server, don't kill it):**
  - `next start -p 3001` with `NEXT_DIST_DIR=.next-view DATA_DIR=./data/live-test AI_MODE=live`, model Haiku;
  - it still runs the **pre-P8 build**: rebuild `.next-view` to see P8 there;
  - it holds the real Sonnet results (Cargo X-Ray $4.80, PCS $1.17). Keep them.
- **Next:** the user tests P8 (main case: `test-inputs/poc-inputs/2-meeting-e-seals/README.md`). Then push, then P9.
- **App runs?** `npm run dev` → http://localhost:3000.
- **All checks green?** `npm run check` ✔ (**178 unit + integration**) · `npm run test:e2e` ✔ (**20**).

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
Build folders: `.next/dev` = dev server cache · `.next` = default `next build` · **`.next-e2e`** = E2E/screenshot builds (`NEXT_DIST_DIR=.next-e2e`, G-51).
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
| G-51 | ✅ Solved | **Dev reload loop.** Every open page reloaded ~3×/s; the dev log showed `GET /standards` + `✓ Compiled in 0ms` endlessly. In the browser: on each HMR connect the server sent `turbopack-message … "type":"restart"` for the entry chunk list, then `reloadPage: "HMR hash mismatch"`. Cause: the dev cache in `.next/dev` was stale (entry chunk file from hours earlier) after many production builds into the same `.next` folder (E2E / screenshot builds) while `next dev` was running. Visual Studio's indexer churning `.vs/` and `.next/` made it worse | Stop dev → delete **`.next/dev`** (build cache only) → restart. Prevention: E2E builds now use **`NEXT_DIST_DIR=.next-e2e`** (`next.config.ts` `distDir`, set in `playwright.config.ts`); use the same env for any manual `next build`/`next start` while the user's dev server runs. Diagnose with a page's WebSocket frames (scratch script: log `framereceived` of the HMR socket) |
| G-52 | ℹ️ Rule | **Never change a column's DDL (type, default) on an existing SQLite table through drizzle-kit.** SQLite needs a table rebuild (`DROP TABLE` + rename); our migrator runs inside a transaction, where `PRAGMA foreign_keys=OFF` is ignored, so the DROP would **cascade-delete** documents, proposals and links | Keep the DDL identical (TS-only changes: `.$type<…>()`, `.default(sql\`'…'\`)`), check `npx drizzle-kit generate` says "No schema changes", and write a **custom data migration** (`npx drizzle-kit generate --custom --name …`) with plain `UPDATE`s. Back up `data/app.db*` before restarting the user's dev server. Example: `drizzle/0002_project_categories.sql` |
| G-57 | ⚠️ Rule | **Backslashes in inline Python via the Bash tool get mangled (happened 4× this session, also with a quoted heredoc)**: `\\b` arrived as a backspace character (0x08) in a TS regex and `\\n` as real newlines; a heredoc with backticks once failed to parse at all | For code with backslashes or backticks, use the Edit/Write tools, or write the script to the scratchpad with Write and run it. Scan for control characters after scripted edits |
| G-58 | ⚠️ Rule | **Structured outputs × prompt caching**: `output_config.format` is part of the cached prefix. A different schema per step gave **0 cache reads across phases** (~90k reads within a phase). One schema for all five steps → 400 "too many parameters with union types (limit 16)", and after removing nullables → 400 "compiled grammar is too large" | Two shared formats (`schemas.ts`): **EvaluateOutputSchema** {checklist, analysis, riskRegister} for checklist → analyze → risk, and **RankOutputSchema** {comparison, summary}. Inside them "not stated" is `""` / `0` (wire schemas), turned back to null by `fromWire()`. Unit test counts union fields. Measured after the fix: risk steps read ~39k cached tokens each |
| G-59 | ⚠️ Rule | **pdf.js rejects Node `Buffer`s** ("provide binary data as Uint8Array") and `readPdfPages` silently returned [] for files read from storage | Pass `new Uint8Array(bytes)` (pdf-text.ts, pdf-meta.ts) |
| G-60 | ℹ️ Rule | **Live test scripts** (never against the user's `data/`): `npm run ai:smoke [model]` (≈ $0.002); `DATA_DIR=./data/live-test npm run ai:run -- <model> [pcs]` (whole pipeline, prints per-step tokens, cache r/w and cost); `DATA_DIR=./data/live-test AI_MODE=live npm run ai:generate -- <model> <profiles…>` | The scripts refuse other DATA_DIRs. Two processes on the same DATA_DIR are unsafe while a run is active: the second marks the first's runs `interrupted` on boot |
| G-61 | ℹ️ Fact | **Runner**: `src/server/runs/runner.ts` (createRunner, deps injected) + `instance.ts` (globalThis singleton, server-only) + `src/instrumentation.ts` → `boot.ts` (marks stale runs `interrupted` with its own connection, no `server-only`; skipped during `next build`). First step of each phase runs alone until `message_start`, then the rest start in parallel (they read its cache entry) | Mock engine: `MOCK_STEP_MS` env sets the per-step delay (E2E uses 400) |
| G-62 | ℹ️ Fact | **Generated bids** (P7.5): `src/server/simulate/` (jobs in memory on globalThis; bids are normal proposals with source "ai"). Technical = DOCX (`docx`), financial = PDF printed by **Chromium via `playwright-core`** (external package in next.config) | Needs `npx playwright install chromium` on a new machine (already installed here); Docker (P9) must include Chromium or switch renderer |
| G-63 | ✅ Solved | Build log: `[api] unhandled error … During prerendering, connection() rejects` (digest HANGING_PROMISE_REJECTION) for `/api/runs/active`: `withErrors` caught Next's own prerender signal and turned it into a logged 500 | `withErrors` calls `unstable_rethrow(err)` (next/navigation) before mapping errors |
| G-64 | ✅ Solved | The Generate-with-AI dialog lost its progress after the first bid arrived: the Proposals tab switched from the empty state to the table, and the dialog (inside the button group) was remounted | The dialog is rendered once at a stable position (`generateDialog` before both layouts). Rule: dialogs with in-flight state must not live inside a subtree that swaps layout |
| G-65 | ℹ️ Rule | **Cost estimate** = `estimateRun()` in `src/lib/plan.ts`, step by step with the real cache behaviour (two formats, 5-min TTL), fed by `GET /api/projects/:id/estimate` (real PDF pages, text length of DOCX/XLSX, rules, requirement count of the last run). Calibration from the P6.10 runs: RFP/standard PDF page ≈ 2,750 tokens, proposal page ≈ 2,350, checklist JSON 185 per requirement, output 220 (checklist) / 450 (analysis) per requirement. Reproduces the measured PCS run ($1.17) within 3 %. The old estimator said $1.62 for the $4.80 run | Shown in the Analyse panel (tooltip) and in the confirm dialog before every live run (also Run again). Opus speed/verbosity and Haiku tokens are assumptions until measured: re-calibrate after the first Opus/Haiku runs |
| G-66 | ℹ️ Fact | **Haiku 5.5** (`claude-haiku-5-5`): $0.10/$0.50 per MTok up to 100K prompt tokens per request, **5× above** (`MODEL_PRICES.longPrompt`, `costFromUsage` picks the tier per step). No server-side refusal fallback: the client omits `fallbacks` + beta header for Haiku (`supportsFallbacks`). Large tenders (Cargo X-Ray, ~120K-token analysis prompts) land in the expensive tier: ≈ $1.03 on Haiku vs ≈ $0.09 for PCS | Not live-verified yet: the user runs it from the UI. A 400 at step 1 costs $0 |
| G-67 | ℹ️ Fact | **AI review** (`src/server/runs/quality.ts`, `reviews.ts`, tab `/projects/:id/ai-review`): `run_quality` (metrics JSON per run, saved by the runner's `onFinished` hook, computed on first view for older runs and recomputed when steps changed later) and `run_reviews` (stars 1–5 overall + 4 optional dimensions, verdict, comment, reviewer, **metrics snapshot**). Confidence = 35 % AI confidence (high 1 · medium 0.6 · low 0.25) + 35 % evidence verified (quote found on the cited page via pdf.js text; other page = half) + 15 % coverage + 15 % completion. Export: `GET /api/reviews/export` | Migration `0003_ai_review` only creates the two tables (safe, G-52). Real Sonnet run: 93/100, 307 of 308 quotes on the cited page |
| G-68 | ℹ️ Fact | **Requirement sources** (`src/server/runs/sources.ts`, no AI): `sourceRef` text → standard rules (code match → rule text, `/standards/:id?rule=CODE` scrolls to and highlights the rule) and RFP locations (clause token such as "4.6.1", "TB-24", "GC 10.1" searched in the RFP text; a clause at line start wins, bare numbers must look like headings; "Annex C …" falls back to the document). The proposal page reader has an **RFP** group, so chips open the RFP on that page with the clause highlighted. Real checklists: 166/173 (X-ray) and 25/25 (PCS) references linked | Page texts cached per document (LRU 40) |
| G-69 | ✅ Solved | "Page scrolls past the content and shows the background": elastic overscroll (Edge/Chrome on touchpads); the layout itself had no extra height (measured) | `overscroll-behavior: none` on html/body, the content panel, dialog bodies and the reader |
| G-70 | ✅ Solved | Wheel over the **sidebar** still scrolled the page past the content (inside the content panel it was fine): Radix radio groups inside a `<form>` render hidden `position:absolute` inputs; with no positioned ancestor they were placed against the page (deep below the fold) and made the document ~1,000 px taller than the window | `#app-scroll` and the shell frame are `relative` (containing blocks). Checked on 8 pages × 3 window sizes: document height = window, wheel over the sidebar moves nothing |
| G-71 | ℹ️ Rule | `mutateAsync` waits for the mutation's `onSettled` promise: returning `invalidate(...)` there delayed "Analyse & process" → Evaluation by the time all refetches took (> 5 s on a busy test server) | Fire-and-forget invalidation in `onSettled` (`void invalidate()`), navigate right after the POST |
| G-72 | ✅ Solved | "Highlights only mark the number, not the sentence" (user, after the source links). Three causes, none from the scroll fixes (diff reviewed): (1) RFP clause chips searched for the clause number only; (2) `highlightQuote` marked only the ~80-char search needle, so long AI quotes were half-highlighted; (3) on **sheet / text / image pages** the reader rebuilt page objects every render → the highlight effect re-ran → `setPulse` re-rendered → **~1,800 mark insertions per second** (endless loop), and a row near the bottom stayed cut off inside the sheet's own scroll area | (1) `clauseText()` gives each RFP link the clause's own text (to the next clause heading; one row for tables; running headers/footers stripped); (2) the highlight extends over the whole quote after the needle locates it; (3) memoized pages in `use-reader-source`, pulse/scroll once per quote + page, and the mark is centred inside inner scroll areas. Measured: 9/9 links 100 % highlighted, 0 mark churn; E2E guards the sheet case |
| G-53 | ✅ Solved | A production build served a **stale `globals.css`**: new CSS variables (`--stage…`) were missing from the bundle although the file had changed. Turbopack's persistent build cache in the dist folder kept the old stylesheet | Playwright's webServer deletes `.next-e2e` before every build. For manual builds after CSS changes: `rm -rf .next-e2e` first. If dev styles look stale: stop dev, delete `.next/dev`, restart (as G-51) |
| G-54 | ℹ️ Rule | **pdf.js in the browser**: load it only from effects via `loadPdfjs()` / `getPdf()` (`src/lib/pdf/pdfjs.ts`), never at module top level (it touches DOM APIs during SSR). The worker is `new Worker(new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url), { type: "module" })`. pdf.js 6: `page.render({ canvas, viewport, transform })`; destroy via the loading task (G-38). Turbopack warns "pdfjs-dist can't be external" for the worker reference; it is suppressed in `next.config.ts` (`turbopack.ignoreIssue`, path `/lib[\\/]pdf/`, because the issue path is the folder) | Reuse `usePdf`, `PdfCanvas` (off-screen render, no flash on zoom), `usePageSizes`, `DocumentCover`, `DocumentReader` from `src/components/viewer/` |
| G-55 | ℹ️ Rule | **Evidence quotes** (`src/lib/quote.ts`): matching normalises case, all whitespace, typographic quotes/dashes, NFKC (ligatures) and soft hyphens, because PDF text layers split words into spans. Needles: the first 80 normalised chars, then 48, then 28, so a quote that runs over a page break still lands on the page where it starts. `findQuotePage` prefers the current page; `highlightQuote` wraps text nodes in `<mark class="marsa-hit">` | P6 evidence must store the **verbatim** quote (≥ 28 meaningful chars) + doc id + page; the reader verifies and corrects the page |
| G-56 | ℹ️ Fact | E2E text assertions in the reader must be scoped to the main sheet (`getByRole("img", { name: /…, page N/ })`): the filmstrip thumbnails render the same text (DOCX/XLSX/text pages are real HTML, scaled down) | Also use `exact: true` for short labels like "1 page" (the subtitle contains it) |
| G-45 | ℹ️ Rule | *(Superseded by G-50.)* Tab content under `/projects/[projectId]` reads the project with `useProjectContext()` | See G-50 for the current structure |
| G-73 | ✅ Solved | A dev server on a **new dist folder** (`NEXT_DIST_DIR=.next-design`) reloaded every page in a loop ("[Fast Refresh] rebuilding"): the folder had been created **before** it was gitignored / eslint-ignored, so the watcher saw its own output change | Gitignore and eslint-ignore a dist folder **before** the first server uses it. If it loops: stop the server, delete the folder, restart |
| G-74 | ℹ️ Rule | `next dev` with a new `NEXT_DIST_DIR` **rewrites `tsconfig.json`** (adds `<dir>/dev/types/**/*.ts` and reformats it) | Don't commit that change: `git checkout -- tsconfig.json` after stopping the server |
| G-75 | ℹ️ Rule | After **deleting a route**, `tsc` fails on stale `validator.ts` files in every dist folder that `tsconfig` includes (`.next`, `.next/dev`, `.next-e2e`, `.next-view`: "Cannot find module …/page.js") | Run `npx next typegen` and `NEXT_DIST_DIR=<dir> npx next typegen` for each existing dist folder. This writes types only, so it is safe even for the user's `.next-view` server |
| G-76 | ✅ Solved | A custom `overline` utility clashed with Tailwind's built-in `overline` (text-decoration): captions got a line above them | Renamed to `caption-caps`. Check new utility names against Tailwind's |
| G-77 | ✅ Solved | An SVG `linearGradient` id used twice (the brand mark rendered in a hidden and a visible SVG) made the visible gradient disappear | `useId()` for SVG ids (`brand-mark.tsx`) |
| G-78 | ✅ Solved | Guided form: the **first** RFP drop creates the draft, but its upload callback held the render from before the draft existed, so it refreshed `projects/""` and the file list stayed empty | Refresh by the id `ensureDraft()` returns (`projectKey(id)`), never by `project?.id` from the closure |
| G-79 | ℹ️ Fact | `Field` labels don't reach a Radix `Select` trigger, so `getByRole("combobox", { name: "Category" })` finds nothing (the Select root takes the id) | In tests use `getByRole("combobox").first()` or scope by section |
| G-80 | ℹ️ Rule | **Python on Windows writes CRLF** in text mode; patch scripts then leave CRLF files (git warns "CRLF will be replaced by LF") | `open(p, "w", encoding="utf-8", newline="\n")`. Bash heredocs with quotes in the body still fail (G-25): write the script with the Write tool and run `python -I script.py` |
| G-81 | ✅ Solved | "Only 4 sections were displayed": (1) the tabs only listed sections that had points; (2) `guessSection` took the **first** keyword hit, and `secur` / `reference` / `staff` / `deviation` were far too broad. Demo runs put 20 of 33 points in Security; "reference method" counted as Company; "route deviation" as Terms. (3) The mock checklist stopped at 24 requirements, cutting off the commercial clauses at the end of an RFP | (1) `shownSections()` always lists the 7 template sections; an empty one says so. (2) Every section is scored by weighted keyword hits (money and contract words ×2) and the best wins; unit-tested on real clause texts. (3) Cap 60 |
| G-82 | ✅ Solved | A new standard made from a dropped rules file showed **"0 rules"** in the picker and on the Standards page, though its page listed the rules: `useCreateStandard` refreshed the list right after the standard was created, **before** the rules were added, and nothing refreshed it afterwards | The dialog invalidates the list and the standard after `rules/bulk` (and the document upload). E2E checks "12 rules · 6 mandatory" in the picker and "12 rules" on the Standards page |
| G-83 | ✅ Solved | The AI wrote "the highest standards compliance in **Section E**" in the recommendation: the prompt labels its input blocks Section A–E, and the model echoed them | System prompt rule: never write the input's section letters; name the document, vendor, requirement or proposal section. Snapshot updated (the change invalidates the prompt cache once) |
| G-84 | 🟡 Workaround | **Page reloads every half second** on `npm run dev` (user, 2026-10-23): Visual Studio has the repo open and keeps writing its index under `.vs/` (gitignored). Turbopack still watches it: "✓ Compiled in 0ms" → full reload, in a loop (the log also says "waiting for the filesystem to settle … .vs\slnx.sqlite-journal"). Next 16 has no option to make the watcher skip a folder | The user's app on :3000 now runs as a **production build**: `NEXT_DIST_DIR=.next-design npx next build`, then `NEXT_DIST_DIR=.next-design npx next start -p 3000` (no watcher; rebuild after code changes). Or close Visual Studio while `npm run dev` runs |
| G-85 | ℹ️ Rule | **Two names (user, 2026-10-23):** the product is shown as **Mizan** ("Marsa" means harbour; the user wanted a procurement name). **Marsa stays the codename everywhere in code:** repo, `package.json`, DB, folders, docs, comments, the `analysis_meta` etc. The user asked for "the simplest way, just the name in the UI". | Displayed name = `APP_NAME` in `src/lib/brand.ts`, used by the tab title (layout metadata + `TitleSync`), sidebar `Wordmark`, welcome dialog, UI texts, the settings API (`appName` is overridden; the stored settings row still says "Marsa": don't migrate it, G-52) and the AI's recommendation prompt (so summaries don't say "Marsa"). E2E expects "Welcome to Mizan" and "· Mizan —" in titles. Never rename code identifiers, tables or files |
| G-87 | ℹ️ Fact | **Consultant report PDFs need Chromium at runtime** (`playwright-core`, the same one the tests and the generated bids use). A fresh clone must run `npx playwright install chromium` once, or Download / View of a report fails with that hint. PDFs are cached under the storage root (`DATA_DIR/uploads/reports/<run>/<proposal>-v1-<finishedAt>.pdf`); bump `LAYOUT_VERSION` in `src/server/reports/pdf.ts` after a layout change, or old PDFs keep being served | Fonts (Hanken Grotesk, Noto Sans Arabic) and the emblem are embedded from `node_modules/@fontsource-variable` and `public/brand` (paths from `process.cwd()`), so the PDF looks the same everywhere |
| G-86 | ℹ️ Fact | **npm's `script-shell` is PowerShell on this machine**, so a backgrounded `npx next start` runs as `npx-cli.js` → `powershell.exe -c "next start -p 3000"` → `node …/next start`. When Claude Code reaps the task for low memory (or `TaskStop`), only the wrapper dies: the server keeps listening (2026-10-24: it ran on for hours after the "killed" notice). The orphan's command line does not show `NEXT_DIST_DIR` | Before saying a server is down, `curl` the port. To tell whose it is, match its creation time to the task's output file and the chunks it serves to a build folder (`.next-design` = the one built for the user's :3000). Never rebuild a dist folder under a running server: stop it first |
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
| I-25 | ✅ Solved | The Evaluation tab showed only the latest run | P8: **Latest analysis ▾** menu on the results page lists every run (`?run=`) |
| I-22 | ℹ️ Note | *(P8: the compare phase is gone; order is standards → RFP → risk.)* The risk step's vendor cache (③, 5-min TTL) can still expire on long runs | Measure on Opus runs; option: 1-hour TTL on ③ |
| I-26 | ℹ️ Note | The proposal page still has the P6 per-vendor **Compliance / Comparison / Risk** tabs (latest finished run). They work, but the results page replaces them | Ask the user whether to remove them |
| I-27 | 🟡 Open | `tests/integration/runner.test.ts` › "survives a crash … resumes without re-running finished steps" is flaky (expected ≥ 2, got 1): 2 of 3 runs failed on 2026-10-25, also on the committed code; other runs pass | Timing-dependent; look at the crash simulation's wait before asserting |
| I-27 | ℹ️ Note | The vendor simulator (`/vendor-portal`) is no longer linked from the Proposals tab (**Add vendor** replaced it); Settings → Demo tools still links it | Keep as a demo tool, or remove in P9 |
| I-28 | ℹ️ Note | **PDF standards:** rule extraction by AI (`extract-rules-ai.ts`, Haiku, low effort, asks first) is only tested with the mock engine | First live use costs about a cent; the user starts it |
| I-29 | ✅ Checked | The 0–100 risk score and Marsa's pick were calibrated on the P6 Sonnet runs | First live P8 run (Haiku, set 3): Sabkha 19 low, Kaltenmoor 51 high, Nimbrel 84 critical, as intended |
| I-30 | 🟡 Workaround | Haiku's cost estimate was half the real cost ($0.05 vs $0.094): Haiku writes about 1,000 output tokens per RFP finding (thinking included), twice Sonnet's. Dense RFPs also have ~7 requirements a page, against the 3.5 the estimator assumes | `OUTPUT_FACTOR` Haiku = 2 (`lib/plan.ts`). A re-run uses the real requirement count. Recalibrate after the user's runs and the final Opus run |
| I-23 | ℹ️ Note | Live speed (Sonnet, 91 requirements): analyse steps 3.5–4.7 min, whole 4-vendor run ~17 min (PRD target "3 vendors in 3–6 min" met only for the short PCS tender: ~5 min). Opus is likely slower | Options for P9: effort `medium` for compare/summary (changes the cache group), concurrency 4, shorter finding prose |
| I-24 | ✅ Solved | Results tabs were a basic P6 view | P8 results page (`/analysis/<projectId>`) |
| I-17 | ✅ Solved | Analysis tabs on the proposal page | Unlocked once a run has finished (latest completed run) |
| I-13 | ✅ Obsolete | Settings scroll-spy | Settings became fading tabs (user feedback) |
| I-14 | ✅ Solved | Browser PDF iframe in previews and the proposal page | Replaced by `DocumentReader` everywhere (`DocumentPreviewDialog` is now a thin wrapper around it) |
| I-19 | ✅ Solved | Reader text layer and other formats | pdf.js `TextLayer` (selectable text, quote highlight); DOCX via docx-preview (client, sanitized); XLSX/CSV/TXT via `GET /api/documents/:id/preview` |
| I-20 | ℹ️ Note | `npm audit`: high/moderate advisories in transitive deps of shadcn CLI (braces), drizzle-kit (esbuild), mammoth (sprintf-js), exceljs (uuid). None come from docx-preview; the fixes are breaking downgrades | Review in P9.6 (code review / hardening) |
| I-21 | ℹ️ Note | Reader limits: a DOCX without page breaks becomes one tall "page" (auto fit-width, capped at 880 px). XLSX previews are capped at 1,000 rows × 50 columns per sheet; text at 1 M chars. `.ods`, `.pptx` and archives get a download card | Acceptable for v1 |
| I-16 | ℹ️ Minor | The Proposals table scrolls horizontally on phones (390 px) | P9.4 responsive pass (card list on mobile) |
| I-17-old | ✅ Superseded | The analysis tabs on the proposal page (Compliance, Comparison, Risk) were locked placeholders; `?tab=` only accepts commercial/technical for now | P6/P8 |
| I-18 | ℹ️ Minor | On proposal pages the full project header pushes the content down. Less important now that documents open in the full-screen reader | P5.3: compact project header on `/proposals/[id]` |
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
- **Categories:** `PROJECT_CATEGORIES = STANDARD_CATEGORIES`; `standardFitsProject(std, project)` = project is General OR standard is General OR equal (`src/lib/domain.ts`), used by the picker, `createProject` pre-selection, `setProjectStandards` (400 `standard_category_mismatch`) and `updateProject` (a category change drops misfit links). The UI warns before saving (`CategoryChangeNote`). New projects default to General. The DB column keeps DDL default `'other'` on purpose (G-52).
- **Reader:**
  - The proposal page URL is `?tab=commercial|technical&reader=<docId|1>&page=N`. The table's View link adds `&reader=1`, and clicking the Commercial/Technical tab opens the reader. Esc removes `reader`/`page`.
  - The reader is controlled (`docId`, `page`, `onNavigate`). Groups are envelopes, or one group for a plain document.
  - Keys: ←/→ PageUp/PageDown Home End, + − 0. Fit page (default) / fit width. Zoom 50–300 %.
  - Always-dark `stage` tokens live in `globals.css` (`bg-stage`, `text-stage-ink`, `border-stage-line`, …).
- **Analyse & process panel** (`analyse-panel.tsx`): T = 3N + 2 (`planRun`, N = 1 → compare skipped), time from phase waves × concurrency (mock 3.5 s/step; live guesses per phase, to re-measure in P6.1), cost from pages × 2,000 tokens with cached shared context (Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, cache read $0.20 per MTok; `MODEL_PRICES`). Button disabled until P6.
- **Reader sources** (`use-reader-source.tsx`): pdf (pdf.js), image, docx (docx-preview → sanitized section HTML + its CSS), sheets/text (server preview). HTML pages are laid out at their own size and CSS-scaled (`ScaledHtml`). Deep link `?q=` → `findQuotePage` → navigate → text layer / DOM highlight → banner + 1.2 s pulse.
- **Vendors & proposals:** vendor names are unique ignoring case (409). One proposal per vendor per project; `POST /api/projects/:id/proposals {vendorId}` returns 201 (new) or 200 + `replaced:true` (resubmission: old files deleted, `submittedAt` = now). Files follow one per request on `POST /api/proposals/:id/documents` (multipart `file` + `kind` = commercial|technical). Only **open** tenders accept proposals or files (409 otherwise). `useSubmitProposal` orchestrates create + uploads with per-file progress and returns failed files instead of throwing.
- **Proposal source** (`seed` · `simulator` · `ai`) is shown as a pill ("Sample" · "Simulator" · "AI-generated").
- **Vendor simulator** (`/vendor-portal`, not in the sidebar; reached from the Proposals tab and Demo tools): `?project=` preselects the tender; the vendor picker opens on "New vendor" while no vendors exist.
- **Test-input generators** live in `scripts/test-inputs/` (HTML→PDF/PNG via Playwright Chromium in `lib/pdf.ts`; DOCX via `docx`; XLSX via `exceljs`).
- **P8 (2026-10-22/23); these supersede older bullets where they differ:**
  - **Proposal template:** `PROPOSAL_SECTIONS` (`lib/domain.ts`) = company · solution · security · implementation · support · commercial · terms; labels in `labels.ts`. "Section N" is the template position (`sectionNumber`).
  - **Checklist:**
    - every standard rule becomes its own requirement (`withStandardRules`: sourceType `standard`, sourceRef = rule code, title = `ruleTitle(text)`);
    - a rule code that two standards share gets the standard as a prefix;
    - `requirementsFor(checklist, "standards" | "rfp")` splits the two checks.
  - **New table `analysis_meta`** (`item_id`, `run_id`, `kind`, `section`, `headline`) holds sections and one-line summaries. Existing tables are unchanged (G-52).
  - **Scores** (`lib/scoring.ts`, `server/runs/scores.ts`):
    - Standards % and RFP % use `computeScore` with the settings weights.
    - Risk score = 45 × min(1, mandatory not met / 5) + 30 × gap share + 25 × the average of the top-3 L×I / 25.
    - Risk bands: < 25 low · < 50 moderate · < 70 high · else critical.
    - Overall = 0.4 Std + 0.4 RFP + 0.2 (100 − risk); without standards, 0.8 RFP + 0.2 (100 − risk).
    - Only vendors with RFP findings are ranked. The AI summary step only explains the pick.
  - **Results page URL:** `/analysis/<projectId>?run=&tab=overview|compliance|risks|comparison|quality&reader=&page=&q=&v=`.
    - `v` is the vendor whose finding opened an RFP clause, so the reader keeps that vendor's envelopes.
    - One request (`GET /api/runs/:id/analysis`) feeds every tab; section and comparison numbers are computed in the browser (`components/analysis/shared.tsx`).
  - **Sidebar:** `setSidebarCollapsed(collapsed, persist = false)` collapses it only while the results page is open, and the previous state comes back on leaving.
  - **Rules files** (`server/standards/rules-file.ts`):
    - CSV/TSV are parsed directly; XLSX/DOCX/TXT go through `extractText` and pipe rows; header and separator rows are skipped.
    - A PDF is first read by rule codes; under 2 rules found → `needsAi`, and the dialog offers AI extraction (paid, asks first).
  - **Vendors:**
    - drafts accept vendors, since the guided form adds them before Create; only evaluating and archived projects refuse;
    - a typed name that matches an existing vendor reuses it (hint under the field);
    - the same vendor twice on one project is refused;
    - the source pill for vendors the customer adds reads **Uploaded** (enum value still `simulator`).

## 7. Before you start a task, consider…
- **Next APIs** → bundled docs first (G-02). Caching → G-03. Titles → G-20.
- **New GET route** → `await connection()`, `withErrors`, zod.
- **New client state that comes from the browser** → `useSyncExternalStore` (G-19/G-30), not setState in an effect.
- **New fs path code** → G-06 tracing check.
- **New npm script** → no `&&` (G-01).
- **Anything calling Claude for real** → ask the user first (💳), log the cost.
- **UI work** → Harbor tokens only (G-23), 4-px spacing, logical properties, icon + label for status, reduced motion. Self-review with `scripts/screenshots.ts` before showing the user.
- **Test documents** → §0 rule 3 (no hints, consistent, legitimate). Update `test-inputs/SCENARIO.md`.
- **Builds while the user's dev server runs** → `NEXT_DIST_DIR=.next-e2e` (G-51). If pages start reloading by themselves: stop dev, delete `.next/dev`, restart.
- **End of phase** → §0 rule 1: run the app, give the link and bullets, plus the exact click-by-click main test case. Commit locally; push only after the user's OK (§0 rule 5).

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
- **Feedback round after P4 (same session):**
  - **Request 1:** project categories should filter standards. Asked one question: should General standards apply everywhere? Answer: yes.
  - **Request 2:** the document view looked "small and ugly". Asked which option; the user picked the full-screen reader.
  - **Built:** categories (domain + service rules + UI + data migration 0002 + unit tests incl. the migration), and the reader (pdf.js client, PdfCanvas, filmstrip, page-turn animation, sheet stack, toolbar, keyboard, URL sync, document cover cards). Also swapped every preview to the reader.
  - **User asked mid-way:** make their project IT & security. Migration 0002 now derives a legacy project's category from its applied standards (one category → that one; none or mixed → General).
  - **Problems (solved):** G-52 (no DDL changes on existing tables), G-53 (stale CSS from the build cache), G-54 (pdf.js worker warning).
  - **Checks:** 99 unit ✔, 17 E2E ✔. Reader verified on the user's dev data (read-only) and in screenshots.
- **Phase 5 (same session; the user said "start with phase 5"):**
  - **P5.2** Analyse & process panel with `src/lib/plan.ts`. Prices are taken from the claude-api skill: Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, cache reads $0.20 per MTok.
  - **P5.3** compact header on proposal pages.
  - **P5.6** DOCX (docx-preview 0.4.1, sanitized), XLSX/CSV/TXT (new `/api/documents/:id/preview`), image sources.
  - **P5.7** pdf.js text layer (CSS trimmed into `globals.css`), quote search/highlight/pulse, `q` deep links wired in the proposal page.
  - **Reader polish:** fullscreen (F), scrubber, collapsible filmstrip, single-page mode, RDD page-turn variants, three ghost sheets.
  - **Problem found and fixed:** the test quote crossed a page break and reported "not found" → needle fallback (G-55).
  - **Tests:** 11 new unit tests (plan, quote, previews, paginate) and 2 new or extended E2E tests. Deep links verified on the user's dev data (read-only).
- **Phase 6 (same session; the user said "push both and start phase 6 but mark phase 5 untested"):**
  - **Code:** `src/server/ai/` (client, schemas incl. wire formats, prompts, content builder with breakpoints ① ② ③, mock engine, live engine, Files API uploads), `src/server/runs/` (context, store, runner, read models, instance, boot), Runs API (`/api/projects/:id/runs`, `/api/runs/:id`, cancel/resume/retry, results, per-proposal, active), `src/instrumentation.ts`, planner/ETA/cost in `src/lib/plan.ts`, risk severity in `scoring.ts`.
  - **UI:** Analyse & process starts a run (live mode confirms the estimated cost first); Evaluation tab shows the run, steps, ranking, executive summary and key constraints. Proposal page: Compliance / Comparison / Risk tabs unlocked with numbered findings and evidence "Page N" deep links.
  - **User asked mid-way:** "make tests using sonnet first … then switch to opus and tell me how to test in the ui". Live tests ran on Sonnet 5.5 only; the default model stays Opus 5.5 and the test guide uses Opus.
  - **Problems found live (all fixed):** G-58 (per-step schema broke caching; then union limit; then grammar size), G-59 (pdf.js Buffer), G-57 (mangled escapes). Atlas analysis wrote 119k cache tokens before the fix; after it, risk steps read ~39k each.
  - **Quality check (Sonnet):** X-ray ranking Harborline 91.6 > Meridian 74.9 > Nile Gate 70.8 > Atlas 49.4; Meridian's cloud licensing caught (REQ-045, p.4 quote). PCS: Qasr 96.3 (recommended) > Corniche 70.4 > Bluewave 57.4; it also noticed Qasr's missing "Appendix A".
  - **Test inputs:** `test-inputs/phase-6/pcs-proposals/` (3 bids, built by `scripts/test-inputs/build-phase-6.ts`), reviewer notes appended to `SCENARIO.md`.
- **Phase 7 (same session; the user said "after that do phase 7 and we test both together"):**
  - **P7.1** Mission control (`mission-control.tsx`: DepthBackdrop, ring, Step k of T, MaskedText activity, elapsed/ETA, phase rail with ScrambleText, result chips, step timeline). **P7.2** chips pop in, failed steps show Retry, completed-with-errors banner. **P7.3** RunPill in the top bar (`shell/run-pill.tsx`, polls `/api/runs/active`) + completion toast with View results (the single source of completion toasts). **P7.4** curtain lift (clip-path) from mission control into the results; reduced motion = fade.
  - **P7.5** Generate with AI dialog → job → DOCX + PDF → proposals (`source: "ai"`). Live check on Sonnet: 2 bids for $0.19; fixed duplicate section numbers, a placeholder price line ("x · USD 0") and the internal project code in headings (`cleanBid`, `tenderReference`).
  - **Tests:** 151 unit + integration (runner: full run, determinism, crash + resume, retry, cancel, N = 1; generator with real DOCX/PDF rendering), E2E for mission control → pill → toast → results → cancel/resume, and Generate with AI.
- **POC inputs (same session, user request: "one standard, 1 RFP, 2 vendors … make 2 of these … push and commit"):**
  - `test-inputs/poc-inputs/`: set 1 rehearsal (Smart Gates, POTS-2026) and set 2 meeting (e-Seals, CTS-2026), each with its own README of copy-paste values and "what a good result looks like".
  - Generator: `scripts/test-inputs/build-poc.ts` with content in `content/poc-render.ts`, `poc-gates.ts` and `poc-eseals.ts`.
  - Verified with a Playwright script on a throwaway `next start -p 3300` (mock, `data/poc-check`, deleted afterwards). Estimates priced with `estimateRun` from the app's `/estimate` input. No API credits used.
  - Pushed at the user's request, together with the earlier local commits.

### 2026-10-22/23 · Session 6: client feedback → P8 re-planned and built
- **Asked:**
  - an evaluation UX redesign with the RTA company design standard;
  - then: "ignore everything we did because i got new requirements". The new story was approved as a plan. During the build the user changed the wizard order ("make the project step first"), asked for Risks divided by section like Compliance, and said "about 1 dollar left … use Haiku".
- **Built:**
  - P8.0 RTA design system;
  - P8.3 pipeline;
  - P8.1 guided form, P8.2 project page, P8.4 results page;
  - P8.5 POC sets on the 7-section template, rules as XLSX/CSV, READMEs, unit tests for the rules files, E2E rewritten (`analysis.spec.ts` replaces `evaluation.spec.ts`; projects and proposals specs follow the guided form and Add vendor).
- **Problems (solved):**
  - G-73 to G-80;
  - a duplicate "Created" row on the project details;
  - the mock price kept a trailing comma;
  - an RFP clause opened from a finding lost the vendor's envelopes (`?v=`).
- **Memory pressure:** Claude Code killed background servers twice. Only kill servers I started (check the command line first), and don't restart killed ones on my own.
- **Checks:** 177 unit + integration ✔, 20 E2E ✔. Verified click by click on a throwaway mock server (port 3400, `data/design-check`), screenshots reviewed. **No API credits used.**
- **Feedback round, same session (2026-10-23):**
  - **User reports:** only 4 sections; vendor names missing above the Comparison columns; a risk's "View more" didn't link anywhere; section numbers to hide; "0 rules" after creating a standard from a file. Also asked for a 3-vendor test case. **All fixed** (G-81, G-82, G-83; Comparison column heads; risk links).
  - **Budget:** the user added $5 (≈ $6 total): Haiku for tests, Opus once at the end. Before the user's "let me do the ai run" message arrived, I ran one Haiku check of set 3 on a throwaway server (`data/haiku-check`, Haiku-only guard in the script): **$0.094**. It found the "Section E" leak (G-83) and the Haiku estimate gap (I-30).
  - **Checks:** 178 unit ✔, E2E ✔ (analysis, projects and proposals specs re-run; the analysis journey now has a 120 s timeout).
- **Second feedback round (same day), after the user's own Haiku run (set 3, $0.089):**
  - **Compliance:** an RFP view and a Standards view (radio group "Checked against"). Each shows only the sections with points of that kind, in template order; the empty sections are listed once at the end. Risks does the same. A risk's section link opens the view its requirement belongs to (`ComplianceFocus.scope`; the tab remounts on a new focus).
  - **Comparison:** rebuilt as a pricing-page `<table aria-label="Vendor comparison">`.
    - One column card per vendor: header with rank, Recommended badge and price, pinned below the top bar (`top-16`, opaque).
    - Row groups: Overall, RFP by section, Standards by section, Risks by section, Commercial terms (AI-read).
    - The best value of a row gets a check; a section row opens the differing points in the same columns.
    - Still computed from the saved analysis, no AI call: the user had noticed it was instant.
  - **Mission control:** every vendor box has a second line ("No mandatory fails" or the fail count) and `min-h-24`, so the boxes match.
  - **Checks:** 178 unit ✔, analysis E2E ✔. Screens checked on the real Haiku data in a mock-mode viewer (port 3400, `data/haiku-check`). The :3000 app was rebuilt (`.next-design`) after checking that no run was active.
- **Third round (same day):** the user didn't want two views inside Compliance: "remove the compliances tab and replace them with rfp and standards each one has its own tab". The tabs are now **Overview · RFP · Standards · Risks · Comparison · AI quality**.
  - `?tab=rfp|standards`; the old `?tab=compliance` opens RFP.
  - With no standards applied there is no Standards tab.
  - `ComplianceTab` takes a fixed `scope`; a risk's "see its points" opens the tab of its requirement.
- **Status pills (same day):** each vendor dropdown in the RFP and Standards tabs groups its points by status. The pills, worst first, are Non-compliant · Partially compliant · Not addressed · Compliant, each with a count. One group shows at a time, the dropdown opens on the worst group that has points, and empty groups are disabled. They replace the tab-level "All points / Shortfalls only" switch (user: "if there is 77 rules i dont have to scroll").
- **Vendor first (same day):** in RFP, Standards and Risks, cards are now **per vendor** (ranking order). The card heads show the vendor's result for the tab: compliance %, or risk score and level. Underneath is one row per proposal section: score, counts and a dropdown with the status pills or the risk cards. Vendor chips at the top jump to a card.
  - A risk's "see its points" opens that vendor's section row in the RFP or Standards tab, already expanded.
  - The previous section-first layout is tagged **`before-vendor-first-layout`** (`33d7755`) in case the user wants it back.
- **Open stepper (same day):** every step of the guided form can be opened at any time, even empty (user: to show the steps without creating anything).
  - **State:** the wizard keeps the step-1 fields, plus the standards chosen before a draft exists (`pendingStandards`), across steps.
  - **Draft:** saved only when something must be stored. `ensureDraft(stayOn)` runs on the first RFP drop, a saved vendor (`VendorsEditor` `ensureProject`), or Create. It needs a valid name, else it rejects with "Add the project name in step 1 first".
  - **Create:** checks the fields and then at least one RFP. If one is missing it goes to step 1, shows the errors and focuses the first `aria-invalid` field, or scrolls to and pulses the RFP drop zone. It then PATCHes the fields, applies the pending standards (after the category) and publishes.
  - **Hooks:** `useProposals(null)` loads nothing; `useSubmitProposal` takes a `projectId` per call.
  - **Checks:** E2E covers the empty walk-through, the Create redirects, and that no project is created along the way.
- **Brand and name (same day):**
  - **Logo:** the RTA logo files were deleted; the **Sharjah emblem** (`public/brand/sharjah-emblem.png`, from the user's `sharjah-logo.png`) is the brand mark.
    - `Emblem` in `shell/brand-mark.tsx`: 56 px in the sidebar, 34 px on the collapsed rail, in the welcome/profile dialog.
    - Favicons `icon-32/64.png`, apple `icon-180.png`.
    - The RTA *design system* (colours, gradient, fonts) stays.
  - **Name:** shown as **Mizan**, while the codename **Marsa** stays in code (G-85, and the note at the top of CLAUDE.md).
- **POC set 4 (three vendors, category Quality):** `test-inputs/poc-inputs/4-three-vendors-customs-lab/`.
  - Contents: LIMS for the Central Customs Laboratory; standard CLQS-2026 (12 rules: 6 M · 5 I · 1 D); RFP GCD/T/2026/061 (5 p., 32 clauses).
  - Vendors: Qalamra (strong, local), Veridane (EU cloud, PQ left to the lab, Dutch bank), Corvantis (cheap ERP add-on, many mandatory breaks).
  - Content in `scripts/test-inputs/content/poc-lims.ts`.
  - Checked in demo mode: guided form → standard from XLSX → 3 vendors → run. Haiku estimate ≈ $0.08.
- **Pushed to GitHub (user request, 2026-10-23):** `main` and the tags `before-rta-redesign` and `before-vendor-first-layout`.
- **Screenshots of every page and feature:** `screenshots/2026-10-23/` (34 PNGs plus `index.json`), `screenshots/Mizan-screens-2026-10-23.pdf` (captioned) and a zip; the user got the PDF and zip through SendUserFile. The folder is gitignored.
  - **How they were made:** a demo-mode server on 3400 from `.next-design`, with `DATA_DIR=./data/screens`, a copy of `data/haiku-check`. The AI results are the real Haiku run `run_32j4afy4xb4mhn`; pick it by `mode === "live"`, because later demo runs also record the Haiku model.
  - **Script:** `$CLAUDE_JOB_DIR/tmp/screens.cjs` (job-local). To re-create it, follow the same steps.
  - **Found and fixed while capturing:** at phone width the breadcrumb ran under the run pill (the trail is now clipped), and the project code above the results title wrapped onto two lines.

### 2026-10-24 · Session 7
- **Found at start:** a local commit by the user, `a2a02f4` "rta standards push" (not pushed). It adds the `rta standard/` folder (RTA logos, design-system HTML, a 1.9 MB `.skill`, `__MACOSX/` junk) and `sharjah-logo.png`. Earlier sessions kept that folder untracked. The user was asked whether to push it; no answer yet, so it is untouched.
- **Projects hero → welcome band** (user: "more visually good and informative", remove the port drawing; then: "this should be a general overview and welcome section … dont put a specific recommendation or project in it"). The user rejected three proposals that showed the latest project or recommendation. **Rule: the Projects hero never names a project, vendor or recommendation; only workspace-wide totals.**
  - New `src/components/projects/projects-welcome.tsx`: caption-caps date · organisation, greeting (first name capitalised), `rta-rule`, one general sentence, New project / Manage standards. Underneath, an RTA hero KPI band that is also the workflow: 1 Publish the RFP (tenders, open, drafts) → 2 Apply standards (active standards, rules, mandatory) → 3 Collect vendor bids (proposals, vendors with a bid) → 4 AI analysis (evaluated, running now). Data from `useProjects`, `useStandards`, `useVendors`; no new API.
  - About 330 px tall instead of ~525. Phone: 2 × 2 cells, step titles wrap, icons hidden, buttons full width.
  - **Port art removed everywhere:** `DepthBackdrop` lost its harbour line art (cranes + containers) and its `art` prop; `ProjectsArt` (empty state) shows vendor bids stacked behind the RFP instead of a container ship.
- **How it was checked:** throwaway server on 3400 (`.next-e2e`, `DATA_DIR=./data/hero-check`, a copy of the user's data, `AI_MODE=mock`), screenshots light / dark / 390 px. `npm run check` ✔ (178), E2E shell + projects + proposals ✔ (12).
- **Pushed** on the user's word ("commit and push"): `a2a02f4` (their `rta standard/` folder, as committed, `__MACOSX/` included) and `571f68f`.
- **Tried and rejected: the RTA dark hero band** on the welcome (ink background, angular glow, clipped corner, hover effects on the steps; local commit `e89c8bb`). User: "no i dont like put it back as it was". Reverted; the welcome stays the light band of `571f68f`. Don't propose a dark welcome band again.

### 2026-10-25 · Session 7 (cont.)
- **Run line moved off the results page** (user: the "Analysis complete · date · model · cost · N of N steps" line under "AI analysis results" was "taking so many space for nothing"; "remove them … or maybe put them in the ai quality tab"). In `analysis-page.tsx` the line is now `RunSummary`: a finished run shows it at the top of **AI quality** only. `RunBar` above the results shows nothing for a clean run, only the warning for a run with failed steps; a cancelled, interrupted or failed run (no tabs) keeps the line there with Resume.
- E2E `analysis.spec.ts` updated: the Overview has no "14 of 14 steps"; AI quality shows "Analysis complete" and the steps; after Resume it waits for the Recommended vendor card. `npm run check` ✔ (178), analysis E2E ✔ (2).
- :3000 after the low-memory notice: the server had **not** stopped (G-86, only the wrapper was killed); the user was told wrongly that it had. `.next-design` was then rebuilt under the running server, so it was restarted cleanly (no run active) and checked: Overview has no run line, AI quality opens with it.
- **Pushed** on the user's word: up to `cc70319`.
- **Faster first evidence open** (user: the RFP / proposal links "take a while to load the first time"; faster only if accuracy and logic stay the same). Measured on the production build (Playwright, results page idle, then the evidence URL): cold first open 0.40–0.46 s to the highlight, a new document once pdf.js was warm 0.16 s, later opens 0.05–0.08 s. The cold cost was downloading and starting pdf.js + its worker. Fix: `preloadPdfjs()` in `src/lib/pdf/pdfjs.ts` (idle callback) called by `DocumentReader` on mount; `loadPdfjs()` now forgets a failed download so it can retry. After: first open 0.26–0.30 s (8 samples each, old vs new build side by side). Quote search, highlight and page choice untouched.
  - Not done (no need at today's 4–10-page documents): reading the cited page's text first and scanning every page only when the quote is not there. Same result by construction (`findQuotePage` returns the cited page whenever the longest needle is on it), would help long documents. Ask before doing it.
- **Standard rule → side panel** (user picked "rule popup" of: panel / remember the place on Back / new tab). New `src/components/standards/rule-sheet.tsx` (`StandardRuleChip`): the rule chip on the results page (`finding-card.tsx` `SourceChips`, used by RFP/Standards/Risks tabs) and on the proposal page (`proposal-results.tsx`) is now a button opening a right-hand `Sheet` over the page: standard title + code + rule count, the rule **as the analysis stored it** (code, priority, wording) in a highlighted card, then every rule of the standard as it is now with this one marked (`aria-current`, brand edge), and **Open full standard** (the old `/standards/<id>?rule=` link). If the standard was edited after the analysis the panel says the wording changed / the rule was removed / the standard was deleted, instead of silently showing other text. Closing (Esc, ×, click outside) leaves the results exactly where they were.
  - E2E `analysis.spec.ts`: the chip opens the panel with the rule marked, Esc closes it, the URL and `window.scrollY` are unchanged; Open full standard still lands on the rule. Checked on a copy of the user's data (light, dark, 390 px).
- **Reader opens at 200 %** of "whole page" (user: pages looked "so far"), capped to full width when 200 % would be wider than the stage (landscape sheets, phones stay at 100 %). `zoom` state is `null` = opening zoom; the % label and key 0 return to it; +/− step to the next preset from wherever it is. The page-position dots got the toolbar's frosted surface (at 200 % the page runs under them and the red dot looked like a mark on the text). E2E `proposals.spec.ts`: opens at 200 %, + → 250 %, label → 200 %. Checked 1440×900, 1366×768, 390 px: no sideways scroll, quote in view.
- **Pushed** on the user's word ("push everything first"): up to `49ad745`.
- **Overview tab, round 1 of the user's page-by-page walk-through** (user: the recommended box "needs to be reverted to the original color i think its white", "make it look like its a recommendation or overall choice", remove "conditions before an award", bars "filled up to the end" at 90 %, the % "in a percentage circle" blue ≥ 70 / yellow ≥ 30 / a third colour below, section labels clickable to their tabs). The hero had been dark (`bg-rail`) since `a43b28d`; "white" is the page's card surface.
  - **Hero** = the RTA *featured card* (`@utility rta-featured` in `globals.css`: 1 px RTA-gradient border on the surface), a faint warm wash, caption "Recommended vendor" + "Rank 1 of N" pill, the **overall score as the page's one gradient number** (`text-rta`), a green "N points ahead of <runner-up>" chip, a red line for open mandatory points, then "Why this vendor · AI-generated" and strengths. **Conditions before an award removed** from the Overview (still in the data: `recommendation.conditions`).
  - **Rows:** the status-segmented `GapBar` is gone from the Overview. Each row has a `MeterBar` filled to its number over a visible track (`bg-border`, so 90 % shows the missing 10 %) and a **`ScoreRing`** at the end (`shared.tsx`; ring filled to the share, flat ends so 97 never looks closed, the number inside, `role="meter"`). Compliance bands `pctTone`: blue `--chart-1` ≥ 70, amber `--partial-fill` ≥ 30, red `--fail-fill` below; the mini-box bars use the same bands. **Risk rows keep their level colours** (lower is better, so blue-for-high would read wrong) and show the score, not a %. The status / severity counts stay under each bar.
  - **Section titles** (Standards compliance, RFP compliance, Risks) are buttons with a chevron → `onOpen` → `setQuery({tab})` and scroll to the top. The shell panel `#app-scroll` scrolls on desktop, the window on phones: reset both (first version reset only the window; caught in the preview).
  - E2E `analysis.spec.ts`: hero has "Overall score" and no conditions; ring meters; the RFP title opens the RFP tab; the Risks title, clicked from the bottom of the Overview, opens Risks at scroll 0. `npm run check` ✔ (178), analysis E2E ✔ (2). Screens: light, dark, 390 px on a copy of the user's data.
  - **Follow-up (same day):** order is now **RFP → Standards → Risks** (sections and mini boxes), and the compliance bands are **green `--ok-fill` ≥ 70 · blue `--chart-1` 30–69 · yellow `--partial-fill` < 30** (user picked it; no red on compliance numbers).
- **RFP and Standards tabs, round 2 of the walk-through** (user: hide the vendor pills "but comment it … in case we need it back", "colapse each vendor", two views "the current view, and a card list view", three filters status / type / section, "if there is no data related saay now data related", "very fancy and informative … used by the commercial analyser and the tech analyser"). Asked first; the user chose: **type by proposal section**, **both tabs**, **status = All + 4, pick one**; mid-turn: **the list opens on Non-compliant**.
  - **Vendor pills:** commented out in `compliance-tab.tsx` (JSX comment with a note; delete the two comment lines to restore).
  - **Collapsing:** `VendorCardShell` (`shared.tsx`) wraps every vendor card in both views: the tinted band folds the card (whole band clickable, the chevron is the real button: "Collapse/Expand <vendor>", `aria-expanded`); **Collapse all / Expand all** in the toolbar. State is local (resets on tab change and on a risk's "see its points").
  - **Views:** segmented "By section" (unchanged) · "Point list" (`point-list.tsx`). URL: `?view=list&status=&type=&section=`, shared by both tabs. No `status` = **Non-compliant** (`DEFAULT_FILTERS`); `status=all` = every status. A risk's "see its points" drops `view` (the section lives in the section view).
  - **Type rule:** `pointType(section)` in `shared.tsx`: Commercial offer & pricing + Terms & deviations = commercial, the other five = technical; no section = no type. `scopeStats` takes `type`.
  - **Point list:** filter card (Status and Type segmented with faceted counts over every vendor's points; Section select with all 7 sections, "no data" on the empty ones, plus "Not assigned" for old runs; **Reset filters** back to the defaults). One card per vendor in rank order; its band shows "Showing N of M", the slice's status counts and a **ring with the vendor's compliance for the type + section picked** (status filter left out, it would make it 0 or 100). Rows sorted status (worst first) → priority → section → code: status edge, status / priority / type / section pills and code, headline over "RFP · requirement title", the AI's verdict tinted by status ("Why it falls short" / "What is missing" / "Not addressed" / "Why it is met", two lines until opened), RFP clause or rule chip and the vendor's evidence chip (`EvidenceChip`, extracted from `FindingCard`), **Details** = "The RFP requires" (+ "Accepted when") beside "<vendor> offers" (+ quote), AI confidence and reviewer change.
  - **Empty cases:** a type + section with no requirement in the tab → one "No data related to <slice>" card (no vendor cards); a vendor with nothing for the status → "No non-compliant points for <vendor> in <slice>" (green check for shortfall statuses) + "Show every status".
  - The filter card is **not sticky** (about 150 px high at 1440 px; it would cover the list).
  - E2E `analysis.spec.ts`: pills gone; collapse one / all / expand; list opens on Non-compliant, All → `status=all`, Commercial + Security & data → "No data related to Commercial · Security & data", Reset filters, Details shows "The RFP requires", back to By section. `npm run check` ✔ (178), analysis + proposals E2E ✔ (5). Screens: light, dark, 390 px on a copy of the user's data.
  - **Follow-up (same day, user):** "the list view toggle should be in red"; filters "3 dropdowns inside each vendor they will appear when this vendor is expanded"; "the first vendor should be expanded and the other are collapsed"; dropdowns "not so small or so big … pushed to the right side"; then "the dropdowns should be in red too for contrast".
    - **Filters are per vendor now** (local state in `VendorPoints`, kept while the card is folded, reset on a tab or view switch). **No filters in the URL any more** (only `?view=list`). Three compact `FilterSelect`s ("Status: …", "Type: …", "Section: …", widths 14/13/15 rem, full width on phones) right-aligned in a strip at the top of the open card, "Showing N of M" on its left, **Reset** beside them when changed. RTA red outline style (`border-brand/50 bg-brand-soft text-brand-ink`), not solid red: the status dots and counts stay readable. Counts are the vendor's own. "No data related to <slice>" is now inside the vendor's card.
    - The SelectValue must be a **direct child** of `SelectTrigger`: the shadcn `SelectValue` drops `className`, and only the trigger's `*:data-[slot=select-value]` rules make icons inline (an icon wrapped onto its own line otherwise).
    - **View switch red:** `SegmentedControl` got `tone="brand"` (picked segment in the RTA gradient, white text); only the view switch uses it.
    - **First vendor open, the others folded** on load, in both views (`closed` initial state in `ComplianceTab`); a risk's "see its points" opens its own vendor instead.
- **Open issue I-27 (seen 2026-10-25):** `tests/integration/runner.test.ts` › "survives a crash … resumes without re-running finished steps" is **flaky** (expected ≥ 2, got 1), 2 fails out of 3 runs, also on the committed code before these UI changes; it passed in other `npm run check` runs. Timing-dependent; not looked into.
- **Pushed** on the user's word ("push and commit these"): up to `f35ecb9`.
- **Consultant reports (new feature, user-designed, 2026-10-25).** The user asked for a Reports tab with one AI report per vendor, "like an actual report" by "a very professional business consultant", as a PDF with structured output. Structure proposed and approved in chat. The user's choices:
  - The agent reads the proposal files as well as the analysis ("not biased by the analysis"). Measured cost on their Haiku set: +~$0.015 per run on Haiku, ~$0.55 more on Opus for 3 vendors.
  - Old runs get reports once, with no permanent button.
  - Rows have View plus a red Download.
  - Verdicts are *Preferred bidder / Acceptable with conditions / Not recommended*.
  - At most 2 pages. No comparison section and no section scores: only the overall, RFP, Standards and Risk rings at the top right.
  - **Pipeline:** new last phase `report` (`RUN_PHASES`), one step per vendor after the summary: T = **4N + 2** (3N + 2 without standards). Step label "Writing the consultant report on <vendor>".
    - **Input:** the tender ① and checklist ② as cached blocks, the vendor's documents ③, then Section E: Marsa's scores, rank, the recommended vendor, the vendor's digest, its risk register and the other bids' stated prices (only to judge price level).
    - **Own system prompt** (`reportSystemPrompt`: senior procurement and business consultant to the client, same document-safety rules). Its **own output format** (`ReportOutputSchema`): a third format costs no shared cache, because reports come after every cache entry they could share.
    - **Task text** `reportTask`: word limits (~1,100 words), the verdict rule, refs on every point.
  - **Schema** `ReportSchema` (`schemas.ts`):
    - verdict, headline and executiveSummary;
    - technical and commercial: rating strong/adequate/weak, assessment, 3–5 strengths/weaknesses each with a reference;
    - balance: assessment, valueForMoney;
    - concerns (title, detail);
    - recommendation: opinion, conditions, negotiationPoints, clarifications.
  - **Normalisation** `normalizeReport`: Marsa's pick is always `preferred_bidder`, the others never are. Lists are capped (5 points, 4 concerns, 5 actions) and blanks dropped. Output stored on the step (no new table); `readReport`.
  - **Runner:** a report is blocked without its vendor's analysis or the summary. **Retry:** a retried check (before the summary) re-runs the summary **and every report** (scores changed); a retried report only itself; a failed summary re-runs the skipped reports. **`addReports(runId)`** = the one-time backfill: adds missing report steps (rank order, `addReportSteps`), re-queues unfinished ones, runs only those. Its endpoint is `POST /api/runs/:id/reports`, with **no UI**.
  - **PDF:** `src/server/reports/`.
    - `html.ts` is the pure template: EN/AR, RTL, escaped, rings in the app's bands, verdict and rating chips, strengths beside weaknesses, the recommendation box with 3 columns, a method note, and a Chromium footer with page x of y.
    - `view.ts` builds it from the DB.
    - `pdf.ts` renders it with the shared `src/server/pdf/print.ts` (`withBrowser`, also used by `simulate/render.ts` now). It shrinks the scale 1 → 0.94 → 0.88 → 0.82 until `pdfPageCount` ≤ 2, caches on disk (G-87), and renders concurrent requests once.
    - Route `GET /api/runs/:id/reports/:proposalId` (`?download=1` = attachment).
    - A maximum-length sample prints on 2 pages at scale 1.
  - **UI:**
    - **Reports tab** (`reports-tab.tsx`), after Comparison: section title, one row per vendor (rank, vendor, `VerdictPill`, headline, date, **View** in the app's reader, red **Download PDF**). Rows also cover writing, failed (retry under AI quality), skipped, cancelled and missing reports.
    - **Analyse panel:** "18 (4 × 4 + 2)", a "Report" chip, and text that mentions the report.
    - **Mission control:** the rail shows "Reports".
  - **Estimate:** `estimateRun` adds the reports (the first writes ①②③, the others ③) and returns `reportsUsd`; the calibration tests compare `usd − reportsUsd` with the measured runs.
  - **Mock engine:** the demo report is assembled from findings, commercial terms and risks.
  - **Tests:**
    - unit `report.test.ts` (verdict rule, caps, escaping, RTL);
    - integration `report-pdf.test.ts` (a real Chromium render of a maximum-length report: ≤ 2 pages, text selectable);
    - runner tests: 18 steps, one preferred bidder, retry rules, the backfill runs once;
    - E2E: Reports tab, PDF headers and `%PDF-`, View opens the reader.
  - `npm run check` ✔ (185), full E2E ✔ (20).
  - Preview on a copy of the user's data (light, dark, 390 px): the demo run's backfill made 2 reports (Preferred bidder / Not recommended); View shows the 2-page PDF.
