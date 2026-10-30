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
    <span className="tabular text-[13px] tracking-tight" aria-label={`${n} out of 5 stars`}>
      <span className={n <= 2 ? "text-critical" : "text-[#e8a400]"}>{"★".repeat(n)}</span>
      <span className="text-border">{"★".repeat(5 - n)}</span>
    </span>
  );
}

function Bone({ className }: { className: string }) {
  return <span className={`block rounded-md bg-surface-2 animate-pulse ${className}`} />;
}

/** The fix action up to its first full stop, so the card never ends mid-sentence. */
function firstSentence(s: string) {
  const m = s.match(/^.+?[.!?](?=\s|$)/);
  return m ? m[0] : s;
}

/** Prefer one review per language, so the "before" side shows the mix Raay reads. */
function pick(reviews: FeaturedSnapshot["reviews"]) {
  const first = reviews.filter((r, i) => reviews.findIndex((x) => x.lang === r.lang) === i);
  return [...first, ...reviews.filter((r) => !first.includes(r))].slice(0, 3);
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
    ? new Date(snap.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "";
  const href = live && snap ? `/app/${snap.app.store}/${snap.app.id}` : "/app/play/com.zeptoconsumerapp";
  const top = snap?.waterfall.steps[0];

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[1fr_auto_1.05fr] items-center">
        {/* Before: what users wrote */}
        <div>
          <p className="text-sm text-ink-3">
            {snap ? `${snap.total} reviews like these` : "Reviews like these"}
          </p>
          <ul className="mt-4 space-y-3">
            {(snap ? pick(snap.reviews) : [null, null, null]).map((r, i) =>
              r ? (
                <li
                  key={i}
                  className="rounded-2xl bg-surface px-5 py-4 ring-1 ring-black/[0.06] shadow-[0_12px_30px_-18px_rgba(20,16,10,0.25)] dark:ring-white/10"
                  style={{ marginLeft: `${[0, 18, 6][i]}px`, marginRight: `${[18, 0, 10][i]}px` }}
                >
                  <div className="flex items-center gap-2 text-[13px] text-ink-3">
                    <Stars n={r.stars} /> <span>· {r.lang}</span>
                  </div>
                  <p className="mt-1.5 text-[16px] leading-snug">“{r.text}”</p>
                  {r.gist && r.lang !== "English" && <p className="mt-1.5 text-sm text-ink-3">Raay reads: {r.gist}</p>}
                </li>
              ) : (
                <li key={i} className="rounded-2xl bg-surface px-5 py-4 ring-1 ring-black/[0.06] space-y-2">
                  <Bone className="h-3 w-24" />
                  <Bone className="h-4 w-full" />
                </li>
              ),
            )}
          </ul>
        </div>

        <span
          aria-hidden
          className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface ring-1 ring-black/[0.06] text-ink-2 rotate-90 lg:rotate-0 dark:ring-white/10"
        >
          →
        </span>

        {/* After: what Raay tells you */}
        <div className="rounded-3xl bg-[#121211] text-[#f2efe9] p-7 sm:p-9 shadow-[0_40px_90px_-40px_rgba(20,16,10,0.6)] ring-1 ring-white/5">
          <div className="flex items-center gap-3">
            {snap?.app.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={snap.app.icon} alt="" className="h-9 w-9 rounded-[10px]" />
            ) : (
              <span className="h-9 w-9 rounded-[10px] bg-white/10" />
            )}
            <div className="min-w-0 text-sm">
              <p className="font-medium truncate">{snap ? snap.app.title : " "}</p>
              <p className="text-[#8f8e86]">{live ? `Raay report · ${date}` : state ? "Example for illustration" : " "}</p>
            </div>
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-[#ff7a2e]">Do this first</p>
          {snap?.fix ? (
            <>
              <p className="mt-3 font-serif text-[2rem] sm:text-[2.4rem] leading-[1.08]">{snap.fix.title}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-[#c3c2b7]">{firstSentence(snap.fix.action)}</p>
            </>
          ) : (
            <div className="mt-3 space-y-3">
              <span className="block h-8 w-4/5 rounded-md bg-white/10" />
              <span className="block h-4 w-full rounded-md bg-white/10" />
            </div>
          )}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-end justify-between gap-4">
            {top ? (
              <p className="text-sm text-[#c3c2b7]">
                Biggest drag on the rating
                <span className="block mt-1 text-[#f2efe9] text-base font-medium">
                  {top.label ?? top.short} <span className="tabular text-[#ff7a2e]">−{top.delta.toFixed(2)}★</span>
                </span>
              </p>
            ) : (
              <span />
            )}
            <Link href={href} className="text-sm font-medium text-[#f2efe9] underline underline-offset-4 decoration-white/30 hover:decoration-white">
              Open the full report →
            </Link>
          </div>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-ink-3">
        {live && snap
          ? `Real, public Google Play reviews of ${snap.app.name}, analyzed by Raay. Raay is not affiliated with ${snap.app.name}.`
          : state
            ? "Illustrative example."
            : " "}
      </p>
    </div>
  );
}
