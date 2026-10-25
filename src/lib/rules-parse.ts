/**
 * Bulk "Paste rules" parser (Standards → rules editor).
 * One rule per line:   CODE | rule text | priority
 *   - separator: "|" or a TAB (so rows pasted from Excel/Word tables work)
 *   - priority: mandatory / important / desirable, or M / I / D (case-insensitive), or the Arabic
 *     إلزامي / مهم / مرغوب; defaults to important
 *   - CODE may be omitted ("rule text | priority" or just "rule text"): a code is generated
 *   - blank lines and lines starting with "#" are ignored
 */
import { PRIORITIES, type Priority } from "./domain";

export interface ParsedRule {
  line: number;
  code: string | null;
  text: string;
  priority: Priority;
}

export interface ParseError {
  line: number;
  message: string;
  raw: string;
}

const PRIORITY_ALIASES: Record<string, Priority> = {
  m: "mandatory",
  mandatory: "mandatory",
  must: "mandatory",
  i: "important",
  important: "important",
  d: "desirable",
  desirable: "desirable",
  optional: "desirable",
  // Arabic (2026-10-25): rules pasted or uploaded from an Arabic standard.
  إلزامي: "mandatory",
  الزامي: "mandatory",
  مهم: "important",
  مرغوب: "desirable",
  اختياري: "desirable",
};

const CODE_RE = /^[A-Za-z][A-Za-z0-9._-]{0,23}$/;
export const RULE_TEXT_MAX = 1000;

export function parsePriority(v: string): Priority | null {
  return PRIORITY_ALIASES[v.trim().toLowerCase()] ?? null;
}

export function parseRules(input: string): { rules: ParsedRule[]; errors: ParseError[] } {
  const rules: ParsedRule[] = [];
  const errors: ParseError[] = [];
  const seen = new Set<string>();

  input.split(/\r?\n/).forEach((raw, idx) => {
    const line = idx + 1;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const parts = (raw.includes("\t") ? raw.split("\t") : raw.split("|")).map((p) => p.trim());
    let code: string | null = null;
    let text: string;
    let priority: Priority = "important";

    if (parts.length >= 3) {
      code = parts[0] || null;
      text = parts.slice(1, -1).join(" | ");
      const p = parsePriority(parts[parts.length - 1]);
      if (!p) {
        errors.push({
          line,
          raw,
          message: `Unknown priority "${parts[parts.length - 1]}" (use mandatory, important or desirable).`,
        });
        return;
      }
      priority = p;
    } else if (parts.length === 2) {
      const p = parsePriority(parts[1]);
      if (p) {
        text = parts[0];
        priority = p;
      } else {
        code = parts[0] || null;
        text = parts[1];
      }
    } else {
      text = parts[0];
    }

    if (code && !CODE_RE.test(code)) {
      errors.push({
        line,
        raw,
        message: `Invalid code "${code}" (letters, digits, - . _ ; max 24 chars, start with a letter).`,
      });
      return;
    }
    if (!text) {
      errors.push({ line, raw, message: "Rule text is empty." });
      return;
    }
    if (text.length > RULE_TEXT_MAX) {
      errors.push({ line, raw, message: `Rule text is longer than ${RULE_TEXT_MAX} characters.` });
      return;
    }
    if (code) {
      const key = code.toUpperCase();
      if (seen.has(key)) {
        errors.push({ line, raw, message: `Duplicate code "${code}" in the pasted text.` });
        return;
      }
      seen.add(key);
    }
    rules.push({ line, code, text, priority });
  });

  return { rules, errors };
}

/** Next free code for a standard, e.g. prefix "SEC" + existing ["SEC-01","SEC-07"] → "SEC-08". */
export function nextRuleCode(prefix: string, existing: string[]): string {
  const clean =
    (prefix || "R")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 8) || "R";
  const re = new RegExp(`^${clean}-(\\d+)$`, "i");
  const max = existing.reduce((m, c) => {
    const hit = re.exec(c);
    return hit ? Math.max(m, Number(hit[1])) : m;
  }, 0);
  return `${clean}-${String(max + 1).padStart(2, "0")}`;
}

export { PRIORITIES };
