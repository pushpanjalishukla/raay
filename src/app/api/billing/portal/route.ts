import { getPlanState, getUserId } from "@/lib/auth";
import { billingEnabled, billingMode, dodo } from "@/lib/dodo";

// Opens Dodo's customer portal: invoices, payment method and billing details.
export async function POST() {
  if (!billingEnabled()) return Response.json({ error: "Payments aren't switched on." }, { status: 503 });
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Please sign in first." }, { status: 401 });
  const customerId = (await getPlanState(userId)).dodoCustomerIds[billingMode()];
  if (!customerId) return Response.json({ error: "No billing history yet." }, { status: 400 });
  try {
    const session = await dodo().customers.customerPortal.create(customerId);
    return Response.json({ url: session.link });
  } catch (err) {
    console.error("[raay] portal failed:", err);
    return Response.json({ error: "Couldn't open billing right now. Please try again." }, { status: 502 });
  }
}
