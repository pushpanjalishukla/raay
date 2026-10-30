// Who may spend AI budget right now: a paid plan's monthly quota, or the account's one-time free allowance.
import { bump, sharedCache } from "./counters";
import { localBump } from "./visitor";
import { activePlan, authEnabled, getPlanState, getUserId, spendFreeCredit } from "./auth";
import { FREE_LIMITS, PLANS, type PlanKey } from "./plans";

export type Gate = "login" | "upgrade" | "quota" | "busy";
type Kind = "report" | "question";

const GLOBAL_FREE_PER_DAY: Record<Kind, number> = {
  report: Number(process.env.RAAY_AI_DAILY_LIMIT ?? 40),
  question: Number(process.env.RAAY_ASK_DAILY_LIMIT ?? 300),
};

const day = () => new Date().toISOString().slice(0, 10);
const month = () => new Date().toISOString().slice(0, 7);

export type Allowance = { ok: true; plan: PlanKey | null } | { ok: false; gate: Gate };

/** Counts one use per visitor per day; true once the visitor is past `max`. */
async function overDaily(key: string, max: number): Promise<boolean> {
  return localBump(key) > max || (await bump(key, 2 * 86400)) > max;
}

export async function checkAllowance(kind: Kind, ip: string): Promise<Allowance> {
  const userId = await getUserId().catch(() => null);

  if (!userId) {
    // The free allowance belongs to an account, so visitors sign in first.
    if (authEnabled()) return { ok: false, gate: "login" };
    // Without accounts (local development) there is nowhere to keep a lifetime count.
    return (await overDaily(`free-ip:${ip}:${kind}:${day()}`, FREE_LIMITS[kind])) ? { ok: false, gate: "busy" } : { ok: true, plan: null };
  }

  const state = await getPlanState(userId);
  const plan = activePlan(state);
  if (plan) {
    const used = await bump(`paid:${userId}:${kind}:${month()}`, 40 * 86400);
    return used > PLANS[plan].limits[kind] ? { ok: false, gate: "quota" } : { ok: true, plan };
  }

  if (state.freeUsed[kind] >= FREE_LIMITS[kind]) return { ok: false, gate: "upgrade" };
  // Guards against one person farming free accounts, and against a site-wide spike in AI cost.
  if (
    (await overDaily(`free-ip:${ip}:${kind}:${day()}`, FREE_LIMITS[kind])) ||
    (await overDaily(`free-all:${kind}:${day()}`, GLOBAL_FREE_PER_DAY[kind]))
  ) {
    return { ok: false, gate: "busy" };
  }
  await spendFreeCredit(userId, kind, state.freeUsed);
  return { ok: true, plan: null };
}

export async function usageThisMonth(userId: string) {
  const cache = sharedCache();
  const get = async (k: Kind) => Number((await cache.get(`paid:${userId}:${k}:${month()}`).catch(() => 0)) ?? 0);
  return { report: await get("report"), question: await get("question") };
}
