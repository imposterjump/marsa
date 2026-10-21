import { Suspense } from "react";
import { ProjectGate } from "./project-shell";

/**
 * Page-level gate for /projects/[projectId]/*: awaits `params` inside the page's own <Suspense>
 * and provides the project to client components (useProjectContext). Server component. G-50.
 */
export function ProjectRoute({
  params,
  fallback,
  children,
}: {
  params: Promise<{ projectId: string }>;
  fallback: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <Gate params={params} fallback={fallback}>
        {children}
      </Gate>
    </Suspense>
  );
}

async function Gate({
  params,
  fallback,
  children,
}: {
  params: Promise<{ projectId: string }>;
  fallback: React.ReactNode;
  children: React.ReactNode;
}) {
  const { projectId } = await params;
  return (
    <ProjectGate projectId={projectId} fallback={fallback}>
      {children}
    </ProjectGate>
  );
}
