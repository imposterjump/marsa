/**
 * Mock AI engine (RDD §7.8, P6.9): `AI_MODE=mock` runs the whole pipeline at $0. Outputs are
 * schema-valid and deterministic (seeded by vendor name + requirement code, so a re-run on the same
 * documents gives the same scores). They are built from the real documents:
 * - checklist: "shall"/"must" sentences of the RFP + every applied standard rule;
 * - analyses: the vendor sentence that shares most keywords with each requirement is the evidence
 *   (verbatim, with its real PDF page, so the reader's quote highlight works);
 * - a proposal that relies on an external cloud service for licensing, telemetry or updates is
 *   non-compliant with hosting / data-residency requirements (the on-prem conflict);
 * - P8: standard rules are checked in their own step; sections come from a keyword guess; the
 *   recommendation explains Marsa's computed pick;
 * - consultant reports (2026-10-25) are assembled from the vendor's findings, commercial terms
 *   and risk register.
 * This is a keyword heuristic for demos and tests, not an evaluation.
 */
import type {
  AspectRating,
  FindingStatus,
  Priority,
  ProposalSection,
  RequirementCategory,
  RiskSeverity,
} from "../../lib/domain";
import { riskSeverity } from "../../lib/scoring";
import type {
  AnalysisOutput,
  ChecklistOutput,
  ComparisonOutput,
  ReportOutput,
  RiskOutput,
  SummaryOutput,
} from "./schemas";
import { normalizeChecklist, normalizeReport, requirementsFor, withStandardRules } from "./schemas";
import { guessSection, pointType, type PointType } from "../../lib/sections";
import { EMPTY_USAGE } from "../../lib/domain";
import { readPdfPages } from "../documents/pdf-text";
import type { LocalStorage } from "../storage/local";
import type { CallResult } from "./result";
import type {
  AiEngine,
  AnalysisDigest,
  SourceDoc,
  StepHooks,
  StepInput,
  StepOutputs,
} from "./types";

export interface PageText {
  /** 1-based PDF page, or null for non-paged documents. */
  page: number | null;
  text: string;
}

export interface MockDeps {
  loadPages(doc: SourceDoc): Promise<PageText[]>;
  /** Fixed delay per step (E2E/tests); default 2–5 s, stable per step. */
  stepMs?: number;
}

interface Sentence {
  doc: SourceDoc;
  page: number | null;
  text: string;
  words: Set<string>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** FNV-1a → [0, 1). */
export function seeded(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 2 ** 32;
}

const STOP = new Set(
  "shall must will with that this from have their there which other into than then also each such these those within where when what including include includes provide provided vendor bidder tender proposal system systems required requirement requirements based least more less only under over about after before during being been were they them your ours".split(
    " ",
  ),
);

export const keywords = (s: string) =>
  new Set((s.toLowerCase().match(/[a-z0-9][a-z0-9-]{3,}/g) ?? []).filter((w) => !STOP.has(w)));

export function splitSentences(text: string): string[] {
  return text
    .replace(/­/g, "")
    .split(/\n{2,}|(?<=[.;:!?])\s+(?=[A-Z0-9(•–-])|\n(?=\s*(?:[•▪\-–]|\d+(?:\.\d+)*\s))/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 30 && s.length <= 320);
}

async function sentencesOf(docs: SourceDoc[], deps: MockDeps): Promise<Sentence[]> {
  const out: Sentence[] = [];
  for (const doc of docs) {
    if (!doc.aiReadable) continue;
    for (const p of await deps.loadPages(doc)) {
      for (const text of splitSentences(p.text)) {
        out.push({ doc, page: p.page, text, words: keywords(text) });
      }
    }
  }
  return out;
}

const overlap = (a: Set<string>, b: Set<string>) => {
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n;
};

const CATEGORY_HINTS: [RequirementCategory, RegExp][] = [
  ["security", /encrypt|authenticat|password|audit log|access control|vulnerab|penetration|cyber/i],
  ["infrastructure", /server|network|storage|on-?premise|data cent|hosting|cloud|virtuali|backup/i],
  ["delivery", /deliver|install|commission|schedule|weeks|months|milestone|site acceptance/i],
  ["support", /training|maintenance|warranty|spare|support|service level|response time/i],
  ["commercial", /price|payment|invoice|guarantee|bond|currency|cost/i],
  ["legal", /contract|liabilit|law|penalt|indemn|insurance|termination/i],
  ["compliance", /standard|certif|iso|iec|regulat|licen[cs]e from|radiation|safety/i],
  ["functional", /operator|user interface|workflow|report|display|software|integrat/i],
];
const guessCategory = (s: string): RequirementCategory =>
  CATEGORY_HINTS.find(([, re]) => re.test(s))?.[0] ?? "technical";

const titleOf = (s: string) => {
  const words = s
    .replace(/^[\d.()\s•▪–-]+/, "")
    .split(/\s+/)
    .slice(0, 7)
    .join(" ");
  return words.replace(/[,;:.]+$/, "");
};

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new Error("Cancelled."));
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new Error("Cancelled."));
      },
      { once: true },
    );
  });

const result = <T>(data: T): CallResult<T> => ({
  data,
  usage: { ...EMPTY_USAGE },
  model: "mock",
  stopReason: "end_turn",
});

/** External-service dependency sentences (licensing, telemetry or updates through a cloud). */
const CLOUD = /\b(cloud|internet|saas|eu-hosted|hosted service|vendor-hosted)\b/i;
const CLOUD_USE = /licen[cs]|telemetr|update|synchroni|activation|monitoring/i;
/** Requirements about where systems and data must run. */
const HOSTING =
  /on-?premise|public cloud|cloud service|national territory|directorate infrastructure|offline|telemetry|licensing server/i;

// ─── Steps ───────────────────────────────────────────────────────────────────
async function checklist(input: Extract<StepInput, { phase: "checklist" }>, deps: MockDeps) {
  const seen = new Set<string>();
  const reqs: ChecklistOutput["requirements"] = [];
  for (const s of await sentencesOf(input.ctx.rfpDocs, deps)) {
    if (!/\b(shall|must)\b/i.test(s.text) || reqs.length >= 60) continue;
    const key = [...s.words].slice(0, 8).join(" ");
    if (seen.has(key)) continue;
    seen.add(key);
    const strict = /\b(minimum|at least|maximum|no later than|not exceed|only|mandatory)\b/i.test(
      s.text,
    );
    reqs.push({
      code: `REQ-${String(reqs.length + 1).padStart(3, "0")}`,
      title: titleOf(s.text),
      description: s.text,
      category: guessCategory(s.text),
      priority: strict ? "mandatory" : "important",
      sourceType: "rfp",
      sourceRef: `${s.doc.name}${s.page ? ` p.${s.page}` : ""}`,
      acceptance: "The proposal states compliance and describes how it is met.",
      section: guessSection(s.text),
    });
  }
  const keyConstraints = reqs
    .filter((r) => /on-?premise|no later than|deadline|budget|ceiling|certif/i.test(r.description))
    .slice(0, 5)
    .map((r) => ({ label: r.title, value: r.description.slice(0, 160) }));
  const ruleSections = input.ctx.standards.flatMap((std) =>
    std.rules.map((rule) => ({ code: rule.code, section: guessSection(rule.text) })),
  );
  const out = normalizeChecklist({ requirements: reqs, ruleSections, keyConstraints });
  return withStandardRules(out, input.ctx.standards);
}

function commercialOf(sentences: Sentence[]): AnalysisOutput["commercial"] {
  const find = (re: RegExp) => sentences.find((s) => re.test(s.text))?.text.slice(0, 200) ?? null;
  const all = sentences.map((s) => s.text).join(" ");
  const price =
    all.match(
      /(?:grand total|total (?:contract |bid |offer )?price|total amount|total)[^.]{0,80}?((?:USD|AED|EUR|SAR|US\$|\$)\s?\d(?:[\d,]*\d)?(?:\.\d+)?(?:\s?million)?)/i,
    )?.[1] ?? null;
  return {
    totalPrice: price,
    currency:
      price
        ?.match(/USD|AED|EUR|SAR|US\$|\$/)?.[0]
        ?.replace("US$", "USD")
        .replace("$", "USD") ?? null,
    paymentTerms: find(/\bpayment\b/i),
    deliveryTime: find(/\bdeliver(y|ed)?\b.*\b(weeks?|months?|days?)\b/i),
    warranty: find(/\bwarranty\b/i),
    validity: find(/\bvalid(ity)?\b.*\bdays?\b/i),
    exclusions: sentences
      .filter((s) => /not included|excluded|exclusion|optional \(not/i.test(s.text))
      .slice(0, 4)
      .map((s) => s.text.slice(0, 200)),
  };
}

const headlineOf = (status: FindingStatus, title: string) =>
  `${status === "compliant" ? "Meets" : status === "partial" ? "Partly meets" : status === "non_compliant" ? "Falls short on" : "Silent on"}: ${title}`.slice(
    0,
    110,
  );

async function analyze(
  input: Extract<StepInput, { phase: "analyze" | "standards" }>,
  deps: MockDeps,
): Promise<AnalysisOutput> {
  const vendor = input.vendor.name;
  const scope = requirementsFor(input.checklist, input.phase === "standards" ? "standards" : "rfp");
  const sentences = await sentencesOf(input.vendor.docs, deps);
  // Technical documents first: they describe the architecture; negated mentions don't count.
  const conflict = [...sentences]
    .sort((a, b) => Number(b.doc.kind === "technical") - Number(a.doc.kind === "technical"))
    .find(
      (s) =>
        CLOUD.test(s.text) && CLOUD_USE.test(s.text) && !/\b(no|not|without|never)\b/i.test(s.text),
    );
  const findings: AnalysisOutput["findings"] = scope.map((r) => {
    const reqText = `${r.title} ${r.description}`;
    const evidence = (s: Sentence) => ({
      evidenceQuote: s.text,
      evidenceDocument: s.doc.title,
      evidencePage: s.page,
      evidenceSection: null,
    });
    if (conflict && HOSTING.test(reqText)) {
      return {
        code: r.code,
        status: "non_compliant" as const,
        headline: headlineOf("non_compliant", r.title),
        vendorResponse: conflict.text,
        ...evidence(conflict),
        assessment:
          "The proposal depends on an external hosted service, which this requirement does not allow.",
        gap: "Operation, licensing or updates rely on a service outside the customer's infrastructure.",
        confidence: "high" as const,
      };
    }
    const kw = keywords(reqText);
    let best: Sentence | null = null;
    let bestScore = 0;
    for (const s of sentences) {
      const score = overlap(kw, s.words);
      if (score > bestScore) [best, bestScore] = [s, score];
    }
    const h = seeded(`${vendor}|${r.code}`);
    let status: FindingStatus;
    if (!best || bestScore === 0) status = "not_addressed";
    else if (bestScore >= 3)
      status = h < 0.74 ? "compliant" : h < 0.9 ? "partial" : "non_compliant";
    else status = h < 0.45 ? "compliant" : h < 0.75 ? "partial" : "not_addressed";
    if (status === "not_addressed" || !best) {
      return {
        code: r.code,
        status: "not_addressed" as const,
        headline: headlineOf("not_addressed", r.title),
        vendorResponse: "The proposal does not address this requirement.",
        evidenceQuote: null,
        evidenceDocument: null,
        evidencePage: null,
        evidenceSection: null,
        assessment: "No statement in the proposal covers this requirement.",
        gap: null,
        confidence: "medium" as const,
      };
    }
    return {
      code: r.code,
      status,
      headline: headlineOf(status, r.title),
      vendorResponse: best.text,
      ...evidence(best),
      assessment:
        status === "compliant"
          ? "The proposal states this requirement is met."
          : status === "partial"
            ? "The proposal covers part of this requirement; details are missing or weaker than required."
            : "What the proposal offers falls short of this requirement.",
      gap:
        status === "compliant"
          ? null
          : status === "partial"
            ? "Part of the requirement is not demonstrated."
            : "The offered solution does not meet the requirement.",
      confidence: bestScore >= 4 ? ("high" as const) : ("medium" as const),
    };
  });
  const byStatus = (st: FindingStatus) => findings.filter((f) => f.status === st);
  if (input.phase === "standards") {
    return {
      findings,
      summary: "",
      strengths: [],
      weaknesses: [],
      commercial: {
        totalPrice: null,
        currency: null,
        paymentTerms: null,
        deliveryTime: null,
        warranty: null,
        validity: null,
        exclusions: [],
      },
    };
  }
  const reqTitle = (code: string) =>
    input.checklist.requirements.find((r) => r.code === code)?.title ?? code;
  return {
    findings,
    summary: `${vendor} addresses ${findings.length - byStatus("not_addressed").length} of ${findings.length} requirements; ${byStatus("non_compliant").length} are non-compliant and ${byStatus("partial").length} partially met. (Mock analysis.)`,
    strengths: byStatus("compliant")
      .slice(0, 4)
      .map((f) => `Meets ${f.code}: ${reqTitle(f.code)}`),
    weaknesses: [...byStatus("non_compliant"), ...byStatus("partial")]
      .slice(0, 4)
      .map(
        (f) =>
          `${f.status === "partial" ? "Partly meets" : "Does not meet"} ${f.code}: ${reqTitle(f.code)}`,
      ),
    commercial: commercialOf(sentences),
  };
}

const priceValue = (a: AnalysisDigest) => {
  const m = a.analysis.commercial.totalPrice?.replace(/,/g, "").match(/[\d.]+/);
  if (!m) return null;
  const n = Number(m[0]);
  return /million/i.test(a.analysis.commercial.totalPrice ?? "") ? n * 1e6 : n;
};

function compare(input: Extract<StepInput, { phase: "compare" }>): ComparisonOutput {
  const me = input.analyses.find((a) => a.proposalId === input.vendor.proposalId)!;
  const others = input.analyses.filter((a) => a !== me);
  const advantages: ComparisonOutput["advantages"] = [];
  const disadvantages: ComparisonOutput["disadvantages"] = [];
  const beaten = others.filter((o) => o.scorePct < me.scorePct).map((o) => o.vendor);
  const better = others.filter((o) => o.scorePct > me.scorePct).map((o) => o.vendor);
  if (beaten.length)
    advantages.push({ point: `Higher overall compliance (${me.scorePct}%)`, versus: beaten });
  if (better.length)
    disadvantages.push({
      point: `Lower overall compliance (${me.scorePct}%)`,
      betterVendors: better,
    });
  for (const [cat, score] of Object.entries(me.categoryScores)) {
    const lower = others
      .filter((o) => (o.categoryScores[cat] ?? 0) < score - 10)
      .map((o) => o.vendor);
    const higher = others
      .filter((o) => (o.categoryScores[cat] ?? 0) > score + 10)
      .map((o) => o.vendor);
    if (lower.length)
      advantages.push({ point: `Stronger on ${cat} requirements (${score}%)`, versus: lower });
    if (higher.length)
      disadvantages.push({
        point: `Weaker on ${cat} requirements (${score}%)`,
        betterVendors: higher,
      });
  }
  if (me.mandatoryFailures > 0) {
    const clean = others
      .filter((o) => o.mandatoryFailures < me.mandatoryFailures)
      .map((o) => o.vendor);
    if (clean.length)
      disadvantages.push({
        point: `${me.mandatoryFailures} mandatory requirement(s) not met`,
        betterVendors: clean,
      });
  }
  const prices = input.analyses.map((a) => ({ a, p: priceValue(a) })).filter((x) => x.p !== null);
  const mine = priceValue(me);
  let pricePosition: ComparisonOutput["pricePosition"] = "unknown";
  if (mine !== null && prices.length >= 2) {
    const sorted = prices.map((x) => x.p!).sort((x, y) => x - y);
    pricePosition = mine === sorted[0] ? "lowest" : mine === sorted.at(-1) ? "highest" : "mid";
  }
  const rank = [...input.analyses].sort((x, y) => y.scorePct - x.scorePct).indexOf(me) + 1;
  return {
    advantages: advantages.slice(0, 5),
    disadvantages: disadvantages.slice(0, 5),
    uniqueOffers: me.analysis.strengths.slice(0, 2),
    pricePosition,
    positionStatement: `${input.vendor.name} ranks ${rank} of ${input.analyses.length} on compliance (${me.scorePct}%) with ${me.mandatoryFailures} mandatory failure(s); price position: ${pricePosition}. (Mock comparison.)`,
  };
}

const RISK_FOR: Record<RequirementCategory, RiskOutput["risks"][number]["category"]> = {
  technical: "technical",
  functional: "operational",
  infrastructure: "infrastructure",
  security: "security",
  commercial: "commercial",
  delivery: "schedule",
  support: "operational",
  legal: "legal",
  compliance: "compliance",
};

function risk(input: Extract<StepInput, { phase: "risk" }>): RiskOutput {
  const reqs = new Map(input.checklist.requirements.map((r) => [r.code, r]));
  const weight: Record<Priority, number> = { mandatory: 0, important: 1, desirable: 2 };
  const flagged = input.analysis.analysis.findings
    .filter((f) => f.status === "non_compliant" || f.status === "partial")
    .sort(
      (a, b) =>
        weight[reqs.get(a.code)?.priority ?? "desirable"] -
          weight[reqs.get(b.code)?.priority ?? "desirable"] ||
        (a.status === "non_compliant" ? -1 : 1) - (b.status === "non_compliant" ? -1 : 1),
    );
  const risks: RiskOutput["risks"] = flagged.slice(0, 7).map((f) => {
    const r = reqs.get(f.code);
    const mandatory = r?.priority === "mandatory";
    const non = f.status === "non_compliant";
    return {
      title: `${non ? "Non-compliance" : "Partial compliance"}: ${r?.title ?? f.code}`,
      category: RISK_FOR[r?.category ?? "technical"],
      likelihood: non ? 4 : 3,
      impact: mandatory ? 5 : non ? 4 : 3,
      description: f.assessment,
      consequence: mandatory
        ? "The delivered solution may fail a mandatory requirement at acceptance."
        : "The delivered solution may need changes or extra cost after award.",
      mitigation: "Require written confirmation and a contractual remedy before award.",
      evidence: f.evidenceQuote,
      requirementCodes: [f.code],
      section: r?.section ?? guessSection(r?.description ?? ""),
    };
  });
  for (const ex of input.analysis.analysis.commercial.exclusions.slice(0, 1)) {
    risks.push({
      title: "Excluded items may add cost",
      category: "commercial",
      likelihood: 3,
      impact: 3,
      description: ex,
      consequence: "Items outside the offered price may have to be bought separately.",
      mitigation: "Ask the vendor to price the excluded items as options.",
      evidence: ex,
      requirementCodes: [],
      section: "commercial",
    });
  }
  while (risks.length < 3) {
    risks.push(
      risks.length % 2
        ? {
            title: "Handover and training capacity",
            category: "operational",
            likelihood: 2,
            impact: 2,
            description: "Operator readiness depends on the vendor's training plan.",
            consequence: "Slower ramp-up after go-live.",
            mitigation: "Tie the final payment to completed training and acceptance.",
            evidence: null,
            requirementCodes: [],
            section: "implementation",
          }
        : {
            title: "Delivery schedule",
            category: "schedule",
            likelihood: 2,
            impact: 3,
            description: "Installation and commissioning depend on site readiness and logistics.",
            consequence: "Go-live could slip.",
            mitigation: "Agree milestone dates with delay penalties in the contract.",
            evidence: null,
            requirementCodes: [],
            section: "implementation",
          },
    );
  }
  const order: RiskSeverity[] = ["low", "moderate", "high", "critical"];
  const overall = risks.reduce<RiskSeverity>((acc, r) => {
    const s = riskSeverity(r.likelihood, r.impact);
    return order.indexOf(s) > order.indexOf(acc) ? s : acc;
  }, "low");
  return { overall, risks };
}

function summary(input: Extract<StepInput, { phase: "summary" }>): SummaryOutput {
  const missing = input.missing.length ? ` Not analysed: ${input.missing.join(", ")}.` : "";
  const top = input.scores[0];
  const pct = (v: number | null) => (v === null ? "n/a" : `${v}%`);
  return {
    ranking: input.scores.map((s) => ({
      vendor: s.vendor,
      rank: s.rank,
      rationale: `Standards ${pct(s.standardsPct)}, RFP ${s.rfpPct}%, risk ${s.riskScore} (${s.riskLevel}).`,
    })),
    recommendedVendor: input.recommended,
    executiveSummary: top
      ? `${top.vendor} has the best balance of standards compliance (${pct(top.standardsPct)}), RFP compliance (${top.rfpPct}%) and risk (${top.riskScore}, ${top.riskLevel}).${top.mandatoryNotMet ? ` It still misses ${top.mandatoryNotMet} mandatory requirement${top.mandatoryNotMet === 1 ? "" : "s"}, to be fixed before award.` : ""}${missing} (Demo AI.)`
      : `No vendor could be analysed.${missing} (Demo AI.)`,
    conditions: ["Written confirmation of every partial finding before award."],
    negotiationPoints: [
      "Price of excluded and optional items.",
      "Delay penalties tied to milestones.",
    ],
  };
}

function report(input: Extract<StepInput, { phase: "report" }>): ReportOutput {
  const reqs = new Map(input.checklist.requirements.map((r) => [r.code, r]));
  const name = input.vendor.name;
  const findings = input.analysis.analysis.findings;
  const order: Record<Priority, number> = { mandatory: 0, important: 1, desirable: 2 };
  const typeOf = (code: string) =>
    pointType((reqs.get(code)?.section ?? null) as ProposalSection | null);
  const byPriority = (a: (typeof findings)[number], b: (typeof findings)[number]) =>
    order[reqs.get(a.code)?.priority ?? "desirable"] -
    order[reqs.get(b.code)?.priority ?? "desirable"];
  const ref = (f: (typeof findings)[number]) =>
    [
      f.code,
      f.evidenceDocument && `${f.evidenceDocument}${f.evidencePage ? ` p. ${f.evidencePage}` : ""}`,
    ]
      .filter(Boolean)
      .join(" · ");
  const of = (type: PointType, statuses: FindingStatus[]) =>
    findings.filter((f) => typeOf(f.code) === type && statuses.includes(f.status)).sort(byPriority);
  const aspect = (type: PointType, what: string): ReportOutput["technical"] => {
    const all = findings.filter((f) => typeOf(f.code) === type);
    const met = of(type, ["compliant"]);
    const short = of(type, ["non_compliant", "not_addressed", "partial"]);
    const share = all.length ? met.length / all.length : 0;
    const rating: AspectRating = share >= 0.75 ? "strong" : share >= 0.45 ? "adequate" : "weak";
    return {
      rating,
      assessment: all.length
        ? `${name} fully meets ${met.length} of the ${all.length} ${what} points checked. ${short.length ? `${short.length} fall short, the most important being ${reqs.get(short[0].code)?.title ?? short[0].code}.` : "None falls short."} (Demo AI.)`
        : `The tender sets no ${what} points for this bid. (Demo AI.)`,
      strengths: met.slice(0, 4).map((f) => ({
        point: f.headline || reqs.get(f.code)?.title || f.code,
        reference: ref(f),
      })),
      weaknesses: short.slice(0, 4).map((f) => ({
        point: `${f.headline || reqs.get(f.code)?.title || f.code}${f.gap ? `: ${f.gap}` : ""}`,
        reference: ref(f),
      })),
    };
  };
  const technical = aspect("technical", "technical");
  const commercial = aspect("commercial", "commercial");
  const c = input.analysis.analysis.commercial;
  const price = !c.totalPrice
    ? "an unstated total"
    : c.currency && !c.totalPrice.includes(c.currency)
      ? `${c.currency} ${c.totalPrice}`
      : c.totalPrice;
  commercial.assessment = `${name} prices the bid at ${price}. Payment terms: ${c.paymentTerms ?? "not stated"}; warranty: ${c.warranty ?? "not stated"}; validity: ${c.validity ?? "not stated"}. ${commercial.assessment}`;
  const isPick = input.recommended === name;
  const mandatoryShort = findings.filter(
    (f) =>
      reqs.get(f.code)?.priority === "mandatory" &&
      (f.status === "non_compliant" || f.status === "not_addressed"),
  );
  const verdict: ReportOutput["verdict"] = isPick
    ? "preferred_bidder"
    : mandatoryShort.length > 2 || technical.rating === "weak"
      ? "not_recommended"
      : "acceptable_with_conditions";
  const partial = findings.filter((f) => f.status === "partial").sort(byPriority);
  return normalizeReport(
    {
      verdict,
      headline:
        verdict === "preferred_bidder"
          ? `${name} offers the best overall bid and should be taken forward, subject to the conditions below.`
          : verdict === "not_recommended"
            ? `${name}'s bid falls short on points the client cannot waive; an award is not advised.`
            : `${name} could be awarded only if the open points below are closed first.`,
      executiveSummary: `${name} ranks ${input.scores.rank} of ${input.ranked}. The technical proposal is ${technical.rating} and the commercial proposal ${commercial.rating}. ${mandatoryShort.length ? `${mandatoryShort.length} mandatory point${mandatoryShort.length === 1 ? "" : "s"} still fail${mandatoryShort.length === 1 ? "s" : ""}.` : "Every mandatory point is met."} This report was written by the demo engine from the analysis data. (Demo AI.)`,
      technical,
      commercial,
      balance: {
        assessment: `The technical proposal is ${technical.rating} and the commercial proposal ${commercial.rating}; ${technical.rating === commercial.rating ? "both carry similar weight in the decision" : `the ${technical.rating === "strong" || commercial.rating === "weak" ? "commercial" : "technical"} side needs the most attention before award`}. (Demo AI.)`,
        valueForMoney: `At ${price}, the client gets a ${technical.rating} solution. (Demo AI.)`,
      },
      concerns: (input.risks?.risks ?? []).slice(0, 3).map((r) => ({
        title: r.title,
        detail: r.consequence,
      })),
      recommendation: {
        opinion: `${verdict === "not_recommended" ? "Do not award to" : "Take forward"} ${name}${verdict === "not_recommended" ? " unless the failing mandatory points are corrected" : ", with the conditions below written into the contract"}. (Demo AI.)`,
        conditions: mandatoryShort
          .slice(0, 4)
          .map(
            (f) => `Written commitment to meet ${f.code} (${reqs.get(f.code)?.title ?? f.code}).`,
          ),
        negotiationPoints: [
          ...c.exclusions.slice(0, 2).map((x) => `Price the excluded item as an option: ${x}`),
          "Delay penalties tied to the delivery milestones.",
        ],
        clarifications: partial
          .slice(0, 4)
          .map(
            (f) =>
              `Confirm how ${f.code} (${reqs.get(f.code)?.title ?? f.code}) will be met in full.`,
          ),
      },
    },
    { recommended: isPick },
  );
}

/** Page text for the mock engine: real PDF pages, or the extracted text as one page. */
export function createPageLoader(storage: LocalStorage) {
  const cache = new Map<string, Promise<PageText[]>>();
  return (doc: SourceDoc): Promise<PageText[]> => {
    let hit = cache.get(doc.id);
    if (!hit) {
      hit =
        doc.ext === "pdf"
          ? storage
              .read(doc.storagePath)
              .then((b) => readPdfPages(b))
              .then((pages) => pages.map((text, i) => ({ page: i + 1, text })))
              .catch(() => [])
          : Promise.resolve(doc.textContent ? [{ page: null, text: doc.textContent }] : []);
      cache.set(doc.id, hit);
    }
    return hit;
  };
}

// ─── Engine ──────────────────────────────────────────────────────────────────
export function createMockEngine(deps: MockDeps): AiEngine {
  return {
    mode: "mock",
    async runStep<P extends StepInput["phase"]>(
      input: Extract<StepInput, { phase: P }>,
      hooks: StepHooks,
    ): Promise<CallResult<StepOutputs[P]>> {
      hooks.onStarted();
      const key = "vendor" in input ? `${input.phase}|${input.vendor.name}` : input.phase;
      await sleep(deps.stepMs ?? Math.round(2000 + seeded(key) * 3000), hooks.signal);
      const i = input as StepInput;
      const data =
        i.phase === "checklist"
          ? await checklist(i, deps)
          : i.phase === "analyze" || i.phase === "standards"
            ? await analyze(i, deps)
            : i.phase === "compare"
              ? compare(i)
              : i.phase === "risk"
                ? risk(i)
                : i.phase === "report"
                  ? report(i)
                  : summary(i);
      return result(data as StepOutputs[P]);
    },
  };
}
