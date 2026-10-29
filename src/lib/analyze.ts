import { aiEnabled, insightsWithClaude, labelWithClaude, MODEL } from "./claude";
import { classify } from "./lexicon";
import { computeStats, fallbackInsights, fallbackSummary } from "./stats";
import { fetchApp } from "./stores";
import type { Analysis, Insight, Store } from "./types";

const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; data: Analysis }>();
const inflight = new Map<string, Promise<Analysis>>();

// Simple per-IP limit on fresh AI analyses so a public demo can't drain the API budget.
const AI_PER_IP_PER_HOUR = Number(process.env.RAAY_AI_PER_IP_PER_HOUR ?? 5);
const aiUsage = new Map<string, number[]>();
function allowAi(ip: string): boolean {
  const now = Date.now();
  const recent = (aiUsage.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= AI_PER_IP_PER_HOUR) return false;
  recent.push(now);
  aiUsage.set(ip, recent);
  return true;
}

export async function analyze(store: Store, id: string, ip: string): Promise<Analysis> {
  const key = `${store}:${id}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const running = inflight.get(key);
  if (running) return running;

  const job = run(store, id, ip).finally(() => inflight.delete(key));
  inflight.set(key, job);
  const data = await job;
  if (data.reviews.length) cache.set(key, { at: Date.now(), data });
  return data;
}

async function run(store: Store, id: string, ip: string): Promise<Analysis> {
  const { app, reviews: raw } = await fetchApp(store, id);
  const useAi = aiEnabled() && raw.length > 0 && allowAi(ip);

  if (!useAi) {
    const reviews = raw.map(classify);
    const stats = computeStats(reviews);
    return {
      app,
      generatedAt: new Date().toISOString(),
      engine: "lexicon",
      note: aiEnabled()
        ? "AI limit reached for this hour, so this report uses Raay's built-in classifier."
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
    model: MODEL,
    note: allAi ? undefined : "Some AI steps failed, so parts of this report use the built-in classifier.",
    summary: brief?.summary ?? fallbackSummary(app, stats),
    insights,
    replies: brief?.replies ?? [],
    stats,
    reviews,
  };
}
