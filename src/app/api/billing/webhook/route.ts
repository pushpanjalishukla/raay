import type { NextRequest } from "next/server";
import { authEnabled, getPlanState, setPlanState } from "@/lib/auth";
import { isPlanKey } from "@/lib/plans";
import { cancelSubscription, getSubscription, verifyWebhook, type RzpSubscription } from "@/lib/razorpay";

// Razorpay → Raay: keeps each user's plan in sync on renewals, failures and cancellations.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-razorpay-signature") ?? "")) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (!authEnabled()) return Response.json({ ok: true, skipped: "auth disabled" });
  let event: { event: string; payload?: { subscription?: { entity?: RzpSubscription } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Malformed payload" }, { status: 400 });
  }
  if (!event.event?.startsWith("subscription.")) return Response.json({ ok: true, skipped: event.event });
  const subId = event.payload?.subscription?.entity?.id;
  if (!subId) return Response.json({ ok: true, skipped: "no subscription" });
  // Treat the event as a hint only: read the subscription's current state from Razorpay,
  // so out-of-order or replayed events can't roll a user's plan back.
  const sub = await getSubscription(subId);
  const userId = sub.notes?.userId;
  if (!userId) return Response.json({ ok: true, skipped: "no user" });

  const known = ["created", "authenticated", "active", "pending", "halted", "paused", "cancelled", "completed", "expired"];
  const next = known.includes(sub.status) ? sub.status : null;
  if (!next || next === "created") return Response.json({ ok: true, skipped: `status ${sub.status}` });

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
