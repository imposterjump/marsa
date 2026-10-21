/**
 * Evidence quotes (P5.7, RDD §8.5): find a quote in rendered text and highlight it.
 * Matching ignores case, whitespace, typographic quotes/dashes and soft hyphens, because PDF text
 * layers split words into spans and drop or add spaces. Only the first ~80 characters are used.
 */

const NEEDLE_CHARS = 80;

function normChar(c: string): string {
  switch (c) {
    case "‘":
    case "’":
    case "‛":
    case "′":
      return "'";
    case "“":
    case "”":
    case "‟":
    case "″":
      return '"';
    case "‐":
    case "‑":
    case "‒":
    case "–":
    case "—":
    case "−":
      return "-";
    case "­": // soft hyphen
    case "​": // zero-width space
    case "﻿":
      return "";
    default:
      return /\s/.test(c) ? "" : c.toLowerCase();
  }
}

/** Normalised form used for matching (no whitespace at all). */
export function normalizeForMatch(text: string): string {
  let out = "";
  for (const c of text.normalize("NFKC")) out += normChar(c);
  return out;
}

/**
 * Needles to search for, longest first: the first ~80 meaningful characters, then shorter prefixes.
 * The fallbacks find quotes that run across a page break (the rest is on the next page).
 */
export function quoteNeedles(quote: string): string[] {
  const n = normalizeForMatch(quote);
  return [...new Set([n.slice(0, NEEDLE_CHARS), n.slice(0, 48), n.slice(0, 28)])].filter(
    (x) => x.length >= 3,
  );
}

/** The primary needle (first ~80 meaningful characters). */
export function quoteNeedle(quote: string): string {
  return quoteNeedles(quote)[0] ?? "";
}

export function textContainsQuote(text: string, quote: string): boolean {
  const hay = normalizeForMatch(text);
  return quoteNeedles(quote).some((n) => hay.includes(n));
}

/**
 * Index of the page that contains the quote, preferring the longest needle over every page, then
 * the `preferred` page on ties. -1 when no needle matches anywhere.
 */
export function findQuotePage(texts: string[], quote: string, preferred = 0): number {
  const hays = texts.map(normalizeForMatch);
  for (const needle of quoteNeedles(quote)) {
    if (hays[preferred]?.includes(needle)) return preferred;
    const i = hays.findIndex((h) => h.includes(needle));
    if (i >= 0) return i;
  }
  return -1;
}

/** Remove highlights added by highlightQuote. */
export function clearHighlights(root: HTMLElement) {
  root
    .querySelectorAll("mark.marsa-hit")
    .forEach((m) => m.replaceWith(...Array.from(m.childNodes)));
  root.normalize();
}

/**
 * Wrap the first occurrence of `quote` inside `root` in <mark class="marsa-hit"> elements (one per
 * text node it spans). Returns the first mark, or null when the quote isn't there.
 */
export function highlightQuote(root: HTMLElement, quote: string): HTMLElement | null {
  clearHighlights(root);
  const needles = quoteNeedles(quote);
  if (!needles.length) return null;

  // Normalised text of the whole root, with each normalised char mapped back to (node, offset).
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const map: { node: Text; offset: number }[] = [];
  let hay = "";
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const node = n as Text;
    const text = node.data;
    for (let i = 0; i < text.length; i++) {
      const c = normChar(text[i].normalize("NFKC"));
      for (const ch of c) {
        hay += ch;
        map.push({ node, offset: i });
      }
    }
  }
  const needle = needles.find((n) => hay.includes(n));
  if (!needle) return null;
  const at = hay.indexOf(needle);

  // Group the matched characters by text node: [first offset, last offset].
  const spans = new Map<Text, [number, number]>();
  for (let i = at; i < at + needle.length; i++) {
    const { node, offset } = map[i];
    const s = spans.get(node);
    spans.set(node, s ? [s[0], offset] : [offset, offset]);
  }
  const marks: HTMLElement[] = [];
  for (const [node, [a, b]] of [...spans.entries()].reverse()) {
    const range = document.createRange();
    range.setStart(node, a);
    range.setEnd(node, b + 1);
    const mark = document.createElement("mark");
    mark.className = "marsa-hit";
    range.surroundContents(mark);
    marks.unshift(mark);
  }
  return marks[0] ?? null;
}
