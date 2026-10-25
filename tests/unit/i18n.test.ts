import path from "node:path";
import { describe, expect, it } from "vitest";
import { AR, AR_PARTS } from "@/lib/i18n/ar";
import { translate, translatePlural, translateText } from "@/lib/i18n/core";
import { analyzeLabel, formatDuration, planSteps, standardsLabel } from "@/lib/plan";
import { checkFile, legacyWarning } from "@/lib/files";
import { toErrorResponse, notFound } from "@/server/api";
import {
  collectKeys,
  placeholders,
  resolveFiles,
  scanFile,
  walk,
  ROOT,
} from "../../scripts/i18n-lib";

// Arabic UI (2026-10-25): every English text on screen has an Arabic translation.
const uiFiles = resolveFiles([]);
const libFiles = walk(path.join(ROOT, "src/lib")).filter((f) => !/[\\/]i18n[\\/]/.test(f));
const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

describe("Arabic dictionary", () => {
  it("translates every key the code uses (t, t.plural, msg)", () => {
    const missing = [...uiFiles, ...libFiles]
      .flatMap(collectKeys)
      .filter((k) => AR[k.key] === undefined)
      .map((k) => `${k.file}:${k.line}  ${k.key}`);
    expect(missing).toEqual([]);
  });

  it("leaves no English text outside t() in the UI", () => {
    const hits = uiFiles.flatMap(scanFile).map((h) => `${h.file}:${h.line}  ${h.text}`);
    expect(hits).toEqual([]);
  });

  it("keeps the placeholders of each key", () => {
    const bad: string[] = [];
    for (const [key, entry] of Object.entries(AR)) {
      const want = [...new Set(placeholders(key))];
      const forms = typeof entry === "string" ? [entry] : Object.values(entry);
      for (const form of forms) {
        const got = [...new Set(placeholders(form!))];
        // A count may be written out ("مورد واحد" drops {n}); no other placeholder may be lost,
        // added or renamed.
        const ok =
          got.every((p) => want.includes(p)) &&
          (typeof entry !== "string" || want.every((p) => got.includes(p) || p === "n"));
        if (!ok) bad.push(`${key} → ${form}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("keeps each key in one area file", () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const [area, dict] of Object.entries(AR_PARTS)) {
      for (const key of Object.keys(dict)) {
        if (seen.has(key)) dupes.push(`${key} (${seen.get(key)}, ${area})`);
        else seen.set(key, area);
      }
    }
    expect(dupes).toEqual([]);
  });

  it("writes Arabic, not English, in every entry", () => {
    const words = (s: string) => /[A-Za-z]/.test(s.replace(/\{\w+\}/g, ""));
    const english = Object.entries(AR)
      .filter(([k]) => words(k)) // "“{quote}”" has nothing to translate
      .filter(
        ([, e]) => !(typeof e === "string" ? [e] : Object.values(e)).every((f) => hasArabic(f!)),
      )
      .map(([k]) => k)
      // Names of things that stay in Latin script.
      .filter((k) => !["English"].includes(k));
    expect(english).toEqual([]);
  });
});

describe("translation helpers", () => {
  it("falls back to the English and fills placeholders", () => {
    expect(translate("en", "Rank {rank} of {n}", { rank: 1, n: 3 })).toBe("Rank 1 of 3");
    expect(translate("ar", "Not a key {x}", { x: 5 })).toBe("Not a key 5");
    expect(translate("ar", "Cancel")).toBe("إلغاء");
  });

  it("picks Arabic plural forms", () => {
    const f = (n: number) => translatePlural("ar", n, "{n} file", "{n} files");
    expect(translatePlural("en", 1, "{n} file", "{n} files")).toBe("1 file");
    expect(translatePlural("en", 4, "{n} file", "{n} files")).toBe("4 files");
    expect(f(1)).toBe("ملف واحد");
    expect(f(2)).toBe("ملفان");
    expect(f(5)).toBe("5 ملفات");
    expect(f(12)).toBe("12 ملفًا");
    expect(f(100)).toBe("100 ملف");
  });

  it("translates the analysis step labels the server stores", () => {
    const vendors = [
      { proposalId: "a", name: "Gulf Systems" },
      { proposalId: "b", name: "Al Noor Tech" },
    ];
    const labels = [
      ...planSteps(vendors, { standards: 2, rules: 14 }).map((s) => s.label),
      ...planSteps(vendors, { standards: 1, rules: 3 }).map((s) => s.label),
      ...planSteps(vendors, { standards: 0, rules: 0 }).map((s) => s.label),
      analyzeLabel("Gulf Systems", 42),
      standardsLabel("Gulf Systems", 1),
    ];
    for (const label of labels) {
      const ar = translateText("ar", label);
      expect(hasArabic(ar), label).toBe(true);
      expect(ar, label).not.toMatch(/Checking|Assessing|Writing|Building|Scoring/);
    }
    expect(translateText("ar", analyzeLabel("Gulf Systems", 42))).toContain("Gulf Systems");
    expect(translateText("ar", analyzeLabel("Gulf Systems", 42))).toContain("42");
  });

  it("translates file checks and durations", () => {
    const empty = checkFile({ name: "a.pdf", size: 0 }, { maxSizeMb: 50 })!.message;
    expect(hasArabic(translateText("ar", empty))).toBe(true);
    expect(hasArabic(translateText("ar", legacyWarning("old.doc")!))).toBe(true);
    expect(formatDuration(200, "ar")).toBe("3 د");
    expect(formatDuration(200)).toBe("3 min");
  });

  it("sends API errors in the reader's language", async () => {
    const ar = await toErrorResponse(notFound("Project"), "ar").json();
    expect(ar.error.message).toBe("تعذّر العثور على المشروع.");
    const en = await toErrorResponse(notFound("Project")).json();
    expect(en.error.message).toBe("Project not found.");
  });
});
