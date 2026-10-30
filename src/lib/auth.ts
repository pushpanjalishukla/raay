// Sign-in is optional: until Clerk keys are configured the site runs without accounts.
import type { PlanKey } from "./plans";

export type UsageKind = "report" | "question";

export const authEnabled = () =>
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

export async function getUserId(): Promise<string | null> {
  if (!authEnabled()) return null;
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId;
}

export interface PlanState {
  plan: PlanKey | null;
  status: string | null;
  /** Unix seconds when the current paid period ends. */
  currentEnd: number | null;
  /** The Dodo Payments subscription that currently grants the plan. */
  subscriptionId: string | null;
  /** Dodo customer per mode ("test_mode" / "live_mode"), created at first checkout. */
  dodoCustomerIds: Record<string, string>;
  email: string | null;
  name: string | null;
  /** Free allowance used so far. Kept on the account so it never resets. */
  freeUsed: Record<UsageKind, number>;
}

function readFreeUsed(priv: Record<string, unknown>): Record<UsageKind, number> {
  const raw = (priv.freeUsed ?? {}) as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === "number" && v > 0 ? Math.floor(v) : 0);
  return { report: n(raw.report), question: n(raw.question) };
}

function readStrings(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object") return {};
  return Object.fromEntries(Object.entries(v).filter((e): e is [string, string] => typeof e[1] === "string"));
}

export async function getPlanState(userId: string): Promise<PlanState> {
  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const pub = (user.publicMetadata ?? {}) as Record<string, unknown>;
  const priv = (user.privateMetadata ?? {}) as Record<string, unknown>;
  return {
    plan: pub.plan === "starter" || pub.plan === "growth" ? pub.plan : null,
    status: typeof pub.planStatus === "string" ? pub.planStatus : null,
    currentEnd: typeof pub.planCurrentEnd === "number" ? pub.planCurrentEnd : null,
    subscriptionId: typeof priv.dodoSubscriptionId === "string" ? priv.dodoSubscriptionId : null,
    dodoCustomerIds: readStrings(priv.dodoCustomerIds),
    email: user.primaryEmailAddress?.emailAddress ?? null,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    freeUsed: readFreeUsed(priv),
  };
}

/** Records one use of the account's free allowance. */
export async function spendFreeCredit(userId: string, kind: UsageKind, used: Record<UsageKind, number>) {
  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    privateMetadata: { freeUsed: { ...used, [kind]: used[kind] + 1 } },
  });
}

/**
 * A plan counts while paid: active, cancelled-but-paid-through, or briefly while a
 * renewal is being retried (past due / on hold). Statuses are Dodo Payments' own,
 * plus "cancelled" for a subscription set to end at its next billing date.
 */
export function activePlan(s: PlanState): PlanKey | null {
  if (!s.plan) return null;
  const now = Date.now() / 1000;
  const paidThrough = (s.currentEnd ?? 0) + 2 * 86400; // small grace for renewal webhooks
  const paid = ["active", "cancelled", "past_due", "on_hold"];
  return s.status && paid.includes(s.status) && paidThrough > now ? s.plan : null;
}

export async function setPlanState(
  userId: string,
  update: {
    plan?: PlanKey | null;
    status?: string;
    currentEnd?: number | null;
    subscriptionId?: string;
    dodoCustomer?: { mode: string; id: string };
  },
) {
  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  const publicMetadata: Record<string, unknown> = {};
  if (update.plan !== undefined) publicMetadata.plan = update.plan;
  if (update.status !== undefined) publicMetadata.planStatus = update.status;
  if (update.currentEnd !== undefined) publicMetadata.planCurrentEnd = update.currentEnd;
  const privateMetadata: Record<string, unknown> = {};
  if (update.subscriptionId) privateMetadata.dodoSubscriptionId = update.subscriptionId;
  // Clerk deep-merges metadata, so this adds one mode's customer id without dropping the other.
  if (update.dodoCustomer) privateMetadata.dodoCustomerIds = { [update.dodoCustomer.mode]: update.dodoCustomer.id };
  await client.users.updateUserMetadata(userId, { publicMetadata, privateMetadata });
}
