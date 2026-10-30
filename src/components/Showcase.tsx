"use client";

// "What users wrote → what Raay tells you", using a real, cached Raay report
// (read-only; never triggers a paid analysis). Falls back to a labelled example.
import Link from "next/link";
import { useEffect, useState } from "react";
import type { FeaturedSnapshot } from "@/lib/featured";

const EXAMPLE: FeaturedSnapshot = {
  app: { id: "", store: "play", name: "Example app", title: "Example grocery app", icon: "" },
  generatedAt: "",
  total: 260,
  kpis: { negative: 0.33, recent: 3.62, churn: 11 },
  waterfall: {
    actual: 3.62,
    potential: 4.9,
    steps: [
      { short: "Refunds", label: "Payments & refunds", delta: 0.55 },
      { short: "Delivery", label: "Orders & delivery", delta: 0.33 },
      { short: "Support", label: "Customer support", delta: 0.18 },
    ],
  },
  reviews: [
    { lang: "Hinglish", stars: 1, text: "order aaya hi nahi aur paise bhi cut gaye", gist: "Charged, but the order never arrived", topic: "Payments & refunds", positive: false },
    { lang: "Hindi", stars: 2, text: "डिलीवरी हर बार 40 मिनट लेट आती है", gist: "Deliveries are always ~40 min late", topic: "Orders & delivery", positive: false },
    { lang: "English", stars: 5, text: "10-minute delivery is real. Love the fresh veggies!", gist: "", topic: "Praise", positive: true },
  ],
  fix: { title: "Charged, but the order never arrived", detail: "", action: "Auto-refund failed orders within 2 hours and tell the user." },
  callouts: { spike: null, churn: null, reply: null },
};

function Stars({ n }: { n: number }) {
  return (
    <span className="tabular text-sm tracking-tight" aria-label={`${n} out of 5 stars`}>
      <span className={n <= 2 ? "text-critical" : "text-[#e8a400]"}>{"★".repeat(n)}</span>
      <span className="text-border">{"★".repeat(5 - n)}</span>
    </span>
  );
}

function Bone({ className }: { className: string }) {
  return <span className={`block rounded-md bg-surface-2 animate-pulse ${className}`} />;
}

/** Prefer one review per language, so the left side shows the mix Raay reads. */
function pick(reviews: FeaturedSnapshot["reviews"]) {
  const first = reviews.filter((r, i) => reviews.findIndex((x) => x.lang === r.lang) === i);
  return [...first, ...reviews.filter((r) => !first.includes(r))].slice(0, 3);
}

/** The fix action up to its first full stop, so the card never ends mid-sentence. */
function firstSentence(s: string) {
  const m = s.match(/^.+?[.!?](?=\s|$)/);
  return m ? m[0] : s;
}

export default function Showcase() {
  const [state, setState] = useState<{ snap: FeaturedSnapshot; live: boolean } | null>(null);
  useEffect(() => {
    fetch("/api/featured")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setState(d?.available ? { snap: d.snap, live: true } : { snap: EXAMPLE, live: false }))
      .catch(() => setState({ snap: EXAMPLE, live: false }));
  }, []);

  const snap = state?.snap;
  const live = Boolean(state?.live);
  const date = snap?.generatedAt
    ? new Date(snap.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";
  const href = live && snap ? `/app/${snap.app.store}/${snap.app.id}` : "/app/play/com.zeptoconsumerapp";
  const top = snap?.waterfall.steps[0];

  return (
    <div>
      <div className="rounded-3xl border border-border bg-surface shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] overflow-hidden text-left">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 px-6 sm:px-8 py-5 border-b border-border">
          {snap?.app.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={snap.app.icon} alt="" className="w-11 h-11 rounded-xl border border-border" />
          ) : (
            <span className="w-11 h-11 rounded-xl bg-surface-2" />
          )}
          <div className="min-w-0 flex-1 basis-48">
            {snap ? (
              <>
                <p className="font-semibold">{snap.app.title}</p>
                <p className="text-sm text-ink-3">
                  {live ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-good font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-good" /> Live report
                      </span>{" "}
                      · {snap.total} latest Play Store reviews · {date}
                    </>
                  ) : (
                    "Example for illustration"
                  )}
                </p>
              </>
            ) : (
              <>
                <Bone className="h-4 w-52" />
                <Bone className="h-3 w-72 mt-2" />
              </>
            )}
          </div>
          <Link
            href={href}
            className="h-10 px-4 w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-border text-sm font-medium hover:border-ink-3"
          >
            Open full report →
          </Link>
        </div>

        <div className="relative grid lg:grid-cols-2">
          {/* Arrow on the divider */}
          <span
            aria-hidden
            className="hidden lg:grid absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-11 h-11 place-items-center rounded-full bg-ink text-bg shadow-lg"
          >
            →
          </span>

          {/* Left: what users wrote, as the messages they are */}
          <div className="p-6 sm:p-8 lg:pr-12 lg:border-r border-border">
            <p className="text-sm font-medium text-ink-3">What users wrote</p>
            <ul className="mt-5 space-y-3">
              {snap
                ? pick(snap.reviews).map((r, i) => (
                    <li key={i} className="max-w-[92%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs text-ink-3">
                        <Stars n={r.stars} />
                        <span>{r.lang}</span>
                      </div>
                      <p className="mt-1 text-[15px] leading-snug">“{r.text}”</p>
                      {r.gist && r.lang !== "English" && (
                        <p className="mt-1.5 text-sm text-ink-3">Raay reads: {r.gist}</p>
                      )}
                    </li>
                  ))
                : Array.from({ length: 3 }, (_, i) => (
                    <li key={i} className="rounded-2xl bg-surface-2/60 px-4 py-3 space-y-2">
                      <Bone className="h-3 w-24" />
                      <Bone className="h-4 w-full" />
                    </li>
                  ))}
            </ul>
          </div>

          {/* Right: one finding and one action, nothing else */}
          <div className="p-6 sm:p-8 lg:pl-12 bg-surface-2/40 border-t lg:border-t-0 border-border flex flex-col">
            <p className="text-sm font-medium text-ink-3">What Raay tells you</p>
            <div className="mt-5">
              <p className="text-sm text-ink-2">Biggest drag on the rating</p>
              {top ? (
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {top.label ?? top.short} <span className="text-critical tabular">−{top.delta.toFixed(2)}★</span>
                </p>
              ) : (
                <Bone className="h-7 w-64 mt-2" />
              )}
              {snap ? (
                <p className="mt-2 text-sm text-ink-2">
                  {Math.round(snap.kpis.negative * 100)}% of recent reviews are unhappy · {snap.kpis.churn} users say
                  they&apos;re leaving
                </p>
              ) : (
                <Bone className="h-3 w-72 mt-3" />
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-ink text-bg p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Do this first</p>
              {snap?.fix ? (
                <>
                  <p className="mt-2 text-lg font-semibold leading-snug">{snap.fix.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed opacity-75">{firstSentence(snap.fix.action)}</p>
                </>
              ) : (
                <>
                  <span className="block h-5 w-3/4 mt-2 rounded-md bg-bg/15" />
                  <span className="block h-3 w-full mt-2 rounded-md bg-bg/15" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-ink-3">
        {live && snap
          ? `Real, public Google Play reviews of ${snap.app.name}, analyzed by Raay. Raay is not affiliated with ${snap.app.name}.`
          : state
            ? "Illustrative example."
            : " "}
      </p>
    </div>
  );
}
