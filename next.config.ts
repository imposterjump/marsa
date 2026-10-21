import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Single Node server deployment (Docker / Railway / Render / VPS) — see docs/RDD.md §15.
  output: "standalone",
  // The floating dev badge overlapped the sidebar footer; errors still surface in dev.
  devIndicators: false,
  // Document libraries (page counting, DOCX/XLSX text extraction) load at runtime, not bundled.
  serverExternalPackages: ["pdfjs-dist", "mammoth", "exceljs"],
  // PRD FR-1.1: the app opens on Projects. A config redirect (not a page-level redirect())
  // keeps Next 16 instant-navigation validation happy.
  redirects: async () => [{ source: "/", destination: "/projects", permanent: false }],
  // Next 16 defaults. NOTE: with cacheComponents, GET route handlers and server components are
  // prerendered unless they hit request-time data. better-sqlite3 is synchronous, so every
  // request-time DB read must call `await connection()` first (see docs/HANDOFF.md).
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
