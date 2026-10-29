import type { NextRequest } from "next/server";
import { activePlan, getPlanState, getUserId, setPlanState } from "@/lib/auth";
import { isPlanKey, PLANS } from "@/lib/plans";
import { billingEnabled, createSubscription, publicKeyId } from "@/lib/razorpay";
import { overLimit, tooMany } from "@/lib/visitor";

export async function POST(req: NextRequest) {
  if (!billingEnabled()) return Response.json({ error: "Payments aren't switched on yet." }, { status: 503 });
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Please sign in first.", gate: "login" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const plan = body?.plan;
  if (!isPlanKey(plan)) return Response.json({ error: "Unknown plan." }, { status: 400 });
  if (await overLimit("checkout", userId, 6, 3600)) return tooMany();
  try {
    const state = await getPlanState(userId);
    if (activePlan(state) === plan) {
      return Response.json({ error: `You're already on ${PLANS[plan].name}.` }, { status: 409 });
    }
    const sub = await createSubscription(plan, userId);
    // Keep the paid subscription untouched until this one is verified.
    await setPlanState(userId, { pendingSubscriptionId: sub.id });
    return Response.json({
      keyId: publicKeyId(),
      subscriptionId: sub.id,
      name: `Raay ${PLANS[plan].name}`,
      description: `₹${PLANS[plan].price.toLocaleString("en-IN")} / month`,
      prefill: { email: state.email ?? undefined, name: state.name ?? undefined },
    });
  } catch (err) {
    console.error("[raay] checkout failed:", err);
    return Response.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 });
  }
}
