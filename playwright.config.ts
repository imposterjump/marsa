import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  // One worker: all specs share one SQLite DB and one dev server (parallel files reset each
  // other's data and trigger concurrent cold compiles → reloads/hydration noise). HANDOFF G-32.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    // Production build, not `next dev`: dev mode's HMR intermittently reload-looped the first
    // page on a cold server (HANDOFF G-32). `next start` warns about output:standalone but works.
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    // Never silently reuse a leftover server (stale data/DB); a busy port fails loudly instead.
    reuseExistingServer: false,
    timeout: 300_000,
    // E2E always runs against mock AI and its own data folder.
    // NEXT_DIST_DIR keeps this build out of .next, which the user's dev server uses (G-51).
    env: { AI_MODE: "mock", DATA_DIR: "./data/e2e", NEXT_DIST_DIR: ".next-e2e" },
  },
});
