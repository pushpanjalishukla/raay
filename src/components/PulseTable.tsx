"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PULSE_CATEGORIES, type PulseCategory, type PulseRow } from "@/lib/pulse-shared";
import DataTable, { type Column } from "./DataTable";

const pct = (n: number) => `${Math.round(n * 100)}%`;

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface divide-y divide-border">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <span className="w-7 h-7 rounded-lg bg-surface-2 animate-pulse" />
          <span className="h-3 w-32 rounded bg-surface-2 animate-pulse" />
          <span className="ml-auto h-3 w-24 rounded bg-surface-2 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function PulseTable({ limit, filters = true }: { limit?: number; filters?: boolean }) {
  const [data, setData] = useState<{ at: string; rows: PulseRow[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [cat, setCat] = useState<PulseCategory | null>(null);

  useEffect(() => {
    let alive = true;
    const load = (attempt: number) =>
      fetch("/api/pulse")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => alive && setData(d))
        .catch(() => {
          // The board can take a few seconds to build on a cold start; retry before giving up.
          if (alive && attempt < 2) setTimeout(() => load(attempt + 1), 3000);
          else if (alive) setFailed(true);
        });
    load(0);
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => {
    const all = (data?.rows ?? []).filter((r) => !cat || r.category === cat);
    return limit ? all.slice(0, limit) : all;
  }, [data, cat, limit]);
  const maxNeg = Math.max(0.01, ...(data?.rows ?? []).map((r) => r.negativeShare));

  const cols: Column<PulseRow>[] = [
    {
      key: "app",
      header: "App",
      sort: (r) => r.name,
      render: (r) => (
        <span className="flex items-center gap-3 whitespace-nowrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.icon} alt="" className="w-8 h-8 rounded-lg border border-border" />
          <span>
            <span className="block font-medium">{r.name}</span>
            <span className="block text-xs text-ink-3">{r.category}</span>
          </span>
        </span>
      ),
    },
    {
      key: "neg",
      header: "Unhappy reviews",
      sort: (r) => r.negativeShare,
      render: (r) => (
        <span className="flex items-center gap-3 min-w-[10rem]">
          <span className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
            <span className="block h-full rounded-full bg-[var(--neg)]" style={{ width: `${(r.negativeShare / maxNeg) * 100}%` }} />
          </span>
          <span className="tabular w-10 text-right font-medium">{pct(r.negativeShare)}</span>
        </span>
      ),
    },
    {
      key: "recent",
      header: "Recent ★",
      align: "right",
      sort: (r) => r.recentRating,
      render: (r) => {
        const d = r.recentRating - r.storeRating;
        return (
          <span className="whitespace-nowrap tabular">
            {r.recentRating.toFixed(2)}{" "}
            <span className={`text-xs ${d <= -0.5 ? "text-critical" : "text-ink-3"}`}>
              {d < 0 ? "▼" : "▲"} {Math.abs(d).toFixed(2)}
            </span>
          </span>
        );
      },
    },
    {
      key: "store",
      header: "All-time ★",
      align: "right",
      sort: (r) => r.storeRating,
      render: (r) => <span className="tabular text-ink-2">{r.storeRating.toFixed(2)}</span>,
    },
    {
      key: "top",
      header: "Top complaint",
      sort: (r) => r.topComplaint ?? "",
      render: (r) => <span className="whitespace-nowrap text-ink-2">{r.topComplaint ?? "–"}</span>,
    },
    {
      key: "go",
      header: "",
      align: "right",
      render: (r) => (
        <Link href={`/app/play/${r.id}`} className="text-sm whitespace-nowrap underline-offset-4 hover:underline">
          Full report →
        </Link>
      ),
    },
  ];

  return (
    <div>
      {filters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {[null, ...PULSE_CATEGORIES].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              onClick={() => setCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-sm border ${
                cat === c ? "bg-ink text-bg border-ink" : "border-border hover:border-ink-3"
              }`}
            >
              {c ?? "All apps"}
            </button>
          ))}
        </div>
      )}
      {failed ? (
        <p className="text-sm text-ink-2">The pulse is refreshing. Please check back in a minute.</p>
      ) : !data ? (
        <Skeleton rows={limit ?? 8} />
      ) : (
        <>
          <DataTable rows={rows} columns={cols} rowKey={(r) => r.id} initialSort={{ key: "neg", dir: "desc" }} />
          <p className="mt-3 text-xs text-ink-3">
            Based on the latest ~250 Google Play India reviews per app · updated{" "}
            {new Date(data.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}{" "}
            IST · “Unhappy” = 1–2★ or clearly negative.
          </p>
        </>
      )}
    </div>
  );
}
