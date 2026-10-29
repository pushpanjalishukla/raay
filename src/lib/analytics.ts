// Client-side analytics computed from an Analysis payload.
import { CATEGORY_INFO, LANG_LABEL } from "./categories";
import type { Category, LabeledReview, Lang, VersionStat } from "./types";

const IST_OFFSET = 5.5 * 3_600_000;
const HOUR = 3_600_000;

/** Sequential single-hue ramp (light -> dark) shared by heat tables. */
export const RAMP = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"];
export function rampCell(value: number, max: number) {
  if (value <= 0 || max <= 0) return { background: "transparent", color: "var(--ink-3)" };
  const step = Math.min(RAMP.length - 1, Math.floor((value / max) * RAMP.length));
  return { background: RAMP[step], color: step >= 3 ? "#ffffff" : "#0b0b0b" };
}

export interface TimeRow {
  label: string;
  negative: number;
  neutral: number;
  positive: number;
  total: number;
  avgRating: number | null;
}

/**
 * Buckets reviews over time. The bucket size adapts to how busy the app is:
 * big apps get hundreds of reviews a day, small ones a few a week.
 */
export function timeSeries(reviews: LabeledReview[]) {
  const times = reviews.map((r) => Date.parse(r.date) + IST_OFFSET).sort((a, b) => a - b);
  if (!times.length) return { rows: [] as TimeRow[], unit: "day", excluded: 0 };
  // Focus on where reviews actually are: if the newest 60% sit in a much
  // shorter window than the newest 90% (e.g. a busy app plus a few old
  // Hindi reviews), chart that dense recent window.
  const hi = times[times.length - 1];
  const p10 = times[Math.floor(times.length * 0.1)];
  const p40 = times[Math.floor(times.length * 0.4)];
  const lo = hi - p10 > 6 * (hi - p40) ? p40 : p10;
  const spanH = (hi - lo) / HOUR;
  const stepH = spanH <= 36 ? 2 : spanH <= 96 ? 6 : spanH <= 24 * 21 ? 24 : 24 * 7;
  const stepMs = stepH * HOUR;
  const start = Math.floor(lo / stepMs) * stepMs;
  const n = Math.floor((hi - start) / stepMs) + 1;

  const rows: (TimeRow & { sum: number })[] = Array.from({ length: n }, (_, i) => ({
    label: bucketLabel(start + i * stepMs, stepH),
    negative: 0,
    neutral: 0,
    positive: 0,
    total: 0,
    avgRating: null,
    sum: 0,
  }));
  let excluded = 0;
  for (const r of reviews) {
    const t = Date.parse(r.date) + IST_OFFSET;
    if (t < start) {
      excluded++;
      continue;
    }
    const row = rows[Math.floor((t - start) / stepMs)];
    row[r.sentiment]++;
    row.total++;
    row.sum += r.rating;
  }
  const unit = stepH < 24 ? `${stepH}-hour` : stepH === 24 ? "day" : "week";
  return {
    rows: rows.map(({ sum, ...row }) => ({
      ...row,
      // Averages over 1-2 reviews are noise; leave those buckets out of the line.
      avgRating: row.total >= 3 ? Math.round((sum / row.total) * 100) / 100 : null,
    })),
    unit,
    excluded,
  };
}

function bucketLabel(shiftedMs: number, stepH: number) {
  // shiftedMs is already in IST, so format it as UTC.
  const d = new Date(shiftedMs);
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
  if (stepH >= 24 * 7) return `Wk of ${date}`;
  if (stepH >= 24) return date;
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", hour12: true, timeZone: "UTC" });
  return `${date}, ${time}`;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
function topOf<T extends string>(items: T[]): T | null {
  const counts = new Map<T, number>();
  for (const x of items) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export interface TopicRow {
  category: Category;
  label: string;
  reviews: number;
  share: number;
  negShare: number;
  avgRating: number;
  severe: number;
  topLang: string;
  example: string;
}

export function topicTable(reviews: LabeledReview[]): TopicRow[] {
  const groups = new Map<Category, LabeledReview[]>();
  for (const r of reviews) groups.set(r.category, [...(groups.get(r.category) ?? []), r]);
  return [...groups.entries()]
    .map(([category, list]) => {
      const sample = [...list].sort((a, b) => b.severity - a.severity || b.thumbsUp - a.thumbsUp)[0];
      return {
        category,
        label: CATEGORY_INFO[category].label,
        reviews: list.length,
        share: list.length / reviews.length,
        negShare: list.filter((r) => r.sentiment === "negative").length / list.length,
        avgRating: avg(list.map((r) => r.rating)),
        severe: list.filter((r) => r.severity === 3).length,
        topLang: LANG_LABEL[topOf(list.map((r) => r.lang)) ?? "other"],
        example: sample?.gist || sample?.text.slice(0, 120) || "",
      };
    })
    .sort((a, b) => b.reviews - a.reviews);
}

export interface LangRow {
  lang: Lang;
  label: string;
  reviews: number;
  share: number;
  negShare: number;
  avgRating: number;
  topIssue: string;
}

export function languageTable(reviews: LabeledReview[]): LangRow[] {
  const groups = new Map<Lang, LabeledReview[]>();
  for (const r of reviews) groups.set(r.lang, [...(groups.get(r.lang) ?? []), r]);
  return [...groups.entries()]
    .map(([lang, list]) => {
      const issue = topOf(
        list.filter((r) => r.sentiment !== "positive" && r.category !== "praise").map((r) => r.category),
      );
      return {
        lang,
        label: LANG_LABEL[lang],
        reviews: list.length,
        share: list.length / reviews.length,
        negShare: list.filter((r) => r.sentiment === "negative").length / list.length,
        avgRating: avg(list.map((r) => r.rating)),
        topIssue: issue ? CATEGORY_INFO[issue].label : "–",
      };
    })
    .sort((a, b) => b.reviews - a.reviews);
}

/** Complaint topics × app versions: share of each version's reviews in each topic. */
export function versionHeat(reviews: LabeledReview[], versions: VersionStat[]) {
  const complaints = reviews.filter((r) => r.sentiment !== "positive" && r.category !== "praise");
  const totals = new Map<Category, number>();
  for (const r of complaints) totals.set(r.category, (totals.get(r.category) ?? 0) + 1);
  const shown = new Set(versions.map((v) => v.version));
  const ranked = [...totals.entries()]
    .filter(([c]) => c !== "other")
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => ({
      c,
      row: versions.map((v) => {
        const count = complaints.filter((r) => r.version === v.version && r.category === c).length;
        return { count, share: v.total ? count / v.total : 0 };
      }),
    }))
    // Drop topics with no complaints in any of the versions shown.
    .filter((x) => shown.size && x.row.some((cell) => cell.count > 0))
    .slice(0, 7);
  const cats = ranked.map((x) => x.c);
  const cells = ranked.map((x) => x.row);
  const max = Math.max(0.01, ...cells.flat().map((x) => x.share));
  return { cats, cells, max };
}

export function toCsv(reviews: LabeledReview[]): string {
  const head = ["date", "rating", "version", "language", "topic", "sentiment", "severity", "thumbs_up", "replied", "text", "english_summary"];
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = reviews.map((r) =>
    [
      r.date,
      r.rating,
      r.version ?? "",
      LANG_LABEL[r.lang],
      CATEGORY_INFO[r.category].label,
      r.sentiment,
      r.severity,
      r.thumbsUp,
      r.replied ? "yes" : "no",
      r.text,
      r.gist ?? "",
    ]
      .map(esc)
      .join(","),
  );
  return [head.join(","), ...lines].join("\n");
}
