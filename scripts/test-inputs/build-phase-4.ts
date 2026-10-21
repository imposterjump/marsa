/**
 * Builds Phase 4 test inputs into test-inputs/:
 *   - phase-4/proposals/: one commercial (financial) PDF and one technical PDF per vendor,
 *     in the RFP's form structure (F-1 … F-6);
 *   - phase-4/sample-pcs/: the short RFP of the second sample tender;
 *   - seed/manifest.json: what `npm run seed` / Settings → Demo tools load (the server reads the
 *     files listed here from test-inputs/, so the seed and the test inputs never drift apart).
 *
 *   npx tsx scripts/test-inputs/build-phase-4.ts
 */
import fs from "node:fs";
import path from "node:path";
import { TENDER } from "./content/rfp";
import { PCS, pcsRfpHtml } from "./content/pcs-rfp";
import { commercialHtml, technicalHtml, totals, usd, VENDORS } from "./content/proposals";
import { STANDARDS } from "./content/standards";
import { closeBrowser, htmlToPdf } from "./lib/pdf";

const ROOT = path.join(process.cwd(), "test-inputs");
const OUT = path.join(ROOT, "phase-4");

export const proposalFile = (i: number, slug: string, kind: "Commercial" | "Technical") =>
  `${i + 1}-${slug}-${kind}.pdf`;
const PCS_FILE = "PCS-RFP-NGPA-T-2026-021.pdf";

async function main() {
  fs.mkdirSync(path.join(OUT, "proposals"), { recursive: true });
  for (const [i, v] of VENDORS.entries()) {
    const footer = `${v.name} · Proposal for ${TENDER.ref} · SAMPLE — fictional bid created for software testing`;
    await htmlToPdf(
      technicalHtml(v),
      path.join(OUT, "proposals", proposalFile(i, v.slug, "Technical")),
      {
        headerLeft: `${TENDER.ref} · Technical Proposal (Envelope 1)`,
        headerRight: v.legalName,
        footerLeft: footer,
      },
    );
    await htmlToPdf(
      commercialHtml(v),
      path.join(OUT, "proposals", proposalFile(i, v.slug, "Commercial")),
      {
        headerLeft: `${TENDER.ref} · Financial Proposal (Envelope 2)`,
        headerRight: v.legalName,
        footerLeft: footer,
      },
    );
    const t = totals(v);
    console.log(
      `✓ ${v.name.padEnd(28)} CAPEX ${usd(t.capex).padStart(11)}  CMC ${usd(t.cmc).padStart(10)}  total ${usd(t.evaluated)}`,
    );
  }

  fs.mkdirSync(path.join(OUT, "sample-pcs"), { recursive: true });
  await htmlToPdf(pcsRfpHtml(), path.join(OUT, "sample-pcs", PCS_FILE), {
    headerLeft: `${PCS.ref} · Request for Proposal`,
    headerRight: "Northern Gulf Ports Authority",
  });
  console.log("✓ PCS RFP");
  await closeBrowser();

  // Seed manifest: paths are relative to test-inputs/.
  const pack = "phase-1/rfp-pack";
  const manifest = {
    version: 1,
    standards: STANDARDS.map((s) => ({
      code: s.code,
      title: s.title,
      category: s.category,
      description: s.description,
      file: `phase-2/standards/${s.file}`,
      rules: s.rules.map((r) => ({ code: r.code, text: r.text, priority: r.priority })),
    })),
    projects: [
      {
        key: "xray",
        name: "Cargo X-Ray Inspection Systems — Port of Al-Noor (sample)",
        description:
          "Supply, installation, commissioning and 5-year maintenance of four high-energy drive-through cargo X-ray inspection systems (T1 Gate A, T1 Gate B, T2 and one relocatable unit) with a central image analysis centre. Tender NGPA/T/2026/014.",
        category: "equipment",
        deadlineInDays: 45,
        standards: ["CITS-2026", "PESE-03", "PCT-07"],
        rfp: [
          `${pack}/01-RFP-NGPA-T-2026-014.pdf`,
          `${pack}/05-Addendum-No-1.pdf`,
          `${pack}/03-Annex-B-Technical-Specifications.xlsx`,
          `${pack}/04-Annex-C-Draft-Contract.docx`,
          `${pack}/02-Annex-A-2-T2-Site-Plan.png`,
        ],
        proposals: VENDORS.map((v, i) => ({
          vendor: {
            name: v.name,
            country: v.country,
            contactName: v.contact.name,
            contactEmail: v.contact.email,
          },
          // Oldest first, a few days apart, all before "now".
          submittedHoursAgo: [218, 121, 74, 50][i],
          commercial: [`phase-4/proposals/${proposalFile(i, v.slug, "Commercial")}`],
          technical: [`phase-4/proposals/${proposalFile(i, v.slug, "Technical")}`],
        })),
      },
      {
        key: "pcs",
        name: "Port Community System — Web Platform and Integration (sample)",
        description:
          "Web portal, messaging hub and integrations (TOS, customs, Maritime Single Window, ERP) for the Port of Al-Noor community, with a truck appointment system and 3 years of support. Tender NGPA/T/2026/021.",
        category: "software",
        deadlineInDays: 86,
        standards: ["CITS-2026", "PCT-07"],
        rfp: [`phase-4/sample-pcs/${PCS_FILE}`],
        proposals: [],
      },
    ],
  };
  fs.mkdirSync(path.join(ROOT, "seed"), { recursive: true });
  fs.writeFileSync(
    path.join(ROOT, "seed", "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log("✓ seed/manifest.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
