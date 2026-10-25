/**
 * Proposal sections (P8 template): normalising what the AI wrote ("Security & data",
 * "security") to a section key, and a keyword guess used by the demo engine and as a fallback.
 * Pure; shared by server and UI.
 */
import { PROPOSAL_SECTIONS, type ProposalSection } from "./domain";
import { PROPOSAL_SECTION_LABEL } from "./labels";

/**
 * Keywords per section, with a weight. Every section is scored and the highest score wins (ties:
 * list order), so a clause that names a payment and an acceptance lands where its words point.
 * Money and contract words weigh double: they are rarer and decide the section when present.
 * "Bid security" and "performance security" are contract terms, not information security.
 */
const HINTS: [ProposalSection, number, RegExp][] = [
  [
    "terms",
    2,
    /\b(bid validity|validity of|conditions of contract|general conditions|contract terms|governing law|liabilit|deviations? (from|to) the|bid security|performance security|bank guarantee|guarantee issued|penalt|liquidated damages|arbitration|subcontract|conflict of interest|integrity pact|insurance)/gi,
  ],
  [
    "commercial",
    2,
    /\b(price[sd]?|pricing|cost|payments?|invoice|currency|advance|escalat|subscription|fee|lump sum|financial)/gi,
  ],
  [
    "company",
    1,
    /\b(compan(y|ies)|references?(?! (method|principle|station|instrument|material))|experience|\d+ (staff|employees)|founded|track record|financial standing|local presence|office (in|or)|(authorised|certified) (service )?partner|service partner|manufacturer|oem|iso 9001|turnover|similar [a-z -]{0,25}(projects?|contracts?|installations?|networks?|systems?))/gi,
  ],
  [
    "implementation",
    1,
    /\b(implement|schedule|deliver(y|ed)?|install(ed|ation)? (and|within|of)|commission|milestone|within \d+ (months?|weeks?)|pilot|rollout|roll-out|go-live|training|trained|acceptance tests?|site acceptance|performance test|trial run|cut ?over|migration|site survey)/gi,
  ],
  [
    "support",
    1,
    /\b(support|warranty|maintenance|spare|service level|sla|response time|respond|on-site response|restoration|helpdesk|service desk|replacement|replaced|availability|uptime|operation and maintenance|o&m|calibrat|consumables)/gi,
  ],
  [
    "security",
    1,
    /\b(cyber|information security|encrypt|authenticat|multi-factor|mfa|password|audit (log|trail|record)s?|siem|vulnerab|penetration|data residency|within the state|national territory|cloud|hosting|hosted|on-?premise|data cent(re|er)|server rooms?|backup|tls|aes|vpn|active directory|single sign-on|access rights|personal data|kept for (at least )?\d+ years|retention)/gi,
  ],
];

/**
 * Commercial or technical point (user, 2026-10-25), by the proposal section it is answered in:
 * "Commercial offer & pricing" and "Terms & deviations" are commercial, the other five technical.
 * Points without a section (runs from before P8) have no type.
 */
export type PointType = "technical" | "commercial";
export const COMMERCIAL_SECTIONS: readonly ProposalSection[] = ["commercial", "terms"];
export const pointType = (s: ProposalSection | null): PointType | null =>
  s === null ? null : COMMERCIAL_SECTIONS.includes(s) ? "commercial" : "technical";

/** Best-effort section for a requirement, rule or risk text: the section with the best score. */
export function guessSection(text: string): ProposalSection {
  let best: ProposalSection = "solution";
  let bestScore = 0;
  for (const [section, weight, re] of HINTS) {
    const score = (text.match(re)?.length ?? 0) * weight;
    if (score > bestScore) {
      best = section;
      bestScore = score;
    }
  }
  return best;
}

/** The model's section value → a key; falls back to a keyword guess on `context`. */
export function toSection(value: string | null | undefined, context = ""): ProposalSection {
  const v = (value ?? "").trim().toLowerCase();
  const key = PROPOSAL_SECTIONS.find(
    (k) => k === v || PROPOSAL_SECTION_LABEL[k].toLowerCase() === v,
  );
  if (key) return key;
  const partial = PROPOSAL_SECTIONS.find(
    (k) => v && (PROPOSAL_SECTION_LABEL[k].toLowerCase().includes(v) || v.includes(k)),
  );
  return partial ?? guessSection(`${value ?? ""} ${context}`);
}

/** "company" = "Company & references", … for prompts. */
export const SECTION_LIST = PROPOSAL_SECTIONS.map(
  (k) => `"${k}" (${PROPOSAL_SECTION_LABEL[k]})`,
).join(", ");
