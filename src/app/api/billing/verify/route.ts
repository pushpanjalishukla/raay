import type { NextRequest } from "next/server";
import { getUserId } from "@/lib/auth";
import { billingEnabled, syncSubscription } from "@/lib/dodo";

// Called when Dodo sends the buyer back to /account. Reads the subscription from Dodo
// (never trusts the redirect's query string) and switches the plan on once it's paid.
export async function POST(req: NextRequest) {
  if (!billingEnabled()) return Response.json({ error: "Payments aren't switched on." }, { status: 503 });
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Please sign in first." }, { status: 401 });
  const b = await req.json().catch(() => null);
  const subscriptionId = String(b?.subscriptionId ?? "");
  if (!/^[\w-]{3,80}$/.test(subscriptionId)) return Response.json({ error: "Missing subscription." }, { status: 400 });
  try {
    const result = await syncSubscription(subscriptionId, userId);
    if (!result) return Response.json({ error: "This payment belongs to a different account." }, { status: 403 });
    if (!result.plan) {
      return Response.json({ pending: true, error: "Your payment is still processing. This page will update in a moment." }, { status: 202 });
    }
    return Response.json({ ok: true, plan: result.plan });
  } catch (err) {
    console.error("[raay] verify failed:", err);
    return Response.json({ error: "Couldn't confirm the payment yet. Please refresh in a minute." }, { status: 502 });
  }
}
