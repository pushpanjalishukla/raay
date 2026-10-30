import { NotFoundError } from "dodopayments";
import type { NextRequest } from "next/server";
import { billingEnabled, dodo, syncSubscription } from "@/lib/dodo";

// Dodo Payments → Raay: keeps each user's plan in sync on payments, renewals,
// failed renewals and cancellations. Signed per the Standard Webhooks spec.
export async function POST(req: NextRequest) {
  if (!billingEnabled()) return Response.json({ ok: true, skipped: "billing disabled" });
  const raw = await req.text();
  let event;
  try {
    event = dodo().webhooks.unwrap(raw, {
      headers: {
        "webhook-id": req.headers.get("webhook-id") ?? "",
        "webhook-signature": req.headers.get("webhook-signature") ?? "",
        "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
      },
    });
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }
  const subscriptionId = "subscription_id" in event.data ? event.data.subscription_id : null;
  if (!event.type.startsWith("subscription.") || !subscriptionId) {
    return Response.json({ ok: true, skipped: event.type });
  }
  try {
    await syncSubscription(subscriptionId);
    return Response.json({ ok: true });
  } catch (err) {
    // Unknown subscription (e.g. a dashboard test event): nothing to sync, don't retry.
    if (err instanceof NotFoundError) return Response.json({ ok: true, skipped: "unknown subscription" });
    // Any other failure: a 5xx makes Dodo retry the event later.
    console.error("[raay] webhook sync failed:", err);
    return Response.json({ error: "Sync failed" }, { status: 500 });
  }
}
