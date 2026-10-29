import type { NextRequest } from "next/server";
import { authEnabled, setPlanState } from "@/lib/auth";
import { isPlanKey } from "@/lib/plans";
import { verifyWebhook, type RzpSubscription } from "@/lib/razorpay";

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
  await setPlanState(userId, {
    plan: isPlanKey(sub.notes.plan) ? sub.notes.plan : undefined,
    status: next,
    currentEnd: sub.current_end ?? undefined,
    subscriptionId: sub.id,
  });
  return Response.json({ ok: true });
}
