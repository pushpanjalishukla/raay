// Dodo Payments (merchant of record) for the monthly Starter and Growth plans.
import DodoPayments from "dodopayments";
import { activePlan, authEnabled, getPlanState, setPlanState, type PlanState } from "./auth";
import { sharedCache } from "./counters";
import { PLANS, type PlanKey } from "./plans";

type Subscription = DodoPayments.Subscription;

export const billingEnabled = () => authEnabled() && Boolean(process.env.DODO_PAYMENTS_API_KEY);

/** "test_mode" unless DODO_PAYMENTS_ENVIRONMENT says "live_mode", so test keys never hit live. */
export const billingMode = () => (process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode");

let client: DodoPayments | null = null;
export function dodo(): DodoPayments {
  client ??= new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? null,
    environment: billingMode(),
  });
  return client;
}

/**
 * The Dodo product id for a Raay plan. Uses DODO_PRODUCT_STARTER / DODO_PRODUCT_GROWTH
 * when set, otherwise finds or creates a monthly INR product tagged with the plan.
 */
export async function productFor(plan: PlanKey): Promise<string> {
  const fromEnv = process.env[`DODO_PRODUCT_${plan.toUpperCase()}`];
  if (fromEnv) return fromEnv;
  const { name, price, tagline } = PLANS[plan];
  const cacheKey = `dodo-product:${billingMode()}:${plan}:${price}`;
  const cached = (await sharedCache().get(cacheKey).catch(() => null)) as string | null;
  if (cached) return cached;

  let id: string | null = null;
  for await (const p of dodo().products.list({ recurring: true, archived: false })) {
    if (p.metadata?.raayPlan === plan && Number(p.metadata?.raayPrice) === price) {
      id = p.product_id;
      break;
    }
  }
  if (!id) {
    const created = await dodo().products.create({
      name: `Raay ${name}`,
      description: tagline,
      tax_category: "saas",
      price: {
        type: "recurring_price",
        currency: "INR",
        price: price * 100, // paise
        tax_inclusive: true, // customers pay exactly the price on the pricing page
        payment_frequency_count: 1,
        payment_frequency_interval: "Month",
        // Renews monthly until cancelled (Dodo's recommended maximum duration).
        subscription_period_count: 20,
        subscription_period_interval: "Year",
      },
      metadata: { raayPlan: plan, raayPrice: price },
    });
    id = created.product_id;
  }
  await sharedCache().set(cacheKey, id, { ttl: 30 * 86400, name: "raay-dodo-product" }).catch(() => {});
  return id;
}

async function planForProduct(productId: string): Promise<PlanKey | null> {
  for (const plan of Object.keys(PLANS) as PlanKey[]) {
    if ((await productFor(plan)) === productId) return plan;
  }
  return null;
}

/** The account's Dodo customer for the current mode, created (and tagged with the user id) once. */
export async function customerFor(userId: string, state: PlanState): Promise<string> {
  const mode = billingMode();
  const existing = state.dodoCustomerIds[mode];
  if (existing) return existing;
  if (!state.email) throw new Error("account has no email");
  const customer = await dodo().customers.create({
    email: state.email,
    name: state.name ?? state.email,
    metadata: { userId },
  });
  await setPlanState(userId, { dodoCustomer: { mode, id: customer.customer_id } });
  return customer.customer_id;
}

/** Which Raay account a subscription belongs to: its own metadata, else its customer's. */
async function ownerOf(sub: Subscription): Promise<string | null> {
  if (typeof sub.metadata?.userId === "string") return sub.metadata.userId;
  const customer = await dodo().customers.retrieve(sub.customer.customer_id);
  return typeof customer.metadata?.userId === "string" ? customer.metadata.userId : null;
}

const toUnix = (iso: string | null | undefined) => (iso ? Math.floor(new Date(iso).getTime() / 1000) : null);

/**
 * Reads a subscription's live state from Dodo and applies it to its owner's plan.
 * Events and redirects are only hints, so replayed or out-of-order ones can't roll a plan back.
 * With `expectUserId`, a subscription owned by someone else is ignored.
 */
export async function syncSubscription(subscriptionId: string, expectUserId?: string) {
  const sub = await dodo().subscriptions.retrieve(subscriptionId);
  const userId = await ownerOf(sub);
  if (!userId || (expectUserId && userId !== expectUserId)) return null;
  const plan = await planForProduct(sub.product_id);
  if (!plan) return null;

  const state = await getPlanState(userId);
  const isCurrent = state.subscriptionId === sub.subscription_id;
  // A new subscription takes over only once it is paid; late events for an old,
  // replaced subscription are ignored.
  if (!isCurrent && sub.status !== "active") return { userId, plan: activePlan(state), status: sub.status };

  // Cancelled from the account page: still active until the paid month ends.
  const status = sub.status === "active" && sub.cancel_at_next_billing_date ? "cancelled" : sub.status;
  await setPlanState(userId, {
    plan,
    status,
    currentEnd: toUnix(sub.next_billing_date),
    subscriptionId: sub.subscription_id,
  });

  // Switching plans: stop the old subscription so the user isn't charged twice.
  if (!isCurrent && state.subscriptionId) {
    await dodo()
      .subscriptions.update(state.subscriptionId, { status: "cancelled" })
      .catch((err) => console.error("[raay] cancel old subscription failed:", err));
  }
  return { userId, plan, status };
}
