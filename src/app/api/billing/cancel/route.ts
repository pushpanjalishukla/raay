import { getPlanState, getUserId, setPlanState } from "@/lib/auth";
import { billingEnabled, dodo } from "@/lib/dodo";

// Cancels at the end of the paid month: access continues until then.
export async function POST() {
  if (!billingEnabled()) return Response.json({ error: "Payments aren't switched on." }, { status: 503 });
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Please sign in first." }, { status: 401 });
  const state = await getPlanState(userId);
  if (!state.subscriptionId) return Response.json({ error: "No active subscription." }, { status: 400 });
  try {
    await dodo().subscriptions.update(state.subscriptionId, { cancel_at_next_billing_date: true });
    await setPlanState(userId, { status: "cancelled" });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[raay] cancel failed:", err);
    return Response.json({ error: "Couldn't cancel right now. Please try again." }, { status: 502 });
  }
}
