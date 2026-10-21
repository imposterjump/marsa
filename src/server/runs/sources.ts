/**
 * Where a requirement comes from, as links (user request after P7): the checklist stores a free
 * text reference such as "RFP §4.6.1; SEC-02" or "Annex B TB-24". This resolves it, without any
 * AI call, into
 *   - standard rules (code matched against the run's standards → rule text + standard page), and
 *   - RFP locations (the clause token found in the RFP documents' text → document + page), so the
 *     reader can open the RFP on that page with the clause highlighted.
 * Page texts are cached per document. No `server-only` (G-08).
 */
import type { Db } from "../db/connect";
import type { LocalStorage } from "../storage/local";
import { readPdfPages } from "../documents/pdf-text";
import type { RequirementSourceDto } from "../../lib/api-types";
import type { RunContext, SourceDoc } from "../ai/types";
import { loadRunContext } from "./context";
import type { RunRow } from "./store";

const escape = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pageCache = new Map<string, Promise<string[]>>();
function pagesOf(storage: LocalStorage, d: SourceDoc): Promise<string[]> {
  let hit = pageCache.get(d.id);
  if (!hit) {
    hit =
      d.ext === "pdf"
        ? storage
            .read(d.storagePath)
            .then((b) => readPdfPages(b))
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

/**
 * First page where the token starts a line (a clause heading), else where it appears at all.
 * A bare section number ("8") only counts as a heading ("8. Evaluation"), never as any number.
 */
export function findToken(pages: string[], token: string): number {
  const t = escape(token);
  if (/^\d+$/.test(token)) {
    const heading = new RegExp(`(^|\\n)\\s*${t}[.)]?\\s+[A-Z]`);
    return pages.findIndex((p) => heading.test(p));
  }
  const atLine = new RegExp(`(^|\\n)\\s*${t}(?![\\d.])`, "i");
  const anywhere = new RegExp(`(^|[^\\w.])${t}(?![\\d.])`, "i");
  const i = pages.findIndex((p) => atLine.test(p));
  return i >= 0 ? i : pages.findIndex((p) => anywhere.test(p));
}

export interface ResolvableRequirement {
  id: string;
  sourceType: string;
  sourceRef: string;
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
        list.push({
          kind: "rfp",
          label: part,
          documentId: named.id,
          documentName: named.name,
          page: pageHint ? Number(pageHint[1]) : null,
          needle: null,
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
              needle: t,
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
