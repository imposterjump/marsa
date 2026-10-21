import { Suspense } from "react";
import { StandardDetail, StandardDetailSkeleton } from "@/components/standards/standard-detail";

// Reading `params` must happen inside <Suspense> under cacheComponents (HANDOFF G-36):
// the static shell prerenders with the skeleton, the id streams in at request time.
export default function StandardPage({ params }: PageProps<"/standards/[standardId]">) {
  return (
    <Suspense fallback={<StandardDetailSkeleton />}>
      <StandardFromParams params={params} />
    </Suspense>
  );
}

async function StandardFromParams({
  params,
}: Pick<PageProps<"/standards/[standardId]">, "params">) {
  const { standardId } = await params;
  return <StandardDetail standardId={standardId} />;
}
