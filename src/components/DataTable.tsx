"use client";

import { useMemo, useState } from "react";

export interface Column<T> {
  key: string;
  header: string;
  /** Value used for sorting; omit to make the column unsortable. */
  sort?: (row: T) => number | string;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

/** Sortable, paginated table. Numbers right-aligned in tabular figures. */
export default function DataTable<T>({
  rows,
  columns,
  rowKey,
  initialSort,
  pageSize,
  onRowClick,
  empty = "No rows",
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  pageSize?: number;
  onRowClick?: (row: T) => void;
  empty?: string;
}) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!sort || !col?.sort) return rows;
    const get = col.sort;
    const dir = sort.dir;
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return dir === "asc" ? cmp : -cmp;
    });
  }, [rows, columns, sort]);

  const pages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const current = Math.min(page, pages - 1);
  const visible = pageSize ? sorted.slice(current * pageSize, (current + 1) * pageSize) : sorted;
  const alignClass = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    className={`px-3 py-2.5 font-medium text-ink-2 whitespace-nowrap ${alignClass(c.align)}`}
                    aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    {c.sort ? (
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1 hover:text-ink ${active ? "text-ink" : ""}`}
                        onClick={() => {
                          setPage(0);
                          setSort(
                            active && sort!.dir === "desc" ? { key: c.key, dir: "asc" } : { key: c.key, dir: "desc" },
                          );
                        }}
                      >
                        {c.header}
                        <span className="text-[10px] text-ink-3" aria-hidden>
                          {active ? (sort!.dir === "desc" ? "▼" : "▲") : "↕"}
                        </span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-t border-border align-top ${onRowClick ? "cursor-pointer hover:bg-surface-2" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-2 ${alignClass(c.align)} ${c.className ?? ""}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-ink-3">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pageSize && sorted.length > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-sm text-ink-2">
          <span className="tabular">
            {current * pageSize + 1}–{Math.min(sorted.length, (current + 1) * pageSize)} of {sorted.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              className="px-3 py-1 rounded-md border border-border disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
              className="px-3 py-1 rounded-md border border-border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
