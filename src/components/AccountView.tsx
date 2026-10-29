"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_ON } from "@/lib/client-flags";
import { PLANS, type PlanKey } from "@/lib/plans";

interface Me {
  authEnabled: boolean;
  billingEnabled: boolean;
  signedIn: boolean;
  plan?: PlanKey | null;
  status?: string | null;
  currentEnd?: number | null;
  limits?: { report: number; question: number } | null;
  usage?: { report: number; question: number } | null;
  free: { report: number; question: number };
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const share = Math.min(1, used / Math.max(1, limit));
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-ink-2">{label}</span>
        <span className="tabular">
          {used.toLocaleString("en-IN")} / {limit.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className={`h-full rounded-full ${share > 0.9 ? "bg-critical" : "bg-series"}`} style={{ width: `${share * 100}%` }} />
      </div>
    </div>
  );
}

export default function AccountView() {
  const [me, setMe] = useState<Me | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const welcome = useSearchParams().get("welcome");

  const load = () =>
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMsg("Couldn't load your account."));
  useEffect(() => {
    load();
  }, []);

  if (!AUTH_ON) return <p className="text-ink-2">Accounts are being set up. Check back soon.</p>;
  if (!me) return <p className="text-ink-3">Loading…</p>;
  if (!me.signedIn)
    return (
      <div className="flex justify-center">
        <SignIn routing="hash" forceRedirectUrl="/account" />
      </div>
    );

  const cancel = async () => {
    const r = await fetch("/api/billing/cancel", { method: "POST" });
    const b = await r.json().catch(() => ({}));
    setMsg(r.ok ? "Your plan is cancelled. You keep access until the end of this billing month." : b.error ?? "Couldn't cancel.");
    setConfirm(false);
    load();
  };

  const ends = me.currentEnd ? new Date(me.currentEnd * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <div className="space-y-6">
      {welcome && me.plan && (
        <p className="rounded-xl bg-surface-2 px-5 py-4">
          🎉 Welcome to Raay {PLANS[me.plan].name}! Your AI allowance is live. Search any app to get started.
        </p>
      )}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-ink-2">Current plan</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <h2 className="text-3xl font-semibold tracking-tight">{me.plan ? PLANS[me.plan].name : "Free"}</h2>
          {me.plan && me.status && (
            <span className="text-xs px-2 py-0.5 rounded-full border border-border capitalize text-ink-2">{me.status}</span>
          )}
        </div>
        {me.plan ? (
          <p className="mt-2 text-sm text-ink-2">
            ₹{PLANS[me.plan].price.toLocaleString("en-IN")}/month
            {ends ? (me.status === "cancelled" ? ` · access until ${ends}` : ` · renews on ${ends}`) : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink-2">
            {me.free.report} fresh AI reports and {me.free.question} questions a day. Cached reports are always free.
          </p>
        )}

        {me.plan && me.limits && me.usage && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Meter label="Fresh AI reports this month" used={me.usage.report} limit={me.limits.report} />
            <Meter label="Ask Raay questions this month" used={me.usage.question} limit={me.limits.question} />
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {(!me.plan || me.plan === "starter") && (
            <Link href={me.plan ? "/pricing?plan=growth" : "/pricing"} className="h-10 px-5 inline-flex items-center rounded-lg bg-ink text-bg text-sm font-medium">
              {me.plan ? "Upgrade to Growth" : "See plans"}
            </Link>
          )}
          <Link href="/" className="h-10 px-5 inline-flex items-center rounded-lg border border-border text-sm">
            Analyze an app
          </Link>
          {me.plan && me.status !== "cancelled" && me.billingEnabled && (
            confirm ? (
              <span className="inline-flex items-center gap-2 text-sm">
                Cancel at the end of this month?
                <button type="button" onClick={cancel} className="h-10 px-4 rounded-lg bg-critical text-white">
                  Yes, cancel
                </button>
                <button type="button" onClick={() => setConfirm(false)} className="h-10 px-4 rounded-lg border border-border">
                  Keep plan
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirm(true)} className="h-10 px-4 text-sm text-ink-3 hover:text-ink">
                Cancel plan
              </button>
            )
          )}
        </div>
        {msg && <p className="mt-4 text-sm text-ink-2">{msg}</p>}
      </section>
    </div>
  );
}
