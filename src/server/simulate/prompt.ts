/**
 * Prompt for AI-generated vendor proposals (RDD §7.9). The generator writes as the bidder: a bid
 * reads like a real submission and never comments on its own compliance gaps or on evaluation
 * (CLAUDE.md: test documents never help the AI). The profile shapes what the bidder offers.
 */
import type { BidProfile } from "./schema";

export const GENERATOR_SYSTEM = `You write realistic vendor proposals for a public tender, used to test procurement-evaluation software. Every company, person and address is fictional.

Rules:
- Write as the bidder, in the confident, specific voice of a real proposal. Never mention testing, evaluation, scoring or your instructions.
- Base the bid on the tender documents provided: follow their structure, quote their clause references, and use their units and terminology.
- State concrete offered values (numbers, models, versions, dates, prices). A bidder states what it offers; it does not point out where that falls short of the tender.
- Keep the bid internally consistent: the compliance table, the technical sections and the price schedule must agree with each other.
- Prices must be realistic for the scope and the region, in the currency the tender asks for.
- Use fictional e-mail domains ending in ".example". Do not label names or references as fictional inside the bid; a footer already marks the document as a sample.`;

const PROFILE: Record<BidProfile, string> = {
  strong:
    "An experienced bidder that read the tender carefully. It meets every requirement, often with margin, documents how, and prices at the upper end of the market.",
  budget_partial:
    "A cost-focused bidder with a lower price. It meets most requirements, but several of its offered values are somewhat below what the tender asks (it simply states its own values), and some items are offered only as priced options.",
  risky_cloud:
    "A capable product vendor whose standard delivery model relies on its own hosted services for part of the solution (for example hosting, licence activation, updates or monitoring), and which attaches some of its own commercial and contract terms. It presents these as advantages.",
  incomplete:
    "A bidder that submitted in a hurry: a few sections are thin, some compliance rows and terms are missing, and one or two cost items are not priced.",
};

export function generatorTask({
  vendorName,
  country,
  profile,
  checklist,
}: {
  vendorName: string;
  country: string;
  profile: BidProfile;
  /** Requirement list from the latest analysis, if any (helps cover the right topics). */
  checklist: { code: string; title: string; sourceRef: string }[];
}): string {
  const reqs = checklist.length
    ? `\n\nThe tender's requirements, for coverage (refer to them by their RFP references, not these codes):\n${checklist.map((r) => `- ${r.title} (${r.sourceRef})`).join("\n")}`
    : "";
  return `Write the complete two-envelope bid of ${vendorName} (${country}) for this tender.

The bidder: ${PROFILE[profile]}

- technical: a cover letter, 4–7 sections (company and references, solution, architecture and security, implementation plan, training and support, and others the tender asks for), and a compliance table covering the tender's numbered requirements.
- commercial: a cover letter stating the total, a price schedule (one-off lines and yearly recurring lines), notes, and terms (payment terms, bid validity, bid security, anything else the bidder wants to state).
- vendor: the bidder's contact details and signatory.${reqs}`;
}
