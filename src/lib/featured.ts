// The landing hero shows a real, recent AI report for one well-known app.
// It only ever reads caches; it never triggers a paid analysis.
import { CATEGORY_INFO, LANG_LABEL } from "./categories";
import { sharedCache } from "./counters";
import { detectLang } from "./lexicon";
import { churnSignals, fixTracker, ratingWaterfall } from "./deep";
import type { Analysis, LabeledReview } from "./types";

export const FEATURED = { store: "play" as const, id: "com.zeptoconsumerapp", name: "Zepto" };

export interface FeaturedSnapshot {
  app: { id: string; store: "play" | "ios"; name: string; title: string; icon: string };
  generatedAt: string;
  total: number;
  kpis: { negative: number; recent: number; churn: number };
  waterfall: { actual: number; potential: number; steps: { short: string; delta: number }[] };
  reviews: { lang: string; stars: number; text: string; gist: string; topic: string; positive: boolean }[];
  fix: { title: string; detail: string; action: string } | null;
  callouts: { spike: { title: string; sub: string } | null; churn: { title: string; sub: string } | null; reply: { title: string; sub: string } | null };
}

// Common Hindi words written in English letters; an "English" review containing them reads as Hinglish.
const HINGLISH_HINT = /\b(acha|achha|accha|achcha|hai|he|ke|ka|ki|ko|nahi|nahin|nhi|ni|bahut|bhut|kya|mera|mere|mujhe|paise|bhai|wala|raha|gaya)\b/i;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Picks a short, readable, multilingual set of reviews that Raay decoded well. */
function pickReviews(reviews: LabeledReview[]): LabeledReview[] {
  // On a public page about a real brand, show concrete product feedback: skip
  // accusations (fraud/trust), placeholder text and very short or long reviews.
  const usable = reviews.filter(
    (r) =>
      r.text.length >= 25 &&
      r.text.length <= 140 &&
      r.category !== "trust_fraud" &&
      !/\.\.\.|समीक्षा|review here/i.test(r.text) &&
      // Only show reviews whose language label is unambiguous at a glance.
      (detectLang(r.text) === r.lang || (r.lang === "hindi" && detectLang(r.text) === "marathi")) &&
      !(r.lang === "english" && HINGLISH_HINT.test(r.text)),
  );
  const picked: LabeledReview[] = [];
  const take = (pred: (r: LabeledReview) => boolean) => {
    const r = usable
      .filter((x) => !picked.includes(x) && pred(x))
      .sort((a, b) => b.severity - a.severity || b.thumbsUp - a.thumbsUp)[0];
    if (r) picked.push(r);
  };
  const hasGist = (r: LabeledReview) => Boolean(r.gist);
  const usedCats = () => new Set(picked.map((p) => p.category));
  const indic = ["hindi", "marathi", "tamil", "telugu", "kannada", "bengali", "gujarati", "malayalam", "punjabi"];
  take((r) => r.lang === "hinglish" && r.sentiment === "negative" && hasGist(r));
  const before = picked.length;
  take((r) => indic.includes(r.lang) && hasGist(r));
  if (picked.length === before) take((r) => r.lang === "hinglish" && r.sentiment === "negative" && hasGist(r) && !usedCats().has(r.category));
  take((r) => r.sentiment === "negative" && hasGist(r) && !usedCats().has(r.category));
  take((r) => r.rating === 5 && r.sentiment === "positive" && r.lang === "english");
  if (picked.length < 4) take((r) => r.rating === 5 && r.sentiment === "positive");
  while (picked.length < 4) {
    const before = picked.length;
    take((r) => hasGist(r) || r.sentiment === "positive");
    if (picked.length === before) break;
  }
  return picked.slice(0, 4);
}

export function buildSnapshot(a: Analysis, name: string): FeaturedSnapshot {
  const wf = ratingWaterfall(a.reviews);
  const churn = churnSignals(a.reviews, a.app.title);
  const spike = a.stats.versions.find((v) => v.spike);
  const fix = fixTracker(a.reviews, a.stats.versions);
  const worse = fix?.rows.find((r) => r.status === "worse" || r.status === "new");
  const reply = a.replies[0];
  const replyReview = reply ? a.reviews.find((r) => r.id === reply.reviewId) : undefined;
  const top = a.insights[0];
  return {
    app: { id: a.app.id, store: a.app.store, name, title: a.app.title, icon: a.app.icon },
    generatedAt: a.generatedAt,
    total: a.stats.total,
    kpis: { negative: a.stats.negativeShare, recent: a.stats.sampleAvgRating, churn: churn.churn.length },
    waterfall: {
      actual: wf.actual,
      potential: wf.potential,
      steps: wf.steps
        .filter((s) => s.category !== "other" && s.category !== "rest")
        .slice(0, 4)
        .map((s) => ({ short: s.short, delta: s.delta })),
    },
    reviews: pickReviews(a.reviews).map((r) => ({
      lang: LANG_LABEL[r.lang],
      stars: r.rating,
      text: clip(r.text, 120),
      gist: r.gist && r.lang !== "english" ? clip(r.gist, 80) : r.gist && r.sentiment !== "positive" ? clip(r.gist, 80) : "",
      topic: CATEGORY_INFO[r.category].label,
      positive: r.sentiment === "positive",
    })),
    fix: top ? { title: top.title, detail: clip(top.detail, 110), action: clip(top.action, 120) } : null,
    callouts: {
      spike: spike
        ? { title: `Spike in v${spike.version}`, sub: `${Math.round(spike.negShare * 100)}% of its reviews are negative` }
        : worse
          ? { title: `Getting worse in v${fix!.latest}`, sub: worse.label }
          : wf.steps[0]
            ? { title: `${wf.steps[0].label} costs ${wf.steps[0].delta.toFixed(2)}★`, sub: "Biggest drag on the rating" }
            : null,
      churn: churn.churn.length
        ? {
            title: `${churn.churn.length} users say they're leaving`,
            sub: churn.competitors.length ? `Rivals named: ${churn.competitors.slice(0, 2).map((c) => c.name).join(", ")}` : "Uninstall & switch threats",
          }
        : null,
      reply: reply
        ? { title: `Reply drafted in ${replyReview ? LANG_LABEL[replyReview.lang] : "the user's language"}`, sub: `“${clip(reply.reply, 30)}”` }
        : null,
    },
  };
}

const SNAP_KEY = `featured:v1:${FEATURED.store}:${FEATURED.id}`;

/** Latest real snapshot: from the cached AI report if present, else the last saved one (kept 14 days). */
export async function getFeatured(): Promise<FeaturedSnapshot | null> {
  const cache = sharedCache();
  const report = (await cache.get(`analysis:v2:${FEATURED.store}:${FEATURED.id}`).catch(() => null)) as Analysis | null;
  if (report?.reviews && report.engine !== "lexicon" && report.insights.length) {
    const snap = buildSnapshot(report, FEATURED.name);
    await cache.set(SNAP_KEY, snap, { ttl: 14 * 86400, name: "raay-featured" }).catch(() => {});
    return snap;
  }
  return ((await cache.get(SNAP_KEY).catch(() => null)) as FeaturedSnapshot | null) ?? null;
}
