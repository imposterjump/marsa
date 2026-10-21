import { ProjectEvaluation } from "@/components/projects/project-placeholders";
import { ProjectRoute } from "@/components/projects/project-route";
import { ProjectPageSkeleton } from "@/components/projects/project-shell";

export default function ProjectEvaluationPage({
  params,
}: PageProps<"/projects/[projectId]/evaluation">) {
  return (
    <ProjectRoute params={params} fallback={<ProjectPageSkeleton />}>
      <ProjectEvaluation />
    </ProjectRoute>
  );
}
