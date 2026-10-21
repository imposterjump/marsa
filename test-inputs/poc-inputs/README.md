# POC inputs: two small tenders for the meeting demo

Two complete, mid-size tenders that show the whole Marsa workflow in a few minutes.

**Each set contains:**
- one standard (12 rules to paste);
- one RFP (PDF);
- two vendors, each with a **technical** and a **commercial** (financial) proposal (PDF).

| Set | Use it | Tender | Standard | Vendors |
|---|---|---|---|---|
| [`1-rehearsal-smart-gates/`](1-rehearsal-smart-gates/README.md) | **Before the meeting**, to practise | NGPA/T/2026/031 · Smart Gate Automation for the Terminal 2 truck gates (Port of Al-Noor) | POTS-2026 · Port Operational Technology Standard | Sahel Gate Technologies, Vector OCR Systems |
| [`2-meeting-e-seals/`](2-meeting-e-seals/README.md) | **In the meeting** | GCD/T/2026/047 · Electronic Seal Tracking System for Transit Cargo (General Customs Directorate) | CTS-2026 · Customs Transit Security Standard | Trakom Security Solutions, Orbis Track |

**The two sets have the same shape**, so the rehearsal shows exactly what will happen in the meeting:
- 1 standard + 1 RFP + 2 vendors → **8 AI steps** (1 checklist, 2 analyses, 2 comparisons, 2 risk registers, 1 summary);
- the RFP is 4–5 pages, each technical proposal 4 pages, each commercial proposal 2 pages;
- one vendor is strong with a few small gaps. The other is cheaper but breaks several mandatory rules: it uses a foreign cloud, misses performance figures, gives a shorter warranty or a slower service, and uses a foreign bank guarantee.

All organisations, people and documents are fictional. Nothing in the vendor documents points the AI at the answers: each vendor describes its own offer, like a real bid.

## Cost and time of a live run (from Marsa's own estimate)

| Model | Rehearsal set | Meeting set | Time per run |
|---|---|---|---|
| Claude Haiku 5.5 | ≈ $0.04 | ≈ $0.04 | ≈ 2.5 min |
| Claude Sonnet 5.5 | ≈ $0.81 ($0.64–1.01) | ≈ $0.73 ($0.58–0.91) | ≈ 3.5 min |
| Claude Opus 5.5 | ≈ $1.79 | ≈ $1.62 | ≈ 6 min |

With about $1.50 of credit left, **rehearse on Haiku and run the meeting on Haiku or Sonnet**. One Sonnet run fits; two do not, and Opus does not fit at all. Before each run, the confirmation dialog shows the estimate again. The Sonnet estimate is calibrated on a real run. Haiku has no real run yet, so treat its estimate as a rough figure.

The free demo AI (`AI_MODE=mock`, the default on http://localhost:3000) runs the same screens at $0, but its results are templates. Use it to practise the clicks, not to judge the results.

## Where to run it
- **Live AI:** right now http://localhost:3001 runs with real Claude (Haiku selected). It also holds the big Cargo X-Ray example with the real Sonnet results, so you can show both on the same screen.
  - **To start live mode yourself:** set `AI_MODE=live` in `.env.local`, then run `npm run dev`.
  - **Choose the model** in **Settings → AI & runtime → Model**.
- **Rehearsal and meeting on the same server:** fine. In the meeting project's **Standards** step, click **None** and tick only **CTS-2026**. Each set's README says this at the right step.

## The workflow you show (same steps in both sets)
1. **Standards:** create the standard and paste its 12 rules.
2. **Projects → New project:** details, upload the RFP, pick the standard, publish to vendors.
3. **Proposals → Simulate a vendor submission:** submit the 2 vendors, each with a commercial and a technical PDF.
4. **Analyse & process:** mission control shows the 8 steps live (`1/8 · Building the evaluation checklist…`).
5. **Results:**
   - **Ranking:** with a recommendation.
   - **Vendor results:** per vendor, the **Compliance** lists, each finding with the vendor's own sentence (click **Page N** to open it highlighted) and what it **Breaks** (RFP clause or standard rule, clickable).
   - **Comparison** and **Risk** tabs.
   - **AI review** tab: run quality and a human review form.

**Rebuild the files:** `npx tsx scripts/test-inputs/build-poc.ts` (the content is in `scripts/test-inputs/content/poc-*.ts`).
