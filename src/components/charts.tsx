"use client";

export interface BarRow {
  key: string;
  label: string;
  value: number;
  /** Text shown at the bar end, e.g. "36" or "42%". */
  display: string;
  /** Extra line in the hover tooltip. */
  tip?: string;
  critical?: boolean;
  badge?: string;
}

/** Horizontal bar list: one hue, thin bars, values in text ink, hover tooltip. */
export function BarList({
  rows,
  max,
  selected,
  onSelect,
  labelWidth = "w-36 sm:w-44",
}: {
  rows: BarRow[];
  max?: number;
  selected?: string | null;
  onSelect?: (key: string) => void;
  labelWidth?: string;
}) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-1">
      {rows.map((r) => {
        const width = Math.max(1.5, (r.value / top) * 100);
        const active = selected === r.key;
        const dim = selected && !active;
        const Tag = onSelect ? "button" : "div";
        return (
          <li key={r.key} className="group relative">
            <Tag
              {...(onSelect ? { onClick: () => onSelect(r.key), type: "button" as const } : {})}
              className={`w-full flex items-center gap-3 py-1.5 px-1 rounded-md text-left ${
                onSelect ? "hover:bg-surface-2 cursor-pointer" : ""
              } ${active ? "bg-surface-2" : ""}`}
              aria-label={`${r.label}: ${r.display}${r.tip ? `, ${r.tip}` : ""}`}
            >
              <span className={`${labelWidth} shrink-0 text-sm truncate ${dim ? "text-ink-3" : "text-ink-2"}`}>
                {r.label}
              </span>
              <span className="flex-1 h-3.5 relative">
                <span
                  className={`absolute left-0 top-0 h-full rounded-r-[4px] transition-opacity ${
                    r.critical ? "bg-critical" : "bg-series"
                  } ${dim ? "opacity-30" : ""}`}
                  style={{ width: `${width}%` }}
                />
              </span>
              <span className="w-20 shrink-0 text-right text-sm tabular text-ink">
                {r.display}
                {r.badge && (
                  <span className="ml-1.5 text-[11px] font-medium text-critical whitespace-nowrap">{r.badge}</span>
                )}
              </span>
            </Tag>
            {r.tip && (
              <span className="pointer-events-none absolute right-24 -top-8 z-10 hidden group-hover:block rounded-md bg-ink text-bg text-xs px-2 py-1 whitespace-nowrap shadow">
                {r.label}: {r.display} · {r.tip}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "critical" | "good";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular">
        {tone === "critical" && (
          <span className="text-critical mr-1" aria-hidden>
            ▼
          </span>
        )}
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-ink-3">{sub}</p>}
    </div>
  );
}
