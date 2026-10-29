import type { NextRequest } from "next/server";
import { getPlanState, getUserId, setPlanState } from "@/lib/auth";
import { isPlanKey } from "@/lib/plans";
import { billingEnabled, cancelSubscription, getSubscription, verifyCheckout } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  if (!billingEnabled()) return Response.json({ error: "Payments aren't switched on." }, { status: 503 });
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Please sign in first." }, { status: 401 });
  const b = await req.json().catch(() => null);
  const paymentId = String(b?.razorpay_payment_id ?? "");
  const subscriptionId = String(b?.razorpay_subscription_id ?? "");
  const signature = String(b?.razorpay_signature ?? "");
  if (!paymentId || !subscriptionId || !verifyCheckout(paymentId, subscriptionId, signature)) {
    return Response.json({ error: "Payment could not be verified." }, { status: 400 });
  }
  const sub = await getSubscription(subscriptionId);
  if (sub.notes?.userId !== userId || !isPlanKey(sub.notes?.plan)) {
    return Response.json({ error: "This payment belongs to a different account." }, { status: 403 });
  }
  // Grant access only for a subscription Razorpay says is paid/authorised.
  if (sub.status !== "active" && sub.status !== "authenticated") {
    return Response.json({ error: "This payment isn't complete yet. Please wait a moment and refresh." }, { status: 409 });
  }
  const previous = (await getPlanState(userId)).subscriptionId;
  await setPlanState(userId, {
    plan: sub.notes.plan,
    status: sub.status,
    // Until Razorpay reports the period end (via webhook), allow a short window only.
    currentEnd: sub.current_end ?? Math.floor(Date.now() / 1000) + 2 * 86400,
    subscriptionId: sub.id,
    pendingSubscriptionId: null,
  });
  // Switching plans: stop the old subscription so the user isn't charged twice.
  if (previous && previous !== sub.id) {
    await cancelSubscription(previous, false).catch((err) => console.error("[raay] cancel old subscription failed:", err));
  }
  return Response.json({ ok: true, plan: sub.notes.plan });
}
