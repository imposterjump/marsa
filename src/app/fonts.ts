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

/** Arabic content (UI is RTL-ready; AI reports can be Arabic). */
export const notoArabic = localFont({
  variable: "--font-noto-arabic",
  display: "swap",
  weight: "100 900",
  src: "../../node_modules/@fontsource-variable/noto-sans-arabic/files/noto-sans-arabic-arabic-wght-normal.woff2",
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
