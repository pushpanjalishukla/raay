"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_INFO } from "@/lib/categories";
import { SAMPLE_COMPARE } from "@/lib/config";
import type { Analysis, Category, Store } from "@/lib/types";
import { RAMP } from "@/lib/analytics";
import AppSearch, { StoreBadge } from "./AppSearch";
import { SentimentLegend, SentimentSplitChart } from "./AnalyticsCharts";
import DataTable, { type Column } from "./DataTable";

const MAX_APPS = 4;
const pct = (n: number) => `${Math.round(n * 100)}%`;

type Ref = { store: Store; id: string };

const indicShare = (d: Analysis) =>
  d.stats.langs.filter((l) => l.lang !== "english" && l.lang !== "other").reduce((a, l) => a + l.share, 0);
const topIssue = (d: Analysis) => d.stats.issues.find((i) => i.category !== "other");

const METRIC_COLS: Column<Analysis>[] = [
  {
    key: "app",
    header: "App",
    sort: (d) => d.app.title,
    render: (d) => (
      <span className="flex items-center gap-2 whitespace-nowrap font-medium">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.app.icon} alt="" className="w-6 h-6 rounded-md" />
        {d.app.title.split(/[:\-–]/)[0].trim()}
      </span>
    ),
  },
  { key: "store", header: "Store ★", align: "right", sort: (d) => d.app.rating, render: (d) => <span className="tabular">{d.app.rating.toFixed(2)}</span> },
  { key: "recent", header: "Recent ★", align: "right", sort: (d) => d.stats.sampleAvgRating, render: (d) => <span className="tabular">{d.stats.sampleAvgRating.toFixed(2)}</span> },
  { key: "neg", header: "Negative", align: "right", sort: (d) => d.stats.negativeShare, render: (d) => <span className="tabular">{pct(d.stats.negativeShare)}</span> },
  { key: "indic", header: "Indian lang.", align: "right", sort: indicShare, render: (d) => <span className="tabular">{pct(indicShare(d))}</span> },
  {
    key: "reply",
    header: "Dev replies",
    align: "right",
    sort: (d) => (d.app.store === "play" ? d.stats.replyRate : -1),
    render: (d) => <span className="tabular">{d.app.store === "play" ? pct(d.stats.replyRate) : "n/a"}</span>,
  },
  {
    key: "issue",
    header: "Top complaint",
    sort: (d) => topIssue(d)?.category ?? "",
    render: (d) => {
      const t = topIssue(d);
      return <span className="whitespace-nowrap text-ink-2">{t ? `${CATEGORY_INFO[t.category].label} (${t.count})` : "–"}</span>;
    },
  },
];
type Slot = { status: "loading" } | { status: "error"; error: string } | { status: "done"; data: Analysis };

function parseApps(s: string): Ref[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const [store, ...rest] = x.split(":");
      return { store: store as Store, id: rest.join(":") };
    })
    .filter((r) => (r.store === "play" || r.store === "ios") && r.id)
    .slice(0, MAX_APPS);
}

export default function Compare({ apps }: { apps: string }) {
  const router = useRouter();
  const refs = useMemo(() => parseApps(apps), [apps]);
  const [slots, setSlots] = useState<Record<string, Slot>>({});
  const requested = useRef(new Set<string>());

  useEffect(() => {
    for (const r of refs) {
      const key = `${r.store}:${r.id}`;
      if (requested.current.has(key)) continue;
      requested.current.add(key);
      fetch(`/api/analyze?store=${r.store}&id=${encodeURIComponent(r.id)}`)
        .then(async (res) => {
          const body = await res.json().catch(() => ({ error: "Timed out" }));
          setSlots((s) => ({
            ...s,
            [key]: !res.ok || body.error ? { status: "error", error: body.error ?? "Failed" } : { status: "done", data: body },
          }));
        })
        .catch(() => setSlots((s) => ({ ...s, [key]: { status: "error", error: "Network error" } })));
    }
  }, [refs]);

  const setApps = (next: Ref[]) =>
    router.replace(`/compare?apps=${next.map((r) => `${r.store}:${r.id}`).join(",")}`, { scroll: false });

  const done = refs
    .map((r) => slots[`${r.store}:${r.id}`])
    .filter((s): s is Extract<Slot, { status: "done" }> => s?.status === "done")
    .map((s) => s.data);

  // Categories to compare: the biggest complaint areas across all apps.
  const cats = useMemo(() => {
    const totals = new Map<Category, number>();
    for (const d of done)
      for (const i of d.stats.issues)
        if (i.category !== "other" && i.category !== "praise")
          totals.set(i.category, (totals.get(i.category) ?? 0) + i.share);
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c]) => c);
  }, [done]);
  const maxShare = Math.max(0.01, ...done.flatMap((d) => d.stats.issues.map((i) => i.share)));
  const shareOf = (d: Analysis, c: Category) => d.stats.issues.find((i) => i.category === c)?.share ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Compare apps</h1>
      <p className="mt-2 text-ink-2">
        Is it just you, or the whole category? See how complaints differ across up to {MAX_APPS} apps.
      </p>

      <div className="mt-6 max-w-2xl">
        {refs.length < MAX_APPS ? (
          <AppSearch
            placeholder="Add an app to compare…"
            onPick={(h) => {
              if (!refs.some((r) => r.store === h.store && r.id === h.id)) setApps([...refs, { store: h.store, id: h.id }]);
            }}
          />
        ) : (
          <p className="text-sm text-ink-3">Up to {MAX_APPS} apps at a time. Remove one to add another.</p>
        )}
        {refs.length === 0 && (
          <Link href={`/compare?apps=${SAMPLE_COMPARE}`} className="mt-4 inline-block text-sm underline text-ink-2">
            Try Zepto vs Blinkit vs BigBasket
          </Link>
        )}
      </div>

      {refs.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {refs.map((r) => {
            const key = `${r.store}:${r.id}`;
            const slot = slots[key];
            const top = slot?.status === "done" ? slot.data.stats.issues.find((i) => i.category !== "other") : null;
            return (
              <div key={key} className="rounded-xl border border-border bg-surface p-4 relative">
                <button
                  onClick={() => setApps(refs.filter((x) => `${x.store}:${x.id}` !== key))}
                  className="absolute top-2 right-3 text-ink-3 hover:text-ink"
                  aria-label="Remove app"
                >
                  ✕
                </button>
                {slot?.status === "done" ? (
                  <>
                    <div className="flex items-center gap-3 pr-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slot.data.app.icon} alt="" className="w-10 h-10 rounded-xl" />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{slot.data.app.title}</p>
                        <StoreBadge store={r.store} />
                      </div>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                      <dt className="text-ink-2">Store rating</dt>
                      <dd className="text-right tabular">★ {slot.data.app.rating.toFixed(2)}</dd>
                      <dt className="text-ink-2">Recent rating</dt>
                      <dd className="text-right tabular">★ {slot.data.stats.sampleAvgRating.toFixed(2)}</dd>
                      <dt className="text-ink-2">Negative</dt>
                      <dd className="text-right tabular">{pct(slot.data.stats.negativeShare)}</dd>
                      <dt className="text-ink-2">Top complaint</dt>
                      <dd className="text-right">{top ? CATEGORY_INFO[top.category].label : "–"}</dd>
                    </dl>
                    <Link href={`/app/${r.store}/${r.id}`} className="mt-4 inline-block text-sm underline text-ink-2">
                      Full report →
                    </Link>
                  </>
                ) : slot?.status === "error" ? (
                  <p className="text-sm text-critical pr-5">
                    {r.id}: {slot.error}
                  </p>
                ) : (
                  <p className="text-sm text-ink-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent pulse-dot" /> Analyzing {r.id}…
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {done.length >= 1 && (
        <section className="mt-10 grid gap-8">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight">Key metrics</h2>
            <p className="mt-1 mb-4 text-sm text-ink-2">Click a header to sort. Click a row for the full report.</p>
            <DataTable
              rows={done}
              columns={METRIC_COLS}
              rowKey={(d) => `${d.app.store}:${d.app.id}`}
              initialSort={{ key: "neg", dir: "desc" }}
              onRowClick={(d) => router.push(`/app/${d.app.store}/${d.app.id}`)}
            />
          </div>
          <div className="min-w-0 max-w-2xl">
            <h2 className="text-xl font-semibold tracking-tight">Sentiment split</h2>
            <div className="mt-1 mb-4">
              <SentimentLegend />
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <SentimentSplitChart
                rows={done.map((d) => ({
                  label: d.app.title.split(/[:\-–]/)[0].trim(),
                  total: d.reviews.length,
                  negative: d.reviews.filter((r) => r.sentiment === "negative").length,
                  neutral: d.reviews.filter((r) => r.sentiment === "neutral").length,
                  positive: d.reviews.filter((r) => r.sentiment === "positive").length,
                }))}
              />
            </div>
          </div>
        </section>
      )}

      {done.length >= 1 && cats.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Complaint mix</h2>
          <p className="mt-1 text-sm text-ink-2">
            Share of each app&apos;s complaints that fall into each area. Darker means a bigger share.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-ink-2 px-4 py-3">Area</th>
                  {done.map((d) => (
                    <th key={d.app.id} className="font-medium px-4 py-3 text-center whitespace-nowrap">
                      {d.app.title.split(":")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cats.map((c) => (
                  <tr key={c} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-ink-2 whitespace-nowrap">{CATEGORY_INFO[c].label}</td>
                    {done.map((d) => {
                      const v = shareOf(d, c);
                      const step = v === 0 ? -1 : Math.min(RAMP.length - 1, Math.floor((v / maxShare) * RAMP.length));
                      return (
                        <td key={d.app.id} className="px-2 py-1.5 text-center">
                          <span
                            title={`${d.app.title}: ${pct(v)} of complaints are about ${CATEGORY_INFO[c].label.toLowerCase()}`}
                            className="block rounded-md py-1.5 tabular"
                            style={{
                              background: step < 0 ? "transparent" : RAMP[step],
                              color: step >= 3 ? "#ffffff" : step < 0 ? "var(--ink-3)" : "#0b0b0b",
                            }}
                          >
                            {v === 0 ? "–" : pct(v)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
