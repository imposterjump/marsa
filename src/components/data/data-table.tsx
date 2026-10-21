"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";

export interface Column<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number | null | undefined;
  align?: "start" | "end" | "center";
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
  loading?: boolean;
  empty?: React.ReactNode;
  initialSort?: { id: string; dir: "asc" | "desc" };
  onRowClick?: (row: T) => void;
  className?: string;
}

const ALIGN = { start: "text-start", end: "text-end", center: "text-center" } as const;

/**
 * Harbor data table: spacing + hover instead of heavy borders, sticky header,
 * sortable columns (keyboard accessible, aria-sort), skeleton + empty states.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  loading,
  empty,
  initialSort,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort);

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.id === sort.id);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: "base" });
      return sort!.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const toggleSort = (id: string) =>
    setSort((s) => (s?.id === id ? { id, dir: s.dir === "asc" ? "desc" : "asc" } : { id, dir: "asc" }));

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border bg-surface shadow-xs", className)}>
      <table className="w-full border-separate border-spacing-0 text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 z-10">
          <tr>
            {columns.map((col) => {
              const active = sort?.id === col.id;
              const ariaSort = active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none";
              return (
                <th
                  key={col.id}
                  scope="col"
                  aria-sort={col.sortValue ? ariaSort : undefined}
                  className={cn(
                    "h-11 border-b border-border bg-surface-muted/60 px-4 text-xs font-medium whitespace-nowrap text-ink-muted first:rounded-ss-xl last:rounded-se-xl",
                    ALIGN[col.align ?? "start"],
                    col.headerClassName,
                  )}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.id)}
                      className={cn(
                        "-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none",
                        active && "text-ink",
                      )}
                    >
                      {col.header}
                      {active ? (
                        sort!.dir === "asc" ? (
                          <ArrowUp className="size-3.5" aria-hidden />
                        ) : (
                          <ArrowDown className="size-3.5" aria-hidden />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 4 }, (_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.id} className="h-14 border-b border-border/70 px-4">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            : sorted.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "group/row transition-colors duration-150 hover:bg-surface-muted/50 [&:last-child>td]:border-b-0",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        "h-14 border-b border-border/70 px-4 text-ink",
                        ALIGN[col.align ?? "start"],
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && rows.length === 0 && (
        <div className="border-t border-border/70">{empty ?? <p className="p-8 text-center text-ink-muted">No rows</p>}</div>
      )}
    </div>
  );
}
