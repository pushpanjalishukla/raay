"use client";

import { SignIn, useClerk, useUser } from "@clerk/nextjs";
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
  freeUsed?: { report: number; question: number } | null;
  free: { report: number; question: number };
}

const SHORTCUTS = [
  { href: "/", title: "Analyze an app", body: "Search any Play Store or App Store app and get its fix list." },
  { href: "/compare", title: "Compare apps", body: "Put up to 4 apps side by side by what users complain about." },
  { href: "/pulse", title: "India App Pulse", body: "See which popular apps have the unhappiest users right now." },
];

function Tick() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" className="shrink-0 mt-0.5 text-good" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.14" />
      <path d="M6 10.4l2.6 2.6L14 7.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Meter({ label, used, limit, period }: { label: string; used: number; limit: number; period?: string }) {
  const share = Math.min(1, used / Math.max(1, limit));
  const left = Math.max(0, limit - used);
  const out = left === 0;
  return (
    <div className="rounded-2xl border border-border bg-bg/60 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-ink-2">{label}</span>
        <span className="tabular">
          <span className="text-lg font-semibold">{used.toLocaleString("en-IN")}</span>
          <span className="text-sm text-ink-3"> / {limit.toLocaleString("en-IN")}</span>
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${out || share > 0.9 ? "bg-critical" : "bg-accent"}`}
          style={{ width: `${used > 0 ? Math.max(share * 100, 4) : 0}%` }}
        />
      </div>
      <p className={`mt-2 text-xs ${out ? "text-critical" : "text-ink-3"}`}>
        {out ? "Used up" : `${left.toLocaleString("en-IN")} left${period ? ` ${period}` : ""}`}
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden>
      <div className="h-24 rounded-2xl bg-surface-2" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-3xl bg-surface-2 lg:col-span-2" />
        <div className="h-80 rounded-3xl bg-surface-2" />
      </div>
    </div>
  );
}

export default function AccountView() {
  if (!AUTH_ON) return <p className="text-ink-2">Accounts are being set up. Check back soon.</p>;
  return <Account />;
}

function Account() {
  const [me, setMe] = useState<Me | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const welcome = useSearchParams().get("welcome");
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();

  const load = () =>
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMsg("Couldn't load your account."));
  useEffect(() => {
    load();
  }, []);

  if (!me) return msg ? <p className="text-ink-2">{msg}</p> : <Skeleton />;
  if (!me.signedIn)
    return (
      <div className="flex flex-col items-center gap-6">
        <p className="text-ink-2">Sign in to see your plan and what you&apos;ve used.</p>
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

  const plan = me.plan ?? null;
  const next: PlanKey | null = plan === "growth" ? null : plan === "starter" ? "growth" : "starter";
  const ends = me.currentEnd ? new Date(me.currentEnd * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;
  const name = user?.fullName || user?.firstName || "Your profile";
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="space-y-6">
      {welcome && plan && (
        <p className="rounded-2xl border border-accent/40 bg-surface px-5 py-4 text-sm">
          Welcome to Raay {PLANS[plan].name}! Your AI allowance is live. Search any app to get started.
        </p>
      )}

      {/* Profile */}
      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-5">
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.imageUrl} alt="" className="h-14 w-14 rounded-full border border-border object-cover" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-surface-2" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold truncate">{name}</p>
          {email && <p className="text-sm text-ink-3 truncate">{email}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="h-10 px-4 rounded-lg border border-border text-sm hover:border-ink-3"
          >
            Manage profile
          </button>
          <button type="button" onClick={() => signOut({ redirectUrl: "/" })} className="h-10 px-4 rounded-lg text-sm text-ink-3 hover:text-ink">
            Sign out
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current plan and usage */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8 lg:col-span-2">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(60%_100%_at_0%_0%,color-mix(in_oklab,var(--accent)_14%,transparent),transparent)]"
          />
          <div className="relative">
            <p className="text-sm font-semibold text-accent">Current plan</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-4xl font-semibold tracking-[-0.03em]">{plan ? PLANS[plan].name : "Free"}</h2>
              {plan && me.status && (
                <span className="text-xs px-2.5 py-1 rounded-full border border-border capitalize text-ink-2">{me.status}</span>
              )}
            </div>
            <p className="mt-2 text-ink-2">
              {plan
                ? `₹${PLANS[plan].price.toLocaleString("en-IN")}/month${
                    ends ? (me.status === "cancelled" ? ` · access until ${ends}` : ` · renews on ${ends}`) : ""
                  }`
                : `${me.free.report} fresh AI reports and ${me.free.question} Ask Raay questions, one-time. Cached reports are always free to view.`}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {plan && me.limits && me.usage ? (
                <>
                  <Meter label="AI reports" used={me.usage.report} limit={me.limits.report} period="this month" />
                  <Meter label="Ask Raay questions" used={me.usage.question} limit={me.limits.question} period="this month" />
                </>
              ) : (
                <>
                  <Meter label="Free AI reports" used={me.freeUsed?.report ?? 0} limit={me.free.report} />
                  <Meter label="Free Ask Raay questions" used={me.freeUsed?.question ?? 0} limit={me.free.question} />
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/" className="h-11 px-5 inline-flex items-center rounded-lg bg-accent text-accent-ink text-sm font-semibold hover:opacity-90">
                Analyze an app
              </Link>
              <Link href="/pricing" className="h-11 px-5 inline-flex items-center rounded-lg border border-border text-sm hover:border-ink-3">
                Compare plans
              </Link>
              {plan && me.status !== "cancelled" && me.billingEnabled && (
                confirm ? (
                  <span className="inline-flex flex-wrap items-center gap-2 text-sm">
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
          </div>
        </section>

        {/* Next plan */}
        <aside className="relative overflow-hidden rounded-3xl border border-accent/40 bg-surface p-6 sm:p-8 flex flex-col">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(80%_60%_at_100%_0%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent)]"
          />
          <div className="relative flex flex-1 flex-col">
            {next ? (
              <>
                <p className="text-sm font-semibold text-accent">{plan ? "Need more?" : "When the free reports run out"}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">{PLANS[next].name}</h3>
                <p className="mt-1">
                  <span className="text-3xl font-semibold tracking-tight tabular">₹{PLANS[next].price.toLocaleString("en-IN")}</span>
                  <span className="text-ink-3">/month</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink-2">
                  {PLANS[next].features.slice(0, 4).map((f) => (
                    <li key={f} className="flex gap-2">
                      <Tick />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/pricing?plan=${next}`}
                  className="mt-6 h-11 inline-flex items-center justify-center rounded-lg bg-accent text-accent-ink text-sm font-semibold hover:opacity-90"
                >
                  Get {PLANS[next].name}
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-accent">Top plan</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">You&apos;re on Growth</h3>
                <p className="mt-2 text-sm text-ink-2">
                  You have Raay&apos;s biggest allowance, priority analysis and early access to alerts and the API.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Shortcuts */}
      <div className="grid gap-4 sm:grid-cols-3">
        {SHORTCUTS.map((s) => (
          <Link key={s.href} href={s.href} className="group rounded-2xl border border-border bg-surface p-5 hover:border-ink-3">
            <p className="flex items-center justify-between font-medium">
              {s.title}
              <span aria-hidden className="text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink">
                →
              </span>
            </p>
            <p className="mt-1 text-sm text-ink-2">{s.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
