import Link from "next/link";
import { Suspense } from "react";
import AppSearch from "@/components/AppSearch";
import PricingPlans from "@/components/PricingPlans";
import PulseTable from "@/components/PulseTable";
import { SAMPLE_APPS, SAMPLE_COMPARE } from "@/lib/config";
import { FREE_LIMITS } from "@/lib/plans";

/* ---------- Small building blocks ---------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-accent">{children}</p>;
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">{title}</h2>
      {sub && <p className="mt-4 text-lg text-ink-2">{sub}</p>}
    </div>
  );
}

const icon = {
  ask: "M4 5h16v10H8l-4 4V5z M8 9h8 M8 12h5",
  stars: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3z",
  churn: "M16 3h5v5 M21 3l-7 7 M8 21H3v-5 M3 21l7-7",
  release: "M4 12l5 5L20 6",
  lang: "M4 5h9 M8.5 3v2 M6 5c0 4 3 7 6 8 M11 5c0 4-3 7-6 8 M13 21l4-10 4 10 M14.5 17h5",
  export: "M12 3v12 M7 10l5 5 5-5 M4 21h16",
};

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {d.split(" M").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  );
}

/* ---------- Content ---------- */

const FEATURES = [
  {
    icon: icon.ask,
    title: "Ask Raay anything",
    body: "“Why are people angry about refunds?” Get a straight answer with the exact reviews behind it, in seconds.",
    tag: "Product & leadership",
  },
  {
    icon: icon.stars,
    title: "See where your stars go",
    body: "A rating waterfall shows how much each problem costs you, from late deliveries to OTP failures.",
    tag: "Product",
  },
  {
    icon: icon.churn,
    title: "Catch churn before it happens",
    body: "Spot users who say they'll uninstall or switch, and which competitor they're moving to.",
    tag: "Growth",
  },
  {
    icon: icon.release,
    title: "Know if the update fixed it",
    body: "Every topic gets a verdict for your latest release: new, getting worse, improving or gone.",
    tag: "Engineering",
  },
  {
    icon: icon.lang,
    title: "Fluent in Hinglish",
    body: "Reads English, Hinglish, Hindi, Tamil, Marathi and more, typos included, and replies in the user's own language.",
    tag: "Support",
  },
  {
    icon: icon.export,
    title: "Share it in one click",
    body: "Copy a Slack digest, save a PDF for the weekly review, or export every labelled review to CSV.",
    tag: "Everyone",
  },
];

const STEPS = [
  { title: "Search any app", body: "Yours or a competitor's, on Google Play or the App Store India. No SDK, no login." },
  { title: "Raay reads every review", body: "The latest ~250 reviews, each tagged with topic, sentiment, severity and language." },
  { title: "Act on the fix list", body: "Ranked problems with real quotes, release verdicts, churn signals and reply drafts." },
];

const VERSUS: { row: string; chatbot: string; raay: string }[] = [
  { row: "Getting the reviews", chatbot: "You copy-paste a sample", raay: "Fetched live from both stores" },
  { row: "Hinglish & Indian scripts", chatbot: "Hit and miss", raay: "Built for code-mixed reviews" },
  { row: "Release-by-release tracking", chatbot: "Not possible", raay: "Automatic verdict per version" },
  { row: "Competitors", chatbot: "One app at a time", raay: "Side-by-side comparison & churn radar" },
  { row: "Evidence", chatbot: "No link back to sources", raay: "Every answer cites real reviews" },
  { row: "Sharing", chatbot: "Screenshots", raay: "Shareable links, PDF, CSV, Slack digest" },
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

/* ---------- Product preview (illustrative) ---------- */

function PreviewCard() {
  const bars = [
    { label: "Potential", h: 92, total: true },
    { label: "Delivery", h: 22, top: 0 },
    { label: "Refunds", h: 10, top: 22 },
    { label: "Support", h: 7, top: 32 },
    { label: "OTP", h: 5, top: 39 },
    { label: "Actual", h: 48, total: true },
  ];
  return (
    <div className="relative">
      <div aria-hidden className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-accent/15 via-series/10 to-transparent blur-2xl" />
      <div className="relative rounded-2xl border border-border bg-surface shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-[#5b2fd1] text-white text-sm font-semibold">Q</span>
          <div className="min-w-0">
            <p className="font-medium truncate">QuickBasket · Groceries</p>
            <p className="text-xs text-ink-3">Example report · 260 latest reviews</p>
          </div>
          <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-surface-2 text-ink-2">AI analysis</span>
        </div>
        <div className="grid grid-cols-3 gap-px bg-border">
          {[
            ["Negative", "33%"],
            ["Recent rating", "★ 3.65"],
            ["Churn risk", "11 users"],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface px-4 py-3">
              <p className="text-[11px] text-ink-3">{k}</p>
              <p className="text-lg font-semibold tabular">{v}</p>
            </div>
          ))}
        </div>
        <div className="px-5 pt-4">
          <p className="text-xs font-medium text-ink-2">Where your stars go</p>
          <div className="mt-3 flex items-end gap-2 h-28">
            {bars.map((b) => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex-1 relative">
                  <div
                    className={`absolute inset-x-0 rounded-t-[4px] ${b.total ? "bg-series bottom-0 anim-grow" : "bg-[var(--neg)] anim-drop"}`}
                    style={{
                      ...(b.total ? { height: `${b.h}%` } : { height: `${b.h}%`, top: `${8 + (b.top ?? 0)}%` }),
                      animationDelay: `${0.3 + bars.indexOf(b) * 0.12}s`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-ink-3">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 space-y-3">
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-ink text-bg px-3.5 py-2 text-sm anim-fade-up" style={{ animationDelay: "1.1s" }}>
            Why are people angry about refunds?
          </p>
          <div className="rounded-2xl rounded-bl-sm bg-surface-2 px-3.5 py-2.5 text-sm text-ink anim-fade-up" style={{ animationDelay: "1.8s" }}>
            <p>
              14 of 260 reviews say money was deducted but the order never came. Most are on v26.10.2, and users like “paise
              cut gaye, refund nahi mila” wait 5+ days.
            </p>
            <p className="mt-1.5 text-xs text-ink-3">Based on 4 cited reviews</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function Home() {
  return (
    <div id="top">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-grid opacity-70" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(55%_55%_at_15%_0%,color-mix(in_oklab,var(--accent)_14%,transparent),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24 grid gap-14 lg:grid-cols-[1.1fr_1fr] items-center">
          <div>
            <Link
              href="/app/play/com.zeptoconsumerapp#ask"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm text-ink-2 hover:border-ink-3"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">New</span>
              Ask Raay: AI answers from real reviews
              <span aria-hidden>→</span>
            </Link>
            <h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.04]">
              Your users already told you <span className="text-accent-gradient">what to fix.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-2 max-w-xl">
              Raay reads every Play Store and App Store review, in Hinglish, Hindi, Tamil or English, and turns them into a
              ranked fix list, churn alerts and replies in your users&apos; own language.
            </p>
            <div className="mt-8 max-w-xl">
              <AppSearch />
              <p className="mt-3 text-sm text-ink-3">
                Free, no sign-up · {FREE_LIMITS.report} AI reports a day · Results in about 20 seconds
              </p>
            </div>
          </div>
          <PreviewCard />
        </div>
      </section>

      {/* Live examples */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <p className="text-sm text-ink-3 shrink-0">See a live report:</p>
          <div className="flex flex-wrap gap-3">
            {SAMPLE_APPS.map((a) => (
              <Link
                key={a.id}
                href={`/app/${a.store}/${a.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-bg pl-1.5 pr-3.5 py-1.5 text-sm hover:border-ink-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.icon} alt="" className="w-6 h-6 rounded-md" />
                {a.name}
              </Link>
            ))}
            <Link
              href={`/compare?apps=${SAMPLE_COMPARE}`}
              className="inline-flex items-center rounded-full bg-ink text-bg px-4 py-1.5 text-sm hover:opacity-90"
            >
              Zepto vs Blinkit vs BigBasket →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl border border-border bg-border overflow-hidden reveal">
          {[
            ["18", "popular Indian apps tracked live"],
            ["11", "languages understood, Hinglish included"],
            ["~20s", "from store link to a full AI report"],
            ["₹0", "to start: no card, no sign-up"],
          ].map(([v, k]) => (
            <div key={k} className="bg-surface px-6 py-7 flex flex-col-reverse gap-1">
              <dt className="text-sm text-ink-2">{k}</dt>
              <dd className="text-3xl sm:text-4xl font-semibold tracking-tight tabular">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Pulse */}
      <section id="pulse" className="mx-auto max-w-6xl px-4 pt-24 scroll-mt-16 reveal">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            eyebrow="India App Pulse · live"
            title="Which apps are users unhappiest with right now?"
            sub="Raay tracks India's most popular apps every 6 hours. Here are the five with the most unhappy reviews."
          />
          <Link href="/pulse" className="h-10 px-4 inline-flex items-center rounded-lg border border-border text-sm hover:border-ink-3 shrink-0">
            See all 18 apps →
          </Link>
        </div>
        <div className="mt-8">
          <PulseTable limit={5} filters={false} />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24 scroll-mt-16 reveal">
        <SectionHead
          eyebrow="Features"
          title="Everything your team needs from app reviews"
          sub="One report gives product, support, growth and leadership what each of them is looking for."
        />
        <div className="mt-12 grid gap-px rounded-2xl border border-border bg-border overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-7">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-surface-2 text-ink">
                <Icon d={f.icon} />
              </span>
              <h3 className="mt-5 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-2 leading-relaxed">{f.body}</p>
              <p className="mt-4 text-xs text-ink-3">For {f.tag.toLowerCase()}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-surface scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="reveal">
            <SectionHead eyebrow="How it works" title="From a store link to a fix list in 20 seconds" />
          </div>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <div className="flex items-center gap-4">
                  <span className="grid place-items-center w-10 h-10 rounded-full bg-ink text-bg text-sm font-semibold shrink-0">
                    {i + 1}
                  </span>
                  {i < STEPS.length - 1 && <span aria-hidden className="hidden md:block h-px flex-1 bg-border" />}
                </div>
                <h3 className="mt-5 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-2 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Versus */}
      <section className="mx-auto max-w-6xl px-4 py-24 reveal">
        <SectionHead
          eyebrow="Why Raay"
          title="Not just a chatbot with your reviews pasted in"
          sub="A chatbot sees whatever you copy into it, once. Raay fetches the data itself, keeps it current, and compares releases and rivals."
        />
        <div className="mt-12 rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1fr_1fr] text-sm">
            <div className="px-5 py-3.5 bg-surface-2" />
            <div className="px-5 py-3.5 bg-surface-2 font-medium text-ink-2">Pasting into a chatbot</div>
            <div className="px-5 py-3.5 bg-surface-2 font-semibold">Raay</div>
            {VERSUS.map((v) => (
              <div key={v.row} className="contents">
                <div className="px-5 py-3.5 border-t border-border text-ink-2">{v.row}</div>
                <div className="px-5 py-3.5 border-t border-border text-ink-3">{v.chatbot}</div>
                <div className="px-5 py-3.5 border-t border-border font-medium flex gap-2">
                  <span className="text-good" aria-hidden>
                    ✓
                  </span>
                  {v.raay}
                </div>
              </div>
            ))}
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
        <div className="text-center">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">Questions, answered</h2>
        </div>
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
        <div className="rounded-3xl bg-ink text-bg px-8 py-14 sm:px-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">See what your users are saying</h2>
          <p className="mt-3 opacity-75">Pick any app. Your first report is free and ready in about 20 seconds.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="#top" className="h-11 px-6 inline-flex items-center rounded-lg bg-accent text-accent-ink text-sm font-medium">
              Analyze an app
            </Link>
            <Link href="/app/play/com.zeptoconsumerapp" className="h-11 px-6 inline-flex items-center rounded-lg border border-bg/25 text-sm">
              View a sample report
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
