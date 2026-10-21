import { Suspense } from "react";
import { NewProjectWizard } from "@/components/projects/new-project-wizard";
import { Skeleton } from "@/components/ui/skeleton";

// useSearchParams (draft id + step) must sit inside <Suspense> under cacheComponents (G-35).
export default function NewProjectPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[520px] rounded-xl" />}>
      <NewProjectWizard />
    </Suspense>
  );
}
