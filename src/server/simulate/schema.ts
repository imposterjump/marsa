/**
 * AI-generated vendor proposals (PRD FR-4.3, RDD §7.9, P7.5): the structured bid Claude (or the
 * mock) writes, which is then rendered to a technical DOCX and a financial PDF. No nullable
 * fields: an empty string or list means "not given" (structured-output union limits, G-58).
 */
import { z } from "zod";

export const BID_PROFILES = ["strong", "budget_partial", "risky_cloud", "incomplete"] as const;
export type BidProfile = (typeof BID_PROFILES)[number];

const section = z.object({
  title: z.string(),
  paragraphs: z.array(z.string()),
  tableHead: z.array(z.string()).describe("Column headings; [] when the section has no table"),
  tableRows: z.array(z.array(z.string())).describe("Table rows; [] when there is no table"),
});

export const GeneratedBidSchema = z.object({
  tenderReference: z
    .string()
    .describe('The tender reference exactly as printed in the RFP, e.g. "NGPA/T/2026/021"'),
  vendor: z.object({
    legalName: z.string().describe('Legal name, e.g. "Dhow Gate Systems L.L.C."'),
    address: z.string(),
    contactName: z.string(),
    contactEmail: z.string().describe("Fictional address ending in .example"),
    signatoryName: z.string(),
    signatoryTitle: z.string(),
  }),
  technical: z.object({
    coverLetter: z.string(),
    sections: z.array(section).describe("4–7 sections"),
    compliance: z
      .array(
        z.object({
          ref: z.string().describe("RFP clause or requirement reference"),
          requirement: z.string(),
          response: z.string().describe('The bidder\'s own statement, e.g. "Comply"'),
          offered: z.string(),
        }),
      )
      .describe("The bidder's compliance table"),
  }),
  commercial: z.object({
    coverLetter: z.string(),
    currency: z.string(),
    lines: z.array(
      z.object({ description: z.string(), amount: z.number().describe("In the currency above") }),
    ),
    recurring: z
      .array(z.object({ description: z.string(), amount: z.number() }))
      .describe("Yearly support / maintenance lines; [] if not offered"),
    notes: z.array(z.string()),
    terms: z.array(z.object({ title: z.string(), text: z.string() })),
  }),
});
export type GeneratedBid = z.infer<typeof GeneratedBidSchema>;

/** Tidy model output before rendering: no duplicate numbering, no placeholder price lines. */
export function cleanBid(bid: GeneratedBid): GeneratedBid {
  const meaningful = (l: { description: string }) => l.description.trim().length >= 3;
  return {
    ...bid,
    technical: {
      ...bid.technical,
      sections: bid.technical.sections
        .map((s) => ({ ...s, title: s.title.replace(/^\s*\d+(\.\d+)*[.)]?\s+/, "").trim() }))
        .filter((s) => s.title && (s.paragraphs.length || s.tableRows.length)),
    },
    commercial: {
      ...bid.commercial,
      lines: bid.commercial.lines.filter(meaningful),
      recurring: bid.commercial.recurring.filter(meaningful),
    },
  };
}

export const bidTotals = (b: GeneratedBid) => {
  const once = b.commercial.lines.reduce((s, l) => s + l.amount, 0);
  const recurring = b.commercial.recurring.reduce((s, l) => s + l.amount, 0);
  return { once, recurring, total: once + recurring };
};

/** Fictional vendor identities handed to the generator (never real companies). */
export const VENDOR_POOL: { name: string; country: string }[] = [
  { name: "Dhow Gate Systems", country: "Oman" },
  { name: "Saltline Technologies", country: "Netherlands" },
  { name: "Crescent Harbor IT", country: "United Arab Emirates" },
  { name: "Mangrove Port Solutions", country: "Singapore" },
  { name: "Tidewater Digital", country: "United Kingdom" },
  { name: "Seapoint Integration", country: "Egypt" },
  { name: "Lighthouse Scan Systems", country: "Germany" },
  { name: "Qurm Infrastructure Tech", country: "Oman" },
  { name: "Anchorage Data Works", country: "India" },
  { name: "Coral Bay Systems", country: "Saudi Arabia" },
];
