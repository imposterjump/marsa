"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Sparkles } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";
import { useStartRun } from "@/hooks/use-runs";

/**
 * Starts an analysis (POST /api/projects/:id/runs) and opens the AI analysis page (P8), where
 * mission control shows it live. It starts on click, live or demo: no confirmation with a cost
 * (user, 2026-10-25: the client never sees prices). A run started by mistake can be cancelled,
 * and the previous results stay on screen.
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
  const t = useT();
  const router = useRouter();
  const { data: settings } = useSettings();
  const start = useStartRun(projectId);

  const run = async () => {
    try {
      const created = await start.mutateAsync();
      toast.success(t("Analysis started"));
      // Always name the run: the results page may be showing an older one (?run=).
      router.push(`/analysis/${projectId}?run=${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Couldn't start the analysis."));
    }
  };

  return (
    <>
      <Button
        size={size}
        variant={again ? "secondary" : "default"}
        className={className}
        disabled={start.isPending || !settings}
        onClick={() => void run()}
      >
        {again ? <RotateCcw /> : <Sparkles />}
        {again ? t("Run a new analysis") : t("Run AI analysis")}
      </Button>
    </>
  );
}
