import { AiReviewView } from "@/components/ai-review/ai-review-view";
import { ProjectRoute } from "@/components/projects/project-route";
import { ProjectPageSkeleton } from "@/components/projects/project-shell";

export default function ProjectAiReviewPage({
  params,
}: PageProps<"/projects/[projectId]/ai-review">) {
  return (
    <ProjectRoute params={params} fallback={<ProjectPageSkeleton />}>
      <AiReviewView />
    </ProjectRoute>
  );
}
