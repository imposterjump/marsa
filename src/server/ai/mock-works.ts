/**
 * The demo engine for building works tenders (2026-10-25): the Public Works Department's tenders
 * are Arabic and say what a bid must contain in their declaration form, not in "shall" sentences
 * the generic demo reads. So the demo checks the bid's contents the way the tender asks: a priced
 * bill of quantities (from Mizan's price comparison), the bid bond, the licence, the programme
 * and the signed declaration (from the bid's file names). Free, deterministic, English text.
 */
import type { Priority, ProposalSection, RequirementCategory } from "../../lib/domain";
import type { AnalysisOutput, ChecklistOutput } from "./schemas";
import type { RunContext, SourceDoc, VendorContext } from "./types";

type Req = [
  title: string,
  description: string,
  priority: Priority,
  category: RequirementCategory,
  section: ProposalSection,
  acceptance: string,
];

const REQUIREMENTS: Req[] = [
  [
    "Every item of the bill of quantities priced",
    "The bidder prices every item of the tender's bill of quantities, with a unit rate and an amount.",
    "mandatory",
    "commercial",
    "pricing",
    "A priced bill of quantities with a rate and an amount on every line.",
  ],
  [
    "Quantities and descriptions kept unchanged",
    "The bidder keeps the quantities and item descriptions of the tender's bill of quantities.",
    "mandatory",
    "commercial",
    "pricing",
    "The priced lines match the tender's bill of quantities.",
  ],
  [
    "Correct line amounts and totals with VAT",
    "Every amount equals quantity × rate; the total before VAT, the 5% VAT and the total with VAT are stated and add up.",
    "important",
    "commercial",
    "pricing",
    "Totals that match the priced lines.",
  ],
  [
    "Bill of quantities signed and stamped on every page",
    "The priced bill of quantities is signed and stamped by the bidder on every page.",
    "mandatory",
    "legal",
    "declarations",
    "A signed and stamped copy of the priced bill of quantities.",
  ],
  [
    "Signed declaration of the tender documents",
    "The bidder returns the declaration of the tender documents, signed and stamped, confirming it received and read them.",
    "mandatory",
    "legal",
    "declarations",
    "The signed and stamped declaration form.",
  ],
  [
    "Bid bond of 5% of the bid value",
    "An original bank guarantee of 5% of the bid value from a bank in the State, or the reservation form when the company has dues with the Central Finance Department.",
    "mandatory",
    "commercial",
    "guarantees",
    "The bank guarantee or the signed reservation form.",
  ],
  [
    "Valid trade licence",
    "A trade licence of the bidding company, valid at the bid date.",
    "mandatory",
    "compliance",
    "contractor",
    "A copy of the valid trade licence or registration certificate.",
  ],
  [
    "Work programme within the project duration",
    "A work programme showing the works completed within the tender's duration.",
    "important",
    "delivery",
    "programme",
    "A time schedule of the works.",
  ],
  [
    "Site visit made before pricing",
    "The bidder confirms it visited the site and took its conditions into account in its prices.",
    "important",
    "compliance",
    "declarations",
    "The confirmation in the signed declaration.",
  ],
];

export function worksChecklist(ctx: RunContext): ChecklistOutput {
  const source =
    ctx.rfpDocs.find((d) => /إقرار|اقرار|declaration/i.test(d.name))?.name ??
    ctx.rfpDocs[0]?.name ??
    "Tender documents";
  const estimate = ctx.boq?.estimate;
  return {
    requirements: REQUIREMENTS.map(
      ([title, description, priority, category, section, acceptance], i) => ({
        code: `REQ-${String(i + 1).padStart(3, "0")}`,
        title,
        description,
        category,
        priority,
        sourceType: "rfp" as const,
        sourceRef: /كميات|quantities/i.test(title) ? (ctx.boq?.clientDocument ?? source) : source,
        acceptance,
        section,
      }),
    ),
    ruleSections: [],
    keyConstraints: [
      { label: "Bid bond", value: "5% of the bid value, original bank guarantee" },
      ...(estimate
        ? [
            {
              label: "Cost estimate",
              value: `${estimate.toLocaleString("en-US")} ${ctx.boq!.currency}`,
            },
          ]
        : []),
    ],
  };
}

type Finding = AnalysisOutput["findings"][number];

/** The demo's check of one bid, from Mizan's price comparison and the bid's file names. */
export function analyzeWorks(
  ctx: RunContext,
  vendor: VendorContext,
  codes: string[],
): AnalysisOutput {
  const docs = vendor.docs;
  const find = (re: RegExp, kind?: SourceDoc["kind"]) =>
    docs.find((d) => re.test(d.name) && (!kind || d.kind === kind)) ?? null;
  const prices = ctx.boq?.vendors.find((v) => v.proposalId === vendor.proposalId);
  const lines = ctx.boq?.items ?? 0;
  const boqPdf = find(/كميات|boq|quantit|عرض_سعر|عرض سعر/i, "commercial");
  const finding = (
    code: string,
    status: Finding["status"],
    doc: SourceDoc | null,
    vendorResponse: string,
    assessment: string,
    gap: string | null = null,
  ): Finding => ({
    code,
    status,
    headline:
      status === "compliant"
        ? `Meets: ${vendorResponse}`.slice(0, 110)
        : status === "not_addressed"
          ? `Missing from the bid: ${vendorResponse}`.slice(0, 110)
          : vendorResponse.slice(0, 110),
    vendorResponse,
    evidenceQuote: null,
    evidenceDocument: doc?.title ?? null,
    evidencePage: doc && doc.ext === "pdf" ? 1 : null,
    evidenceSection: null,
    assessment,
    gap,
    confidence: status === "not_addressed" ? "medium" : "high",
  });
  const has = (re: RegExp, what: string, code: string, kind?: SourceDoc["kind"]) => {
    const doc = find(re, kind);
    return doc
      ? finding(
          code,
          "compliant",
          doc,
          `${what} is in the bid (${doc.name}).`,
          `The bid includes ${what.toLowerCase()}.`,
        )
      : finding(
          code,
          "not_addressed",
          null,
          what,
          `The bid has no document that is ${what.toLowerCase()}.`,
          `${what} is missing.`,
        );
  };

  const out: Finding[] = [];
  const [priced, quantities, totals, signed, declaration, bond, licence, programme, site] = codes;
  if (prices?.parsed) {
    const gaps = prices.unpriced + prices.missing;
    out.push(
      finding(
        priced,
        gaps === 0 ? "compliant" : gaps > lines * 0.1 ? "non_compliant" : "partial",
        boqPdf,
        gaps === 0
          ? `All ${lines} lines of the bill of quantities are priced.`
          : `${gaps} of ${lines} lines are not priced.`,
        gaps === 0
          ? "Every line of the tender's bill of quantities has a rate and an amount."
          : "Some lines of the tender's bill of quantities have no price.",
        gaps === 0 ? null : `${gaps} lines without a price.`,
      ),
      finding(
        quantities,
        prices.qtyChanged === 0 && prices.missing === 0 ? "compliant" : "non_compliant",
        boqPdf,
        prices.qtyChanged === 0 && prices.missing === 0
          ? "The quantities of the tender's bill of quantities are kept."
          : `${prices.qtyChanged} quantities changed and ${prices.missing} lines left out.`,
        prices.qtyChanged === 0
          ? "The priced lines match the tender's bill of quantities."
          : "The bidder changed quantities of the tender's bill of quantities.",
        prices.qtyChanged === 0 && prices.missing === 0 ? null : "Changed or missing lines.",
      ),
      finding(
        totals,
        prices.arithmetic === 0 && prices.difference === null ? "compliant" : "partial",
        boqPdf,
        prices.arithmetic === 0 && prices.difference === null
          ? "Line amounts and totals add up."
          : `${prices.arithmetic} lines where quantity × rate ≠ amount${prices.difference !== null ? "; the lines do not add up to the stated total" : ""}.`,
        "Checked against Mizan's price comparison.",
        prices.arithmetic === 0 && prices.difference === null ? null : "Arithmetic to correct.",
      ),
    );
  } else {
    for (const code of [priced, quantities, totals])
      out.push(
        finding(
          code,
          boqPdf ? "partial" : "not_addressed",
          boqPdf,
          boqPdf ? "A priced bill of quantities as PDF only." : "No priced bill of quantities.",
          boqPdf
            ? "The bid has no Excel bill of quantities, so its lines could not be compared."
            : "The bid has no priced bill of quantities.",
          "To check against the PDF by hand.",
        ),
      );
  }
  out.push(
    boqPdf
      ? finding(
          signed,
          "compliant",
          boqPdf,
          `A signed copy of the priced bill of quantities (${boqPdf.name}).`,
          "The bid includes the priced bill of quantities as a PDF copy.",
        )
      : finding(
          signed,
          "not_addressed",
          null,
          "A signed and stamped bill of quantities",
          "No signed copy of the priced bill of quantities.",
          "Missing signed copy.",
        ),
    has(/إقرار|اقرار|declaration/i, "The signed declaration", declaration),
    has(/كفالة|تأمين|تامين|ضمان|bond|guarantee/i, "The bid bond", bond),
    has(/رخصة|ترخيص|licen|dpw|registration|تسجيل/i, "The trade licence", licence),
    has(/برنامج|program|schedule|زمني|مدة|duration/i, "The work programme", programme),
  );
  const declared = find(/إقرار|اقرار|declaration/i);
  out.push(
    declared
      ? finding(
          site,
          "compliant",
          declared,
          "The site visit, confirmed in the signed declaration.",
          "The signed declaration confirms the site visit.",
        )
      : finding(
          site,
          "not_addressed",
          null,
          "The site visit confirmation",
          "No signed declaration confirms the site visit.",
          "Not confirmed.",
        ),
  );
  const met = out.filter((f) => f.status === "compliant").length;
  return {
    findings: out,
    summary: `${vendor.name}: ${met} of ${out.length} tender conditions met${prices?.statedTotal != null ? `; bid total ${prices.statedTotal.toLocaleString("en-US")} ${ctx.boq!.currency} before VAT` : ""}. (Demo analysis.)`,
    strengths: out
      .filter((f) => f.status === "compliant")
      .slice(0, 4)
      .map((f) => f.vendorResponse),
    weaknesses: out
      .filter((f) => f.status !== "compliant")
      .slice(0, 4)
      .map((f) => f.vendorResponse),
    commercial: {
      totalPrice:
        prices?.statedTotal != null
          ? `${ctx.boq!.currency} ${prices.statedTotal.toLocaleString("en-US")}`
          : null,
      currency: prices?.statedTotal != null ? ctx.boq!.currency : null,
      paymentTerms: null,
      deliveryTime: null,
      warranty: null,
      validity: null,
      exclusions: [],
    },
  };
}
