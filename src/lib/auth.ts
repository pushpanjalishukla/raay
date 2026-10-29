// Sign-in is optional: until Clerk keys are configured the site runs without accounts.
import type { PlanKey } from "./plans";

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
  subscriptionId: string | null;
  email: string | null;
  name: string | null;
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
    subscriptionId: typeof priv.razorpaySubscriptionId === "string" ? priv.razorpaySubscriptionId : null,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
  };
}

/** A plan counts while active, or until the end of a cancelled-but-paid period. */
export function activePlan(s: PlanState): PlanKey | null {
  if (!s.plan) return null;
  const now = Date.now() / 1000;
  const paidThrough = (s.currentEnd ?? 0) + 2 * 86400; // small grace for renewal webhooks
  if (s.status === "active" || s.status === "authenticated") return paidThrough > now ? s.plan : null;
  if (s.status === "cancelled" || s.status === "pending") return paidThrough > now ? s.plan : null;
  return null;
}

export async function setPlanState(
  userId: string,
  update: { plan?: PlanKey | null; status?: string; currentEnd?: number | null; subscriptionId?: string },
) {
  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  const publicMetadata: Record<string, unknown> = {};
  if (update.plan !== undefined) publicMetadata.plan = update.plan;
  if (update.status !== undefined) publicMetadata.planStatus = update.status;
  if (update.currentEnd !== undefined) publicMetadata.planCurrentEnd = update.currentEnd;
  const privateMetadata: Record<string, unknown> = {};
  if (update.subscriptionId) privateMetadata.razorpaySubscriptionId = update.subscriptionId;
  await client.users.updateUserMetadata(userId, { publicMetadata, privateMetadata });
}
