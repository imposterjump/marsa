import { Suspense } from "react";
import { VendorPortal } from "@/components/proposals/vendor-portal";
import { Skeleton } from "@/components/ui/skeleton";

// Demo tool (PRD FR-4.2), not in the sidebar. useSearchParams (?project=) needs <Suspense> (G-35).
export default function VendorPortalPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[640px] max-w-3xl rounded-xl" />}>
      <VendorPortal />
    </Suspense>
  );
}
