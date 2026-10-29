import type { NextRequest } from "next/server";
import { getUserId, setPlanState } from "@/lib/auth";
import { isPlanKey } from "@/lib/plans";
import { getSubscription, verifyCheckout } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
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
  await setPlanState(userId, {
    plan: sub.notes.plan,
    status: sub.status === "created" ? "authenticated" : sub.status,
    currentEnd: sub.current_end ?? Math.floor(Date.now() / 1000) + 31 * 86400,
    subscriptionId: sub.id,
  });
  return Response.json({ ok: true, plan: sub.notes.plan });
}
