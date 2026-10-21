# Phases 6 + 7: test guide (AI pipeline, live progress, AI-generated proposals)

**App:** http://localhost:3000 · **Format used:** PDF only (generated bids also include a DOCX).
**New files:** `test-inputs/phase-6/pcs-proposals/` contains three short, real-looking bids for the second sample tender (Port Community System, NGPA/T/2026/021):

| # | Vendor | Technical (Envelope 1) | Financial (Envelope 2) |
|---|---|---|---|
| 1 | Qasr Digital Systems | `1-Qasr-Digital-Systems-Technical.pdf` (4 pages) | `1-Qasr-Digital-Systems-Commercial.pdf` (2 pages) |
| 2 | Bluewave Port Software | `2-Bluewave-Port-Software-Technical.pdf` (4 pages) | `2-Bluewave-Port-Software-Commercial.pdf` (2 pages) |
| 3 | Corniche Logistics IT | `3-Corniche-Logistics-IT-Technical.pdf` (4 pages) | `3-Corniche-Logistics-IT-Commercial.pdf` (2 pages) |

The guide has two parts:
- **Part A** uses the free demo AI (`AI_MODE=mock`, the default). It tests every screen and costs $0.
- **Part B** uses real Claude (Opus 5.5) and costs money; the cost of each case is shown below. Do Part A first.

---

## Part A: demo AI (free)

### A1. Analyse the sample tender and watch mission control
1. **Settings** → **Demo tools** → **Load sample data** (or **Reload sample data**) → confirm. Your own projects are not touched.
2. **Projects** → **Cargo X-Ray Inspection Systems — Port of Al-Noor (sample)** → **Proposals** tab.
3. Scroll to the **Analyse & process** panel under the table. **Expected:** 4 proposals, 3 standards, **Steps 14 (3 × 4 + 2)**, Cost **Free (demo AI)**.
4. Click **Analyse & process**. **Expected:** you land on the **Evaluation** tab and see **mission control**:
   - **Ring and step counter:** a progress ring with a percentage, and **Step k of 14**.
   - **Current step:** a large line such as `1/14 · Building the evaluation checklist from your RFP and 3 standards`. It slides in each time the step changes.
   - **Timing:** **Elapsed 0:12 · ~40 s left**, plus "3 running in parallel" during the analyses.
   - **Phase rail:** Checklist · Analysis · Comparison · Risk · Summary. The active phase's name scrambles in and its bar sweeps; finished phases turn solid teal.
   - **Results so far:** one chip per vendor. Each score pops in as soon as that vendor's analysis finishes, for example **Harborline Systems 68.5% compliance**, then a risk badge after its risk step.
   - **Steps:** all 14 steps with status, duration, and a gentle pulse on the running ones.
5. While it runs, click the **Overview** tab. **Expected:** a teal pill **Analysing · 6/14** with a mini ring appears in the top bar, on every page.
6. Wait about 30 seconds. **Expected:** the pill disappears and a toast says **Analysis complete · PRJ-2026-00x** with a **View results** button. Click **View results**.
7. **Expected:** the Evaluation tab now shows:
   - **Header:** **Analysis complete**, the date, **Demo AI (free)** and **14 of 14 steps finished**.
   - **Vendor chips:** score and risk for each vendor.
   - **Ranking:** rank, vendor, compliance %, mandatory fails and risk; the scores count up. Above it, a green **Recommended** box with the executive summary. Below it, **Key constraints from the RFP**.
   - **Steps:** collapsed; click to open.

   *Demo AI scores are templates, so don't judge the quality here.* The project status pill now says **Evaluated**.

### A2. One vendor's results and the evidence links
1. In the ranking, click **›** on **Meridian Scan Technologies**.
2. Click the **Compliance** tab (now unlocked). **Expected:**
   - **Header:** a big weighted compliance %, pills with counts (compliant / partial / non-compliant / not addressed) and "N mandatory not met".
   - **Numbered lists per status:** code, title, priority, the RFP reference, assessment, gap, and the vendor's own sentence as a quote.
3. In the **Non-compliant** list, find a finding whose quote mentions **Cloud**. Click its **Page 4** button. **Expected:** the full-screen reader opens Meridian's technical proposal on page 4, with the sentence highlighted and pulsing. Press **Esc**: you are back on the Compliance tab.
4. Click **Comparison**. **Expected:** price position, a position statement, and numbered advantages / disadvantages against the other vendors.
5. Click **Risk**. **Expected:** the overall risk and a numbered register with severity, L × I, consequence and mitigation.

### A3. Cancel, resume and retry
1. Go back to the **Evaluation** tab and click **Run again**. Mission control appears.
2. Click **Cancel**. **Expected:** **Analysis cancelled**, a **Resume** button, and cancelled steps marked in the list.
3. Click **Resume**. **Expected:** mission control again; the finished steps are not re-run. It ends with **Analysis complete**.

### A4. Generate proposals with AI (demo)
1. **Projects** → **Port Community System — Web Platform and Integration (sample)** → **Proposals** tab. **Expected:** "Waiting for proposals".
2. Click **Generate with AI**. **Expected:** a dialog with four profiles (Strong, Budget, Risky, Incomplete); Strong and Budget are ticked; it says **2 proposals · free (demo AI)**.
3. Also tick **Risky**, then click **Generate 3**. **Expected:**
   - **Progress:** "Generating 1 of 3", each vendor going Writing… → Rendering the DOCX and PDF… → **Submitted**.
   - **Table:** rows appear under the dialog as each bid finishes.
4. Click **Done**. **Expected:** 3 new proposals with vendor names such as Coral Bay Systems or Anchorage Data Works.
5. Click **View** on one. **Expected:** the reader opens the **financial proposal PDF**. Click **Technical** at the top: the **technical proposal DOCX** opens.

---

## Part B: real Claude (Opus 5.5), costs money

Before you start:
1. Stop the dev server (Ctrl + C in its terminal).
2. Open **`.env.local`** in the project folder and change `AI_MODE=mock` to `AI_MODE=live`. Save it.
3. Start the server again: `npm run dev` → http://localhost:3000.
4. **Settings** → **AI & runtime** → **Model**: **Claude Opus 5.5** (the default). The runtime line shows **Live (Anthropic API)**.
5. **Settings** → **Demo tools** → **Reload sample data** → confirm. This removes the demo bids from A4 and restores both sample tenders to "open".

Each live run first shows a confirmation with its estimated cost. **Cancel** stops it at any time; steps that already finished stay saved.

### B1. Cheap live run: PCS tender with the three Phase 6 bids (≈ $2–4 on Opus, ≈ 6–10 min)
Submit the three bids through the vendor portal:
1. **Projects** → **Port Community System — Web Platform and Integration (sample)** → **Proposals** → **Simulate a vendor submission**.
2. Fill in the form, then click **Submit proposal**:

   | Field | Bid 1 | Bid 2 | Bid 3 |
   |---|---|---|---|
   | Vendor | **New vendor** | **New vendor** | **New vendor** |
   | Company name | `Qasr Digital Systems` | `Bluewave Port Software` | `Corniche Logistics IT` |
   | Country | `Northern Gulf State` | `Ireland` | `Egypt` |
   | Contact name | `Hessa Al-Mazrouei` | `Ciaran Doyle` | `Mona Fahmy` |
   | Contact email | `tenders@qasrdigital.example` | `bids@bluewaveport.example` | `tenders@cornichelit.example` |
   | Commercial proposal | `1-Qasr-Digital-Systems-Commercial.pdf` | `2-Bluewave-Port-Software-Commercial.pdf` | `3-Corniche-Logistics-IT-Commercial.pdf` |
   | Technical proposal | `1-Qasr-Digital-Systems-Technical.pdf` | `2-Bluewave-Port-Software-Technical.pdf` | `3-Corniche-Logistics-IT-Technical.pdf` |

   All files are in `test-inputs\phase-6\pcs-proposals\`. After each submission, click **Submit another** (or go back) for the next bid.
3. Back on **Proposals**, the panel shows **3 proposals · Steps 11 (3 × 3 + 2) · Cost ≈ $… · Claude Opus 5.5**. Click **Analyse & process** → **Start analysis**.
4. Watch mission control. The checklist step takes about 1 minute, each analysis about 1.5–3 minutes, and the other steps under a minute.
5. When it finishes, check these things:
   - **Ranking:** Qasr ranks first and is recommended, with 0 mandatory failures. My Sonnet test gave Qasr 96 %, Corniche 70 % and Bluewave 57 %.
   - **Bluewave → Compliance:** hosting is caught. The hosting requirement (RFP §3.1) and the CITS-2026 no-public-cloud rule (SEC-02) are non-compliant: the base offer runs from Bahrain with disaster recovery in Dublin, and the on-premise "Option B" still calls the Bluewave Update Service over the internet. Click the quote's **Page 2** button and check that the sentence is highlighted.
   - **Corniche → Compliance:** 99.5 % availability versus 99.8 %, the customs integration in month 13 versus 10, and severity-1 support at 2 h / 8 h versus 1 h / 4 h. These should be non-compliant or partial.
   - **Cost:** the run header shows the real cost, for example `claude-opus-5-5 · $2.71`.

### B2. Full live run: X-ray sample tender, 4 vendors (≈ $7–10 on Opus, ≈ 20–30 min)
1. **Projects** → **Cargo X-Ray Inspection Systems — Port of Al-Noor (sample)** → **Proposals** → **Analyse & process** → **Start analysis**.
2. Things to check (my Sonnet test results are in brackets):
   - **Ranking:** Harborline first [91.6 %, recommended with conditions], then Meridian [74.9 %], Nile Gate [70.8 %] and Atlas [49.4 %].
   - **Meridian → Compliance:** the on-premise licensing / telemetry / updates requirement is non-compliant. The quote is "The gateway synchronises licence entitlements with Meridian's licensing service…", and **Page 4** opens it highlighted.
   - **The executive summary** mentions Meridian's on-premise / data-residency breach.
3. While it runs, open another page and come back: the top-bar pill and the completion toast work as in Part A.

### B3. Generate 2 proposals with Claude (≈ $0.4 on Opus, ≈ 3–4 min)
1. This needs an **open** tender. If B1 already evaluated the PCS tender, **Settings → Demo tools → Reload sample data** first.
2. PCS tender → **Proposals** → **Generate with AI** → keep **Strong** and tick **Risky** (untick Budget) → **Generate 2**.
3. **Expected:** about 1–2 minutes per bid; the dialog shows the cost.
4. **View** a bid: it should read like a real proposal, with the tender's clause references, concrete numbers and prices, and its own terms.
5. The **Risky** bid presents a vendor-hosted service as a benefit (for example licence activation or telemetry). An analysis should then flag it.

### Your own project
PRJ-2026-001 (IT & security, 4 vendors, CITS-2026) can be analysed the same way, from its **Proposals** tab.

---

**Switch back to free mode** when you are done: set `AI_MODE=mock` in `.env.local` and restart.
