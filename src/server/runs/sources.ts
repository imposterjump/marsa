/**
 * Where a requirement comes from, as links (user request after P7): the checklist stores a free
 * text reference such as "RFP §4.6.1; SEC-02" or "Annex B TB-24". This resolves it, without any
 * AI call, into
 *   - standard rules (code matched against the run's standards → rule text + standard page), and
 *   - RFP locations: the clause found in the RFP documents' text → document + page + the clause's
 *     own text, so the reader opens the RFP on that page with the whole clause highlighted (the
 *     clause number alone would only highlight "4.6.1").
 * Page texts are cached per document. No `server-only` (G-08).
 */
import type { Db } from "../db/connect";
import type { LocalStorage } from "../storage/local";
import { readPdfPages } from "../documents/pdf-text";
import type { RequirementSourceDto } from "../../lib/api-types";
import { textContainsQuote } from "../../lib/quote";
import type { RunContext, SourceDoc } from "../ai/types";
import { loadRunContext } from "./context";
import type { RunRow } from "./store";

const escape = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Running headers and footers (lines repeated on most pages, "Page 8 of 13") are removed, so a
 * clause at the bottom of a page doesn't run into the footer.
 */
export function stripRunningLines(pages: string[]): string[] {
  if (pages.length < 3) return pages.map((p) => p.replace(/^.*\bPage \d+ of \d+.*$/gm, ""));
  const seen = new Map<string, number>();
  for (const p of pages) {
    // Exact repeats only: body lines that differ just in a number must stay.
    for (const l of new Set(p.split("\n").map((x) => x.trim()))) {
      if (l.length >= 8) seen.set(l, (seen.get(l) ?? 0) + 1);
    }
  }
  const repeated = new Set([...seen].filter(([, n]) => n >= pages.length / 2).map(([l]) => l));
  return pages.map((p) =>
    p
      .split("\n")
      .filter((l) => !repeated.has(l.trim()) && !/\bPage \d+ of \d+/.test(l))
      .join("\n"),
  );
}

const pageCache = new Map<string, Promise<string[]>>();
function pagesOf(storage: LocalStorage, d: SourceDoc): Promise<string[]> {
  let hit = pageCache.get(d.id);
  if (!hit) {
    hit =
      d.ext === "pdf"
        ? storage
            .read(d.storagePath)
            .then((b) => readPdfPages(b))
            .then(stripRunningLines)
            .catch(() => [])
        : Promise.resolve(d.textContent ? [d.textContent] : []);
    pageCache.set(d.id, hit);
    if (pageCache.size > 40) pageCache.delete(pageCache.keys().next().value!);
  }
  return hit;
}

/** Clause tokens worth searching for: "§4.6.1" → "4.6.1"; codes like "TB-24", "GC 10.1", "A3". */
export function clauseTokens(ref: string, ruleCodes: Set<string>): string[] {
  const out: string[] = [];
  for (const m of ref.matchAll(/§\s*(\d+(?:\.\d+)+|\d+)/g)) out.push(m[1]);
  for (const m of ref.matchAll(/\b([A-Z]{1,4}[- ]?\d+(?:\.\d+)*)\b/g)) {
    const t = m[1];
    if (ruleCodes.has(t.toUpperCase()) || /^(RFP|REQ)\b/i.test(t)) continue;
    out.push(t);
  }
  for (const m of ref.matchAll(/(?:^|[\s(])(\d+\.\d+(?:\.\d+)*)(?=[\s,;)]|$)/g)) {
    // A bare number that is part of a code already found ("GC 10.1") would match elsewhere.
    if (!out.some((t) => t.includes(m[1]))) out.push(m[1]);
  }
  return [...new Set(out)];
}

/** Hints like "Annex B", "Addendum", "Draft Contract" pick the right RFP document first. */
function docHintScore(ref: string, d: SourceDoc): number {
  const r = ref.toLowerCase();
  const n = d.name.toLowerCase().replace(/[-_]/g, " ");
  let s = 0;
  for (const hint of ["annex a", "annex b", "annex c", "addendum", "contract", "specification"]) {
    if (r.includes(hint) && n.includes(hint)) s += 2;
  }
  if (r.includes(d.name.toLowerCase())) s += 5;
  return s;
}

function rankDocs(ref: string, docs: SourceDoc[]): SourceDoc[] {
  return [...docs].sort((a, b) => docHintScore(ref, b) - docHintScore(ref, a));
}

/** Where the token starts on a page: a clause heading at line start wins over a mere mention. */
function tokenStart(page: string, token: string): number {
  const t = escape(token);
  if (/^\d+$/.test(token)) {
    // A bare section number only counts as a heading ("8. Evaluation"), never as any number.
    const m = new RegExp(`(^|\\n)\\s*(${t}[.)]?\\s+[A-Z])`).exec(page);
    return m ? m.index + m[0].indexOf(m[2]) : -1;
  }
  // A table row starts with "|" in extracted DOCX / XLSX text: treat it like leading space.
  const line = new RegExp(`(^|\\n)[\\s|]*(${t})(?![\\d.])`, "i").exec(page);
  if (line) return line.index + line[0].indexOf(line[2]);
  const any = new RegExp(`(^|[^\\w.])(${t})(?![\\d.])`, "i").exec(page);
  return any ? any.index + any[0].indexOf(any[2]) : -1;
}

/** First page where the token starts a line (a clause heading), else where it appears at all. */
export function findToken(pages: string[], token: string): number {
  const t = escape(token);
  if (/^\d+$/.test(token)) return pages.findIndex((p) => tokenStart(p, token) >= 0);
  const atLine = new RegExp(`(^|\\n)[\\s|]*${t}(?![\\d.])`, "i");
  const i = pages.findIndex((p) => atLine.test(p));
  return i >= 0 ? i : pages.findIndex((p) => tokenStart(p, token) >= 0);
}

/**
 * The clause that starts at `token` on this page, as it reads in the document: up to the next
 * clause heading ("4.6.2 …", "TB-25 …", "(b) …"), one paragraph or table row for text documents,
 * at most ~320 characters (cut at a sentence end). Null when the token isn't on the page.
 */
export function clauseText(page: string, token: string, textDocument = false): string | null {
  const start = tokenStart(page, token);
  if (start < 0) return null;
  let rest = page.slice(start);
  const next = /\n[\s|]*(?:\d+(?:\.\d+)+\s|[A-Z]{1,4}[- ]?\d+(?:\.\d+)*\s|\(\w\)\s)/.exec(
    rest.slice(token.length),
  );
  if (next) rest = rest.slice(0, token.length + next.index);
  if (textDocument) {
    // DOCX / XLSX text: a table row is one line, a paragraph ends at a blank line. The "|" cell
    // separators aren't in the rendered page, so they become spaces.
    const lineStart = page.lastIndexOf("\n", start) + 1;
    const inTable = page.slice(lineStart, start).trim().startsWith("|");
    rest = (inTable ? rest.split("\n")[0] : rest.split(/\n\s*\n/)[0])
      .replace(/\s*\|\s*/g, " ")
      .replace(/\s+$/, "");
  }
  let text = rest.replace(/\s+/g, " ").trim();
  if (text.length > 320) {
    const cut = text.slice(0, 320);
    const end = cut.lastIndexOf(". ");
    text = end > 80 ? cut.slice(0, end + 1) : cut;
  }
  return text.length > token.length ? text : null;
}

export interface ResolvableRequirement {
  id: string;
  sourceType: string;
  sourceRef: string;
  /** Used as the highlight when it appears word for word on the cited page (e.g. mock runs). */
  description?: string;
}

export async function resolveSources(
  db: Db,
  storage: LocalStorage,
  run: RunRow,
  requirements: ResolvableRequirement[],
): Promise<Map<string, RequirementSourceDto[]>> {
  const ctx: RunContext = loadRunContext(db, run.projectId, run.config);
  const rules = ctx.standards.flatMap((s) =>
    s.rules.map((r) => ({ standard: s, code: r.code, text: r.text })),
  );
  const ruleCodes = new Set(rules.map((r) => r.code.toUpperCase()));
  const out = new Map<string, RequirementSourceDto[]>();

  for (const req of requirements) {
    const ref = req.sourceRef;
    const list: RequirementSourceDto[] = [];
    const upper = ref.toUpperCase();
    for (const r of rules) {
      if (new RegExp(`(^|[^A-Z0-9-])${escape(r.code.toUpperCase())}($|[^A-Z0-9])`).test(upper)) {
        list.push({
          kind: "standard",
          label: `${r.standard.code} ${r.code}`,
          standardId: r.standard.id,
          standardCode: r.standard.code,
          ruleCode: r.code,
          ruleText: r.text,
        });
      }
    }
    if (req.sourceType === "notes")
      list.push({ kind: "notes", label: "Customer's evaluation notes" });

    // RFP part: explicit "file.pdf p.N" (mock / precise refs) or clause tokens searched in the text.
    const rest = ref
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter((s) => s && !rules.some((r) => s.toUpperCase() === r.code.toUpperCase()));
    for (const part of rest) {
      const named = ctx.rfpDocs.find((d) => part.toLowerCase().includes(d.name.toLowerCase()));
      const pageHint = part.match(/\bp(?:age)?\.?\s*(\d+)\b/i);
      if (named) {
        const page = pageHint ? Number(pageHint[1]) : null;
        const pages = await pagesOf(storage, named);
        const pageText = pages[(page ?? 1) - 1] ?? "";
        list.push({
          kind: "rfp",
          label: part,
          documentId: named.id,
          documentName: named.name,
          page,
          needle:
            req.description && textContainsQuote(pageText, req.description)
              ? req.description
              : null,
        });
        continue;
      }
      const tokens = clauseTokens(part, ruleCodes);
      let found: RequirementSourceDto | null = null;
      for (const doc of rankDocs(part, ctx.rfpDocs)) {
        if (!doc.aiReadable) continue;
        const pages = await pagesOf(storage, doc);
        for (const t of tokens) {
          const i = findToken(pages, t);
          if (i >= 0) {
            found = {
              kind: "rfp",
              label: part,
              documentId: doc.id,
              documentName: doc.name,
              page: doc.ext === "pdf" ? i + 1 : null,
              needle: clauseText(pages[i], t, doc.ext !== "pdf") ?? t,
            };
            break;
          }
        }
        if (found) break;
      }
      // No clause found, but the reference names a document ("Annex C App. 2"): open that document.
      const hinted = found
        ? null
        : rankDocs(part, ctx.rfpDocs).find((d) => docHintScore(part, d) > 0);
      if (found) list.push(found);
      else if (hinted) {
        list.push({
          kind: "rfp",
          label: part,
          documentId: hinted.id,
          documentName: hinted.name,
          page: null,
          needle: null,
        });
      } else if (!list.some((x) => x.kind === "standard") || /rfp|annex|addendum|§/i.test(part)) {
        list.push({
          kind: "rfp",
          label: part,
          documentId: null,
          documentName: null,
          page: null,
          needle: null,
        });
      }
    }
    out.set(req.id, list);
  }
  return out;
}
