# Marsa — Session Handoff

> **Read this first in every new session**, before writing any code. It holds everything the previous sessions learned the hard way: environment quirks, gotchas, open problems, and small decisions that are not obvious from the code.
> Companion docs: [PROGRESS.md](PROGRESS.md) (status) · [PHASES.md](PHASES.md) (plan) · [RDD.md](RDD.md) (design) · [PRD.md](PRD.md) (requirements)

## How to maintain this file
1. **At the end of every coding session**, update §1 (Where we are), add or update entries in §4 (Gotchas) and §5 (Open issues), and append a dated entry to §8 (Session log).
2. **Never delete history.** When an issue is fixed, change its status to ✅ Solved and say *how*. Keep the entry so the next agent knows the trap exists.
3. Each gotcha gets an ID (`G-xx`) and each open issue an ID (`I-xx`). Reference them in commits and PROGRESS.md notes.
4. Write for an agent that has **zero memory** of earlier sessions: exact commands, exact file paths, exact error text.

Status legend: 🔴 Open · 🟡 Workaround in place · ✅ Solved · ℹ️ Rule / fact (always applies)

---

## 1. Where we are (update every session)
- **Last session:** 2026-10-21 (session 2, Phase 0).
- **Done:** Planning docs (PRD, RDD, PHASES, PROGRESS). **Phase 0 complete** (P0.1–P0.8).
- **Next subtask:** **P1.1**: Harbor tokens in `src/app/globals.css` (replace shadcn's neutral oklch tokens), light/dark, no FOUC. Then P1.2 → P1.9 (design checkpoint 🧑 with the user).
- **App runs?** Yes. `npm run dev` → http://localhost:3000 shows the temporary P0 page. `GET /api/health` → `{status:"ok"}`.
- **All checks green?** Yes. `npm run check` (lint + typecheck + 10 unit tests) and `npm run test:e2e` (2 Playwright tests) pass. `npm run build` has 0 warnings.
- **User approvals:** All 22 recommendations approved (REC-01…REC-22), so Phase 10 items are in scope after P9.

## 2. Quick start for a new session
```bash
npm install                     # if node_modules is missing
npm run dev                     # http://localhost:3000 (AI_MODE=mock from .env.local)
npm run check                   # lint + typecheck + unit tests
npm run test:e2e                # Playwright (starts its own server on :3200; stop other `next dev` first — G-09)
npm run db:generate             # after editing src/server/db/schema.ts → commit the new drizzle/*.sql
npm run db:migrate              # optional; the app also auto-migrates on first DB use
npm run build                   # production build (standalone output)
```
Ports in use by convention: **3000** dev · **3100** ad-hoc manual checks · **3200** Playwright · **3300** standalone smoke test.

## 3. Environment facts
| Fact | Value / note |
|---|---|
| OS | Windows 11 Home. Tools available: Git Bash (POSIX) and PowerShell 5.1 |
| Node / npm | Node **24.15.0** · npm **11.12.1** (`engines.node >= 24`) |
| npm script shell | **PowerShell 5.1** (set in the user's global `~/.npmrc`: `script-shell=…powershell.exe`). Do **not** change the user's global config. See G-01 |
| Repo path | `C:\work\mawane2 w gamarek`: **contains spaces**. Always quote paths |
| Git | Initialized on `main`. User name/email configured globally. Commit per finished subtask (REC-22) |
| Key versions | next 16.4.2 · react 19.3 · tailwind 4.3 · shadcn CLI 4.22 (style radix-nova) · drizzle-orm 0.45 · better-sqlite3 13.0 (SQLite 3.53.4) · zod 4.6 · motion 14.5 · TanStack Query 5.104 · vitest 5.0 · Playwright 1.64 |
| Secrets | The user's real Anthropic key is in **`.env`** (repo root, gitignored, user-created). `.env.local` holds non-secret overrides. See G-07 |
| Data folders | `data/` (dev DB + uploads) · `data/test/` (vitest env) · `data/e2e/` (Playwright). All gitignored |

## 4. Gotchas & rules
| ID | Status | Gotcha | What to do |
|---|---|---|---|
| G-01 | ✅ Solved | npm scripts run in **PowerShell 5.1**: `a && b` fails with *"The token '&&' is not a valid statement separator"*. Inline env prefixes (`FOO=1 cmd`) don't work either | Chain with `run-s` / `run-p` from **npm-run-all2** (installed). For env vars in scripts use a config file, Playwright `webServer.env`, or `cross-env` (install it if needed). In the Bash tool itself `&&` is fine |
| G-02 | ℹ️ Rule | **Next.js 16.4 is newer than the model's training data.** APIs and conventions changed (`AGENTS.md` says so) | Before using any Next API, read the bundled docs in `node_modules/next/dist/docs/01-app/` (e.g. `01-getting-started/15-route-handlers.md`, `03-api-reference/04-functions/connection.md`). `next dev` re-adds the block in `AGENTS.md`: keep it committed |
| G-03 | ℹ️ Rule | `cacheComponents: true` (Next 16 default, kept on purpose because it becomes mandatory in the next major). GET route handlers and server components are **prerendered at build** unless they touch request-time data. **better-sqlite3 is synchronous**, so its queries do NOT count as dynamic → stale data baked into the build | First line of every GET handler / server component that reads the DB: `await connection()` (`import { connection } from "next/server"`). Do **not** put `connection()` inside services (`src/server/services/*`): seed scripts and the AI runner call them outside a request. Verify with `npm run build`: API routes must show `ƒ (Dynamic)` |
| G-04 | ℹ️ Rule | With cacheComponents, `export const runtime = …` is **not supported** (build error) | Never add a `runtime` export. Node is the default runtime |
| G-05 | ✅ Solved | `next/font/google` timed out fetching `fonts.gstatic.com` from the dev server (curl worked; the dev server did not) → `GET /` returned 500 | Fonts are self-hosted: `@fontsource-variable/*` + `@fontsource/ibm-plex-sans-arabic` loaded with `next/font/local` in `src/app/fonts.ts`. **next/font options must be static literals**: no template strings, variables or `.map()` in `localFont({...})` (error: *"missing field `src`"*) |
| G-06 | ✅ Solved | Turbopack output tracing: `path.resolve(process.cwd(), runtimeValue)` and `path.join(dataDir, "app.db")` made the build trace **the whole repo and the local `data/*.db`** into `.next/standalone` | Runtime-only fs paths are marked `/*turbopackIgnore: true*/` as the first argument (see `src/server/env.ts`, `storage/local.ts`, `db/connect.ts`). After adding new fs code, run `npm run build` and inspect `.next/server/app/**/route.js.nft.json`: only `drizzle/*` should appear outside node_modules |
| G-07 | 🟡 Workaround | The user's key is in `.env` (not `.env.local` as originally planned). **`.env.local` overrides `.env`**, so an empty `ANTHROPIC_API_KEY=` in `.env.local` *hid the real key* (dev reported "key not configured") | Never add `ANTHROPIC_API_KEY=` to `.env.local`. Never print the key. Check it with length/prefix only (`sk-ant-`, length 108). **Next copies `.env` into `.next/standalone/`**, so `.dockerignore` excludes `.env*` and P9.7's Dockerfile must pass the key at runtime (`-e ANTHROPIC_API_KEY`). Never ship `.next/standalone` with `.env` inside |
| G-08 | ℹ️ Rule | `import "server-only"` **throws** outside the React Server condition (vitest, tsx scripts) | Vitest aliases `server-only` → `node_modules/server-only/empty.js` (`vitest.config.mts`). Scripts must import the *factories* (`src/server/db/connect.ts`, `src/server/storage/local.ts`), not `client.ts` / `storage/index.ts`. If a script truly needs a server-only module, run it with `tsx --conditions=react-server` |
| G-09 | ℹ️ Rule | Next 16 allows **one `next dev` per project folder** (*"Another next dev server is already running"*). On Windows, stopping a background Bash task (TaskStop) **does not kill the child `node.exe`** | Before `npm run test:e2e` or a new dev server, stop the old one. Find it: `Get-CimInstance Win32_Process -Filter "Name='node.exe'" \| ? CommandLine -like '*mawane2 w gamarek*next*'`, then `Stop-Process -Id <pid> -Force`. Only kill processes you started |
| G-10 | ℹ️ Fact | shadcn CLI v4 is interactive by default; init needed `-p <preset>`. Command used: `npx shadcn@latest init -t next -b radix -p nova --rtl --pointer --no-monorepo -y`. Components import from **`radix-ui`** (monorepo package) and **`cn`** (shadcn's own package: `shadcn-ui/cn`, replaces clsx + tailwind-merge). `shadcn` itself is a runtime dep (for `shadcn/tailwind.css`) | Add components with `npx shadcn@latest add <name>`, then restyle to Harbor tokens. `rtl: true` in `components.json` → generated classes use logical properties (`ps-*`, `pe-*`) |
| G-11 | 🟡 Accepted | `npm audit`: 5 high (`braces` via `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob`). **Dev-only** toolchain, not shipped | Do **not** run `npm audit fix --force` (it downgrades eslint-config-next to 14). Re-check when Next releases a patch |
| G-12 | ✅ Solved | Vitest warned *"ESM syntax in a file loaded as CommonJS"* for `vitest.config.ts` (package has no `"type": "module"`) | Config is `vitest.config.mts` and uses `import.meta.dirname` (not `__dirname`) |
| G-13 | ℹ️ Fact | Repo path has spaces. better-sqlite3 prebuilt binary, Playwright, Next and Drizzle all work with it | Always quote paths in shell commands and scripts |
| G-14 | ℹ️ Rule | Drizzle conventions: JSON columns use `text(..., {mode:"json"}).$type<T>()` with **`$defaultFn`** for defaults (SQL-expression JSON defaults were fragile). Booleans are `integer(..., {mode:"boolean"})`. Timestamps are ISO text via `strftime('%Y-%m-%dT%H:%M:%fZ','now')` | After any schema change: `npm run db:generate` → review → commit `drizzle/*.sql`. `getDb()` auto-applies migrations and `migrateDb()` ensures the `settings` row (id = 1) |
| G-15 | ℹ️ Fact | `typecheck` needs generated route types first (`LayoutProps`, `RouteContext` are globals from `next typegen`) | `npm run typecheck` = `run-s typegen tsc` |
| G-16 | ℹ️ Fact | The scaffold added a Turbopack CSS rule with `@tailwindcss/turbopack` in `next.config.ts` | Keep it. It is how Tailwind v4 runs under Turbopack in this Next version |
| G-17 | ℹ️ Rule | Prettier ignores `*.md` (docs keep their hand-made tables) and `.env*` | Run `npm run format` before committing code |
| G-18 | ℹ️ Rule | Client code must never import `src/server/**` (the API key and DB live there) | Enforced by ESLint `no-restricted-imports` for `src/components/**` and `src/hooks/**`, and at runtime by `import "server-only"` in `env.ts`, `db/client.ts`, `storage/index.ts`. Type-only imports (`import type`) from route files are OK (erased) |

## 5. Open issues & carry-overs
| ID | Status | Issue | Plan |
|---|---|---|---|
| I-01 | 🔴 Open | `src/app/globals.css` still has shadcn's **neutral oklch** tokens. Harbor tokens (RDD §9.2) not applied yet | P1.1 |
| I-02 | 🔴 Open | Temporary P0 landing page: `src/app/page.tsx` + `src/app/foundation-check.tsx` | Replace in P1.7 (redirect `/` → `/projects` inside the shell). Delete `foundation-check.tsx` and update `tests/e2e/smoke.spec.ts` |
| I-03 | 🔴 Open | `src/components/ui/button.tsx` is the stock shadcn Button (h-8, neutral) | Restyle in P1.3 (sizes, Harbor colours, loading state) |
| I-04 | 🔴 Open | Dockerfile not written yet. Requirements: copy `.next/standalone` + `.next/static` + `public`; `drizzle/` is already traced into standalone ✔; **never** include `.env` (G-07); mount `/app/data` | P9.7 |
| I-05 | 🔴 Open | Unique-constraint violations surface as better-sqlite3 `SqliteError` with message containing `UNIQUE`. They need mapping to HTTP 409 in the API error helper | Build an `apiError()` helper with the first API route in P1.8 / P2.2 |
| I-06 | ℹ️ Note | Sample vendor names (Harborline Systems, Meridian Scan Tech, Nile Gate Solutions, Atlas Port Technologies) are fictional | In P4.1, double-check they don't match real companies. Label everything "Sample" |

## 6. Small decisions made while coding
- **IDs:** `prefix_` + 14 chars from `23456789abcdefghijkmnpqrstuvwxyz` (no look-alikes) via `newId(kind)` in `src/lib/ids.ts`. Prefixes: prj, doc, ven, prp, std, rul, run, stp, req, evl, fnd, cmp, rsk.
- **Shared vocabulary** (statuses, priorities, categories, phases, models, defaults) lives in `src/lib/domain.ts` and is used by the DB schema, zod schemas and the UI. Add new enum values there first.
- **DB access:** app code uses `getDb()` (`src/server/db/client.ts`, a globalThis singleton with lazy migrate). Tests and scripts use `openDb()` + `migrateDb()` from `connect.ts`. Pragmas: WAL, foreign_keys ON, busy_timeout 5000, synchronous NORMAL.
- **Storage:** relative POSIX paths like `projects/<projectId>/<docId>.<ext>`. Segments must match `[A-Za-z0-9_-]{1,64}`, extensions `[a-z0-9]{1,10}`. Writes are atomic (temp file + rename). `stream(path, range)` returns a Web `ReadableStream` for `Response` bodies (supports HTTP Range for pdf.js).
- **Env:** `src/server/env.ts` (zod). Invalid values fail fast with a readable message. A missing key does *not* crash (mock mode works). `/api/health` reports `ai.ready`.
- **Health route:** `GET /api/health` → 200 `{status:"ok"}` or 503 `{status:"degraded"}`, `Cache-Control: no-store`.
- **TanStack Query defaults:** `staleTime 10s`, no refetch on window focus, `retry 1` (`src/app/providers.tsx`).
- **Fonts:** CSS vars `--font-inter`, `--font-jakarta`, `--font-jetbrains`, `--font-plex-arabic`. Tailwind theme maps `font-sans` → Inter + Plex Arabic, `font-heading` → Jakarta + Plex Arabic, `font-mono` → JetBrains Mono.
- `<html lang="en" dir="ltr">` is set explicitly (RTL-ready: flipping `dir` is the future Arabic switch).

## 7. Before you start a task, consider…
- **Next APIs** → read the bundled doc first (G-02). Caching behaviour → G-03.
- **New GET route** → `await connection()` first. Validate input with zod. Return `{ error: { code, message } }` on failure.
- **New fs path code** → G-06 tracing check.
- **New npm script** → no `&&` (G-01).
- **Anything that calls Claude for real** → ask the user first (💳) and log the cost in PROGRESS.md "API spend log". Default is `AI_MODE=mock`.
- **UI work** → Harbor tokens only (no raw hex in components). 4-px spacing scale. Logical properties (`ms-*`/`me-*`/`ps-*`/`pe-*`/`start-*`/`end-*`), never `ml-*`/`mr-*`/`left-*`/`right-*`. Status = icon + label. Respect `prefers-reduced-motion`. Follow the epic-design adaptation in RDD §11.
- **Finishing a subtask** → run `npm run check` (+ `npm run test:e2e` if UI changed). Update PROGRESS.md, commit with the subtask ID in the message.

## 8. Session log
### 2026-10-21 · Session 1: Planning
- Gathered requirements in two question rounds (7 decisions, see PROGRESS decision log). Wrote PRD, RDD, PHASES, PROGRESS, CLAUDE.md.
- Problem: the agent ended a turn after announcing the RDD without writing it (user: "why did u stop again ??"). **Rule:** never end a turn right after announcing a step; do it in the same turn.

### 2026-10-21 · Session 2: Phase 0 (foundation)
- User approved all REC-01…REC-22 and asked for this HANDOFF.md.
- Scaffolded Next 16.4.2 in the scratchpad (repo root not empty, path has spaces), then copied it in. Added shadcn (radix-nova, RTL), Drizzle + SQLite schema (16 tables, migration `drizzle/0000_cold_blue_blade.sql`), env, storage, health route, Vitest (10 tests), Playwright (2 tests).
- Problems hit (all solved, see §4): PowerShell npm shell `&&` (G-01) · Google Fonts timeout → self-hosted fonts (G-05) · next/font needs literals (G-05) · Turbopack tracing whole repo and `data/*.db` (G-06) · empty key in `.env.local` hid the user's `.env` key (G-07) · orphaned `next dev` after TaskStop (G-09) · vitest ESM config (G-12).
- Verified: `npm run build` 0 warnings, `/api/health` is `ƒ` dynamic. The standalone server (`node .next/standalone/server.js`) with an empty `DATA_DIR` auto-migrates and returns health 200.
