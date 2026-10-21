/**
 * Mock bid writer (AI_MODE=mock): deterministic bids built from the tender's own "shall/must"
 * sentences, shaped by the profile, so the generate flow works at $0 in demos and E2E tests.
 * Like the mock evaluator, it is a template, not an imitation of a real bidder.
 */
import { seeded, splitSentences, type PageText } from "../ai/mock";
import type { RunContext, SourceDoc } from "../ai/types";
import type { BidProfile, GeneratedBid } from "./schema";

const round = (n: number, to = 10_000) => Math.round(n / to) * to;

export async function mockBid({
  ctx,
  vendorName,
  country,
  profile,
  loadPages,
}: {
  ctx: RunContext;
  vendorName: string;
  country: string;
  profile: BidProfile;
  loadPages: (doc: SourceDoc) => Promise<PageText[]>;
}): Promise<GeneratedBid> {
  const h = (k: string) => seeded(`${vendorName}|${k}`);
  const reqs: { ref: string; text: string }[] = [];
  for (const doc of ctx.rfpDocs) {
    for (const p of await loadPages(doc)) {
      for (const s of splitSentences(p.text)) {
        if (/\b(shall|must)\b/i.test(s) && reqs.length < 14) {
          reqs.push({ ref: `${doc.name}${p.page ? ` p.${p.page}` : ""}`, text: s });
        }
      }
    }
  }
  const slug = vendorName.toLowerCase().replace(/[^a-z]+/g, "");
  const onPrem = profile !== "risky_cloud";
  const compliance = reqs
    .filter((_, i) => profile !== "incomplete" || h(`row${i}`) > 0.4)
    .map((r, i) => ({
      ref: r.ref,
      requirement: r.text.slice(0, 140),
      response: profile === "budget_partial" && h(`p${i}`) < 0.3 ? "Partially comply" : "Comply",
      offered:
        profile === "budget_partial" && h(`p${i}`) < 0.3
          ? "Offered as specified in our solution description; see section 2"
          : "As required",
    }));
  const scale = { strong: 1.3, budget_partial: 0.75, risky_cloud: 0.95, incomplete: 0.85 }[profile];
  const base = 1_000_000 * scale * (1 + h("price") * 0.25);
  const lines = [
    { description: "Software licences", amount: round(base * 0.35) },
    { description: "Hardware and installation", amount: round(base * 0.4) },
    { description: "Implementation, integration and training", amount: round(base * 0.25) },
  ];
  const recurring =
    profile === "incomplete"
      ? []
      : [1, 2, 3].map((y) => ({
          description: `Support and maintenance, year ${y}`,
          amount: round(base * 0.09 * (1 + (y - 1) * 0.03)),
        }));
  const total =
    lines.reduce((s, l) => s + l.amount, 0) + recurring.reduce((s, l) => s + l.amount, 0);
  const tender = `${ctx.project.code} ${ctx.project.name}`;

  return {
    tenderReference: ctx.project.code,
    vendor: {
      legalName: `${vendorName} Ltd.`,
      address: `Business Park, Tower ${String.fromCharCode(65 + Math.floor(h("addr") * 6))}, ${country}`,
      contactName: "Bid Manager",
      contactEmail: `tenders@${slug}.example`,
      signatoryName: "Managing Director",
      signatoryTitle: "Managing Director",
    },
    technical: {
      coverLetter: `We submit our technical proposal for tender ${tender}. This envelope contains no prices.`,
      sections: [
        {
          title: "Company and references",
          paragraphs: [
            `${vendorName} has delivered port and customs systems for ${4 + Math.floor(h("refs") * 8)} authorities.`,
          ],
          tableHead: [],
          tableRows: [],
        },
        {
          title: "Solution",
          paragraphs: reqs.slice(0, 4).map((r) => `We provide: ${r.text}`),
          tableHead: [],
          tableRows: [],
        },
        {
          title: "Architecture and hosting",
          paragraphs: [
            onPrem
              ? "All components are installed on the Authority's infrastructure. Licences are perpetual and activated offline."
              : "The solution is installed at the Authority; licence activation, updates and health monitoring are delivered through our cloud service, which the system contacts every 30 days.",
          ],
          tableHead: [],
          tableRows: [],
        },
        ...(profile === "incomplete"
          ? []
          : [
              {
                title: "Implementation plan",
                paragraphs: ["Milestones from contract signature:"],
                tableHead: ["Milestone", "Month"],
                tableRows: [
                  ["Design approval", "2"],
                  ["Installation", String(profile === "budget_partial" ? 8 : 6)],
                  ["Final acceptance", String(profile === "budget_partial" ? 12 : 10)],
                ],
              },
            ]),
      ],
      compliance,
    },
    commercial: {
      coverLetter: `We offer to deliver the scope of tender ${tender} for a total of USD ${total.toLocaleString("en-US")}.`,
      currency: "USD",
      lines,
      recurring,
      notes: ["Prices exclude VAT."],
      terms: [
        {
          title: "Payment terms",
          text:
            profile === "risky_cloud"
              ? "40 % on signature, 60 % on delivery."
              : "Against milestones as per the tender.",
        },
        { title: "Bid validity", text: profile === "budget_partial" ? "90 days." : "120 days." },
        ...(profile === "incomplete"
          ? []
          : [{ title: "Bid security", text: "Bank guarantee as required by the tender." }]),
      ],
    },
  };
}
