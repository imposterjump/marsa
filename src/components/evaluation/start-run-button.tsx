"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSettings } from "@/hooks/use-settings";
import { useStartRun } from "@/hooks/use-runs";

/**
 * Starts an analysis (POST /api/projects/:id/runs) and opens the Evaluation tab. With live AI
 * it asks first, because the run spends Anthropic API credits; demo (mock) runs start directly.
 */
export function StartRunButton({
  projectId,
  costUsd,
  again = false,
  size = "lg",
  className,
}: {
  projectId: string;
  /** Estimated cost for the confirmation (live AI only). */
  costUsd?: number;
  again?: boolean;
  size?: "default" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: settings } = useSettings();
  const start = useStartRun(projectId);
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
        disabled={start.isPending || !settings}
        onClick={() => (live ? setConfirm(true) : void run())}
      >
        {again ? <RotateCcw /> : <Sparkles />}
        {again ? "Run again" : "Analyse & process"}
      </Button>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Run the analysis with Claude?"
        description={
          costUsd !== undefined
            ? `This sends the RFP, standards and proposals to Claude and costs about $${costUsd.toFixed(2)} in API credits (rough estimate).`
            : "This sends the RFP, standards and proposals to Claude and spends API credits."
        }
        confirmLabel="Start analysis"
        onConfirm={run}
      />
    </>
  );
}
