import type { NextRequest } from "next/server";
import { activePlan, getPlanState, getUserId } from "@/lib/auth";
import { billingEnabled, customerFor, dodo, productFor } from "@/lib/dodo";
import { isPlanKey, PLANS } from "@/lib/plans";
import { overLimit, tooMany } from "@/lib/visitor";

// Starts a Dodo Payments hosted checkout for a plan and returns its URL.
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
    if (!state.email) return Response.json({ error: "Add an email address to your account first." }, { status: 400 });
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
    const session = await dodo().checkoutSessions.create({
      product_cart: [{ product_id: await productFor(plan), quantity: 1 }],
      customer: { customer_id: await customerFor(userId, state) },
      // Dodo appends ?subscription_id=…&status=… to this URL after payment.
      return_url: `${origin}/account`,
      metadata: { userId, plan },
    });
    if (!session.checkout_url) throw new Error("no checkout_url");
    return Response.json({ url: session.checkout_url });
  } catch (err) {
    console.error("[raay] checkout failed:", err);
    return Response.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 });
  }
}
