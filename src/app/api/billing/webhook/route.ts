import type { NextRequest } from "next/server";
import { authEnabled, getPlanState, setPlanState } from "@/lib/auth";
import { isPlanKey } from "@/lib/plans";
import { cancelSubscription, verifyWebhook, type RzpSubscription } from "@/lib/razorpay";

// Razorpay → Raay: keeps each user's plan in sync on renewals, failures and cancellations.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-razorpay-signature") ?? "")) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (!authEnabled()) return Response.json({ ok: true, skipped: "auth disabled" });
  const event = JSON.parse(raw) as { event: string; payload?: { subscription?: { entity?: RzpSubscription } } };
  const sub = event.payload?.subscription?.entity;
  const userId = sub?.notes?.userId;
  if (!sub || !userId) return Response.json({ ok: true, skipped: "no subscription" });

  const status: Record<string, string> = {
    "subscription.authenticated": "authenticated",
    "subscription.activated": "active",
    "subscription.charged": "active",
    "subscription.resumed": "active",
    "subscription.pending": "pending",
    "subscription.halted": "halted",
    "subscription.paused": "paused",
    "subscription.cancelled": "cancelled",
    "subscription.completed": "completed",
  };
  const next = status[event.event];
  if (!next) return Response.json({ ok: true, skipped: event.event });

  // Only the user's current subscription (or a just-paid pending one) may change their plan.
  // Late events for an old, replaced subscription are ignored.
  const state = await getPlanState(userId);
  const isCurrent = state.subscriptionId === sub.id;
  const isPendingPaid = state.pendingSubscriptionId === sub.id && next === "active";
  if (!isCurrent && !isPendingPaid) return Response.json({ ok: true, skipped: "not the current subscription" });

  await setPlanState(userId, {
    plan: isPlanKey(sub.notes.plan) ? sub.notes.plan : undefined,
    status: next,
    currentEnd: sub.current_end ?? undefined,
    subscriptionId: sub.id,
    ...(isPendingPaid ? { pendingSubscriptionId: null } : {}),
  });
  if (isPendingPaid && state.subscriptionId && state.subscriptionId !== sub.id) {
    await cancelSubscription(state.subscriptionId, false).catch((err) => console.error("[raay] cancel old subscription failed:", err));
  }
  return Response.json({ ok: true });
}
