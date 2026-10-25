# POC inputs: small tenders for the meeting demo

Four complete, mid-size tenders that show the whole Mizan workflow in a few minutes.

**Each set contains:**
- one standard: 12 rules as an Excel file to drop, plus the same rules as CSV and text;
- one RFP (PDF);
- two vendors (three in sets 3 and 4), each with a **technical** and a **commercial** (financial) proposal (PDF). All follow Mizan's 7-section proposal template.

| Set | Use it | Tender | Standard | Vendors |
|---|---|---|---|---|
| [`1-rehearsal-smart-gates/`](1-rehearsal-smart-gates/README.md) | **Before the meeting**, to practise | NGPA/T/2026/031 · Smart Gate Automation for the Terminal 2 truck gates (Port of Al-Noor) | POTS-2026 · Port Operational Technology Standard | Sahel Gate Technologies, Vector OCR Systems |
| [`2-meeting-e-seals/`](2-meeting-e-seals/README.md) | **In the meeting** | GCD/T/2026/047 · Electronic Seal Tracking System for Transit Cargo (General Customs Directorate) | CTS-2026 · Customs Transit Security Standard | Trakom Security Solutions, Orbis Track |
| [`3-three-vendors-air-quality/`](3-three-vendors-air-quality/README.md) | **Three vendors**, category Safety & environment | NGPA/T/2026/052 · Air Quality and Noise Monitoring Network (Port of Al-Noor) | PEMS-2026 · Port Environmental Monitoring Standard | Sabkha Environmental Systems, Nimbrel Sensing, Kaltenmoor Messtechnik |
| [`4-three-vendors-customs-lab/`](4-three-vendors-customs-lab/README.md) | **Three vendors**, category Quality | GCD/T/2026/061 · Laboratory Information Management System (Central Customs Laboratory) | CLQS-2026 · Customs Laboratory Quality Standard | Qalamra Lab Systems, Veridane Informatics, Corvantis Business Software |

**Sets 1 and 2 have the same shape**, so the rehearsal shows exactly what will happen in the meeting. Sets 3 and 4 have three vendors (14 steps).
- 1 standard + 1 RFP + 2 vendors → **10 AI steps**:
  - 1 checklist;
  - 2 standards checks;
  - 2 RFP checks;
  - 2 risk registers;
  - 1 recommendation;
  - 2 consultant reports (one 2-page PDF per vendor).
- The RFP is 4–5 pages, each technical proposal 4 pages (sections 1–5), and each commercial proposal 2 pages (sections 6–7).
- One vendor is strong with a few small gaps. The other is cheaper but breaks several mandatory rules: it uses a foreign cloud, misses performance figures, gives a shorter warranty or a slower service, and uses a foreign bank guarantee.

All organisations, people and documents are fictional. Nothing in the vendor documents points the AI at the answers: each vendor describes its own offer, like a real bid.

## Cost and time of a live run (from Mizan's own estimate)

| Model | Set 1 (rehearsal) | Set 2 (meeting) | Sets 3 and 4 (3 vendors) |
|---|---|---|---|
| Claude Haiku 5.5 | ≈ $0.08 | ≈ $0.07 | ≈ $0.11 (real run on set 3: $0.12) |
| Claude Sonnet 5.5 | ≈ $0.94 | ≈ $0.86 | ≈ $1.33 |
| Claude Opus 5.5 | ≈ $2.07 | ≈ $1.90 | ≈ $2.92 |

The consultant reports are about a quarter to a third of each figure (real set 3 on Haiku: $0.09 for the evaluation, $0.03 for the 3 reports). A run takes 4–7 minutes. **With about $6 of credit: test on Haiku, then run Opus once** when everything is ready. Before each run, the confirmation dialog shows the estimate again. The Haiku figures are calibrated on a real run (it writes about twice as much as Sonnet).

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
2. **Create project**, then **Run AI analysis**. The **AI analysis results** page opens with the sidebar folded away, and mission control shows the 10 steps live.
3. **Results** (tabs **Overview · RFP · Standards · Risks · Comparison · Reports · AI quality**):
   - **Overview:** the recommended vendor as a featured card (overall score, lead over the runner-up, the AI's reason and strengths), then every vendor's RFP %, Standards % and 0–100 risk score in rings. A section title opens its tab.
   - **RFP** and **Standards:** one card per vendor (only the first open). **By section** shows each proposal section's score and its points; the red **Point list** shows every point of the vendor, worst first, with Status / Type / Section dropdowns.
   - **Risks:** the same two views: risks per section, or the **Risk list** with Severity / Type / Section dropdowns.
   - **Comparison:** tick two or more vendors and **Compare**: one column per vendor, one row per aspect, the best value marked; a section row opens the points where they differ.
   - **Reports:** one consultant report per vendor (verdict, technical and commercial assessment, concerns, recommendation), **View** or **Download PDF**.
   - **AI quality:** the run's summary line, run quality and a human review form.

**Rebuild the files:** `npx tsx scripts/test-inputs/build-poc.ts` (the content is in `scripts/test-inputs/content/poc-*.ts`).
