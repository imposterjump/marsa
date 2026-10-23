/**
 * Proposal sections (P8 template): normalising what the AI wrote ("Security & data",
 * "security") to a section key, and a keyword guess used by the demo engine and as a fallback.
 * Pure; shared by server and UI.
 */
import { PROPOSAL_SECTIONS, type ProposalSection } from "./domain";
import { PROPOSAL_SECTION_LABEL } from "./labels";

const HINTS: [ProposalSection, RegExp][] = [
  [
    "commercial",
    /\b(price|pricing|cost|payment|invoice|currency|bank guarantee|bid security|performance security|advance|escalat|subscription|fee)\b/i,
  ],
  [
    "terms",
    /\b(contract|law|liabilit|terms|deviation|validity|integrity|conflict of interest|subcontract|governing|arbitration|penalt)/i,
  ],
  [
    "security",
    /\b(security|secur|encrypt|authenticat|mfa|password|audit log|siem|vulnerab|penetration|data residency|national territory|cloud|hosting|hosted|on-?premise|backup|tls|aes|vpn|vetting|sbom)/i,
  ],
  [
    "support",
    /\b(support|warranty|maintenance|spare|service level|sla|response|restoration|helpdesk|service desk|replacement)/i,
  ],
  [
    "implementation",
    /\b(implement|schedule|deliver|install|commission|milestone|months?|weeks?|pilot|rollout|roll-out|go-live|training|acceptance test|cut over|migration)/i,
  ],
  [
    "company",
    /\b(company|references?|experience|staff|certified partner|founded|track record|financial standing|local presence)/i,
  ],
];

/** Best-effort section for a requirement, rule or risk text. */
export function guessSection(text: string): ProposalSection {
  return HINTS.find(([, re]) => re.test(text))?.[0] ?? "solution";
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
