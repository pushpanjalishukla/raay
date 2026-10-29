"use client";

import { useMemo, useState } from "react";
import { toCsv } from "@/lib/analytics";
import { CATEGORY_INFO, LANG_LABEL } from "@/lib/categories";
import { CATEGORY_KEYS, type Category, type LabeledReview, type Lang, type Sentiment } from "@/lib/types";
import DataTable, { type Column } from "./DataTable";

export interface ReviewFilters {
  cat: Category | null;
  lang: Lang | null;
  sent: Sentiment | null;
  q: string;
}
export const NO_FILTERS: ReviewFilters = { cat: null, lang: null, sent: null, q: "" };

const SENT_STYLE: Record<Sentiment, string> = {
  negative: "var(--neg)",
  neutral: "var(--neu)",
  positive: "var(--pos)",
};

const dateIST = (d: string) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T | null) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-ink-3">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange((e.target.value || null) as T | null)}
        className="h-9 rounded-lg border border-border bg-surface px-2 text-ink"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ReviewsTable({
  reviews,
  appName,
  filters,
  setFilters,
}: {
  reviews: LabeledReview[];
  appName: string;
  filters: ReviewFilters;
  setFilters: (f: ReviewFilters) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const langs = useMemo(() => [...new Set(reviews.map((r) => r.lang))], [reviews]);
  const cats = useMemo(() => CATEGORY_KEYS.filter((c) => reviews.some((r) => r.category === c)), [reviews]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return reviews.filter(
      (r) =>
        (!filters.cat || r.category === filters.cat) &&
        (!filters.lang || r.lang === filters.lang) &&
        (!filters.sent || r.sentiment === filters.sent) &&
        (!q || r.text.toLowerCase().includes(q) || r.gist?.toLowerCase().includes(q)),
    );
  }, [reviews, filters]);

  const download = () => {
    const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appName.replace(/[^\w]+/g, "-").toLowerCase()}-reviews.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cols: Column<LabeledReview>[] = [
    {
      key: "date",
      header: "Date (IST)",
      sort: (r) => r.date,
      render: (r) => <span className="whitespace-nowrap text-ink-2 tabular">{dateIST(r.date)}</span>,
    },
    {
      key: "rating",
      header: "★",
      align: "center",
      sort: (r) => r.rating,
      render: (r) => <span className={`tabular ${r.rating <= 2 ? "text-critical font-medium" : ""}`}>{r.rating}</span>,
    },
    {
      key: "sent",
      header: "Sentiment",
      sort: (r) => r.sentiment,
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap capitalize">
          <span className="w-2 h-2 rounded-sm" style={{ background: SENT_STYLE[r.sentiment] }} />
          {r.sentiment}
        </span>
      ),
    },
    {
      key: "topic",
      header: "Topic",
      sort: (r) => CATEGORY_INFO[r.category].label,
      render: (r) => <span className="whitespace-nowrap">{CATEGORY_INFO[r.category].label}</span>,
    },
    { key: "lang", header: "Language", sort: (r) => r.lang, render: (r) => LANG_LABEL[r.lang] },
    {
      key: "ver",
      header: "Version",
      sort: (r) => r.version ?? "",
      render: (r) => <span className="text-ink-2 tabular whitespace-nowrap">{r.version ?? "–"}</span>,
    },
    {
      key: "text",
      header: "Review",
      className: "min-w-[18rem] max-w-xl",
      render: (r) => {
        const open = expanded.has(r.id);
        return (
          <button
            type="button"
            className="text-left"
            onClick={() => {
              const next = new Set(expanded);
              if (open) next.delete(r.id);
              else next.add(r.id);
              setExpanded(next);
            }}
          >
            <span className={open ? "" : "line-clamp-2"}>{r.text}</span>
            {r.gist && r.lang !== "english" && <span className="block text-ink-2 italic mt-0.5">→ {r.gist}</span>}
          </button>
        );
      },
    },
    {
      key: "thumbs",
      header: "👍",
      align: "right",
      sort: (r) => r.thumbsUp,
      render: (r) => <span className="tabular text-ink-2">{r.thumbsUp || ""}</span>,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          placeholder="Search reviews…"
          className="h-9 w-full sm:w-56 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ink-3"
          aria-label="Search reviews"
        />
        <Select
          label="Topic"
          value={filters.cat}
          options={cats.map((c) => ({ value: c, label: CATEGORY_INFO[c].label }))}
          onChange={(cat) => setFilters({ ...filters, cat })}
        />
        <Select
          label="Language"
          value={filters.lang}
          options={langs.map((l) => ({ value: l, label: LANG_LABEL[l] }))}
          onChange={(lang) => setFilters({ ...filters, lang })}
        />
        <Select
          label="Sentiment"
          value={filters.sent}
          options={(["negative", "neutral", "positive"] as Sentiment[]).map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))}
          onChange={(sent) => setFilters({ ...filters, sent })}
        />
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-ink-3 tabular">{rows.length} reviews</span>
          <button
            type="button"
            onClick={download}
            className="h-9 px-3 rounded-lg bg-ink text-bg text-sm font-medium hover:opacity-90"
          >
            Download CSV
          </button>
        </div>
      </div>
      <DataTable
        rows={rows}
        columns={cols}
        rowKey={(r) => r.id}
        initialSort={{ key: "date", dir: "desc" }}
        pageSize={20}
        empty="No reviews match these filters"
      />
    </div>
  );
}
