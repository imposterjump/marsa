import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Single Node server deployment (Docker / Railway / Render / VPS) — see docs/RDD.md §15.
  output: "standalone",
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
