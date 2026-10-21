import localFont from "next/font/local";

// Self-hosted from @fontsource packages: builds work offline (Docker, restricted networks)
// and there is no runtime request to Google Fonts.
// NOTE: next/font options must be static literals — no template strings, variables or .map().

/** UI / body text. */
export const inter = localFont({
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  src: [
    { path: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2" },
    {
      path: "../../node_modules/@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2",
    },
  ],
});

/** Display headings (hero greeting, page titles). */
export const jakarta = localFont({
  variable: "--font-jakarta",
  display: "swap",
  weight: "200 800",
  src: [
    {
      path: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
    },
    {
      path: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-ext-wght-normal.woff2",
    },
  ],
});

/** IDs, codes, tabular references. */
export const jetbrainsMono = localFont({
  variable: "--font-jetbrains",
  display: "swap",
  weight: "100 800",
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
});

/** Arabic glyph fallback (UI is RTL-ready; AI reports can be Arabic). */
export const plexArabic = localFont({
  variable: "--font-plex-arabic",
  display: "swap",
  src: [
    {
      path: "../../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-500-normal.woff2",
      weight: "500",
    },
    {
      path: "../../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2",
      weight: "600",
    },
    {
      path: "../../node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-700-normal.woff2",
      weight: "700",
    },
  ],
});

export const fontVariables = [inter, jakarta, jetbrainsMono, plexArabic]
  .map((f) => f.variable)
  .join(" ");
