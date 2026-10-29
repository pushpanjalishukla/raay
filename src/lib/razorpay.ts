// Razorpay Subscriptions via the REST API (no SDK needed).
import { createHmac, timingSafeEqual } from "node:crypto";
import { authEnabled } from "./auth";
import { sharedCache } from "./counters";
import { PLANS, type PlanKey } from "./plans";

const API = "https://api.razorpay.com/v1";

export const billingEnabled = () =>
  authEnabled() && Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export const publicKeyId = () => process.env.RAZORPAY_KEY_ID ?? "";

async function rp<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Razorpay ${res.status}: ${body?.error?.description ?? "request failed"}`);
  return body as T;
}

interface RzpPlan {
  id: string;
  period: string;
  interval: number;
  item: { name: string; amount: number; currency: string };
}

/**
 * Returns the Razorpay plan id for a Raay plan. Uses RAZORPAY_PLAN_STARTER /
 * RAZORPAY_PLAN_GROWTH when set, otherwise finds or creates a matching monthly plan.
 */
export async function ensurePlan(plan: PlanKey): Promise<string> {
  const fromEnv = process.env[`RAZORPAY_PLAN_${plan.toUpperCase()}`];
  if (fromEnv) return fromEnv;
  const { name, price } = PLANS[plan];
  const itemName = `Raay ${name}`;
  const cacheKey = `rzp-plan:${plan}:${price}:${publicKeyId()}`;
  const cached = (await sharedCache().get(cacheKey).catch(() => null)) as string | null;
  if (cached) return cached;
  const list = await rp<{ items: RzpPlan[] }>("/plans?count=100");
  const found = list.items.find(
    (p) => p.item.name === itemName && p.item.amount === price * 100 && p.period === "monthly" && p.interval === 1,
  );
  const id =
    found?.id ??
    (
      await rp<RzpPlan>("/plans", {
        method: "POST",
        body: {
          period: "monthly",
          interval: 1,
          item: { name: itemName, amount: price * 100, currency: "INR", description: PLANS[plan].tagline },
        },
      })
    ).id;
  await sharedCache().set(cacheKey, id, { ttl: 30 * 86400, name: "raay-rzp-plan" }).catch(() => {});
  return id;
}

export interface RzpSubscription {
  id: string;
  status: string;
  current_end: number | null;
  notes: Record<string, string>;
  short_url?: string;
}

export async function createSubscription(plan: PlanKey, userId: string): Promise<RzpSubscription> {
  return rp<RzpSubscription>("/subscriptions", {
    method: "POST",
    body: {
      plan_id: await ensurePlan(plan),
      total_count: 12,
      customer_notify: 1,
      notes: { userId, plan },
    },
  });
}

export const getSubscription = (id: string) => rp<RzpSubscription>(`/subscriptions/${encodeURIComponent(id)}`);

/** Cancels a subscription. By default access continues to the end of the paid month. */
export const cancelSubscription = (id: string, atCycleEnd = true) =>
  rp<RzpSubscription>(`/subscriptions/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: { cancel_at_cycle_end: atCycleEnd ? 1 : 0 },
  });

function safeEqualHex(a: string, b: string) {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Checkout success signature: HMAC-SHA256(payment_id|subscription_id, key_secret). */
export function verifyCheckout(paymentId: string, subscriptionId: string, signature: string) {
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "")
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC-SHA256(raw body, webhook secret). */
export function verifyWebhook(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
