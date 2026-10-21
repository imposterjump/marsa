/** Runs once when a Next.js server starts (RDD §7.2: interrupt-on-boot). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { markInterruptedRuns } = await import("./server/runs/boot");
  const ids = markInterruptedRuns();
  if (ids.length)
    console.log(`[marsa] ${ids.length} analysis run(s) were interrupted by a restart.`);
}
