/**
 * The Translator (2026-10-25): the last step of a run writes every AI-written text in the run's
 * other language, so one run gives English and Arabic results. Always Haiku (translation is an
 * easy task; it keeps the cost to a few cents whatever model ran the analysis). Identical texts
 * are translated once; texts go in batches, a few at a time; a batch that leaves items out is
 * asked once more for them, and anything still missing keeps its original text.
 */
import "server-only";
import { z } from "zod";
import { addUsage, TRANSLATOR_MODEL } from "../../lib/plan";
import { EMPTY_USAGE, type ReportLanguage, type TokenUsage } from "../../lib/domain";
import { callStructured } from "./client";
import type { CallResult } from "./result";
import type { RunText } from "../runs/texts";

export const TranslationSchema = z.object({
  items: z.array(z.object({ id: z.string(), text: z.string() })),
});

export interface TranslationOutput {
  target: ReportLanguage;
  /** Text key → translation. */
  texts: Record<string, string>;
}

const BATCH_CHARS = 9_000;
const BATCH_ITEMS = 120;
const PARALLEL = 4;

const NAME: Record<ReportLanguage, string> = { en: "English", ar: "Modern Standard Arabic" };

/** Procurement terms in the app's Arabic (src/lib/i18n/README.md glossary). */
const GLOSSARY_AR = [
  ["vendor / bidder", "المورّد / مقدّم العطاء"],
  ["proposal / bid", "العرض / العطاء"],
  ["RFP (the client's request)", "طلب العروض"],
  ["tender", "المناقصة"],
  ["standard / rule", "المعيار / القاعدة"],
  ["requirement", "المتطلب"],
  [
    "compliant / partially compliant / non-compliant / not addressed",
    "مطابق / مطابق جزئيًا / غير مطابق / لم يُتناول",
  ],
  ["mandatory / important / desirable", "إلزامي / مهم / مرغوب"],
  ["risk / mitigation", "الخطر / إجراءات التخفيف"],
  ["recommendation / recommended vendor", "التوصية / المورّد الموصى به"],
  ["preferred bidder", "مقدّم العطاء المفضّل"],
  ["bill of quantities (BOQ)", "جدول الكميات"],
  ["bid bond / performance guarantee", "التأمين الابتدائي / ضمان حسن التنفيذ"],
  ["commercial / technical proposal", "العرض التجاري / العرض الفني"],
  ["award", "الترسية"],
] as const;

export function translatorPrompt(source: ReportLanguage, target: ReportLanguage): string {
  const glossary =
    target === "ar"
      ? `\n- Use these terms:\n${GLOSSARY_AR.map(([en, ar]) => `  - ${en} → ${ar}`).join("\n")}`
      : "";
  return `You are a professional translator for a UAE government procurement team in Sharjah. You translate the results of a tender evaluation (findings, risks, recommendations and consultant reports) from ${NAME[source]} into ${NAME[target]}.

You receive a JSON object {"items": [{"id", "text"}, …]}. Return every item, with the same id, its text translated.

Rules:
- Translate faithfully and completely: the same meaning, facts, numbers and tone. Add nothing, leave nothing out, never summarise or explain.
- Write formal, clear ${NAME[target]}, as in an official evaluation report.
- Keep exactly as written, never translated or transliterated: company and vendor names, product and model names, document titles and file names, requirement, clause and rule codes (REQ-001, SEC-01, §4.1, Annex B), standard codes (ISO 27001, EN 14211), amounts, currencies, units, percentages, dates, URLs and e-mail addresses.
- Text in quotation marks that quotes a document stays in its original language.
- Use Western digits (0–9).
- An item that is only a code, a name or a number stays unchanged.${glossary}`;
}

/** Identical texts once: the unique texts with short ids, and the keys each one fills. */
export function dedupeTexts(texts: RunText[]) {
  const idOf = new Map<string, string>();
  const keysOf = new Map<string, string[]>();
  const unique: { id: string; text: string }[] = [];
  for (const t of texts) {
    let id = idOf.get(t.text);
    if (!id) {
      id = String(unique.length + 1);
      idOf.set(t.text, id);
      unique.push({ id, text: t.text });
      keysOf.set(id, []);
    }
    keysOf.get(id)!.push(t.key);
  }
  return { unique, keysOf };
}

export function batches<T extends { text: string }>(items: T[]): T[][] {
  const out: T[][] = [];
  let cur: T[] = [];
  let chars = 0;
  for (const it of items) {
    if (cur.length && (chars + it.text.length > BATCH_CHARS || cur.length >= BATCH_ITEMS)) {
      out.push(cur);
      cur = [];
      chars = 0;
    }
    cur.push(it);
    chars += it.text.length;
  }
  if (cur.length) out.push(cur);
  return out;
}

export async function translateTexts(
  texts: RunText[],
  {
    source,
    target,
    signal,
    onStarted,
  }: {
    source: ReportLanguage;
    target: ReportLanguage;
    signal?: AbortSignal;
    onStarted?: () => void;
  },
): Promise<CallResult<TranslationOutput>> {
  const { unique, keysOf } = dedupeTexts(texts);
  const done = new Map<string, string>();
  let usage: TokenUsage = EMPTY_USAGE;
  let model: string = TRANSLATOR_MODEL;
  const system = translatorPrompt(source, target);

  const translate = async (batch: { id: string; text: string }[]) => {
    const res = await callStructured({
      model: TRANSLATOR_MODEL,
      system,
      content: [{ type: "text", text: JSON.stringify({ items: batch }) }],
      schema: TranslationSchema,
      effort: "low",
      signal,
      onStarted,
    });
    usage = addUsage(usage, res.usage);
    model = res.model;
    const wanted = new Set(batch.map((b) => b.id));
    for (const it of res.data.items) {
      if (wanted.has(it.id) && it.text.trim()) done.set(it.id, it.text.trim());
    }
  };

  const pool = async (list: { id: string; text: string }[][]) => {
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(PARALLEL, list.length) }, async () => {
        while (next < list.length) await translate(list[next++]);
      }),
    );
  };

  await pool(batches(unique));
  // One more pass for anything a batch left out.
  const missing = unique.filter((u) => !done.has(u.id));
  if (missing.length) await pool(batches(missing));

  const out: Record<string, string> = {};
  for (const [id, translation] of done)
    for (const key of keysOf.get(id) ?? []) out[key] = translation;
  return { data: { target, texts: out }, usage, model, stopReason: "end_turn" };
}
