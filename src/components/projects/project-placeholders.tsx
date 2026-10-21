"use client";

import { Lock, Megaphone, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatYmd } from "@/lib/format";
import { useProjectContext } from "./project-shell";

const frame = "rounded-2xl border border-dashed border-border-strong bg-surface/60";

/** Proposals tab until the vendor side lands in Phase 4. */
export function ProjectProposals() {
  const p = useProjectContext();
  const published = p.status !== "draft";
  return (
    <div className={frame}>
      <EmptyState
        size="lg"
        art={
          published ? (
            <Users className="size-12 text-brand" strokeWidth={1.25} />
          ) : (
            <Megaphone className="size-12 text-ink-faint" strokeWidth={1.25} />
          )
        }
        title={published ? "Waiting for proposals" : "Not published yet"}
        description={
          published
            ? `Vendors can now download the RFP and submit commercial and technical proposals${
                p.deadline ? ` until ${formatYmd(p.deadline)}` : ""
              }. Each submission will be listed here with its date and documents. The vendor simulator arrives in Phase 4.`
            : "Publish the tender to vendors from the header above. Their proposals will be listed here."
        }
      />
    </div>
  );
}

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
