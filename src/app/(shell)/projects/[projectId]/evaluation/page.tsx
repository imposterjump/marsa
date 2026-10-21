import { EvaluationView } from "@/components/evaluation/evaluation-view";
import { ProjectRoute } from "@/components/projects/project-route";
import { ProjectPageSkeleton } from "@/components/projects/project-shell";

export default function ProjectEvaluationPage({
  params,
}: PageProps<"/projects/[projectId]/evaluation">) {
  return (
    <ProjectRoute params={params} fallback={<ProjectPageSkeleton />}>
      <EvaluationView />
    </ProjectRoute>
  );
}
