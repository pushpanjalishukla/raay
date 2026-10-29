// India App Pulse: a live leaderboard of how unhappy users are with popular apps.
// Uses a cached AI report when one exists, otherwise the free built-in classifier,
// so it costs nothing in AI calls.
import { CATEGORY_INFO } from "./categories";
import { sharedCache } from "./counters";
import { classify } from "./lexicon";
import { computeStats } from "./stats";
import { fetchApp } from "./stores";
import type { Analysis } from "./types";
import type { PulseCategory, PulseRow } from "./pulse-shared";

export type { PulseRow } from "./pulse-shared";

export const PULSE_APPS: { id: string; name: string; category: PulseCategory }[] = [
  { id: "com.zeptoconsumerapp", name: "Zepto", category: "Quick commerce" },
  { id: "com.grofers.customerapp", name: "Blinkit", category: "Quick commerce" },
  { id: "com.bigbasket.mobileapp", name: "BigBasket", category: "Quick commerce" },
  { id: "com.jpl.jiomart", name: "JioMart", category: "Quick commerce" },
  { id: "com.phonepe.app", name: "PhonePe", category: "Payments" },
  { id: "net.one97.paytm", name: "Paytm", category: "Payments" },
  { id: "com.google.android.apps.nbu.paisa.user", name: "Google Pay", category: "Payments" },
  { id: "com.dreamplug.androidapp", name: "CRED", category: "Payments" },
  { id: "com.meesho.supply", name: "Meesho", category: "Shopping" },
  { id: "com.flipkart.android", name: "Flipkart", category: "Shopping" },
  { id: "com.myntra.android", name: "Myntra", category: "Shopping" },
  { id: "in.amazon.mShop.android.shopping", name: "Amazon", category: "Shopping" },
  { id: "in.swiggy.android", name: "Swiggy", category: "Food & travel" },
  { id: "com.application.zomato", name: "Zomato", category: "Food & travel" },
  { id: "com.olacabs.customer", name: "Ola", category: "Food & travel" },
  { id: "com.rapido.passenger", name: "Rapido", category: "Food & travel" },
  { id: "com.nextbillion.groww", name: "Groww", category: "Investing" },
  { id: "com.zerodha.kite3", name: "Zerodha Kite", category: "Investing" },
];


const short = (title: string) => title.split(/[:\-–|]/)[0].trim();

function toRow(a: Analysis, category: PulseCategory, name: string): PulseRow {
  const top = a.stats.issues.find((i) => i.category !== "other");
  return {
    id: a.app.id,
    name: name || short(a.app.title),
    icon: a.app.icon,
    category,
    storeRating: a.app.rating,
    recentRating: a.stats.sampleAvgRating,
    negativeShare: a.stats.negativeShare,
    reviews: a.stats.total,
    topComplaint: top ? CATEGORY_INFO[top.category].label : null,
    topComplaintShare: top?.share ?? 0,
    ai: a.engine !== "lexicon",
  };
}

async function rowFor(id: string, category: PulseCategory, name: string): Promise<PulseRow | null> {
  const cache = sharedCache();
  const ai = (await cache.get(`analysis:v2:play:${id}`).catch(() => null)) as Analysis | null;
  if (ai?.reviews && ai.engine !== "lexicon") return toRow(ai, category, name);
  const key = `pulse:v1:${id}`;
  const hit = (await cache.get(key).catch(() => null)) as PulseRow | null;
  if (hit) return { ...hit, category, name };
  try {
    const { app, reviews: raw } = await fetchApp("play", id);
    const reviews = raw.map(classify);
    const row = toRow({ app, reviews, stats: computeStats(reviews), engine: "lexicon" } as Analysis, category, name);
    await cache.set(key, row, { ttl: 6 * 3600, name: "raay-pulse" }).catch(() => {});
    return row;
  } catch (err) {
    console.error("[raay] pulse failed for", id, err instanceof Error ? err.message : err);
    return null;
  }
}

/** Builds the leaderboard with limited concurrency to stay polite to the store. */
export async function computePulse(): Promise<PulseRow[]> {
  const rows: PulseRow[] = [];
  const queue = [...PULSE_APPS];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const next = queue.shift()!;
        const row = await rowFor(next.id, next.category, next.name);
        if (row) rows.push(row);
      }
    }),
  );
  return rows.sort((a, b) => b.negativeShare - a.negativeShare);
}
