import Link from "next/link";
import { Suspense } from "react";
import AppSearch from "@/components/AppSearch";
import FeatureBento from "@/components/FeatureBento";
import LivePill from "@/components/LivePill";
import PricingPlans from "@/components/PricingPlans";
import PulseRanking from "@/components/PulseRanking";
import Showcase from "@/components/Showcase";
import { SAMPLE_APPS, SAMPLE_COMPARE } from "@/lib/config";
import { FREE_LIMITS } from "@/lib/plans";

/* ---------- Building blocks ---------- */

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-3xl sm:text-[2.6rem] leading-[1.1] font-semibold tracking-[-0.03em]">{title}</h2>
      {sub && <p className="mt-4 text-lg text-ink-2 leading-relaxed">{sub}</p>}
    </div>
  );
}

function Check({ ok }: { ok: boolean }) {
  return ok ? (
    <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0 mt-0.5 text-good" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.14" />
      <path d="M6 10.4l2.6 2.6L14 7.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0 mt-0.5 text-ink-3" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.14" />
      <path d="M7.2 7.2l5.6 5.6M12.8 7.2l-5.6 5.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Content ---------- */

const STEPS = [
  { title: "Search any app", body: "Yours or a competitor's, on Google Play or the App Store India. No SDK, nothing to install." },
  { title: "Raay reads every review", body: "The latest ~250 reviews, each tagged by topic, mood, severity and language, Hinglish included." },
  { title: "Fix what matters", body: "A ranked fix list with real quotes, churn alerts, release verdicts and reply drafts." },
];

const CHATBOT = [
  "You copy-paste a sample of reviews by hand",
  "Hit and miss with Hinglish and Indian scripts",
  "Forgets everything: no releases, no trends",
  "One app at a time, no competitors",
  "No link back to the reviews behind an answer",
];

const RAAY = [
  "Fetches the latest reviews from both stores for you",
  "Built for code-mixed Hinglish and Indian scripts",
  "Tracks every release and tells you what changed",
  "Compares you with rivals and spots who's switching",
  "Every answer cites the real reviews behind it",
];

const FAQ = [
  {
    q: "Do I need to install anything in my app?",
    a: "No. Raay only reads public reviews on Google Play and the App Store India. There's no SDK and no access to your app or your users.",
  },
  {
    q: "Which apps can I analyze?",
    a: "Any public app on Google Play or the Indian App Store: your own, or your competitors'. Paste a store link or just search by name.",
  },
  {
    q: "Which languages does it understand?",
    a: "English, Hinglish (Hindi in English letters), Hindi, Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati and Punjabi.",
  },
  {
    q: "What counts as a free report?",
    a: `You get ${FREE_LIMITS.report} fresh AI reports and ${FREE_LIMITS.question} Ask Raay questions a day for free. Reports someone already generated in the last few hours are free to view any time.`,
  },
  {
    q: "How fresh is the data?",
    a: "Each report reads the newest ~250 reviews from the store. Reports are reused for up to 12 hours, then refreshed on the next visit.",
  },
  {
    q: "Can I cancel a paid plan?",
    a: "Yes, anytime from your account page. You keep access until the end of the month you've paid for.",
  },
];


/* ---------- Page ---------- */

export default function Home() {
  return (
    <div id="top">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-grid opacity-80" />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(45%_50%_at_50%_0%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 sm:pt-20 text-center">
          <LivePill />
          <h1 className="mt-8 mx-auto max-w-4xl text-[2.75rem] leading-[1.02] sm:text-7xl font-semibold tracking-[-0.035em]">
            Your users already told you <br className="hidden sm:block" />
            <span className="text-accent-gradient">what to fix.</span>
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl text-ink-2 leading-relaxed">
            Raay reads every Play Store and App Store review, in Hinglish, Hindi, Tamil or English, and turns them into a
            ranked fix list, churn alerts and replies in your users&apos; own language.
          </p>
          <div className="mt-10 mx-auto max-w-2xl text-left">
            <AppSearch size="lg" placeholder="Search any app or paste a Play Store / App Store link" />
          </div>
          <div className="mt-5 flex flex-wrap justify-center items-center gap-2">
            <span className="text-sm text-ink-3 mr-1">Try:</span>
            {SAMPLE_APPS.map((a) => (
              <Link
                key={a.id}
                href={`/app/${a.store}/${a.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface pl-1 pr-3 py-1 text-sm hover:border-ink-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.icon} alt="" className="w-5 h-5 rounded-[5px]" />
                {a.name}
              </Link>
            ))}
          </div>
          <p className="mt-5 text-sm text-ink-3">
            Free to start · {FREE_LIMITS.report} AI reports a day · No card needed
          </p>
        </div>

        {/* Live showcase */}
        <div className="relative mx-auto max-w-6xl px-4 mt-16 sm:mt-20 pb-24">
          <Showcase />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-surface/60 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <SectionHead
            eyebrow="Features"
            title="Everything your team needs from app reviews"
            sub="Product, support, growth and leadership each get what they're looking for, from one report."
          />
          <div className="mt-14 reveal">
            <FeatureBento />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-24 scroll-mt-16">
        <SectionHead eyebrow="How it works" title="From a store link to a fix list in 20 seconds" />
        <ol className="mt-14 grid gap-5 md:grid-cols-3 reveal">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-3xl border border-border bg-surface p-7">
              <span className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ff7a2e] to-[#e0336e] text-white font-semibold">
                {i + 1}
              </span>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-2 leading-relaxed">{s.body}</p>
              {i < STEPS.length - 1 && (
                <span aria-hidden className="hidden md:grid absolute -right-[18px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 place-items-center rounded-full border border-border bg-bg text-ink-3 text-sm">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Pulse */}
      <section id="pulse" className="border-y border-border bg-surface/60 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <SectionHead
            eyebrow="India App Pulse"
            title="How happy are users with India's top apps?"
            sub="Raay checks 18 popular Indian apps every 6 hours. These six have the most unhappy reviews right now."
          />
          <div className="mt-14 mx-auto max-w-4xl reveal">
            <PulseRanking limit={6} />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/pulse" className="h-11 px-6 inline-flex items-center rounded-full bg-ink text-bg text-sm font-medium hover:opacity-90">
              See all 18 apps
            </Link>
            <Link
              href={`/compare?apps=${SAMPLE_COMPARE}`}
              className="h-11 px-6 inline-flex items-center rounded-full border border-border text-sm font-medium hover:border-ink-3"
            >
              Compare Zepto, Blinkit & BigBasket
            </Link>
          </div>
        </div>
      </section>

      {/* Why Raay */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <SectionHead
          eyebrow="Why Raay"
          title="More than a chatbot with your reviews pasted in"
          sub="A chatbot only sees what you copy into it, once. Raay fetches the data itself, keeps it current, and compares releases and rivals."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-2 reveal">
          <div className="rounded-3xl border border-border bg-surface p-7 sm:p-8">
            <p className="text-sm font-semibold text-ink-3">Pasting reviews into a chatbot</p>
            <ul className="mt-6 space-y-4">
              {CHATBOT.map((t) => (
                <li key={t} className="flex gap-3 text-ink-2">
                  <Check ok={false} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative rounded-3xl border-2 border-accent/50 bg-surface p-7 sm:p-8 shadow-[0_24px_60px_-36px_rgba(232,89,12,0.55)]">
            <p className="text-sm font-semibold text-accent">With Raay</p>
            <ul className="mt-6 space-y-4">
              {RAAY.map((t) => (
                <li key={t} className="flex gap-3 font-medium">
                  <Check ok />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-border bg-surface scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <SectionHead eyebrow="Pricing" title="Start free. Upgrade when your team is hooked." sub="Simple monthly plans in rupees. Cancel anytime." />
          <div className="mt-12">
            <Suspense>
              <PricingPlans />
            </Suspense>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-24 scroll-mt-16 reveal">
        <SectionHead eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <span className="text-ink-3 transition-transform group-open:rotate-45 text-xl leading-none" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-ink-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-ink text-bg px-8 py-16 sm:px-14 text-center">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgba(255,122,46,0.35),transparent)]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-[2.6rem] leading-[1.1] font-semibold tracking-[-0.03em]">See what your users are saying</h2>
            <p className="mt-3 opacity-75">Pick any app. Your first report is free and ready in about 20 seconds.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/sign-up" className="h-12 px-7 inline-flex items-center rounded-full bg-accent text-accent-ink text-sm font-semibold">
                Try Raay free
              </Link>
              <Link href="/app/play/com.zeptoconsumerapp" className="h-12 px-7 inline-flex items-center rounded-full border border-bg/25 text-sm">
                View a sample report
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
