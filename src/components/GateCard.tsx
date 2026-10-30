"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { AUTH_ON } from "@/lib/client-flags";
import { FREE_LIMITS } from "@/lib/plans";

type Gate = "login" | "upgrade" | "quota" | "busy";

const COPY: Record<Exclude<Gate, "busy">, { title: (what: string, n: number) => string; body: string }> = {
  login: {
    title: (what, n) => `Sign in to get your ${n} free AI ${what}`,
    body: `Every account gets ${FREE_LIMITS.report} free AI reports and ${FREE_LIMITS.question} Ask Raay questions. Reports for popular apps stay free to view.`,
  },
  upgrade: {
    title: (what, n) => `You've used your ${n} free AI ${what}`,
    body: "Pick Starter or Growth to keep getting fresh AI reports, churn tracking and Ask Raay answers for any app.",
  },
  quota: {
    title: (what) => `You've used this month's AI ${what} on your plan`,
    body: "Upgrade to Growth for 4× the monthly allowance, or wait for your plan to renew.",
  },
};

/** Reloads once the visitor signs in from the gate, so the request retries with their account. */
function ReloadOnSignIn() {
  const { isSignedIn } = useAuth();
  const was = useRef(isSignedIn);
  useEffect(() => {
    if (was.current === false && isSignedIn) window.location.reload();
    was.current = isSignedIn;
  }, [isSignedIn]);
  return null;
}

export default function GateCard({
  gate,
  kind,
  compact = false,
}: {
  gate: Gate;
  kind: "report" | "question";
  compact?: boolean;
}) {
  if (gate === "busy" || !AUTH_ON) return null;
  const what = kind === "report" ? "reports" : "questions";
  const copy = COPY[gate];
  return (
    <div className={`rounded-xl border border-accent/40 bg-surface ${compact ? "p-4" : "p-6"} shadow-sm`}>
      {gate === "login" && <ReloadOnSignIn />}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[16rem]">
          <p className={`${compact ? "text-base" : "text-lg"} font-semibold`}>{copy.title(what, FREE_LIMITS[kind])}</p>
          <p className="mt-1 text-sm text-ink-2">{copy.body}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {gate === "login" ? (
            <SignInButton mode="modal">
              <button type="button" className="h-10 px-5 rounded-lg bg-accent text-accent-ink text-sm font-medium">
                Sign in free
              </button>
            </SignInButton>
          ) : (
            <Link
              href={gate === "quota" ? "/pricing?plan=growth" : "/pricing"}
              className="h-10 px-5 inline-flex items-center rounded-lg bg-accent text-accent-ink text-sm font-medium"
            >
              {gate === "quota" ? "Upgrade to Growth" : "See plans"}
            </Link>
          )}
          <Link href="/pricing" className="h-10 px-4 inline-flex items-center rounded-lg border border-border text-sm hover:border-ink-3">
            Compare plans
          </Link>
        </div>
      </div>
    </div>
  );
}
