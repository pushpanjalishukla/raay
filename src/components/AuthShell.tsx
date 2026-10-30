import Link from "next/link";
import { LogoMark } from "./Logo";
import { FREE_LIMITS } from "@/lib/plans";

const POINTS = [
  `${FREE_LIMITS.report} fresh AI reports and ${FREE_LIMITS.question} Ask Raay questions every day, free`,
  "Fix lists, churn alerts and reply drafts for any app",
  "Upgrade anytime from ₹2,999/month. No card needed to start",
];

/** Two-column layout for the sign-in and sign-up pages. */
export default function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20 grid gap-12 lg:grid-cols-2 items-center">
      <div>
        <LogoMark size={44} />
        <h1 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-4 text-lg text-ink-2 max-w-md">
          One click with Google and you&apos;re in. Raay turns your app&apos;s reviews into what to fix next.
        </p>
        <ul className="mt-8 space-y-3">
          {POINTS.map((p) => (
            <li key={p} className="flex gap-3 text-ink-2">
              <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0 mt-0.5 text-good" aria-hidden>
                <path d="M5 10.5l3.2 3.2L15 6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-ink-3">
          By continuing you agree to our <Link href="/terms" className="underline">Terms</Link> and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
      <div className="flex justify-center lg:justify-end">{children}</div>
    </div>
  );
}

/** Shown until Clerk keys are configured, so the page is honest instead of broken. */
export function AuthComingSoon() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-xl text-center">
      <span className="inline-flex items-center gap-3 rounded-xl border border-border px-4 h-12 text-sm text-ink-3 w-full justify-center">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
        </svg>
        Continue with Google
      </span>
      <p className="mt-5 font-semibold">Sign-in opens very soon</p>
      <p className="mt-2 text-sm text-ink-2">
        We&apos;re switching on Google sign-in. You can already use Raay for free without an account.
      </p>
      <Link href="/#top" className="mt-6 h-11 inline-flex w-full items-center justify-center rounded-lg bg-ink text-bg text-sm font-medium">
        Analyze an app for free
      </Link>
    </div>
  );
}
