"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { churnSignals } from "@/lib/deep";
import type { Analysis, LabeledReview } from "@/lib/types";
import { BarList, Stat } from "./charts";
import DataTable, { type Column } from "./DataTable";

const pct = (n: number) => `${Math.round(n * 100)}%`;

function Quote({ r }: { r: LabeledReview }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
        <span className={r.rating <= 2 ? "text-critical" : "text-ink-2"}>{"★".repeat(r.rating)}</span>
        {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        {r.version && <span>v{r.version}</span>}
        {r.thumbsUp > 0 && <span>👍 {r.thumbsUp}</span>}
      </div>
      <p className="mt-1.5 leading-relaxed">{r.text}</p>
      {r.gist && r.lang !== "english" && <p className="mt-1 text-ink-2 italic">→ {r.gist}</p>}
    </div>
  );
}

export default function ChurnTab({ data }: { data: Analysis }) {
  const sig = useMemo(() => churnSignals(data.reviews, data.app.title), [data]);
  const byId = useMemo(() => new Map(data.reviews.map((r) => [r.id, r])), [data]);
  const [rival, setRival] = useState<string | null>(null);
  const appName = data.app.title.split(/[:\-–]/)[0].trim();
  const selected = sig.competitors.find((c) => c.name === rival) ?? null;

  type Comp = (typeof sig.competitors)[number];
  const cols: Column<Comp>[] = [
    { key: "name", header: "Competitor", sort: (c) => c.name, render: (c) => <span className="font-medium">{c.name}</span> },
    { key: "m", header: "Mentions", align: "right", sort: (c) => c.mentions, render: (c) => <span className="tabular">{c.mentions}</span> },
    {
      key: "neg",
      header: `Unhappy with ${appName}`,
      align: "right",
      sort: (c) => c.negative,
      render: (c) => <span className={`tabular ${c.negative ? "text-critical font-medium" : ""}`}>{c.negative}</span>,
    },
    { key: "pos", header: "Happy anyway", align: "right", sort: (c) => c.positive, render: (c) => <span className="tabular">{c.positive}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Churn-risk reviews" value={String(sig.churn.length)} sub="say they'll uninstall, switch or never return" />
        <Stat label="Of all unhappy reviews" value={pct(sig.churnShareOfNegative)} sub="are explicit churn threats" />
        <Stat label="Rivals mentioned" value={String(sig.competitors.length)} sub={sig.competitors[0] ? `most often: ${sig.competitors[0].name}` : "none in this sample"} />
        <Stat label="Reviews naming a rival" value={String(sig.mentionReviews)} sub={`of ${data.stats.total} analyzed`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 min-w-0">
          <h3 className="font-semibold">Who users compare you with</h3>
          <p className="text-xs text-ink-3 mt-0.5 mb-4">Competitor names found in reviews. Click one to read what users said.</p>
          {sig.competitors.length ? (
            <>
              <BarList
                selected={rival}
                onSelect={(k) => setRival(rival === k ? null : k)}
                rows={sig.competitors.map((c) => ({
                  key: c.name,
                  label: c.name,
                  value: c.mentions,
                  display: String(c.mentions),
                  tip: `${c.negative} unhappy with ${appName}`,
                }))}
              />
              <div className="mt-4">
                <DataTable rows={sig.competitors} columns={cols} rowKey={(c) => c.name} initialSort={{ key: "m", dir: "desc" }} onRowClick={(c) => setRival(c.name)} />
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-2">No competitor names in the latest reviews.</p>
          )}
          <Link
            href={`/compare?apps=${data.app.store}:${data.app.id}`}
            className="mt-4 inline-block text-sm underline text-ink-2"
          >
            Compare {appName} with a competitor side by side →
          </Link>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 min-w-0">
          <h3 className="font-semibold">{selected ? `What users say about ${selected.name}` : "Users who say they're leaving"}</h3>
          <p className="text-xs text-ink-3 mt-0.5 mb-4">
            {selected
              ? `${selected.mentions} reviews mention ${selected.name}.`
              : "Reviews that mention uninstalling, switching, or never ordering again (English & Hinglish). Most-upvoted first."}
          </p>
          <div className="space-y-2 max-h-[34rem] overflow-y-auto pr-1">
            {(selected ? selected.quoteIds.map((id) => byId.get(id)).filter((r): r is LabeledReview => Boolean(r)) : sig.churn.slice(0, 12)).map((r) => (
              <Quote key={r.id} r={r} />
            ))}
            {!selected && sig.churn.length === 0 && <p className="text-sm text-ink-2">No explicit churn threats in the latest reviews.</p>}
          </div>
          {selected && (
            <button type="button" onClick={() => setRival(null)} className="mt-3 text-sm underline text-ink-2">
              ← Back to churn-risk reviews
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
