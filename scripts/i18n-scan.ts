/**
 * Arabic UI check (2026-10-25): English left in the UI, and t() keys with no Arabic entry.
 *   npx tsx scripts/i18n-scan.ts                     src/components, src/app, src/hooks
 *   npx tsx scripts/i18n-scan.ts src/components/analysis src/hooks/use-runs.ts
 *   npx tsx scripts/i18n-scan.ts --summary           counts per file only
 * See src/lib/i18n/README.md.
 */
import { AR } from "../src/lib/i18n/ar";
import { collectKeys, placeholders, resolveFiles, scanFile } from "./i18n-lib";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const summary = process.argv.includes("--summary");

let untranslated = 0;
let missing = 0;
let mismatched = 0;
for (const file of resolveFiles(args)) {
  const hits = scanFile(file);
  const lines: string[] = hits.map((h) => `${h.file}:${h.line}  [${h.kind}]  ${h.text}`);
  untranslated += hits.length;
  for (const k of collectKeys(file)) {
    const entry = AR[k.key];
    if (entry === undefined) {
      missing++;
      lines.push(`${k.file}:${k.line}  [no Arabic]  ${k.key}`);
      continue;
    }
    const want = placeholders(k.key).join(",");
    for (const form of typeof entry === "string" ? [entry] : Object.values(entry)) {
      const got = placeholders(form!).filter((p, i, a) => a.indexOf(p) === i);
      const need = want.split(",").filter(Boolean);
      // A count may be written out ("مورد واحد" drops {n}); nothing else may be lost or renamed.
      const lost = typeof entry === "string" && need.some((p) => p !== "n" && !got.includes(p));
      if (got.some((p) => !need.includes(p)) || lost) {
        mismatched++;
        lines.push(`${k.file}:${k.line}  [placeholders]  ${k.key}  →  ${form}`);
      }
    }
  }
  if (!lines.length) continue;
  if (summary)
    console.log(`${String(lines.length).padStart(4)}  ${hits[0]?.file ?? lines[0].split(":")[0]}`);
  else console.log(lines.join("\n"));
}
console.log(
  `\n${untranslated} untranslated string(s), ${missing} key(s) with no Arabic, ${mismatched} placeholder mismatch(es)`,
);
process.exitCode = untranslated + missing + mismatched ? 1 : 0;
