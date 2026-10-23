# Marsa — project guide for Claude

> **Naming (2026-10-23):** users see the product as **Mizan** (ميزان, "the scale"). **Marsa** is only the internal codename: the repo, package, database, folders, docs and code comments keep it. Never rename code, tables or files to Mizan. The displayed name comes from `APP_NAME` in `src/lib/brand.ts`; the settings row still stores "Marsa" and is ignored (HANDOFF G-85). Logo: the Sharjah emblem (`public/brand/sharjah-emblem.png`), not the RTA logo.

Marsa is a ports & customs procurement-evaluation prototype: customers publish RFPs, vendors submit commercial and technical proposals, and Claude scores compliance, compares vendors, and builds risk registers.

@AGENTS.md

## Start every session here (in this order)
1. **`docs/HANDOFF.md`**: environment quirks, gotchas (G-xx), open issues (I-xx), where the last session stopped. Read all of it.
2. `docs/PROGRESS.md`: subtask status, what's waiting on the user, API spend.
3. As needed: `docs/PHASES.md` (subtasks + "Done when"), `docs/RDD.md` (technical design), `docs/PRD.md` (requirements).

## End every session
- Update `docs/HANDOFF.md` (§1 where we are, new gotchas and issues, a session log entry) and `docs/PROGRESS.md` (subtask status, decisions, API spend).
- Run `npm run check` (and `npm run test:e2e` after UI changes), then commit with the subtask ID in the message.

## The user's standing rules (details: HANDOFF §0)
- **End every phase** by starting the app (`npm run dev` → http://localhost:3000), then giving the localhost link and a bullet list of what's done for the user to test.
- **Every phase generates deep, production-like test inputs** in `test-inputs/phase-N/` with a README test guide.
- **Test documents never help the AI.** RFP and standards must not contradict each other. Vendor proposals must be legitimate bids. Reference notes for humans go in `test-inputs/SCENARIO.md` (never uploaded).

## Working rules
- Work subtask by subtask (`P{phase}.{n}`). A subtask is done only when its "Done when" test passes.
- Stop at 🧑 checkpoints for user review. Ask before any 💳 step that spends Claude API credits.
- Default `AI_MODE=mock`. The API key lives in `.env` (user's file) and is never printed or read in client code.
- Next.js here is 16.4, newer than training data: read `node_modules/next/dist/docs/` before using Next APIs.
- Skills to apply (in `claude/skills/`): `epic-design` (adapted per RDD §11: no scroll-jacking on data screens), `senior-frontend`, `senior-backend`, `senior-architect`, `code-reviewer`.
- UI follows the Harbor tokens in RDD §9: 4-px spacing scale, logical CSS properties (RTL-ready), status = icon + label, `prefers-reduced-motion` respected.
