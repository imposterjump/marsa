/**
 * Annex C — Draft Contract (Word), FIDIC-style: General Conditions + Special Conditions that
 * explicitly amend them (GC 1.3), e.g. SC 7.1 delay damages, SC 9.2 IT-hardware warranty.
 */
import fs from "node:fs";
import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { TENDER } from "./rfp";

const NAVY = "13304D";

const h1 = (text: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, color: NAVY, bold: true, size: 30 })],
  });
const h2 = (text: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, color: NAVY, bold: true, size: 24 })],
  });
const p = (text: string, opts: { bold?: boolean; italic?: boolean } = {}) =>
  new Paragraph({
    spacing: { after: 100 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 20, ...opts })],
  });
/** Numbered clause: "GC 7.1  text" */
const cl = (no: string, text: string) =>
  new Paragraph({
    spacing: { after: 100 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 720, hanging: 720 },
    children: [
      new TextRun({ text: `${no}\t`, bold: true, size: 20, color: NAVY }),
      new TextRun({ text, size: 20 }),
    ],
  });

function table(head: string[], rows: string[][], widths: number[]) {
  const cell = (text: string, header = false, width = 0) =>
    new TableCell({
      width: { size: width, type: WidthType.PERCENTAGE },
      shading: header ? { type: ShadingType.CLEAR, color: "auto", fill: NAVY } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text, size: 18, bold: header, color: header ? "FFFFFF" : "1B2733" }),
          ],
        }),
      ],
    });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, true, widths[i])) }),
      ...rows.map((r) => new TableRow({ children: r.map((v, i) => cell(v, false, widths[i])) })),
    ],
  });
}

export async function buildAnnexC(outFile: string) {
  const children = [
    new Paragraph({
      children: [new TextRun({ text: `ANNEX C · ${TENDER.ref}`, size: 18, color: "5C6774" })],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: "Draft Contract", bold: true, size: 44, color: NAVY })],
    }),
    p(
      `${TENDER.title}, ${TENDER.port}. Between the ${TENDER.authority} (the "Employer") and the successful Bidder (the "Contractor").`,
    ),
    p("SAMPLE / FICTIONAL DOCUMENT created for software testing. Not a real contract.", {
      italic: true,
    }),

    h1("Part A — General Conditions (GC)"),
    h2("GC 1  Definitions and interpretation"),
    cl(
      "GC 1.1",
      "Capitalised terms have the meaning given in the RFP (§1.4) unless defined otherwise here.",
    ),
    cl("GC 1.2", "Headings are for convenience only. The singular includes the plural."),
    cl(
      "GC 1.3",
      "The Special Conditions (Part B) prevail over these General Conditions. Where a Special Condition amends a General Condition, only the amended provision applies.",
    ),
    h2("GC 2  Contract documents"),
    cl(
      "GC 2.1",
      "The Contract comprises, in order of priority: the Contract Agreement; the Special Conditions; these General Conditions; the Appendices; the Technical Specifications (Annex B as amended by Addenda); the Contractor's Proposal as clarified during evaluation.",
    ),
    cl(
      "GC 2.2",
      "Any general terms and conditions of the Contractor (including those printed on quotations, datasheets or invoices) are excluded and have no effect.",
    ),
    h2("GC 4  Contract price and taxes"),
    cl(
      "GC 4.1",
      "The Contract Price is DDP site (Incoterms 2020) and includes freight, insurance, import duties and all taxes except VAT. The Employer will not issue customs duty exemption certificates.",
    ),
    cl(
      "GC 4.2",
      "CAPEX prices are firm and not subject to adjustment. CMC prices are subject to GC 18.",
    ),
    h2("GC 5  Payment"),
    cl(
      "GC 5.1",
      "Payments are made per the milestones in Appendix 1 within 45 days of receipt of a correct invoice and supporting certificates.",
    ),
    cl(
      "GC 5.2",
      "The advance payment is made only against an Advance Payment Guarantee of the same amount issued or confirmed by a bank licensed in the State, reducing pro rata with deliveries.",
    ),
    cl(
      "GC 5.3",
      "The Employer may withhold payment of amounts disputed in good faith and set off delay damages and availability penalties.",
    ),
    h2("GC 6  Securities"),
    cl(
      "GC 6.1",
      "Within 28 days of signature the Contractor shall provide a Performance Security of 10% of the Contract Price, valid until 28 days after the last FAC.",
    ),
    h2("GC 7  Time for completion and delay damages"),
    cl("GC 7.1", "Time for completion is 9 months from the Effective Date (RFP §5.1.1)."),
    cl(
      "GC 7.2",
      "For each day of delay the Contractor shall pay delay damages of 0.05% of the price of the delayed system, up to a maximum of 5% of the Contract Price.",
    ),
    cl(
      "GC 7.3",
      "When maximum delay damages are reached, the Employer may terminate for default under GC 15.",
    ),
    h2("GC 8  Acceptance"),
    cl(
      "GC 8.1",
      "FAT, SAT, trial operation, PAC and FAC follow RFP §5.2. PAC is issued per system. FAC is issued 12 months after PAC if all defects are remedied.",
    ),
    h2("GC 9  Warranty"),
    cl(
      "GC 9.1",
      "The Contractor warrants each system for 24 months from its PAC. The warranty covers all parts, labour and travel, including the X-ray source (linear accelerator) and detector arrays, which are not consumables.",
    ),
    cl(
      "GC 9.2",
      "Defects shall be remedied within 72 hours of notification. The warranty period of a system is extended by every period during which it is unavailable for more than 72 consecutive hours due to a defect.",
    ),
    h2("GC 10  Limitation of liability"),
    cl(
      "GC 10.1",
      "The Contractor's aggregate liability under the Contract is limited to 100% of the Contract Price. Neither party is liable for indirect or consequential loss.",
    ),
    h2("GC 11  Intellectual property and software escrow"),
    cl(
      "GC 11.1",
      "The Contractor grants the Employer a perpetual, irrevocable licence to use all software supplied for the purpose of the Contract, for all systems and users, without additional fees.",
    ),
    cl(
      "GC 11.2",
      "The source code of the image management and analysis software, with build instructions, shall be deposited with an escrow agent acceptable to the Employer and updated with every release. Release events: insolvency, discontinuation of the product, or failure to provide support for 30 days after notice.",
    ),
    h2("GC 12  Data ownership and confidentiality"),
    cl(
      "GC 12.1",
      "All scan images, metadata, analyst annotations and derived data are the exclusive property of the Employer.",
    ),
    cl(
      "GC 12.2",
      "AI models, or improvements to models, trained or fine-tuned using the Employer's data are the Employer's property and shall not be used outside the Customs Data Center without the Employer's prior written consent. Breach is a material breach of the Contract.",
    ),
    h2("GC 13  Insurance"),
    cl(
      "GC 13.1",
      "The Contractor shall insure the Works until PAC and maintain third-party liability insurance of at least USD 5,000,000 per occurrence.",
    ),
    h2("GC 14  Force majeure"),
    cl(
      "GC 14.1",
      "Neither party is liable for failure caused by force majeure notified within 14 days. Supply-chain shortages of components are not force majeure.",
    ),
    h2("GC 15  Termination"),
    cl(
      "GC 15.1",
      "The Employer may terminate for the Contractor's default after 30 days' notice to remedy, and for convenience with 90 days' notice against payment for work performed.",
    ),
    h2("GC 16  Disputes and governing law"),
    cl(
      "GC 16.1",
      "Disputes are first referred to senior management for 30 days, then to arbitration seated in the capital under the rules of the National Arbitration Centre, in English. The Contract is governed by the laws of the State.",
    ),
    h2("GC 18  Comprehensive Maintenance Contract (CMC)"),
    cl(
      "GC 18.1",
      "The CMC runs for 5 years from the end of the warranty of each system and is priced per year in Appendix 2.",
    ),
    cl(
      "GC 18.2",
      "CMC prices may be escalated annually by the lower of the national CPI change and 3%.",
    ),
    cl("GC 18.3", "Availability penalties under Appendix 3 apply during the warranty and the CMC."),
    new Paragraph({ children: [new PageBreak()] }),

    h1("Part B — Special Conditions (SC)"),
    p("The following provisions amend the General Conditions (GC 1.3)."),
    table(
      ["SC", "Amends", "Provision"],
      [
        [
          "SC 5.1",
          "GC 5.1",
          "Payment milestones are those of Appendix 1 (10% / 60% / 20% / 10%). No other payment terms are accepted.",
        ],
        [
          "SC 7.1",
          "GC 7.2",
          "Delay damages are 0.1% of the price of the delayed system per day, up to a maximum of 10% of the Contract Price.",
        ],
        [
          "SC 7.2",
          "GC 7.1",
          "Milestone: T1 Gate A system in trial operation by the end of month 6. Delay damages at 0.05% per day apply to this milestone (counted toward the 10% cap).",
        ],
        [
          "SC 9.2",
          "GC 9.1",
          "Workstations, servers, storage and network equipment: warranty of 36 months from PAC (instead of 24 months).",
        ],
        [
          "SC 10.1",
          "GC 10.1",
          "The liability cap does not apply to: breach of confidentiality or data protection (GC 12), infringement of third-party intellectual property, gross negligence or wilful misconduct.",
        ],
        [
          "SC 18.2",
          "GC 18.2",
          "CMC year 1 price is firm as bid. Escalation for years 2–5 is capped at 3% per year regardless of CPI.",
        ],
        [
          "SC 18.4",
          "GC 18",
          "The CMC includes one complete replacement of the X-ray source per system during the 5-year CMC, if required to maintain specified performance.",
        ],
      ],
      [10, 12, 78],
    ),
    new Paragraph({ children: [new PageBreak()] }),

    h1("Appendix 1 — Payment milestones"),
    table(
      ["Milestone", "%", "Trigger", "Conditions"],
      [
        ["Advance", "10%", "Contract effectiveness", "Against Advance Payment Guarantee (GC 5.2)"],
        [
          "Delivery",
          "60%",
          "Delivery of each system to site (pro rata to system price)",
          "Signed delivery note and inspection report",
        ],
        ["Provisional acceptance", "20%", "PAC of each system", "PAC certificate"],
        ["Final acceptance", "10%", "FAC of each system", "FAC certificate"],
      ],
      [22, 8, 38, 32],
    ),
    h1("Appendix 2 — Price schedule structure (Form F-5)"),
    p(
      "Bidders shall price every line in USD, DDP site, excluding VAT. Do not add, remove or merge lines (RFP §2.4.3). Omitted lines are priced for evaluation at the highest price of other responsive bidders (RFP §7.3.2).",
    ),
    table(
      ["Line", "Description", "Qty", "Unit"],
      [
        [
          "1.1",
          "High-energy drive-through system, T1 Gate A, incl. shielding and traffic control",
          "1",
          "lot",
        ],
        ["1.2", "High-energy drive-through system, T1 Gate B", "1", "lot"],
        ["1.3", "High-energy drive-through system, T2 main gate", "1", "lot"],
        ["1.4", "Relocatable high-energy system", "1", "lot"],
        ["2.1", "CIAC image management and analysis platform, incl. licences", "1", "lot"],
        ["2.2", "CIAC storage (state usable TB)", "1", "lot"],
        ["2.3", 'Operator/analyst workstations (dual 27", ≥ 2560×1440)', "per Addenda", "pcs"],
        ["3.1", "Civil and building works, T1 (both gates)", "1", "lot"],
        ["3.2", "Civil and building works, T2, incl. any power reinforcement", "1", "lot"],
        ["4.1", "Integration: CRMS and TOS, incl. middleware", "1", "lot"],
        ["4.2", "OCR (container and plates), all lanes", "1", "lot"],
        ["5.1", "Training (RFP §5.3)", "1", "lot"],
        ["5.2", "FAT witnessing: travel and accommodation for 4 persons", "1", "lot"],
        ["6.1", "Radiation licensing support (RFP §4.3.3–4.3.4)", "1", "lot"],
        ["7.1", "Initial in-country stock of critical spare parts", "1", "lot"],
        ["", "TOTAL CAPEX", "", ""],
        ["8.1", "CMC year 1", "1", "year"],
        ["8.2", "CMC year 2", "1", "year"],
        ["8.3", "CMC year 3", "1", "year"],
        ["8.4", "CMC year 4", "1", "year"],
        ["8.5", "CMC year 5", "1", "year"],
        ["", "TOTAL CMC (years 1–5)", "", ""],
        ["", "EVALUATED PRICE = TOTAL CAPEX + TOTAL CMC (+ deviations, RFP §7.3)", "", ""],
      ],
      [8, 70, 12, 10],
    ),
    h1("Appendix 3 — Availability penalties"),
    p(
      "Availability is measured per scanner per calendar month, excluding agreed planned maintenance of up to 8 hours per month (RFP §6.2.1).",
    ),
    table(
      ["Monthly availability (per scanner)", "Penalty"],
      [
        ["≥ 98.0%", "None"],
        [
          "97.0% – 97.9%",
          "2% of the monthly CMC fee of the scanner (during warranty: deducted from the next payment or the performance security)",
        ],
        ["95.0% – 96.9%", "5% of the monthly CMC fee of the scanner"],
        [
          "< 95.0%",
          "10% of the monthly CMC fee of the scanner; three consecutive months below 95% entitle the Employer to terminate the CMC for default",
        ],
      ],
      [35, 65],
    ),
  ];

  const doc = new Document({
    creator: "Northern Gulf Ports Authority (SAMPLE)",
    title: `${TENDER.ref} Annex C Draft Contract`,
    styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${TENDER.ref} · Annex C · Draft Contract`,
                    size: 16,
                    color: "5C6774",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "SAMPLE / fictional · Page ", size: 16, color: "5C6774" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "5C6774" }),
                  new TextRun({ text: " of ", size: 16, color: "5C6774" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "5C6774" }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  fs.writeFileSync(outFile, await Packer.toBuffer(doc));
}
