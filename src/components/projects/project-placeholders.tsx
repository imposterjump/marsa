"use client";

import { Lock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useProjectContext } from "./project-shell";

const frame = "rounded-2xl border border-dashed border-border-strong bg-surface/60";

/** Evaluation tab until the analysis pipeline lands in Phase 6. */
export function ProjectEvaluation() {
  const p = useProjectContext();
  return (
    <div className={frame}>
      <EmptyState
        size="lg"
        art={<Lock className="size-12 text-ink-faint" strokeWidth={1.25} />}
        title="Evaluation is locked"
        description={
          p.proposalCount === 0
            ? "It unlocks once at least one vendor proposal is in. Marsa then checks every proposal against the RFP and the applied standards, and compares vendors."
            : "Analyse & process arrives in Phase 6."
        }
      />
    </div>
  );
}
