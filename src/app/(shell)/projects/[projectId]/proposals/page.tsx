import { ProjectRoute } from "@/components/projects/project-route";
import { ProjectPageSkeleton } from "@/components/projects/project-shell";
import { ProposalsTab } from "@/components/proposals/proposals-tab";

export default function ProjectProposalsPage({
  params,
}: PageProps<"/projects/[projectId]/proposals">) {
  return (
    <ProjectRoute params={params} fallback={<ProjectPageSkeleton />}>
      <ProposalsTab />
    </ProjectRoute>
  );
}
