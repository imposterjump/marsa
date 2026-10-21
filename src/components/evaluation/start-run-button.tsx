"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRunEstimate } from "@/hooks/use-estimate";
import { useSettings } from "@/hooks/use-settings";
import { useStartRun } from "@/hooks/use-runs";
import { AI_MODEL_LABEL } from "@/lib/labels";
import { formatDuration } from "@/lib/plan";

/**
 * Starts an analysis (POST /api/projects/:id/runs) and opens the Evaluation tab. With live AI it
 * always asks first and shows the calibrated cost estimate, because the run spends API credits;
 * demo (mock) runs start directly.
 */
export function StartRunButton({
  projectId,
  again = false,
  size = "lg",
  className,
}: {
  projectId: string;
  again?: boolean;
  size?: "default" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: settings } = useSettings();
  const start = useStartRun(projectId);
  const estimate = useRunEstimate(projectId);
  const [confirm, setConfirm] = useState(false);
  const live = settings?.runtime.aiMode === "live";

  const run = async () => {
    try {
      await start.mutateAsync();
      toast.success("Analysis started");
      const target = `/projects/${projectId}/evaluation`;
      if (pathname !== target) router.push(target);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start the analysis.");
    }
  };

  return (
    <>
      <Button
        size={size}
        variant={again ? "secondary" : "default"}
        className={className}
        disabled={start.isPending || !settings || (live && !estimate)}
        onClick={() => (live ? setConfirm(true) : void run())}
      >
        {again ? <RotateCcw /> : <Sparkles />}
        {again ? "Run again" : "Analyse & process"}
      </Button>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Run the analysis with ${estimate ? AI_MODEL_LABEL[estimate.model] : "Claude"}?`}
        description={
          estimate ? (
            <span className="flex flex-col gap-2">
              <span>
                Estimated cost: <b className="text-ink">≈ ${estimate.usd.toFixed(2)}</b> (likely $
                {estimate.low.toFixed(2)}–${estimate.high.toFixed(2)}), about{" "}
                {formatDuration(estimate.seconds)}.
              </span>
              <span>
                {estimate.steps} steps,{" "}
                {estimate.requirementsEstimated
                  ? `about ${estimate.requirements} requirements (estimated from the RFP)`
                  : `${estimate.requirements} requirements as in the last run`}
                . Cancel stops it at any time; finished steps stay saved.
              </span>
            </span>
          ) : (
            "This sends the RFP, standards and proposals to Claude and spends API credits."
          )
        }
        confirmLabel="Start analysis"
        onConfirm={run}
      />
    </>
  );
}
