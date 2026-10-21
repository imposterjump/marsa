import { Suspense } from "react";
import { ProjectShell, ProjectShellSkeleton } from "@/components/projects/project-shell";

// Reading `params` must happen inside <Suspense> under cacheComponents (HANDOFF G-36).
// The shell loads the project once and hands it to the tab pages through context.
export default function ProjectLayout({ children, params }: LayoutProps<"/projects/[projectId]">) {
  return (
    <Suspense fallback={<ProjectShellSkeleton />}>
      <ProjectFromParams params={params}>{children}</ProjectFromParams>
    </Suspense>
  );
}

async function ProjectFromParams({
  params,
  children,
}: Pick<LayoutProps<"/projects/[projectId]">, "params" | "children">) {
  const { projectId } = await params;
  return <ProjectShell projectId={projectId}>{children}</ProjectShell>;
}
