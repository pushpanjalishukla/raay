"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";

type TipProps = TooltipContentProps<TooltipValueType, string | number>;
import type { TimeRow } from "@/lib/analytics";

const AXIS = { fontSize: 12, fill: "var(--axis)" };
const SENTIMENTS = [
  { key: "negative", label: "Negative", color: "var(--neg)" },
  { key: "neutral", label: "Neutral", color: "var(--neu)" },
  { key: "positive", label: "Positive", color: "var(--pos)" },
] as const;

export function SentimentLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-ink-2">
      {SENTIMENTS.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}

function TipBox({ title, rows }: { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface shadow-lg px-3 py-2 text-xs min-w-[150px]">
      <p className="font-medium text-ink mb-1">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 text-ink-2">
          {r.color && <span className="w-2 h-2 rounded-sm" style={{ background: r.color }} />}
          <span className="flex-1">{r.label}</span>
          <span className="tabular text-ink">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

function VolumeTip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as TimeRow;
  return (
    <TipBox
      title={String(label)}
      rows={[
        ...SENTIMENTS.map((s) => ({ label: s.label, value: String(row[s.key]), color: s.color })).reverse(),
        { label: "Total", value: String(row.total) },
      ]}
    />
  );
}

/** Stacked columns: review volume per time bucket, split by sentiment. */
export function SentimentVolumeChart({ rows }: { rows: TimeRow[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: "var(--grid)" }} minTickGap={24} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={VolumeTip} cursor={{ fill: "var(--surface-2)" }} />
          {SENTIMENTS.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="v"
              fill={s.color}
              stroke="var(--surface)"
              strokeWidth={1}
              radius={i === SENTIMENTS.length - 1 ? [4, 4, 0, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RatingTip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as TimeRow;
  return (
    <TipBox
      title={String(label)}
      rows={[
        { label: "Avg rating", value: row.avgRating ? `★ ${row.avgRating.toFixed(2)}` : "–" },
        { label: "Reviews", value: String(row.total) },
      ]}
    />
  );
}

/** Line: average star rating per time bucket. */
export function RatingTrendChart({ rows }: { rows: TimeRow[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: "var(--grid)" }} minTickGap={24} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={AXIS} tickLine={false} axisLine={false} />
          <Tooltip content={RatingTip} cursor={{ stroke: "var(--axis)", strokeDasharray: "3 3" }} />
          <Line
            type="monotone"
            dataKey="avgRating"
            stroke="var(--series)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--series)", stroke: "var(--surface)", strokeWidth: 2 }}
            activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface SplitRow {
  label: string;
  negative: number;
  neutral: number;
  positive: number;
  total: number;
}

function SplitTip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as SplitRow;
  const pct = (n: number) => `${Math.round((n / Math.max(1, row.total)) * 100)}%`;
  return (
    <TipBox
      title={`${row.label} · ${row.total} reviews`}
      rows={SENTIMENTS.map((s) => ({ label: s.label, value: pct(row[s.key]), color: s.color }))}
    />
  );
}

/** 100% stacked horizontal bars: sentiment split per group (language, app…). */
export function SentimentSplitChart({ rows }: { rows: SplitRow[] }) {
  const data = rows.map((r) => {
    const t = Math.max(1, r.total);
    return { ...r, negP: r.negative / t, neuP: r.neutral / t, posP: r.positive / t };
  });
  const keys = [
    { key: "negP", color: "var(--neg)" },
    { key: "neuP", color: "var(--neu)" },
    { key: "posP", color: "var(--pos)" },
  ];
  return (
    <div style={{ height: Math.max(120, rows.length * 40 + 40) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }} barCategoryGap="28%">
          <XAxis
            type="number"
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            tick={AXIS}
            tickLine={false}
            axisLine={{ stroke: "var(--grid)" }}
          />
          <YAxis type="category" dataKey="label" tick={{ ...AXIS, fill: "var(--ink-2)" }} tickLine={false} axisLine={false} width={96} />
          <Tooltip content={SplitTip} cursor={{ fill: "var(--surface-2)" }} />
          {keys.map((k, i) => (
            <Bar
              key={k.key}
              dataKey={k.key}
              stackId="s"
              fill={k.color}
              stroke="var(--surface)"
              strokeWidth={1}
              radius={i === keys.length - 1 ? [0, 4, 4, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
