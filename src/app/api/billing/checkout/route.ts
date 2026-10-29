import type { NextRequest } from "next/server";
import { getPlanState, getUserId, setPlanState } from "@/lib/auth";
import { isPlanKey, PLANS } from "@/lib/plans";
import { billingEnabled, createSubscription, publicKeyId } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  if (!billingEnabled()) return Response.json({ error: "Payments aren't switched on yet." }, { status: 503 });
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Please sign in first.", gate: "login" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const plan = body?.plan;
  if (!isPlanKey(plan)) return Response.json({ error: "Unknown plan." }, { status: 400 });
  try {
    const sub = await createSubscription(plan, userId);
    const state = await getPlanState(userId);
    await setPlanState(userId, { subscriptionId: sub.id });
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
