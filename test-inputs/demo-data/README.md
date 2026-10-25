# Demo data: the team's app as a snapshot

A copy of a working Mizan app, taken on 2026-10-25, so a fresh clone shows real results without spending anything on AI.

- `app.db`: the SQLite database (projects, standards, vendors, proposals, analyses, reports, AI quality metrics). Migrated forward automatically when the app starts.
- `uploads/`: the stored files (RFPs, standards, proposals) and the rendered report PDFs.

**Load it** (app stopped): `npm run demo:load`; it refuses to overwrite a `data/` that already has projects unless you add `-- --yes`, and then backs that data up first.
**Refresh it** from your own app: `npm run demo:save`, then commit. The owner's name and organisation and the Files API ids of the owner's API key are removed.

What's inside (as saved):

| Project | Analyses |
|---|---|
| PRJ-2026-002 · Electronic Seal Tracking System for Transit Cargo (POC set 2) | a real Claude Haiku run with 2 consultant reports, and an earlier demo-AI run |
| PRJ-2026-003 · Air Quality and Noise Monitoring Network (POC set 3) | a real Claude Haiku run with 3 consultant reports |
| PRJ-2026-001 · High-Energy Cargo X-Ray Inspection Systems | none yet (5 proposals) |

All organisations, people and documents are fictional.
