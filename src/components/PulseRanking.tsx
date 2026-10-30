"use client";

// Homepage view of India App Pulse: one ranked bar per app, so the numbers
// read at a glance. The full, filterable view lives on /pulse.
import Link from "next/link";
import { useEffect, useState } from "react";
import type { PulseRow } from "@/lib/pulse-shared";

export default function PulseRanking({ limit = 6 }: { limit?: number }) {
  const [data, setData] = useState<{ at: string; rows: PulseRow[] } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = (attempt: number) =>
      fetch("/api/pulse")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => alive && setData(d))
        .catch(() => {
          if (alive && attempt < 2) setTimeout(() => load(attempt + 1), 3000);
          else if (alive) setFailed(true);
        });
    load(0);
    return () => {
      alive = false;
    };
  }, []);

  if (failed) return <p className="text-center text-sm text-ink-2">The pulse is refreshing. Please check back in a minute.</p>;

  const rows = [...(data?.rows ?? [])].sort((a, b) => b.negativeShare - a.negativeShare).slice(0, limit);
  const max = Math.max(0.01, ...rows.map((r) => r.negativeShare));

  return (
    <div className="rounded-3xl border border-border bg-surface overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-6 sm:px-8 pt-6 pb-4">
        <p className="font-semibold">Share of recent reviews that are unhappy</p>
        <p className="text-sm text-ink-3">
          {data
            ? `Updated ${new Date(data.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST`
            : " "}
        </p>
      </div>
      <ul className="px-3 sm:px-5 pb-3">
        {data
          ? rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/app/play/${r.id}`}
                  className="group grid grid-cols-[1fr_auto] sm:grid-cols-[15rem_1fr_3.5rem_1.25rem] items-center gap-x-5 gap-y-2.5 rounded-2xl px-3 py-3.5 hover:bg-surface-2"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.icon} alt="" className="w-10 h-10 rounded-xl border border-border shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-medium truncate">{r.name}</span>
                      <span className="block text-sm text-ink-3 truncate">
                        {r.topComplaint ? `Mostly ${r.topComplaint.toLowerCase()}` : r.category}
                      </span>
                    </span>
                  </span>
                  <span className="col-span-2 sm:col-span-1 sm:order-none order-last h-2.5 rounded-full bg-surface-2 overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-[var(--neg)]"
                      style={{ width: `${(r.negativeShare / max) * 100}%` }}
                    />
                  </span>
                  <span className="text-right text-lg font-semibold tabular">{Math.round(r.negativeShare * 100)}%</span>
                  <span className="hidden sm:block text-ink-3 group-hover:text-ink" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))
          : Array.from({ length: limit }, (_, i) => (
              <li key={i} className="px-3 py-3.5">
                <span className="block h-10 rounded-xl bg-surface-2 animate-pulse" />
              </li>
            ))}
      </ul>
      <p className="px-6 sm:px-8 py-4 border-t border-border text-xs text-ink-3">
        From the latest ~250 Google Play India reviews per app. “Unhappy” means 1–2★ or clearly negative.
      </p>
    </div>
  );
}
