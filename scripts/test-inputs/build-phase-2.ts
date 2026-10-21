/**
 * Builds Phase 2 test inputs (standards) into test-inputs/phase-2/.
 *   npx tsx scripts/test-inputs/build-phase-2.ts
 * PDFs and the README paste blocks come from the same data (content/standards.ts).
 */
import fs from "node:fs";
import path from "node:path";
import { closeBrowser, htmlToPdf } from "./lib/pdf";
import { pasteBlock, standardHtml, STANDARDS } from "./content/standards";

const OUT = path.join(process.cwd(), "test-inputs", "phase-2");

function readme(): string {
  const [s1, s2, s3] = STANDARDS;
  const block = (s: (typeof STANDARDS)[number], n: number, first: boolean) => `
### ${first ? "★ " : ""}Standard ${n}: ${s.code}${first ? " (test this one first)" : " (optional)"}
1. **Standards → New standard**, then copy-paste:

| Field | Value |
|---|---|
| Code | \`${s.code}\` |
| Title | \`${s.title}\` |
| Category | **${s.category}** |
| Description | \`${s.description}\` |
| Active | On |

2. Click **Create standard**. **Expected:** you land on its page; breadcrumb "Standards › ${s.code}"; toast "${s.code} created".
3. Click **Paste rules** and paste this whole block (${s.rules.length} rules):

\`\`\`text
${pasteBlock(s)}
\`\`\`

   **Expected:** the preview shows ${s.rules.length} rules, 0 errors, then **Add ${s.rules.length} rules**. The header reads "${s.rules.length} rules · ${s.rules.filter((r) => r.priority === "mandatory").length} mandatory · ${s.rules.filter((r) => r.priority === "important").length} important · ${s.rules.filter((r) => r.priority === "desirable").length} desirable".
4. In **Documents**, drop \`standards/${s.file}\`. **Expected:** progress → toast "… uploaded · N pages"; the file appears with **AI-readable**; the ↗ icon opens the PDF in a new tab.
`;

  return `# Phase 2 — Test guide

**App:** http://localhost:3000 · **Format used:** PDF only

Phase 2 delivers the **Standards library** (create standards, add/edit/reorder rules, upload the standard's PDF) and completes **Settings** (AI model, report language, parallel steps, scoring weights with a live example).

> The three standards are fictional but written like real ones. They are **consistent with the Phase 1 RFP pack**: where they cover the same topic they say the same thing, and otherwise they add rules on topics the RFP doesn't regulate. They contain no hints for the AI.

## Files
| File | Pages | Rules |
|---|---|---|
${STANDARDS.map((s) => `| \`standards/${s.file}\` | ~${s.rules.length > 12 ? 4 : 3} | ${s.rules.length} (${s.code}) |`).join("\n")}

## A. Standards — copy-paste values
${block(s1, 1, true)}
${block(s2, 2, false)}
${block(s3, 3, false)}

## B. Standards — behaviours to check
| Try this | Expected |
|---|---|
| Create another standard with code \`${s1.code}\` | Inline error under Code: "${s1.code} is already used by another standard." |
| Code \`9ABC\` or \`AB CD\` | "Use letters, digits, - . _ and start with a letter." |
| Add a rule with the bottom row, leaving Code empty | It gets the next code automatically (e.g. ${s1.rules[0].code.split("-")[0]}-${String(s1.rules.length + 1).padStart(2, "0")}) |
| Paste \`${s1.rules[0].code} | duplicate | M\` into Paste rules | Line flagged: "Code ${s1.rules[0].code} already exists in this standard." Add is disabled |
| Paste \`X-1 | text | urgent\` | "Unknown priority "urgent" …" |
| Click a rule's text | Inline editor opens. Enter saves, Esc cancels, Shift+Enter adds a new line |
| Change a rule's priority pill | Saves instantly; header counts update |
| Drag a rule by its ⋮⋮ handle | Order changes and **stays after reload** |
| Keyboard: Tab to a rule, then Alt+↓ / Alt+↑ | Rule moves down/up |
| ⋯ → Delete on a rule | Toast "Rule … deleted" with **Undo**; Undo restores it in the same place |
| Toggle **Active** off (card or page) | Card dims, "Inactive" filter count +1, notice on the page |
| Search "safety" on the list | Only PESE-03 remains |
| Card ⋯ → Delete standard | Must type the code to enable the button; rules and files are removed |
| Upload \`test-inputs/phase-1/edge-cases/oversized-55MB.pdf\` as a document | Rejected by the browser (55 MB > 50 MB) |
| Upload \`test-inputs/phase-1/rfp-pack/01-RFP-NGPA-T-2026-014.pdf\` to any standard (then delete it) | Shows **13 pages** (page count read from the PDF) |

## C. Settings
**Settings → AI & runtime**
- Select **Claude Sonnet 5.5**, then **Opus 5.5**: the selected card gets a teal border, and "Saved ✓" appears. The sidebar's AI chip shows the model only in live mode; mock mode still shows "Demo AI".
- Report language **العربية**, then back to **English**. Parallel AI steps **3**.

**Settings → Scoring → Live example** (10 sample findings)

| Set this | Expected score |
|---|---|
| Defaults: Mandatory 3 · Important 2 · Desirable 1 · Partial 50% | **66.7%** (14 / 21), "1 mandatory failure: flagged at the gate" |
| Partial credit **0%** | **52.4%** (11 / 21) |
| Partial credit **100%** | **81.0%** (17 / 21) |
| Weights **10 · 1 · 0**, partial 50% | **64.0%** (27.5 / 43) |
| All weights **0** | 0% plus the warning "At least one weight must be above 0…" |
| **Reset to defaults** | Back to 66.7% |

Values save automatically ("Saving…" then "Saved ✓") and persist after reload.
`;
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, "standards"), { recursive: true });
  for (const s of STANDARDS) {
    await htmlToPdf(standardHtml(s), path.join(OUT, "standards", s.file), {
      headerLeft: `${s.code} · ${s.title}`,
      headerRight: s.issuer.split(" · ")[0],
      footerLeft: "SAMPLE — fictional standard created for software testing.",
    });
    console.log(`  ✔ ${s.file} (${s.rules.length} rules)`);
  }
  fs.writeFileSync(path.join(OUT, "README.md"), readme());
  console.log("  ✔ README.md");
  await closeBrowser();
  console.log(`Done → ${OUT}`);
})().catch(async (e) => {
  console.error(e);
  await closeBrowser();
  process.exit(1);
});
