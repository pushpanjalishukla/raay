import { CATEGORY_INFO } from "./categories";
import type { AppMeta, Category, Insight, LabeledReview, Lang, Stats, VersionStat } from "./types";

const pct = (n: number) => Math.round(n * 100);

export function computeStats(reviews: LabeledReview[]): Stats {
  const total = reviews.length || 1;
  const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Stats["ratingDist"];
  let ratingSum = 0;
  let negatives = 0;
  let replied = 0;
  const issueCounts = new Map<Category, number>();
  const langCounts = new Map<Lang, number>();

  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    ratingDist[star]++;
    ratingSum += r.rating;
    if (r.sentiment === "negative") negatives++;
    if (r.replied) replied++;
    if (r.sentiment !== "positive" && r.category !== "praise") {
      issueCounts.set(r.category, (issueCounts.get(r.category) ?? 0) + 1);
    }
    langCounts.set(r.lang, (langCounts.get(r.lang) ?? 0) + 1);
  }

  const issueTotal = [...issueCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const issues = [...issueCounts.entries()]
    .map(([category, count]) => ({ category, count, share: count / issueTotal }))
    .sort((a, b) => b.count - a.count);
  const langs = [...langCounts.entries()]
    .map(([lang, count]) => ({ lang, count, share: count / total }))
    .sort((a, b) => b.count - a.count);

  const dates = reviews.map((r) => r.date).sort();
  return {
    total: reviews.length,
    sampleAvgRating: reviews.length ? ratingSum / reviews.length : 0,
    negativeShare: negatives / total,
    replyRate: replied / total,
    ratingDist,
    issues,
    langs,
    versions: versionStats(reviews, negatives / total),
    days: dayStats(reviews),
    firstDate: dates[0] ?? "",
    lastDate: dates[dates.length - 1] ?? "",
  };
}

function versionStats(reviews: LabeledReview[], overallNeg: number): VersionStat[] {
  const groups = new Map<string, LabeledReview[]>();
  for (const r of reviews) {
    if (!r.version) continue;
    const list = groups.get(r.version) ?? [];
    list.push(r);
    groups.set(r.version, list);
  }
  const ordered = [...groups.entries()]
    .filter(([, list]) => list.length >= 6)
    .map(([version, list]) => ({
      version,
      list,
      firstSeen: list.map((r) => r.date).sort()[0],
    }))
    .sort((a, b) => a.firstSeen.localeCompare(b.firstSeen))
    .slice(-6);

  let prevNeg: number | null = null;
  return ordered.map(({ version, list }) => {
    const negative = list.filter((r) => r.sentiment === "negative").length;
    const negShare = negative / list.length;
    const cats = new Map<Category, number>();
    for (const r of list) {
      if (r.sentiment === "positive" || r.category === "praise") continue;
      cats.set(r.category, (cats.get(r.category) ?? 0) + 1);
    }
    const top = [...cats.entries()].sort((a, b) => b[1] - a[1])[0];
    const spike =
      list.length >= 8 &&
      negShare >= 0.35 &&
      (prevNeg === null ? negShare >= overallNeg + 0.15 : negShare >= prevNeg + 0.15);
    prevNeg = negShare;
    return {
      version,
      total: list.length,
      negative,
      negShare,
      topIssue: top?.[0] ?? null,
      topIssueCount: top?.[1] ?? 0,
      spike,
    };
  });
}

function dayStats(reviews: LabeledReview[]) {
  const days = new Map<string, { count: number; sum: number }>();
  for (const r of reviews) {
    const d = r.date.slice(0, 10);
    const cur = days.get(d) ?? { count: 0, sum: 0 };
    cur.count++;
    cur.sum += r.rating;
    days.set(d, cur);
  }
  return [...days.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([day, v]) => ({ day, count: v.count, avgRating: v.sum / v.count }));
}

/** Pick the most useful example reviews for a category: severe, upvoted, recent. */
export function pickQuotes(reviews: LabeledReview[], category: Category, n = 3): string[] {
  return reviews
    .filter((r) => r.category === category && r.sentiment !== "positive")
    .sort((a, b) => b.severity - a.severity || b.thumbsUp - a.thumbsUp || b.text.length - a.text.length)
    .slice(0, n)
    .map((r) => r.id);
}

export function fallbackInsights(reviews: LabeledReview[], stats: Stats): Insight[] {
  return stats.issues
    .filter((i) => i.category !== "other" && i.count >= 2)
    .slice(0, 4)
    .map((i) => {
      const info = CATEGORY_INFO[i.category];
      return {
        title: `${info.label}: ${i.count} complaints`,
        detail: `${pct(i.share)}% of all complaints in this sample (${info.hint.toLowerCase()}).`,
        category: i.category,
        count: i.count,
        action: info.action,
        quoteIds: pickQuotes(reviews, i.category),
      };
    });
}

export function fallbackSummary(app: AppMeta, stats: Stats): string {
  const top = stats.issues.find((i) => i.category !== "other");
  const indic = stats.langs
    .filter((l) => l.lang !== "english" && l.lang !== "other")
    .reduce((a, l) => a + l.share, 0);
  const parts = [
    `${stats.total} recent reviews of ${app.title}: ${pct(stats.negativeShare)}% are negative.`,
    top
      ? `The biggest complaint is ${CATEGORY_INFO[top.category].label.toLowerCase()} (${top.count} reviews).`
      : "",
    indic > 0.05 ? `${pct(indic)}% are written in Hinglish or an Indian language.` : "",
  ];
  const spike = stats.versions.find((v) => v.spike);
  if (spike) parts.push(`Version ${spike.version} shows a spike in negative reviews.`);
  return parts.filter(Boolean).join(" ");
}
