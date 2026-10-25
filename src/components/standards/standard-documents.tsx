"use client";

import { toast } from "sonner";
import { DocumentRow } from "@/components/documents/document-row";
import { useT } from "@/components/i18n-provider";
import { Dropzone, type UploadFn } from "@/components/ui/dropzone";
import { useSettings } from "@/hooks/use-settings";
import { useDeleteDocument, useInvalidateStandard } from "@/hooks/use-standards";
import type { DocumentDto, StandardDetailDto } from "@/lib/api-types";
import { middleTruncate } from "@/lib/files";
import { uploadFile } from "@/lib/upload";

export function StandardDocuments({ standard }: { standard: StandardDetailDto }) {
  const t = useT();
  const { data: settings } = useSettings();
  const invalidate = useInvalidateStandard(standard.id);
  const remove = useDeleteDocument(standard.id);

  const upload: UploadFn = async (file, onProgress) => {
    const doc = await uploadFile<DocumentDto>(
      `/api/standards/${standard.id}/documents`,
      file,
      onProgress,
    );
    await invalidate();
    toast.success(t("{name} uploaded", { name: middleTruncate(doc.originalName, 40) }), {
      description: doc.pageCount ? t.plural(doc.pageCount, "{n} page", "{n} pages") : undefined,
    });
  };

  return (
    <section
      aria-labelledby="docs-title"
      className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 shadow-xs"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="docs-title"
          className="font-heading text-base font-semibold tracking-tight text-ink"
        >
          {t("Documents")}
        </h2>
        <p className="text-[13px] text-ink-muted">
          {t("The official text of the standard. Sent to the AI together with the rules.")}
        </p>
      </div>

      {standard.documents.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label={t("Uploaded documents")}>
          {standard.documents.map((d) => (
            <DocumentRow
              key={d.id}
              doc={d}
              onDelete={() =>
                remove.mutateAsync(d.id).then(() => toast.success(t("Document deleted.")))
              }
              deleteDescription={t("“{name}” will be removed from this standard and from disk.", {
                name: d.originalName,
              })}
            />
          ))}
        </ul>
      )}

      <Dropzone
        label={standard.documents.length ? t("Add documents") : t("Upload documents")}
        maxSizeMb={settings?.runtime.maxUploadMb ?? 50}
        maxFiles={10}
        upload={upload}
        removeOnDone
        description={
          <>
            {t("PDF preferred · Word, Excel and images also accepted · up to {n} MB each", {
              n: settings?.runtime.maxUploadMb ?? 50,
            })}
          </>
        }
      />
    </section>
  );
}
