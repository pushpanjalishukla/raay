import Link from "next/link";
import AppSearch from "@/components/AppSearch";
import { BRAND, SAMPLE_APPS, SAMPLE_COMPARE } from "@/lib/config";

const STEPS = [
  {
    n: "1",
    title: "Pick your app and your rivals",
    body: "Search any app on Google Play or the App Store India. No login, no SDK, nothing to install.",
  },
  {
    n: "2",
    title: "Raay reads every review",
    body: "Hinglish, Hindi, Tamil, Marathi and English, typos included. Each review gets a topic, a sentiment, a severity and an English summary.",
  },
  {
    n: "3",
    title: "You get the fix-first list",
    body: "The top problems with real quotes, which release made things worse, and reply drafts written in each user's own language.",
  },
];

const WHY = [
  {
    title: "Live data, not a pasted sample",
    body: "Pulls the newest reviews from both stores every time, so you see what changed this week, not last quarter.",
  },
  {
    title: "Release health by version",
    body: "Complaint rates are tracked per app version, so a bad release gets flagged before your rating drops.",
  },
  {
    title: "You and your competitors, side by side",
    body: "Compare complaint mix across apps: is it just you, or is the whole category struggling with payments?",
  },
  {
    title: "Built for Indian users",
    body: "Understands code-mixed Hinglish and Indian scripts, and drafts replies in the language the user wrote in.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    per: "",
    features: ["Any public app", "Latest ~250 reviews", "Top issues & release health", "Shareable report link"],
    cta: "Analyze an app",
    href: "#top",
    highlight: false,
  },
  {
    name: "Starter",
    price: "₹2,999",
    per: "/month",
    features: [
      "Your app + 3 competitors",
      "Daily refresh & full history",
      "Weekly digest to Slack or email",
      "AI reply drafts in 10+ languages",
    ],
    cta: "Talk to us",
    href: "contact",
    highlight: true,
  },
  {
    name: "Growth",
    price: "₹9,999",
    per: "/month",
    features: ["Up to 10 apps", "Spike alerts within the hour", "API & CSV export", "Custom categories for your product"],
    cta: "Talk to us",
    href: "contact",
    highlight: false,
  },
];

export default function Home() {
  return (
    <div id="top">
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:pt-24">
        <p className="text-sm font-medium text-accent mb-4">App review intelligence for Indian apps</p>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight max-w-4xl leading-[1.05]">
          Your users already told you what to fix.
        </h1>
        <p className="mt-6 text-lg text-ink-2 max-w-2xl">{BRAND.description}</p>
        <div className="mt-10 max-w-2xl">
          <AppSearch autoFocus />
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-3">Try:</span>
            {SAMPLE_APPS.map((a) => (
              <Link
                key={a.id}
                href={`/app/${a.store}/${a.id}`}
                className="px-3 py-1 rounded-full border border-border bg-surface hover:border-ink-3"
              >
                {a.name}
              </Link>
            ))}
            <Link
              href={`/compare?apps=${SAMPLE_COMPARE}`}
              className="px-3 py-1 rounded-full bg-ink text-bg hover:opacity-90"
            >
              Zepto vs Blinkit vs BigBasket →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-surface p-5">
              <div className="w-7 h-7 rounded-full bg-surface-2 grid place-items-center text-sm font-semibold">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-2">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Why not just paste reviews into a chatbot?</h2>
        <p className="mt-2 text-ink-2 max-w-2xl">
          A chatbot sees whatever you copy in, once. Raay fetches the data itself, keeps watching it, and compares it
          across releases and competitors.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {WHY.map((w) => (
            <div key={w.title} className="rounded-xl border border-border bg-surface p-5">
              <h3 className="font-semibold">{w.title}</h3>
              <p className="mt-2 text-sm text-ink-2">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-12 scroll-mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">Pricing</h2>
        <p className="mt-2 text-ink-2">Priced in rupees, for Indian product teams. Cancel anytime.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {PLANS.map((p) => {
            const href = p.href === "contact" ? BRAND.contactUrl : p.href;
            return (
              <div
                key={p.name}
                className={`rounded-xl border bg-surface p-6 flex flex-col ${
                  p.highlight ? "border-ink shadow-md" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.highlight && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-ink">Most popular</span>
                  )}
                </div>
                <p className="mt-4">
                  <span className="text-3xl font-semibold tabular">{p.price}</span>
                  <span className="text-ink-3">{p.per}</span>
                </p>
                <ul className="mt-5 space-y-2 text-sm text-ink-2 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-good" aria-hidden>
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                {href ? (
                  <a
                    href={href}
                    className={`mt-6 text-center rounded-lg px-4 py-2.5 text-sm font-medium ${
                      p.highlight ? "bg-ink text-bg" : "border border-border hover:border-ink-3"
                    }`}
                  >
                    {p.cta}
                  </a>
                ) : (
                  <p className="mt-6 text-center text-sm text-ink-3">Coming soon</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
