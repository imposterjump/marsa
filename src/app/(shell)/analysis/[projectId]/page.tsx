import { AnalysisPage } from "@/components/analysis/analysis-page";
import { ProjectRoute } from "@/components/projects/project-route";
import { Skeleton } from "@/components/ui/skeleton";

/** AI analysis results (P8): full width, outside the project tabs; the sidebar collapses here. */
export default function AnalysisRoutePage({ params }: PageProps<"/analysis/[projectId]">) {
  return (
    <ProjectRoute params={params} fallback={<Skeleton className="h-[560px] w-full rounded-xl" />}>
      <AnalysisPage />
    </ProjectRoute>
  );
}
