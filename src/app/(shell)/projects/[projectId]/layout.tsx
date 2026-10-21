import { Suspense } from "react";
import { ProjectHeader, ProjectHeaderSkeleton } from "@/components/projects/project-shell";

// Only the header awaits `params` (inside <Suspense>, G-36). The tab pages render BESIDE it, not
// inside it: each page resolves the id in its own boundary (<ProjectRoute>), so every page segment
// is part of the static shell and passes instant-navigation validation (HANDOFF G-50).
export default function ProjectLayout({ children, params }: LayoutProps<"/projects/[projectId]">) {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<ProjectHeaderSkeleton />}>
        <HeaderFromParams params={params} />
      </Suspense>
      {children}
    </div>
  );
}

async function HeaderFromParams({ params }: Pick<LayoutProps<"/projects/[projectId]">, "params">) {
  const { projectId } = await params;
  return <ProjectHeader projectId={projectId} />;
}
