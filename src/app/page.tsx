import Link from "next/link";
import { Suspense } from "react";
import hero from "@/assets/shots/hero.png";
import AppSearch from "@/components/AppSearch";
import AskBand from "@/components/landing/AskBand";
import Frame from "@/components/landing/Frame";
import Tour from "@/components/landing/Tour";
import PricingPlans from "@/components/PricingPlans";
import Showcase from "@/components/Showcase";
import { SAMPLE_APPS } from "@/lib/config";
import { FREE_LIMITS } from "@/lib/plans";

/* ---------- Building blocks ---------- */

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="font-serif text-[2.6rem] sm:text-[3.75rem] leading-[1.02] tracking-[-0.01em] text-balance">{title}</h2>
      {sub && <p className="mt-5 mx-auto max-w-xl text-lg text-ink-2 leading-relaxed text-pretty">{sub}</p>}
    </div>
  );
}

/* ---------- Content ---------- */

const STEPS = [
  { title: "Search any app", body: "Yours or a rival's, on Google Play or the App Store India. Nothing to install, no SDK." },
  { title: "Raay reads every review", body: "Each one tagged by topic, mood, severity and language. Hinglish and typos included." },
  { title: "Fix what matters", body: "A ranked fix list with real quotes, churn alerts, release verdicts and reply drafts." },
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
      <section className="relative">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(55%_60%_at_50%_0%,color-mix(in_oklab,var(--accent)_9%,transparent),transparent)]"
        />
        <div className="relative mx-auto max-w-4xl px-4 pt-20 sm:pt-28 text-center">
          <p className="text-sm text-ink-2">App review intelligence for Indian apps</p>
          <h1 className="mt-6 font-serif text-[3.3rem] leading-[0.98] sm:text-[5.75rem] tracking-[-0.015em] text-balance">
            Your users already told you <em className="text-accent">what to fix.</em>
          </h1>
          <p className="mt-7 mx-auto max-w-2xl text-lg sm:text-xl text-ink-2 leading-relaxed text-balance">
            Raay reads every Play Store and App Store review, in Hinglish, Hindi or English, and tells your team what to
            fix first.
          </p>
          <div className="mt-10 mx-auto max-w-xl text-left">
            <AppSearch size="lg" placeholder="Search any app or paste a store link" />
          </div>
          <p className="mt-5 text-sm text-ink-3">
            Free to start, no card needed. Or open a sample:{" "}
            {SAMPLE_APPS.slice(0, 3).map((a, i) => (
              <span key={a.id}>
                {i > 0 && " · "}
                <Link href={`/app/${a.store}/${a.id}`} className="text-ink-2 underline underline-offset-4 decoration-border hover:text-ink hover:decoration-ink-3">
                  {a.name}
                </Link>
              </span>
            ))}
          </p>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 mt-16 sm:mt-24">
          <Frame
            src={hero}
            priority
            alt="A Raay report for Zepto: key numbers, a written summary and a chart of what pulls the rating down"
          />
        </div>
      </section>

      {/* Reviews in, fix out */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <SectionHead
          title="Hundreds of reviews in. One clear fix out."
          sub="Raay reads every review, in whatever language it was written, and tells you the one change that would lift your rating most."
        />
        <div className="mt-16 reveal">
          <Showcase />
        </div>
      </section>

      {/* Product tour */}
      <section id="tour" className="mx-auto max-w-6xl px-4 pb-24 sm:pb-32 scroll-mt-16">
        <SectionHead
          title="One report. Every angle."
          sub="What product, support and growth teams ask about reviews, already charted."
        />
        <div className="mt-12">
          <Tour />
        </div>
      </section>

      <AskBand />

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-24 sm:py-32 scroll-mt-16">
        <SectionHead title="From a store link to a fix list in 20 seconds." />
        <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-12 reveal">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t border-ink/15 pt-6">
              <span className="font-serif text-5xl leading-none text-accent">{i + 1}</span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-border bg-surface scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <SectionHead title="Start free. Upgrade when your team is hooked." sub="Simple monthly plans in rupees. Cancel anytime." />
          <div className="mt-14">
            <Suspense>
              <PricingPlans />
            </Suspense>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:py-32 scroll-mt-16 reveal">
        <SectionHead title="Questions, answered" />
        <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-surface">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <span className="text-ink-3 transition-transform group-open:rotate-45 text-xl leading-none" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-[15px] text-ink-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-[28px] bg-[#121211] text-[#f2efe9] px-6 py-20 sm:px-14 sm:py-24 text-center">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(45%_70%_at_50%_0%,rgba(255,90,31,0.22),transparent)]" />
          <div className="relative">
            <h2 className="font-serif text-[2.6rem] sm:text-[3.9rem] leading-[1.02]">See what your users are saying.</h2>
            <p className="mt-4 text-[#c3c2b7]">Pick any app. Your first report is free and ready in about 20 seconds.</p>
            <div className="mt-10 mx-auto max-w-xl text-left text-ink">
              <AppSearch size="lg" placeholder="Search any app or paste a store link" />
            </div>
            <p className="mt-5 text-sm text-[#8f8e86]">
              {FREE_LIMITS.report} free AI reports a day ·{" "}
              <Link href="/app/play/com.zeptoconsumerapp" className="text-[#f2efe9] underline underline-offset-4 decoration-white/30 hover:decoration-white">
                View a sample report
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
