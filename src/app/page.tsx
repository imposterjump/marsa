import { FoundationCheck } from "./foundation-check";

// Temporary P0 landing page. Replaced in P1.7 by a redirect to /projects inside the app shell.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-10">
      <div className="flex max-w-md flex-col items-start gap-6">
        <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          Phase 0 · Foundation
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Marsa</h1>
        <p className="leading-relaxed text-muted-foreground">
          Procurement Intelligence for Ports &amp; Customs. The foundation is wired: Next.js,
          Tailwind, SQLite and file storage. The design system arrives in Phase 1.
        </p>
        <FoundationCheck />
      </div>
    </main>
  );
}
