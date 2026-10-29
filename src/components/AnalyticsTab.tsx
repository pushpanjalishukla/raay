"use client";

import { useMemo } from "react";
import { languageTable, rampCell, timeSeries, topicTable, versionHeat, type LangRow, type TopicRow } from "@/lib/analytics";
import { CATEGORY_INFO } from "@/lib/categories";
import type { Analysis, Category, Lang } from "@/lib/types";
import { RatingTrendChart, SentimentLegend, SentimentSplitChart, SentimentVolumeChart } from "./AnalyticsCharts";
import DataTable, { type Column } from "./DataTable";
import DeepAnalytics from "./DeepAnalytics";

const pct = (n: number) => `${Math.round(n * 100)}%`;

function Card({ title, sub, right, children }: { title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5 min-w-0">
      <div className="flex flex-wrap items-start gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">{title}</h3>
          {sub && <p className="text-xs text-ink-3 mt-0.5">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function AnalyticsTab({
  data,
  onTopic,
  onLang,
  onSearch,
}: {
  data: Analysis;
  onTopic: (c: Category) => void;
  onLang: (l: Lang) => void;
  onSearch: (q: string) => void;
}) {
  const ts = useMemo(() => timeSeries(data.reviews), [data]);
  const topics = useMemo(() => topicTable(data.reviews), [data]);
  const langs = useMemo(() => languageTable(data.reviews), [data]);
  const heat = useMemo(() => versionHeat(data.reviews, data.stats.versions), [data]);
  const langSplit = useMemo(
    () =>
      langs.slice(0, 6).map((l) => {
        const list = data.reviews.filter((r) => r.lang === l.lang);
        return {
          label: l.label,
          total: list.length,
          negative: list.filter((r) => r.sentiment === "negative").length,
          neutral: list.filter((r) => r.sentiment === "neutral").length,
          positive: list.filter((r) => r.sentiment === "positive").length,
        };
      }),
    [langs, data],
  );

  const topicCols: Column<TopicRow>[] = [
    { key: "label", header: "Topic", sort: (r) => r.label, render: (r) => <span className="font-medium whitespace-nowrap">{r.label}</span> },
    { key: "reviews", header: "Reviews", align: "right", sort: (r) => r.reviews, render: (r) => <span className="tabular">{r.reviews}</span> },
    { key: "share", header: "Share", align: "right", sort: (r) => r.share, render: (r) => <span className="tabular">{pct(r.share)}</span> },
    {
      key: "neg",
      header: "Negative",
      align: "right",
      sort: (r) => r.negShare,
      render: (r) => <span className="tabular">{pct(r.negShare)}</span>,
    },
    { key: "avg", header: "Avg ★", align: "right", sort: (r) => r.avgRating, render: (r) => <span className="tabular">{r.avgRating.toFixed(2)}</span> },
    {
      key: "severe",
      header: "Severe",
      align: "right",
      sort: (r) => r.severe,
      render: (r) => <span className={`tabular ${r.severe ? "text-critical font-medium" : "text-ink-3"}`}>{r.severe}</span>,
    },
    { key: "lang", header: "Main language", sort: (r) => r.topLang, render: (r) => <span className="whitespace-nowrap">{r.topLang}</span> },
    {
      key: "example",
      header: "Typical review",
      render: (r) => <span className="text-ink-2 line-clamp-2 min-w-[14rem]">{r.example}</span>,
    },
  ];

  const langCols: Column<LangRow>[] = [
    { key: "label", header: "Language", sort: (r) => r.label, render: (r) => <span className="font-medium">{r.label}</span> },
    { key: "reviews", header: "Reviews", align: "right", sort: (r) => r.reviews, render: (r) => <span className="tabular">{r.reviews}</span> },
    { key: "share", header: "Share", align: "right", sort: (r) => r.share, render: (r) => <span className="tabular">{pct(r.share)}</span> },
    { key: "neg", header: "Negative", align: "right", sort: (r) => r.negShare, render: (r) => <span className="tabular">{pct(r.negShare)}</span> },
    { key: "avg", header: "Avg ★", align: "right", sort: (r) => r.avgRating, render: (r) => <span className="tabular">{r.avgRating.toFixed(2)}</span> },
    { key: "issue", header: "Top complaint", render: (r) => <span className="whitespace-nowrap text-ink-2">{r.topIssue}</span> },
  ];

  const tsSub = `Reviews per ${ts.unit} (IST)${ts.excluded ? ` · ${ts.excluded} older reviews not shown` : ""}`;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Trends</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Review volume by sentiment" sub={tsSub} right={<SentimentLegend />}>
          <SentimentVolumeChart rows={ts.rows} />
        </Card>
        <Card title="Average rating over time" sub={`Mean star rating per ${ts.unit}`}>
          <RatingTrendChart rows={ts.rows} />
        </Card>
      </div>

      <Card
        title="Complaint topics by release"
        sub="Complaints in each topic as a share of that version's reviews. Darker means a bigger share."
      >
        {data.stats.versions.length && heat.cats.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left font-medium text-ink-2 pb-2 pr-3">Topic</th>
                  {data.stats.versions.map((v) => (
                    <th key={v.version} className="font-medium text-ink-2 pb-2 px-1 text-center whitespace-nowrap">
                      v{v.version}
                      {v.spike && <span className="block text-[11px] text-critical">⚠ Spike</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heat.cats.map((c, i) => (
                  <tr key={c}>
                    <td className="py-1 pr-3 text-ink-2 whitespace-nowrap">{CATEGORY_INFO[c].label}</td>
                    {heat.cells[i].map((cell, j) => (
                      <td key={j} className="p-1 text-center">
                        <span
                          className="block rounded-md py-1.5 tabular min-w-12"
                          style={rampCell(cell.share, heat.max)}
                          title={`v${data.stats.versions[j].version}: ${cell.count} of ${data.stats.versions[j].total} reviews (${pct(cell.share)})`}
                        >
                          {cell.count || "–"}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-border">
                  <td className="pt-2 pr-3 text-ink-3 text-xs">Reviews in version</td>
                  {data.stats.versions.map((v) => (
                    <td key={v.version} className="pt-2 text-center text-ink-3 text-xs tabular">
                      {v.total}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink-2">Not enough reviews with version numbers to compare releases.</p>
        )}
      </Card>

      <Card title="Topics" sub="Every review grouped by topic. Click a row to read those reviews. Click a header to sort.">
        <DataTable
          rows={topics}
          columns={topicCols}
          rowKey={(r) => r.category}
          initialSort={{ key: "reviews", dir: "desc" }}
          onRowClick={(r) => onTopic(r.category)}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 min-w-0 grid">
        <Card title="Sentiment by language" sub="Share of each language's reviews" right={<SentimentLegend />}>
          <SentimentSplitChart rows={langSplit} />
        </Card>
        </div>
        <div className="lg:col-span-3 min-w-0 grid">
        <Card title="Languages" sub="Click a row to read those reviews.">
          <DataTable
            rows={langs}
            columns={langCols}
            rowKey={(r) => r.lang}
            initialSort={{ key: "reviews", dir: "desc" }}
            onRowClick={(r) => onLang(r.lang)}
          />
        </Card>
        </div>
      </div>
      <DeepAnalytics data={data} onSearch={onSearch} onTopic={onTopic} />
    </div>
  );
}
