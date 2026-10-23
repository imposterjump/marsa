# POC inputs: two small tenders for the meeting demo

Two complete, mid-size tenders that show the whole Marsa workflow in a few minutes.

**Each set contains:**
- one standard: 12 rules as an Excel file to drop, plus the same rules as CSV and text;
- one RFP (PDF);
- two vendors, each with a **technical** and a **commercial** (financial) proposal (PDF). Both follow Marsa's 7-section proposal template.

| Set | Use it | Tender | Standard | Vendors |
|---|---|---|---|---|
| [`1-rehearsal-smart-gates/`](1-rehearsal-smart-gates/README.md) | **Before the meeting**, to practise | NGPA/T/2026/031 · Smart Gate Automation for the Terminal 2 truck gates (Port of Al-Noor) | POTS-2026 · Port Operational Technology Standard | Sahel Gate Technologies, Vector OCR Systems |
| [`2-meeting-e-seals/`](2-meeting-e-seals/README.md) | **In the meeting** | GCD/T/2026/047 · Electronic Seal Tracking System for Transit Cargo (General Customs Directorate) | CTS-2026 · Customs Transit Security Standard | Trakom Security Solutions, Orbis Track |

**The two sets have the same shape**, so the rehearsal shows exactly what will happen in the meeting:
- 1 standard + 1 RFP + 2 vendors → **8 AI steps**:
  - 1 checklist;
  - 2 standards checks;
  - 2 RFP checks;
  - 2 risk registers;
  - 1 recommendation.
- The RFP is 4–5 pages, each technical proposal 4 pages (sections 1–5), and each commercial proposal 2 pages (sections 6–7).
- One vendor is strong with a few small gaps. The other is cheaper but breaks several mandatory rules: it uses a foreign cloud, misses performance figures, gives a shorter warranty or a slower service, and uses a foreign bank guarantee.

All organisations, people and documents are fictional. Nothing in the vendor documents points the AI at the answers: each vendor describes its own offer, like a real bid.

## Cost and time of a live run (from Marsa's own estimate)

| Model | Rehearsal set | Meeting set | Time per run |
|---|---|---|---|
| Claude Haiku 5.5 | ≈ $0.03 | ≈ $0.03 | ≈ 2 min |
| Claude Sonnet 5.5 | ≈ $0.66 ($0.52–0.82) | ≈ $0.59 ($0.47–0.74) | ≈ 3 min |
| Claude Opus 5.5 | ≈ $1.45 | ≈ $1.31 | ≈ 5 min |

**With about $1 of credit left, run on Haiku.** One Sonnet run would use most of what is left. Before each run, the confirmation dialog shows the estimate again.

The free demo AI (`AI_MODE=mock`, the default on http://localhost:3000) runs the same screens at $0, but its results are templates. Use it to practise the clicks, not to judge the results.

## Where to run it
- **Free demo AI:** `npm run dev`, then http://localhost:3000.
- **Live AI:** set `AI_MODE=live` in `.env.local` and run `npm run dev`. Choose the model in **Settings → AI & runtime → Model**.
- **Rehearsal and meeting on the same server:** fine. In the meeting project's **Standards** step, keep only **CTS-2026** ticked. Each set's README says this at the right step.

## The workflow you show (same steps in both sets)
1. **Projects → New project**, a guided form in three steps:
   1. **Project:** title, category, and the RFP dropped in.
   2. **Standards:** the standards of that category. **New standard** creates one on the spot from the dropped Excel rules file. Skippable.
   3. **Vendors:** each vendor with two drop zones, commercial and technical. Skippable. Vendors can also be added later.
2. **Create project**, then **Run AI analysis**. The **AI analysis results** page opens with the sidebar folded away, and mission control shows the 8 steps live.
3. **Results:**
   - **Overview:** the recommended vendor and the AI's reason; Standards %, RFP % and the 0–100 risk score; one row per vendor for each.
   - **Compliance:** one card per proposal section ("Section 3 · Security and data"). Each card has every vendor's Standards % and RFP %, and a dropdown of the points with evidence.
   - **Risks:** each vendor's risk score, then each section's risks per vendor.
   - **Comparison:** tick two vendors and **Compare**. Charts, then only the points where they differ.
   - **AI quality:** run quality and a human review form.

**Rebuild the files:** `npx tsx scripts/test-inputs/build-poc.ts` (the content is in `scripts/test-inputs/content/poc-*.ts`).
