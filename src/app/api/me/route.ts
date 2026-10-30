import { activePlan, authEnabled, getPlanState, getUserId } from "@/lib/auth";
import { usageThisMonth } from "@/lib/entitlements";
import { FREE_LIMITS, PLANS } from "@/lib/plans";
import { billingEnabled } from "@/lib/razorpay";

export async function GET() {
  const base = { authEnabled: authEnabled(), billingEnabled: billingEnabled(), free: FREE_LIMITS };
  const userId = await getUserId().catch(() => null);
  if (!userId) return Response.json({ ...base, signedIn: false }, { headers: { "Cache-Control": "private, no-store" } });
  const state = await getPlanState(userId);
  const plan = activePlan(state);
  return Response.json(
    {
      ...base,
      signedIn: true,
      plan,
      status: state.status,
      currentEnd: state.currentEnd,
      limits: plan ? PLANS[plan].limits : null,
      usage: plan ? await usageThisMonth(userId) : null,
      freeUsed: plan ? null : state.freeUsed,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
