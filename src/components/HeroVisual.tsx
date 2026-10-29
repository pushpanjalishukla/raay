"use client";

// Product window for the landing hero. Shows a real, recent Raay report for a
// well-known app (read from cache only). Falls back to a clearly labelled
// example if no real report has been generated yet.
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
      { short: "Refunds", delta: 0.55 },
      { short: "Delivery", delta: 0.33 },
      { short: "OTP", delta: 0.22 },
      { short: "Support", delta: 0.18 },
    ],
  },
  reviews: [
    { lang: "Hinglish", stars: 1, text: "order aaya hi nahi aur paise bhi cut gaye", gist: "Charged, but the order never arrived", topic: "Payments & refunds", positive: false },
    { lang: "Hindi", stars: 2, text: "डिलीवरी हर बार 40 मिनट लेट आती है", gist: "Deliveries are always ~40 min late", topic: "Orders & delivery", positive: false },
    { lang: "Tamil", stars: 1, text: "OTP வரவே இல்லை, login பண்ண முடியல", gist: "OTP never arrives, can't log in", topic: "Login, OTP & account", positive: false },
    { lang: "English", stars: 5, text: "10-minute delivery is real. Love the fresh veggies!", gist: "", topic: "Praise", positive: true },
  ],
  fix: {
    title: "Charged, but the order never arrived",
    detail: "Example insight for illustration.",
    action: "Auto-refund failed orders within 2 hours and tell the user.",
  },
  callouts: {
    spike: { title: "Spike in v2.4", sub: "Refund complaints up 3×" },
    churn: { title: "11 users say they're leaving", sub: "Rivals named in reviews" },
    reply: { title: "Reply drafted in Hinglish", sub: "“Maafi chahte hain…”" },
  },
};

function Stars({ n }: { n: number }) {
  return (
    <span className="tabular tracking-tight" aria-label={`${n} stars`}>
      <span className={n <= 2 ? "text-critical" : "text-ink"}>{"★".repeat(n)}</span>
      <span className="text-border">{"★".repeat(5 - n)}</span>
    </span>
  );
}

function Callout({
  className,
  delay,
  icon,
  tone,
  title,
  sub,
}: {
  className: string;
  delay: string;
  icon: string;
  tone: "critical" | "accent" | "good";
  title: string;
  sub: string;
}) {
  const ring = {
    critical: "bg-[color-mix(in_oklab,var(--critical)_14%,transparent)] text-critical",
    accent: "bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-accent",
    good: "bg-[color-mix(in_oklab,var(--good)_14%,transparent)] text-good",
  }[tone];
  return (
    <div className={`z-10 anim-fade-up ${className}`} style={{ animationDelay: delay }}>
      <div className="anim-float flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 shadow-lg max-w-[17rem]">
        <span className={`grid place-items-center w-8 h-8 shrink-0 rounded-lg text-sm font-semibold ${ring}`} aria-hidden>
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium leading-tight">{title}</span>
          <span className="block text-xs text-ink-3 truncate">{sub}</span>
        </span>
      </div>
    </div>
  );
}

function bars(w: FeaturedSnapshot["waterfall"]) {
  const floor = Math.max(1, Math.floor((w.actual - 0.25) * 2) / 2);
  const pct = (v: number) => ((v - floor) / (5 - floor)) * 100;
  const shown = w.steps.reduce((a, s) => a + s.delta, 0);
  const rest = w.potential - w.actual - shown;
  const steps = rest > 0.02 ? [...w.steps, { short: "Rest", delta: rest }] : w.steps;
  const out: { label: string; total: boolean; top: number; h: number }[] = [
    { label: "Potential", total: true, top: 100 - pct(w.potential), h: pct(w.potential) },
  ];
  let level = w.potential;
  for (const s of steps) {
    out.push({ label: s.short, total: false, top: 100 - pct(level), h: (s.delta / (5 - floor)) * 100 });
    level -= s.delta;
  }
  out.push({ label: "Actual", total: true, top: 100 - pct(w.actual), h: pct(w.actual) });
  return out;
}

function Skeleton({ className }: { className: string }) {
  return <span className={`block rounded bg-surface-2 animate-pulse ${className}`} />;
}

export default function HeroVisual() {
  const [state, setState] = useState<{ snap: FeaturedSnapshot; live: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/featured")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setState(d?.available ? { snap: d.snap, live: true } : { snap: EXAMPLE, live: false }))
      .catch(() => setState({ snap: EXAMPLE, live: false }));
  }, []);

  const snap = state?.snap;
  const live = Boolean(state?.live);
  const updated = snap?.generatedAt
    ? new Date(snap.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";
  const reportHref = live && snap ? `/app/${snap.app.store}/${snap.app.id}` : "/app/play/com.zeptoconsumerapp";

  return (
    <div className="relative mx-auto max-w-5xl">
      <div
        aria-hidden
        className="absolute -inset-x-16 -top-10 bottom-10 rounded-[3rem] bg-[radial-gradient(50%_60%_at_50%_40%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent)] blur-2xl"
      />

      {snap?.callouts.spike && (
        <Callout className="absolute -left-16 -top-7 hidden lg:block" delay="2.2s" icon="⚠" tone="critical" title={snap.callouts.spike.title} sub={snap.callouts.spike.sub} />
      )}
      {snap?.callouts.churn && (
        <Callout className="absolute -right-12 top-56 hidden lg:block" delay="2.6s" icon="↗" tone="accent" title={snap.callouts.churn.title} sub={snap.callouts.churn.sub} />
      )}
      {snap?.callouts.reply && (
        <Callout className="absolute -left-6 -bottom-6 hidden lg:block" delay="3s" icon="✓" tone="good" title={snap.callouts.reply.title} sub={snap.callouts.reply.sub} />
      )}

      <div className="relative rounded-2xl border border-border bg-surface shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] overflow-hidden text-left">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 h-11 border-b border-border bg-surface-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="mx-auto rounded-md border border-border bg-surface px-3 py-0.5 text-xs text-ink-3 truncate max-w-[60%]">
            raay · {snap ? `${snap.app.name} review report` : "loading report…"}
          </span>
          <span className="w-12" />
        </div>

        {/* App header + tabs */}
        <div className="px-5 pt-4 flex items-center gap-3">
          {snap?.app.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={snap.app.icon} alt="" className="w-10 h-10 rounded-xl border border-border" />
          ) : (
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-surface-2 text-ink-3 font-semibold">{snap ? "?" : ""}</span>
          )}
          <div className="min-w-0">
            {snap ? (
              <>
                <p className="font-semibold truncate">{snap.app.title}</p>
                <p className="text-xs text-ink-3">
                  {live ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-good font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-good" /> Live report
                      </span>{" "}
                      · {snap.total} latest reviews · AI analysis · {updated}
                    </>
                  ) : (
                    "Example for illustration · not a real app"
                  )}
                </p>
              </>
            ) : (
              <>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64 mt-1.5" />
              </>
            )}
          </div>
          <span className="ml-auto hidden sm:inline-flex text-xs rounded-lg border border-border px-2.5 py-1 text-ink-2">Copy Slack digest</span>
        </div>
        <div className="px-5 mt-4 flex gap-5 text-xs border-b border-border overflow-hidden">
          {["Overview", "Analytics", "Churn & rivals", "Ask AI ✦", "Reviews"].map((t, i) => (
            <span key={t} className={`pb-2.5 whitespace-nowrap ${i === 0 ? "border-b-2 border-accent text-ink font-medium" : "text-ink-3"}`}>
              {t}
            </span>
          ))}
        </div>

        <div className="grid md:grid-cols-[1.15fr_1fr]">
          {/* Decoding stream */}
          <div className="p-5 space-y-3 md:border-r border-border">
            <p className="text-xs font-medium text-ink-2">{live ? "Real reviews, decoded by Raay" : "Reading reviews in every language"}</p>
            {snap
              ? snap.reviews.map((r, i) => (
                  <div
                    key={`${r.lang}-${i}`}
                    className={`rounded-xl border border-border bg-bg/60 p-3 anim-fade-up ${i === 3 ? "hidden sm:block" : ""}`}
                    style={{ animationDelay: `${0.2 + i * 0.3}s` }}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Stars n={r.stars} />
                      <span className="rounded border border-border px-1.5 py-px text-[10px] text-ink-2">{r.lang}</span>
                    </div>
                    <p className="mt-1.5 text-sm">“{r.text}”</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs anim-fade-up" style={{ animationDelay: `${0.5 + i * 0.3}s` }}>
                      {r.gist && (
                        <>
                          <span className="text-accent" aria-hidden>
                            →
                          </span>
                          <span className="font-medium text-ink">{r.gist}</span>
                        </>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-ink-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.positive ? "var(--pos)" : "var(--neg)" }} />
                        {r.topic}
                      </span>
                    </div>
                  </div>
                ))
              : Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className={`rounded-xl border border-border p-3 space-y-2 ${i === 3 ? "hidden sm:block" : ""}`}>
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
          </div>

          {/* Results */}
          <div className="p-5 space-y-4 bg-surface-2/40">
            <div className="grid grid-cols-3 gap-2">
              {(snap
                ? [
                    ["Negative", `${Math.round(snap.kpis.negative * 100)}%`],
                    ["Recent ★", snap.kpis.recent.toFixed(2)],
                    ["Churn risk", String(snap.kpis.churn)],
                  ]
                : [["Negative", ""], ["Recent ★", ""], ["Churn risk", ""]]
              ).map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-surface px-3 py-2">
                  <p className="text-[11px] text-ink-3">{k}</p>
                  {v ? <p className="text-lg font-semibold tabular">{v}</p> : <Skeleton className="h-6 w-12 mt-0.5" />}
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-medium text-ink-2">Where your stars go</p>
                {snap && (
                  <p className="text-xs text-ink-3">
                    <span className="font-semibold text-ink">+{(snap.waterfall.potential - snap.waterfall.actual).toFixed(2)}★</span> on the table
                  </p>
                )}
              </div>
              <div className="mt-3 flex items-end gap-2 h-24">
                {snap
                  ? bars(snap.waterfall).map((b, i) => (
                      <div key={`${b.label}-${i}`} className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-0">
                        <div className="w-full flex-1 relative">
                          <div
                            className={`absolute inset-x-0 rounded-t-[3px] ${b.total ? "bg-series anim-grow" : "bg-[var(--neg)] anim-drop"}`}
                            style={{ top: `${b.top}%`, height: `${Math.max(2, b.h)}%`, animationDelay: `${0.8 + i * 0.12}s` }}
                          />
                        </div>
                        <span className="text-[10px] text-ink-3 truncate max-w-full">{b.label}</span>
                      </div>
                    ))
                  : Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="flex-1 h-full" />)}
              </div>
            </div>

            {snap?.fix ? (
              <div className="rounded-lg border border-border bg-surface p-3 anim-fade-up" style={{ animationDelay: "1.6s" }}>
                <p className="text-xs font-medium text-accent">Fix this first</p>
                <p className="mt-1 text-sm font-semibold">{snap.fix.title}</p>
                <p className="mt-2 text-xs rounded-md bg-surface-2 px-2.5 py-1.5">
                  <span className="font-medium">Do this:</span> {snap.fix.action}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-full" />
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="relative mt-6 text-center text-xs text-ink-3">
        {live && snap ? (
          <>
            Live data from {snap.app.name}&apos;s public Google Play reviews, analyzed by Raay on {updated}. Raay is not affiliated with{" "}
            {snap.app.name}.{" "}
            <Link href={reportHref} className="underline hover:text-ink">
              Open the full report →
            </Link>
          </>
        ) : state ? (
          <>
            Illustrative example.{" "}
            <Link href={reportHref} className="underline hover:text-ink">
              See a live report for a real app →
            </Link>
          </>
        ) : (
          " "
        )}
      </p>
    </div>
  );
}
