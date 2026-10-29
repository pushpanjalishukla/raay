import { aiEnabled, insightsWithClaude, labelWithClaude, MODEL } from "./claude";
import { classify } from "./lexicon";
import { computeStats, fallbackInsights, fallbackSummary } from "./stats";
import { sharedCache } from "./counters";
import { checkAllowance, type Gate } from "./entitlements";
import { tryAcquire } from "./visitor";
import { fetchAppCached } from "./stores";
import type { Analysis, Insight, Store } from "./types";

// Three cache layers keep each app's (paid) AI analysis shared by every visitor:
// 1. the Vercel CDN caches the /api/analyze response (see the route),
// 2. Vercel Runtime Cache is shared by all function instances and survives deploys,
// 3. an in-memory map + in-flight promise de-duplicate work inside one instance.
const TTL_S = Number(process.env.RAAY_CACHE_HOURS ?? 12) * 3600;
const memory = new Map<string, { at: number; data: Analysis }>();
const inflight = new Map<string, Promise<Analysis>>();
const shared = sharedCache;

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
  if (running) {
    const result = await running;
    // A gated result belongs to the visitor who triggered it; compute our own instead.
    if (!result.personal) return result;
  }

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
  let allowance = aiEnabled() && raw.length > 0 ? await checkAllowance("report", ip) : null;
  // Cap concurrent AI analyses per instance so a burst can't run up the bill.
  const release = allowance?.ok ? tryAcquire("ai-report", Number(process.env.RAAY_MAX_CONCURRENT_AI ?? 4)) : null;
  if (allowance?.ok && !release) allowance = { ok: false, gate: "busy" };
  const gate: Gate | undefined = allowance && !allowance.ok ? allowance.gate : undefined;
  const useAi = allowance?.ok === true;
  try {

  if (!useAi) {
    const reviews = raw.map(classify);
    const stats = computeStats(reviews);
    return {
      app,
      generatedAt: new Date().toISOString(),
      engine: "lexicon",
      aiAvailable: aiEnabled(),
      // A gated report is specific to this visitor; never share it via caches.
      personal: Boolean(gate),
      gate,
      note: gate
        ? gate === "busy"
          ? "AI reports are at capacity right now, so this report uses Raay's built-in classifier. Popular apps stay AI-powered from cache; try again later for a fresh AI report."
          : undefined
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
  } finally {
    release?.();
  }
}
