import localFont from "next/font/local";

// RTA PoC Design System type stack (rta standard/): the licensed "RTA" family is not installed, so
// Hanken Grotesk stands in, as in the design system's own specimen. Self-hosted from @fontsource
// packages: builds work offline and there is no runtime request to Google Fonts.
// NOTE: next/font options must be static literals — no template strings, variables or .map().

/** UI, body text and headings. */
export const hanken = localFont({
  variable: "--font-hanken",
  display: "swap",
  weight: "100 900",
  src: [
    {
      path: "../../node_modules/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2",
    },
    {
      path: "../../node_modules/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-ext-wght-normal.woff2",
    },
  ],
});

/**
 * Arabic letters (the Arabic UI, Arabic names, AI text). Only Arabic characters (unicode-range),
 * so it comes first in the font stack (globals.css) while Latin text and digits still use Hanken;
 * no Arial fallback, because Arial has Arabic letters too (until 2026-10-26 the Hanken fallback,
 * Arial, drew all Arabic text, small). Drawn 10 % larger: Arabic letters look smaller than Latin
 * ones at the same size (user, 2026-10-26: "all the arabic font size is very small just make it
 * a bit bigger"). Layout, Latin text and numbers keep their sizes.
 */
export const notoArabic = localFont({
  variable: "--font-noto-arabic",
  display: "swap",
  weight: "100 900",
  src: "../../node_modules/@fontsource-variable/noto-sans-arabic/files/noto-sans-arabic-arabic-wght-normal.woff2",
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "110%" },
    {
      prop: "unicode-range",
      value:
        "U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200D, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC",
    },
  ],
});

/** IDs, codes, tabular references ("mono-for-data"). */
export const plexMono = localFont({
  variable: "--font-plex-mono",
  display: "swap",
  src: [
    {
      path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2",
      weight: "500",
    },
  ],
});

export const fontVariables = [hanken, notoArabic, plexMono].map((f) => f.variable).join(" ");
