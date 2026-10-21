import {
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { extensionOf, fileKind, type FileKind } from "@/lib/files";

const KIND: Record<FileKind, { icon: LucideIcon; className: string }> = {
  pdf: { icon: FileText, className: "bg-fail-soft text-fail" },
  word: { icon: FileType2, className: "bg-info-soft text-info" },
  sheet: { icon: FileSpreadsheet, className: "bg-ok-soft text-ok" },
  slides: { icon: Presentation, className: "bg-partial-soft text-partial" },
  image: { icon: FileImage, className: "bg-brand-soft text-brand-ink" },
  text: { icon: FileText, className: "bg-surface-muted text-ink-2" },
  archive: { icon: FileArchive, className: "bg-surface-muted text-ink-2" },
  other: { icon: File, className: "bg-surface-muted text-ink-muted" },
};

/** File-type tile: coloured icon + extension label. Colour is supplementary (label is always shown). */
export function FileIcon({ name, className }: { name: string; className?: string }) {
  const { icon: Icon, className: tone } = KIND[fileKind(name)];
  const ext = extensionOf(name);
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex size-10 shrink-0 flex-col items-center justify-center rounded-lg",
        tone,
        className,
      )}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} />
      {ext && (
        <span className="mt-px text-[9px] leading-none font-semibold tracking-wide uppercase">
          {ext.slice(0, 4)}
        </span>
      )}
    </span>
  );
}
