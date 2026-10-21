/**
 * Builds Phase 6 test inputs into test-inputs/phase-6/: three short two-envelope bids
 * (technical + financial PDF) for the second sample tender, NGPA/T/2026/021 Port Community
 * System. They make a cheap live-AI test (1 standard, short RFP, 3 vendors → 11 steps).
 *
 *   npx tsx scripts/test-inputs/build-phase-6.ts
 */
import path from "node:path";
import { PCS } from "./content/pcs-rfp";
import { PCS_BIDS, pcsCommercialHtml, pcsTechnicalHtml } from "./content/pcs-proposals";
import { closeBrowser, htmlToPdf } from "./lib/pdf";

const OUT = path.join(process.cwd(), "test-inputs", "phase-6", "pcs-proposals");

async function main() {
  for (const [i, b] of PCS_BIDS.entries()) {
    const footerLeft = `${b.name} · Proposal for ${PCS.ref} · SAMPLE — fictional bid created for software testing`;
    await htmlToPdf(pcsTechnicalHtml(b), path.join(OUT, `${i + 1}-${b.slug}-Technical.pdf`), {
      headerLeft: `${PCS.ref} · Technical Proposal (Envelope 1)`,
      headerRight: b.legalName,
      footerLeft,
    });
    await htmlToPdf(pcsCommercialHtml(b), path.join(OUT, `${i + 1}-${b.slug}-Commercial.pdf`), {
      headerLeft: `${PCS.ref} · Financial Proposal (Envelope 2)`,
      headerRight: b.legalName,
      footerLeft,
    });
    console.log(`✔ ${b.name}`);
  }
  await closeBrowser();
}

main().catch(async (err) => {
  console.error(err);
  await closeBrowser();
  process.exit(1);
});
