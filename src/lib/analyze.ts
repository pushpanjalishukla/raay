import { aiEnabled, insightsWithClaude, labelWithClaude, MODEL } from "./claude";
import { classify } from "./lexicon";
import { computeStats, fallbackInsights, fallbackSummary } from "./stats";
import { getCache } from "@vercel/functions";
import { fetchAppCached } from "./stores";
import type { Analysis, Insight, Store } from "./types";

// Three cache layers keep each app's (paid) AI analysis shared by every visitor:
// 1. the Vercel CDN caches the /api/analyze response (see the route),
// 2. Vercel Runtime Cache is shared by all function instances and survives deploys,
// 3. an in-memory map + in-flight promise de-duplicate work inside one instance.
const TTL_S = Number(process.env.RAAY_CACHE_HOURS ?? 12) * 3600;
const memory = new Map<string, { at: number; data: Analysis }>();
const inflight = new Map<string, Promise<Analysis>>();
const shared = () => getCache({ namespace: "raay" });

// Budget guards for the public site: per-visitor and global daily caps on fresh
// AI analyses. Past either cap, visitors get the free built-in classifier.
const AI_PER_IP_PER_HOUR = Number(process.env.RAAY_AI_PER_IP_PER_HOUR ?? 5);
const AI_PER_DAY = Number(process.env.RAAY_AI_DAILY_LIMIT ?? 40);

export async function bump(key: string, ttl: number): Promise<number> {
  // Approximate counter: fine for budget guards, not for billing.
  const cache = shared();
  const n = Number((await cache.get(key).catch(() => 0)) ?? 0) + 1;
  await cache.set(key, n, { ttl, name: "raay-counter" }).catch(() => {});
  return n;
}

async function aiBudget(ip: string): Promise<"ok" | "ip" | "day"> {
  const hour = Math.floor(Date.now() / 3_600_000);
  const today = new Date().toISOString().slice(0, 10);
  if ((await bump(`ip:${ip}:${hour}`, 3600)) > AI_PER_IP_PER_HOUR) return "ip";
  if ((await bump(`day:${today}`, 2 * 86400)) > AI_PER_DAY) return "day";
  return "ok";
}

export async function analyze(store: Store, id: string, ip: string): Promise<Analysis> {
  const key = `analysis:v2:${store}:${id}`;
  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < TTL_S * 1000) return hit.data;
  const fromShared = (await shared().get(key).catch(() => null)) as Analysis | null;
  if (fromShared?.reviews) {
    memory.set(key, { at: Date.now(), data: fromShared });
    return fromShared;
  }
  const running = inflight.get(key);
  if (running) return running;

  const job = run(store, id, ip).finally(() => inflight.delete(key));
  inflight.set(key, job);
  const data = await job;
  if (data.reviews.length && !data.personal) {
    memory.set(key, { at: Date.now(), data });
    // Built-in results are cached briefly so an AI report can replace them soon.
    const ttl = data.engine === "lexicon" ? 1800 : TTL_S;
    await shared().set(key, data, { ttl, tags: [`app:${store}:${id}`], name: "raay-analysis" }).catch(() => {});
  }
  return data;
}

async function run(store: Store, id: string, ip: string): Promise<Analysis> {
  const { app, reviews: raw } = await fetchAppCached(store, id);
  const budget = aiEnabled() && raw.length > 0 ? await aiBudget(ip) : "off";
  const useAi = budget === "ok";

  if (!useAi) {
    const reviews = raw.map(classify);
    const stats = computeStats(reviews);
    return {
      app,
      generatedAt: new Date().toISOString(),
      engine: "lexicon",
      aiAvailable: aiEnabled(),
      personal: budget === "ip",
      note:
        budget === "ip"
          ? "You've reached the free AI limit for this hour, so this report uses Raay's built-in classifier."
          : budget === "day"
            ? "Today's free AI reports are used up, so this report uses Raay's built-in classifier. Popular apps stay AI-powered from cache."
            : "Running on Raay's built-in multilingual classifier. Add an Anthropic API key to unlock AI insights and reply drafts.",
      summary: fallbackSummary(app, stats),
      insights: fallbackInsights(reviews, stats),
      replies: [],
      stats,
      reviews,
    };
  }

  const [labels, brief] = await Promise.all([
    labelWithClaude(raw),
    insightsWithClaude(app, raw).catch((err) => {
      console.error("[raay] insights failed:", err instanceof Error ? err.message : err);
      return null;
    }),
  ]);
  const reviews = labels.labeled;
  const stats = computeStats(reviews);
  const countOf = (c: Insight["category"]) => stats.issues.find((i) => i.category === c)?.count ?? 0;

  const insights: Insight[] = brief
    ? brief.insights.map((x) => ({ ...x, count: countOf(x.category) }))
    : fallbackInsights(reviews, stats);
  const allAi = labels.failures === 0 && brief !== null;

  return {
    app,
    generatedAt: new Date().toISOString(),
    engine: allAi ? "claude" : "hybrid",
    aiAvailable: true,
    model: MODEL,
    note: allAi ? undefined : "Some AI steps failed, so parts of this report use the built-in classifier.",
    summary: brief?.summary ?? fallbackSummary(app, stats),
    insights,
    replies: brief?.replies ?? [],
    stats,
    reviews,
  };
}
