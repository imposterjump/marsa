import { ProjectOverview } from "@/components/projects/project-overview";
import { ProjectRoute } from "@/components/projects/project-route";
import { ProjectPageSkeleton } from "@/components/projects/project-shell";

export default function ProjectOverviewPage({ params }: PageProps<"/projects/[projectId]">) {
  return (
    <ProjectRoute params={params} fallback={<ProjectPageSkeleton />}>
      <ProjectOverview />
    </ProjectRoute>
  );
}
