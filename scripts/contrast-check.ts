/**
 * WCAG contrast check for the Harbor tokens in src/app/globals.css (P1.2).
 * Usage: npx tsx scripts/contrast-check.ts   → exits 1 if any pair fails.
 * Translucent colours (#RRGGBBAA) are composited over the background they sit on.
 */
import fs from "node:fs";
import path from "node:path";

type Vars = Record<string, string>;
type RGBA = { r: number; g: number; b: number; a: number };

const css = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

function block(selector: string): Vars {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`Block ${selector} not found`);
  const body = css.slice(start, css.indexOf("\n}", start));
  const vars: Vars = {};
  for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

const light = block(":root");
const dark = { ...light, ...block(".dark") };

function resolve(vars: Vars, name: string, depth = 0): string {
  const raw = vars[name];
  if (raw === undefined) throw new Error(`Unknown token --${name}`);
  const ref = raw.match(/^var\(--([\w-]+)\)$/);
  return ref && depth < 10 ? resolve(vars, ref[1], depth + 1) : raw;
}

function parseHex(hex: string): RGBA {
  const h = hex.replace("#", "");
  if (![6, 8].includes(h.length)) throw new Error(`Unsupported colour: ${hex}`);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
  };
}

const over = (top: RGBA, base: RGBA): RGBA => ({
  r: top.r * top.a + base.r * (1 - top.a),
  g: top.g * top.a + base.g * (1 - top.a),
  b: top.b * top.a + base.b * (1 - top.a),
  a: 1,
});

function luminance({ r, g, b }: RGBA): number {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

const ratio = (a: RGBA, b: RGBA) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** [foreground, background, minimum ratio, note]. Backgrounds may be translucent: they sit on `surface`. */
const PAIRS: [string, string, number, string][] = [
  ["ink", "background", 4.5, "body text"],
  ["ink", "surface", 4.5, "card text"],
  ["ink", "frame", 4.5, "sidebar text"],
  ["ink-2", "surface", 4.5, "secondary text"],
  ["ink-2", "frame", 4.5, "sidebar items"],
  ["ink-muted", "surface", 4.5, "muted text on cards"],
  ["ink-muted", "background", 4.5, "muted text on page"],
  ["ink-muted", "surface-muted", 4.5, "muted text on muted"],
  ["ink-muted", "frame", 4.5, "muted text on frame"],
  ["ink-faint", "surface", 3, "placeholders / decorative (large or non-essential)"],
  ["brand", "surface", 4.5, "links / brand text"],
  ["brand", "background", 4.5, "brand text on page"],
  ["on-brand", "brand", 4.5, "primary button label"],
  ["on-brand", "brand-hover", 4.5, "primary button hover"],
  ["brand-ink", "brand-soft", 4.5, "selected chip text"],
  ["navy", "surface", 4.5, "brand mark text"],
  ["ok", "ok-soft", 4.5, "compliant pill"],
  ["ok", "surface", 4.5, "compliant text"],
  ["partial", "partial-soft", 4.5, "partial pill"],
  ["partial", "surface", 4.5, "partial text"],
  ["fail", "fail-soft", 4.5, "non-compliant pill"],
  ["fail", "surface", 4.5, "non-compliant text"],
  ["missing", "missing-soft", 4.5, "not-addressed pill"],
  ["missing", "surface", 4.5, "not-addressed text"],
  ["info", "info-soft", 4.5, "info pill"],
  ["risk-low", "risk-low-soft", 4.5, "risk low"],
  ["risk-moderate", "risk-moderate-soft", 4.5, "risk moderate"],
  ["risk-high", "risk-high-soft", 4.5, "risk high"],
  ["risk-critical", "risk-critical-soft", 4.5, "risk critical"],
  ["border-strong", "surface", 1.4, "input borders (non-text, decorative min)"],
];

let failures = 0;
for (const [label, vars] of [
  ["LIGHT", light],
  ["DARK", dark],
] as const) {
  console.log(`\n${label}`);
  const surface = parseHex(resolve(vars, "surface"));
  for (const [fg, bg, min, note] of PAIRS) {
    const bgColor = over(parseHex(resolve(vars, bg)), surface);
    const fgColor = over(parseHex(resolve(vars, fg)), bgColor);
    const r = ratio(fgColor, bgColor);
    const ok = r >= min;
    if (!ok) failures++;
    console.log(
      `  ${ok ? "✔" : "✘"} ${r.toFixed(2).padStart(5)}:1 (min ${min})  ${fg} on ${bg}  — ${note}`,
    );
  }
}

console.log(failures ? `\n✘ ${failures} pair(s) below minimum` : "\n✔ All pairs pass");
process.exit(failures ? 1 : 0);
