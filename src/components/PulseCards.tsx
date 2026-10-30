"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PULSE_CATEGORIES, type PulseCategory, type PulseRow } from "@/lib/pulse-shared";

type Sort = "unhappy" | "drop" | "happy";
const SORTS: { key: Sort; label: string }[] = [
  { key: "unhappy", label: "Most unhappy" },
  { key: "drop", label: "Biggest rating drop" },
  { key: "happy", label: "Happiest users" },
];

/** Ring gauge: share of unhappy reviews. */
function Ring({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid place-items-center w-[68px] h-[68px] shrink-0">
      <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90" aria-hidden>
        <circle cx="34" cy="34" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="7" />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke="var(--neg)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${c * value} ${c}`}
        />
      </svg>
      <span className="absolute text-[15px] font-semibold tabular">{Math.round(value * 100)}%</span>
    </span>
  );
}

function Card({ r, rank }: { r: PulseRow; rank: number }) {
  const drop = r.recentRating - r.storeRating;
  return (
    <Link
      href={`/app/play/${r.id}`}
      className="group relative flex flex-col rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)] hover:border-ink-3"
    >
      <span className="absolute top-4 right-4 text-xs font-medium text-ink-3 tabular">#{rank}</span>
      <div className="flex items-center gap-3 pr-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={r.icon} alt="" className="w-10 h-10 rounded-xl border border-border" />
        <div className="min-w-0">
          <p className="font-semibold truncate">{r.name}</p>
          <p className="text-xs text-ink-3">{r.category}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <Ring value={r.negativeShare} />
        <div className="text-sm">
          <p className="text-ink-2">of recent reviews are unhappy</p>
          <p className="mt-1 tabular">
            <span className="font-medium">★ {r.recentRating.toFixed(1)}</span>{" "}
            <span className={drop <= -0.5 ? "text-critical" : "text-ink-3"}>
              {drop < 0 ? "↓" : "↑"} {Math.abs(drop).toFixed(1)} vs all-time
            </span>
          </p>
        </div>
      </div>
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3 text-sm">
        <span className="text-ink-3">
          Top complaint: <span className="text-ink font-medium">{r.topComplaint ?? "None"}</span>
        </span>
        <span className="text-ink-3 group-hover:text-ink shrink-0" aria-hidden>
          →
        </span>
      </div>
    </Link>
  );
}

export default function PulseCards({ limit, controls = true }: { limit?: number; controls?: boolean }) {
  const [data, setData] = useState<{ at: string; rows: PulseRow[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [cat, setCat] = useState<PulseCategory | null>(null);
  const [sort, setSort] = useState<Sort>("unhappy");

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

  const rows = useMemo(() => {
    const list = (data?.rows ?? []).filter((r) => !cat || r.category === cat);
    const by: Record<Sort, (a: PulseRow, b: PulseRow) => number> = {
      unhappy: (a, b) => b.negativeShare - a.negativeShare,
      drop: (a, b) => a.recentRating - a.storeRating - (b.recentRating - b.storeRating),
      happy: (a, b) => a.negativeShare - b.negativeShare,
    };
    const sorted = [...list].sort(by[sort]);
    return limit ? sorted.slice(0, limit) : sorted;
  }, [data, cat, sort, limit]);

  return (
    <div>
      {controls && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {[null, ...PULSE_CATEGORIES].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              onClick={() => setCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-sm border ${cat === c ? "bg-ink text-bg border-ink" : "border-border hover:border-ink-3"}`}
            >
              {c ?? "All apps"}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm text-ink-3">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-9 rounded-full border border-border bg-surface px-3 text-ink"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {failed ? (
        <p className="text-sm text-ink-2">The pulse is refreshing. Please check back in a minute.</p>
      ) : !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: limit ?? 6 }, (_, i) => (
            <div key={i} className="h-[214px] rounded-2xl border border-border bg-surface animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r, i) => (
              <Card key={r.id} r={r} rank={i + 1} />
            ))}
          </div>
          <p className="mt-5 text-xs text-ink-3">
            From the latest ~250 Google Play India reviews per app · updated{" "}
            {new Date(data.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}{" "}
            IST · “Unhappy” means 1–2★ or clearly negative.
          </p>
        </>
      )}
    </div>
  );
}
