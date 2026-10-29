// Who may spend AI budget right now: free daily allowance, then sign-in, then a paid plan.
import { bump, sharedCache } from "./counters";
import { localBump } from "./visitor";
import { activePlan, authEnabled, getPlanState, getUserId } from "./auth";
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

export async function checkAllowance(kind: Kind, ip: string): Promise<Allowance> {
  const userId = await getUserId().catch(() => null);

  if (userId) {
    const plan = activePlan(await getPlanState(userId));
    if (plan) {
      const used = await bump(`paid:${userId}:${kind}:${month()}`, 40 * 86400);
      return used > PLANS[plan].limits[kind] ? { ok: false, gate: "quota" } : { ok: true, plan };
    }
  }

  // Free usage is counted per IP (and per account when signed in), so signing
  // in alone doesn't reset the allowance; it leads to the plans.
  const ipKey = `free-ip:${ip}:${kind}:${day()}`;
  const blocked = localBump(ipKey) > FREE_LIMITS[kind] || (await bump(ipKey, 2 * 86400)) > FREE_LIMITS[kind];
  const blockedUser = userId ? (await bump(`free-user:${userId}:${kind}:${day()}`, 2 * 86400)) > FREE_LIMITS[kind] : false;
  const globalKey = `free-all:${kind}:${day()}`;
  const globalBlocked =
    localBump(globalKey) > GLOBAL_FREE_PER_DAY[kind] || (await bump(globalKey, 2 * 86400)) > GLOBAL_FREE_PER_DAY[kind];
  if (!blocked && !blockedUser && !globalBlocked) return { ok: true, plan: null };
  if (!authEnabled()) return { ok: false, gate: "busy" };
  return { ok: false, gate: userId ? "upgrade" : "login" };
}

export async function usageThisMonth(userId: string) {
  const cache = sharedCache();
  const get = async (k: Kind) => Number((await cache.get(`paid:${userId}:${k}:${month()}`).catch(() => 0)) ?? 0);
  return { report: await get("report"), question: await get("question") };
}
