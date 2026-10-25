# Freshly cloned? Start here

This page gets you from `git clone` to a working app with data to test, in about ten minutes. The other docs go deeper (see [Where the knowledge lives](#where-the-knowledge-lives)).

## What this project is

**Mizan** (ميزان, "the scale") is a procurement-evaluation prototype for a ports and customs authority. **Marsa** is its internal codename: the repo, package, database, folders and code use "Marsa"; users only ever see "Mizan".

A tender goes through it like this:

1. **The customer publishes an RFP** (a project): its documents, a category, and the **standards** that apply (rule lists such as an IT-security or environmental standard).
2. **Vendors submit proposals**, each in two envelopes: a **technical** and a **commercial** (financial) proposal.
3. **The AI analysis** (Claude) runs as a pipeline of steps:
   - a checklist of every RFP requirement, with each standard rule as its own point, filed under one of 7 proposal sections;
   - each vendor checked against the standards, then separately against the RFP, every point with a verbatim quote and page as evidence;
   - a risk register per vendor;
   - Mizan computes the scores (RFP %, Standards %, a 0–100 risk score, an overall score), ranks the vendors and picks a recommendation; the AI only explains it;
   - one **consultant report** per vendor: a 2-page PDF written as a senior procurement consultant advising the client.
4. **The results page** has the tabs **Overview · RFP · Standards · Risks · Comparison · Reports · AI quality**. Every point links to the exact sentence in the vendor's PDF and to the RFP clause or standard rule it is about.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · SQLite (better-sqlite3 + Drizzle) · the Anthropic SDK · pdf.js · Playwright's Chromium (PDF reports). The look follows the company's RTA design system (`rta standard/`). The logo is the Sharjah emblem.

## What the clone contains, and what it doesn't

| In git | Not in git (create it yourself) |
|---|---|
| All code, docs, DB migrations (`drizzle/`) | `data/`: the database (`app.db`) and uploaded files. **A fresh clone starts with an empty app**, until you load the demo data (one command, below). |
| `test-inputs/`: documents to test with, and **`test-inputs/demo-data/`**: a snapshot of the team's app with real AI results | `.env`, `.env.local`: your settings and API key |
| `rta standard/`: the design reference | `node_modules/`, build folders (`.next*`) |

To move your own projects to another machine, stop the app and copy the whole `data/` folder (or `npm run demo:save`, see below).

## Setup

**Needs:** Node.js **24 or newer** (`node --version`) and npm. Developed and tested on Windows 11; nothing in it is Windows-specific.

```bash
git config --global core.longpaths true   # Windows only: allows the long test-file names
git clone https://github.com/imposterjump/marsa.git
cd marsa
npm install
npx playwright install chromium   # once: the report PDFs and the E2E tests need it
npm run demo:load                  # optional: the team's projects with real AI results
npm run dev                        # → http://localhost:3000
```

- The database is created and migrated automatically on first start (`data/app.db`).
- The first visit asks for your name (or **Skip for now**).
- No `.env` file is needed to start: the app runs on the **free demo AI**.

## Free demo AI or real AI

| | Demo AI (default) | Live AI |
|---|---|---|
| Setting | `AI_MODE=mock` (or nothing) | `AI_MODE=live` + `ANTHROPIC_API_KEY` |
| Cost | $0 | Real Claude API calls, billed to the API key. The app shows no prices; see the cost table in [`test-inputs/poc-inputs/README.md`](../test-inputs/poc-inputs/README.md) |
| Results | Templates built from the documents' sentences: good for clicking through every screen, not for judging vendors | A real evaluation |

**To switch to live AI:**

1. `cp .env.example .env.local`.
2. In `.env.local`, set `ANTHROPIC_API_KEY=<your key>` and `AI_MODE=live`.
3. Restart the app.
4. In **Settings → AI & runtime → Model**, pick the model. **Use Claude Haiku 5.5 for tests**: a 3-vendor tender costs about $0.11 with reports. Opus costs about 25× more.

Two things to know:
- `.env*` files are gitignored. **Never commit a key.**
- If you keep the key in `.env` instead, delete the empty `ANTHROPIC_API_KEY=` line from `.env.local`. An empty value there overrides the real one.

A run started in demo mode stays demo, and a live run stays live, even if you change `AI_MODE` later.

## Data to test with

### Option 1: the demo data, real results without paying (recommended)
`test-inputs/demo-data/` is a snapshot of the team's app, taken on 2026-10-25. With the app **stopped**:

```bash
npm run demo:load            # into an empty data/ folder
npm run demo:load -- --yes   # replaces data/ that already has projects (it is backed up first)
```

You get exactly what the team sees:

| Project | Status | What's in it |
|---|---|---|
| **PRJ-2026-002** · Electronic Seal Tracking System for Transit Cargo (IT & security) | Evaluated | POC set 2: standard CTS-2026, 2 vendors (Trakom Security Solutions, Orbis Track), a **real Claude Haiku analysis** with its 2 consultant reports, plus an earlier demo-AI analysis |
| **PRJ-2026-003** · Air Quality and Noise Monitoring Network (Safety & environment) | Evaluated | POC set 3: standard PEMS-2026, 3 vendors (Sabkha Environmental Systems, Nimbrel Sensing, Kaltenmoor Messtechnik), a **real Claude Haiku analysis** with its 3 consultant reports |
| **PRJ-2026-001** · High-Energy Cargo X-Ray Inspection Systems (IT & security) | Open | Standard CITS-2026 and 5 vendor proposals, not analysed yet: run it yourself |

The owner's name was taken out of the snapshot, so the welcome dialog asks for yours. Every results page, list view, the comparison and the report PDFs work at once, with no API key. A new analysis still needs the demo AI or a key.

**To refresh the snapshot** from your own app (for the next person who clones): `npm run demo:save`. It copies your `data/` into `test-inputs/demo-data/` without your name and organisation and without the Files API ids of your key; then commit it.

### Option 2: sample data (one click)
**Settings → Demo tools → Load sample data**, or from a terminal (with the app stopped or running):

```bash
npm run seed              # load or reload
npm run seed -- --remove  # remove the sample data only
npm run reset -- --yes    # delete EVERYTHING (projects, standards, vendors, files); settings stay
```

It loads:
- **3 standards:** CITS-2026 (IT security and data residency), PESE-03, PCT-07.
- **"Cargo X-Ray Inspection Systems — Port of Al-Noor (sample)"**: a full RFP pack (PDF, Excel annex, Word contract, a site-plan image, an addendum) and **4 vendor proposals**: Atlas Port Technologies, Nile Gate Solutions, Harborline Systems, Meridian Scan Technologies.
- **"Port Community System — Web Platform and Integration (sample)"**: an RFP with no proposals yet.

Then open the X-Ray project and click **Run AI analysis**. In demo mode it is free and takes about a minute.

The sample data is defined in `test-inputs/seed/manifest.json` and read from `test-inputs/phase-1`, `phase-2` and `phase-4`. Don't delete those folders.

### Option 3: the POC tenders (best for demos and real AI runs)
[`test-inputs/poc-inputs/`](../test-inputs/poc-inputs/README.md) holds **4 complete, mid-size tenders** you create yourself through the guided **New project** form, as a real user would. Each has an RFP (PDF), a standard's 12 rules (Excel, CSV and text), and 2–3 vendors with a technical and a commercial PDF.

| Set | Tender | Vendors |
|---|---|---|
| 1 · rehearsal | Smart Gate Automation (port truck gates) | 2 |
| 2 · meeting | Electronic Seal Tracking for transit cargo | 2 |
| 3 · air quality | Air Quality and Noise Monitoring Network | 3 |
| 4 · customs lab | Laboratory Information Management System | 3 |

Each set's README is a step-by-step script: what to type and drop at each step. It ends with **"What a good result looks like"** (who should win, which gaps the AI should find), so you can judge a live run. Rebuild the files with `npx tsx scripts/test-inputs/build-poc.ts`.

### Option 4: submit bids as a vendor
**Settings → Demo tools → Vendor simulator** submits bids by hand, as a vendor would. (The app used to write bids with AI; that was removed on 2026-10-25.)

### The rest of `test-inputs/`
| Folder | What it is |
|---|---|
| `demo-data/` | The team's app as a snapshot: database and files (Option 1, `npm run demo:load`). |
| `poc-inputs/` | **Start here** to build a tender yourself: the 4 tenders above. |
| `seed/` | The sample-data manifest (Option 2). |
| `phase-1/` … `phase-6/` | Test packs from each build phase, still useful for upload edge cases. Examples: an RFP pack with Excel, Word and image annexes; 21 files for a bulk upload; corrupted, password-protected and Arabic-named files; standards as PDFs; sample bids. Their READMEs describe the screens as they were then, so the files are current but the click paths in them may be outdated. The 55 MB "oversized" file is generated, not committed: `npx tsx scripts/test-inputs/build-phase-1.ts`. |
| `SCENARIO.md` | Notes for humans about the fictional tenders. **Never upload it.** Test documents must never help the AI: an RFP and its standards don't contradict each other, and every vendor proposal reads as a legitimate bid. |

All organisations, people and documents in `test-inputs/` are fictional.

## A short tour
- **English or Arabic:** the **العربية / English** button in the top bar (or Settings → Appearance → Language) switches every screen; Arabic is right-to-left. New analyses are then written in that language too. AI text from earlier runs stays in the language it was written in, and the free demo AI always writes English.
- **Projects:** the welcome band, then every project. **New project** is a guided form: Project (title, category, RFP) → Standards → Vendors.
- **A project:** Overview, Proposals (vendors, documents, **Add vendor**), and **Run AI analysis** with a time estimate. A run starts on click; if you cancel one started by mistake, the page keeps showing the previous results.
- **AI analysis results:** while it runs, mission control shows the step texts and the **agent team** (an AI Orchestrator passing the work from agent to agent); you can leave the page, a pill in the top bar follows the run. Then the tabs:
  - **Overview:** the recommended vendor, then every vendor's RFP %, Standards % and risk score.
  - **RFP, Standards** and **Risks:** by section, or the red **list** view with filters per vendor (status / severity, type, section).
  - **Comparison:** pick vendors and press Compare: the agents' steps play, then a vendor-by-vendor table.
  - **Reports:** View or Download each consultant report as PDF.
  - **AI quality:** the run's numbers and a human review form.
- **No prices on screen:** the app never shows what the AI costs (a deliberate choice). Costs are still recorded in the database for the team.
- Evidence links open the built-in **document reader** on the right page with the quote highlighted. Standard rules open in a side panel.
- **Standards:** the library (rules, priorities, documents).
- **Settings:** your profile, the screen language, the AI model, the report language (English or Arabic), scoring weights, parallel steps, and **Demo tools**.

## Commands
| Command | What it does |
|---|---|
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` + `npm start` | Production build and server |
| `npm run check` | Lint, typecheck, colour-contrast check and the unit/integration tests, including "every screen text has Arabic" (run before every commit) |
| `npm run i18n:scan` | English left in the UI and texts with no Arabic translation |
| `npm run test:e2e` | Playwright end-to-end tests (builds its own server on port 3200, demo AI) |
| `npm run demo:load` / `npm run demo:save` | Load the team's demo data / save yours as the new demo data (see above) |
| `npm run seed` / `npm run reset -- --yes` | Sample data / wipe everything (see above) |
| `npm run db:studio` | Browse the database |
| `npm run ai:smoke` | One tiny **paid** live call (≈ $0.01) to check the key works |

## Where the knowledge lives
| File | Read it for |
|---|---|
| [`CLAUDE.md`](../CLAUDE.md) | The project's working rules (also what Claude Code follows) |
| [`docs/HANDOFF.md`](HANDOFF.md) | **The most useful file after this one:** where the work stands, every known gotcha (`G-xx`) and open issue (`I-xx`), and a session-by-session log of decisions |
| [`docs/PROGRESS.md`](PROGRESS.md) | Phase status, the decision log, API spend |
| [`docs/PRD.md`](PRD.md) | What the product must do |
| [`docs/RDD.md`](RDD.md) | How it is built (architecture, pipeline, data model, UI system) |
| [`docs/PHASES.md`](PHASES.md) | The build plan, subtask by subtask |
| [`src/lib/i18n/README.md`](../src/lib/i18n/README.md) | How the English / Arabic UI works, how to add text, the Arabic glossary |
| [`test-inputs/poc-inputs/README.md`](../test-inputs/poc-inputs/README.md) | The demo tenders and what a live run costs |

**Code map:**
- `src/app/`: pages and API routes.
- `src/components/`: the UI; `analysis/` holds the results page.
- `src/server/`:
  - `ai/`: prompts, schemas, demo engine;
  - `runs/`: the pipeline runner, scores;
  - `reports/`: the consultant PDFs;
  - `db/`, `documents/`, `seed/`, `storage/`.
- `src/lib/`: shared types, labels, the run plan and estimates; `i18n/` holds the Arabic dictionary.
- `scripts/`: demo data, seed, reset, AI checks, test-input builders.
- `tests/`: unit, integration, E2E.

## Troubleshooting
- **Windows: "Filename too long" while cloning:** one upload test file has a deliberately long name (the longest path in the repo is 144 characters), which fails inside a deep folder. Run `git config --global core.longpaths true` and clone again, or clone to a short path such as `C:\dev\marsa`.
- **"PDF rendering needs Chromium"** when viewing or downloading a report: run `npx playwright install chromium`.
- **"Live AI needs an Anthropic API key"**: see [Free demo AI or real AI](#free-demo-ai-or-real-ai). Check that `.env.local` has no empty `ANTHROPIC_API_KEY=` line.
- **The page reloads every second in `npm run dev`** (Windows with Visual Studio open on the folder, HANDOFF G-84): close Visual Studio, or run a production build:
  ```bash
  NEXT_DIST_DIR=.next-design npx next build
  NEXT_DIST_DIR=.next-design npx next start -p 3000
  ```
- **Port 3000 is busy:** `npx next dev -p 3001`.
- **Start over with an empty app:** stop the server and delete the `data/` folder.
