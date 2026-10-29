"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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

export interface WaterfallInput {
  actual: number;
  potential: number;
  steps: { label: string; short: string; delta: number; count: number }[];
}

interface WaterfallRow {
  name: string;
  full: string;
  base: number;
  value: number;
  kind: "total" | "loss";
  label: string;
  tip: string;
}

function waterfallRows(data: WaterfallInput, floor: number): WaterfallRow[] {
  const rows: WaterfallRow[] = [
    { name: "Potential", full: "Potential rating", base: 0, value: data.potential - floor, kind: "total", label: data.potential.toFixed(2), tip: "If every complaint became a happy review" },
  ];
  let level = data.potential;
  for (const s of data.steps) {
    const top = level;
    level -= s.delta;
    rows.push({
      name: s.short,
      full: s.label,
      base: level - floor,
      value: top - level,
      kind: "loss",
      label: `−${s.delta.toFixed(2)}`,
      tip: `${s.count} complaints cost ${s.delta.toFixed(2)}★`,
    });
  }
  rows.push({ name: "Actual", full: "Actual recent rating", base: 0, value: data.actual - floor, kind: "total", label: data.actual.toFixed(2), tip: "Average of the reviews analyzed" });
  return rows;
}

/**
 * Waterfall from the rating the app could have to the rating it has.
 * Values are shifted by `floor` so bars start at the axis minimum, not zero.
 */
export function RatingWaterfallChart({ data }: { data: WaterfallInput }) {
  const floor = Math.max(1, Math.floor((data.actual - 0.25) * 2) / 2);
  const rows = waterfallRows(data, floor);
  type Row = WaterfallRow;
  const Tip = ({ active, payload }: TipProps) => {
    if (!active || !payload?.length) return null;
    const r = payload[0].payload as Row;
    return <TipBox title={r.full} rows={[{ label: r.tip, value: r.kind === "total" ? `★ ${r.label}` : `${r.label}★` }]} />;
  };
  const ticks: number[] = [];
  for (let t = floor; t <= 5.001; t += 0.5) ticks.push(t - floor);
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 22, right: 8, bottom: 0, left: -16 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="name" tick={{ ...AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: "var(--grid)" }} interval={0} />
          <YAxis
            domain={[0, 5 - floor]}
            ticks={ticks}
            tickFormatter={(v: number) => (v + floor).toFixed(1)}
            tick={AXIS}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={Tip} cursor={{ fill: "var(--surface-2)" }} />
          <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="value" stackId="w" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.name} fill={r.kind === "total" ? "var(--series)" : "var(--neg)"} />
            ))}
            <LabelList dataKey="label" position="top" style={{ fontSize: 11, fill: "var(--ink-2)" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
