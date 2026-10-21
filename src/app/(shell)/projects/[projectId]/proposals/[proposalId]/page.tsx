import { Suspense } from "react";
import { ProjectGate } from "@/components/projects/project-shell";
import { ProposalWorkspace, WorkspaceSkeleton } from "@/components/proposals/proposal-workspace";

// `params` and the workspace's useSearchParams (?tab, ?doc) must sit inside <Suspense> (G-35/G-36).
export default function ProposalPage({
  params,
}: PageProps<"/projects/[projectId]/proposals/[proposalId]">) {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <ProposalFromParams params={params} />
    </Suspense>
  );
}

async function ProposalFromParams({
  params,
}: Pick<PageProps<"/projects/[projectId]/proposals/[proposalId]">, "params">) {
  const { projectId, proposalId } = await params;
  return (
    <ProjectGate projectId={projectId} fallback={<WorkspaceSkeleton />}>
      <ProposalWorkspace proposalId={proposalId} />
    </ProjectGate>
  );
}
