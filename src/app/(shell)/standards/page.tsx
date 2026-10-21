import { Plus, Upload } from "lucide-react";
import { StandardsArt } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

// P1 placeholder: the standards library (cards, rules editor, documents) is built in P2.3–P2.4.
export default function StandardsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Standards"
        description="Your organization's rules that every proposal must respect, such as IT security, safety and commercial terms. Marsa checks each vendor against them alongside the RFP."
        actions={
          <>
            <Button variant="secondary" disabled>
              <Upload /> Upload document
            </Button>
            <Button disabled>
              <Plus /> New standard
            </Button>
          </>
        }
      />
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface/60">
        <EmptyState
          size="lg"
          art={<StandardsArt />}
          title="No standards yet"
          description="Create standards and their rules (code, text, priority), or upload standard documents. The library arrives in Phase 2."
        />
      </div>
    </div>
  );
}
