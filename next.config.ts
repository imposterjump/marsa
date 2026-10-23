import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // E2E/screenshot builds use their own folder (NEXT_DIST_DIR=.next-e2e) so a production build
  // never touches the dev server's cache in .next/dev (HMR "hash mismatch" reload loop, G-51).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Single Node server deployment (Docker / Railway / Render / VPS) — see docs/RDD.md §15.
  output: "standalone",
  // The floating dev badge overlapped the sidebar footer; errors still surface in dev.
  devIndicators: false,
  // Document libraries (page counting, DOCX/XLSX text extraction) load at runtime, not bundled.
  serverExternalPackages: ["pdfjs-dist", "mammoth", "exceljs", "playwright-core"],
  // PRD FR-1.1: the app opens on Projects. A config redirect (not a page-level redirect())
  // keeps Next 16 instant-navigation validation happy.
  // P8: evaluation and AI review moved to the AI analysis results page.
  redirects: async () => [
    { source: "/", destination: "/projects", permanent: false },
    { source: "/projects/:id/evaluation", destination: "/analysis/:id", permanent: false },
    { source: "/projects/:id/ai-review", destination: "/analysis/:id?tab=quality", permanent: false },
  ],
  // Next 16 defaults. NOTE: with cacheComponents, GET route handlers and server components are
  // prerendered unless they hit request-time data. better-sqlite3 is synchronous, so every
  // request-time DB read must call `await connection()` first (see docs/HANDOFF.md).
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // The browser reader creates pdf.js's worker (src/lib/pdf/pdfjs.ts); the SSR pass also sees
    // that reference and warns because pdfjs-dist is a server external. The code never runs on
    // the server (it is only called from effects), so the warning is noise (HANDOFF G-54).
    ignoreIssue: [{ path: /lib[\\/]pdf/, title: /can't be external/ }],
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
