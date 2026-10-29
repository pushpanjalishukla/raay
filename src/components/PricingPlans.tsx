"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_ON } from "@/lib/client-flags";
import { FREE_LIMITS, PLANS, isPlanKey, type PlanKey } from "@/lib/plans";

interface Me {
  authEnabled: boolean;
  billingEnabled: boolean;
  signedIn: boolean;
  plan?: PlanKey | null;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Couldn't load Razorpay"));
    document.body.appendChild(s);
  });
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="text-good shrink-0 mt-0.5" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ authEnabled: false, billingEnabled: false, signedIn: false }));
  }, []);
  return me;
}

/** Wraps Clerk hooks so this component also works before Clerk is configured. */
function useOpenSignIn() {
  const clerk = AUTH_ON ? useClerk() : null; // eslint-disable-line react-hooks/rules-of-hooks
  const auth = AUTH_ON ? useAuth() : null; // eslint-disable-line react-hooks/rules-of-hooks
  return {
    isSignedIn: Boolean(auth?.isSignedIn),
    openSignIn: (redirect: string) => clerk?.openSignIn({ forceRedirectUrl: redirect, signUpForceRedirectUrl: redirect }),
  };
}

export default function PricingPlans() {
  const me = useMe();
  const router = useRouter();
  const params = useSearchParams();
  const wanted = params.get("plan");
  const { isSignedIn, openSignIn } = useOpenSignIn();
  const [busy, setBusy] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (plan: PlanKey) => {
    setError(null);
    if (!isSignedIn) {
      openSignIn(`/pricing?plan=${plan}`);
      return;
    }
    setBusy(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? "Couldn't start checkout");
      await loadCheckout();
      const rzp = new window.Razorpay!({
        key: order.keyId,
        subscription_id: order.subscriptionId,
        name: order.name,
        description: order.description,
        prefill: order.prefill,
        theme: { color: "#e8590c" },
        handler: async (resp: Record<string, string>) => {
          const v = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          if (v.ok) router.push("/account?welcome=1");
          else setError((await v.json().catch(() => ({}))).error ?? "Payment could not be verified");
        },
        modal: { ondismiss: () => setBusy(null) },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(null);
    }
  };

  const billingOn = Boolean(me?.billingEnabled);
  const current = me?.plan ?? null;

  const cards: { key: "free" | PlanKey; name: string; price: string; per: string; tagline: string; features: string[] }[] = [
    {
      key: "free",
      name: "Free",
      price: "₹0",
      per: "",
      tagline: "Try Raay on any app",
      features: [
        `${FREE_LIMITS.report} fresh AI reports a day`,
        `${FREE_LIMITS.question} Ask Raay questions a day`,
        "Unlimited cached reports",
        "Full analytics dashboard",
      ],
    },
    ...(Object.keys(PLANS) as PlanKey[]).map((k) => ({
      key: k,
      name: PLANS[k].name,
      price: `₹${PLANS[k].price.toLocaleString("en-IN")}`,
      per: "/month",
      tagline: PLANS[k].tagline,
      features: PLANS[k].features,
    })),
  ];

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => {
          const highlight = c.key === "starter" || c.key === wanted;
          const isCurrent = c.key !== "free" && c.key === current;
          return (
            <div
              key={c.key}
              className={`relative rounded-2xl border bg-surface p-6 flex flex-col ${
                highlight ? "border-ink shadow-lg" : "border-border"
              }`}
            >
              {c.key === "starter" && (
                <span className="absolute -top-3 left-6 text-xs px-2.5 py-1 rounded-full bg-accent text-accent-ink font-medium">
                  Most popular
                </span>
              )}
              <h3 className="font-semibold">{c.name}</h3>
              <p className="text-sm text-ink-3 mt-1">{c.tagline}</p>
              <p className="mt-5">
                <span className="text-4xl font-semibold tracking-tight tabular">{c.price}</span>
                <span className="text-ink-3">{c.per}</span>
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-ink-2 flex-1">
                {c.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>
              {c.key === "free" ? (
                <Link href="/#top" className="mt-8 h-11 inline-flex items-center justify-center rounded-lg border border-border text-sm font-medium hover:border-ink-3">
                  Start free
                </Link>
              ) : isCurrent ? (
                <Link href="/account" className="mt-8 h-11 inline-flex items-center justify-center rounded-lg border border-border text-sm font-medium">
                  Your current plan
                </Link>
              ) : billingOn ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => isPlanKey(c.key) && buy(c.key)}
                  className={`mt-8 h-11 rounded-lg text-sm font-medium disabled:opacity-50 ${
                    highlight ? "bg-ink text-bg hover:opacity-90" : "border border-border hover:border-ink-3"
                  }`}
                >
                  {busy === c.key ? "Opening checkout…" : isSignedIn ? `Get ${c.name}` : `Sign in & get ${c.name}`}
                </button>
              ) : (
                <p className="mt-8 h-11 inline-flex items-center justify-center rounded-lg bg-surface-2 text-sm text-ink-3">
                  {me ? "Payments opening soon" : "…"}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="mt-4 text-sm text-critical">{error}</p>}
      <p className="mt-6 text-sm text-ink-3">
        Payments are processed securely by Razorpay: UPI, cards, netbanking and wallets. Cancel anytime from your account.
        You keep access until the end of the month you&apos;ve paid for.
      </p>
    </div>
  );
}
