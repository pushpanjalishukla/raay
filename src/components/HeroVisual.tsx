// Illustrative product window for the landing hero (example app, example reviews).

const REVIEWS = [
  {
    lang: "Hinglish",
    stars: 1,
    text: "order aaya hi nahi aur paise bhi cut gaye 😡",
    gist: "Charged, but the order never arrived",
    topic: "Payments & refunds",
    positive: false,
  },
  {
    lang: "Hindi",
    stars: 2,
    text: "डिलीवरी हर बार 40 मिनट लेट आती है",
    gist: "Deliveries are always ~40 min late",
    topic: "Orders & delivery",
    positive: false,
  },
  {
    lang: "Tamil",
    stars: 1,
    text: "OTP வரவே இல்லை, login பண்ண முடியல",
    gist: "OTP never arrives, can't log in",
    topic: "Login & OTP",
    positive: false,
  },
  {
    lang: "English",
    stars: 5,
    text: "10-minute delivery is real. Love the fresh veggies!",
    gist: "Fast delivery, fresh produce",
    topic: "Praise",
    positive: true,
  },
];

const BARS = [
  { label: "Potential", h: 92, total: true },
  { label: "Refunds", h: 22, top: 0 },
  { label: "Delivery", h: 12, top: 22 },
  { label: "OTP", h: 7, top: 34 },
  { label: "Support", h: 5, top: 41 },
  { label: "Actual", h: 46, total: true },
];

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
      <div className="anim-float flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 shadow-lg">
        <span className={`grid place-items-center w-8 h-8 rounded-lg text-sm font-semibold ${ring}`} aria-hidden>
          {icon}
        </span>
        <span>
          <span className="block text-sm font-medium leading-tight">{title}</span>
          <span className="block text-xs text-ink-3">{sub}</span>
        </span>
      </div>
    </div>
  );
}

export default function HeroVisual() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div
        aria-hidden
        className="absolute -inset-x-16 -top-10 bottom-10 rounded-[3rem] bg-[radial-gradient(50%_60%_at_50%_40%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent)] blur-2xl"
      />

      <Callout className="absolute -left-16 -top-7 hidden lg:block" delay="2.4s" icon="⚠" tone="critical" title="Spike in v2.4" sub="Refund complaints up 3×" />
      <Callout className="absolute -right-12 top-56 hidden lg:block" delay="2.8s" icon="↗" tone="accent" title="11 users switching" sub="Most name a rival app" />
      <Callout className="absolute -left-6 -bottom-6 hidden lg:block" delay="3.2s" icon="✓" tone="good" title="Reply drafted in Hinglish" sub="“Maafi chahte hain, refund…”" />

      <div className="relative rounded-2xl border border-border bg-surface shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] overflow-hidden text-left">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 h-11 border-b border-border bg-surface-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="mx-auto rounded-md border border-border bg-surface px-3 py-0.5 text-xs text-ink-3">
            raay · QuickBasket review report
          </span>
          <span className="w-12" />
        </div>

        {/* App header + tabs */}
        <div className="px-5 pt-4 flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-[#5b2fd1] text-white font-semibold">Q</span>
          <div className="min-w-0">
            <p className="font-semibold">QuickBasket: Groceries in minutes</p>
            <p className="text-xs text-ink-3">Example report · 260 latest reviews · AI analysis</p>
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
            <p className="text-xs font-medium text-ink-2">Reading reviews in every language</p>
            {REVIEWS.map((r, i) => (
              <div
                key={r.lang}
                className={`rounded-xl border border-border bg-bg/60 p-3 anim-fade-up ${i === 3 ? "hidden sm:block" : ""}`}
                style={{ animationDelay: `${0.4 + i * 0.35}s` }}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Stars n={r.stars} />
                  <span className="rounded border border-border px-1.5 py-px text-[10px] text-ink-2">{r.lang}</span>
                </div>
                <p className="mt-1.5 text-sm">{r.text}</p>
                <div
                  className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs anim-fade-up"
                  style={{ animationDelay: `${0.7 + i * 0.35}s` }}
                >
                  <span className="text-accent" aria-hidden>
                    →
                  </span>
                  <span className="font-medium text-ink">{r.gist}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-ink-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.positive ? "var(--pos)" : "var(--neg)" }} />
                    {r.topic}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Results */}
          <div className="p-5 space-y-4 bg-surface-2/40">
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Negative", "33%"],
                ["Recent ★", "3.62"],
                ["Churn risk", "11"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-surface px-3 py-2">
                  <p className="text-[11px] text-ink-3">{k}</p>
                  <p className="text-lg font-semibold tabular">{v}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-medium text-ink-2">Where your stars go</p>
                <p className="text-xs text-ink-3">
                  <span className="font-semibold text-ink">+1.28★</span> on the table
                </p>
              </div>
              <div className="mt-3 flex items-end gap-2 h-24">
                {BARS.map((b, i) => (
                  <div key={b.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-full flex-1 relative">
                      <div
                        className={`absolute inset-x-0 rounded-t-[3px] ${b.total ? "bg-series bottom-0 anim-grow" : "bg-[var(--neg)] anim-drop"}`}
                        style={{
                          ...(b.total ? { height: `${b.h}%` } : { height: `${b.h}%`, top: `${8 + (b.top ?? 0)}%` }),
                          animationDelay: `${1 + i * 0.12}s`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-ink-3">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface p-3 anim-fade-up" style={{ animationDelay: "1.9s" }}>
              <p className="text-xs font-medium text-accent">Fix this first</p>
              <p className="mt-1 text-sm font-semibold">Charged, but the order never arrived</p>
              <p className="mt-0.5 text-xs text-ink-3">14 reviews · mostly v2.4 · Hinglish & Hindi</p>
              <p className="mt-2 text-xs rounded-md bg-surface-2 px-2.5 py-1.5">
                <span className="font-medium">Do this:</span> auto-refund failed orders within 2 hours and tell the user.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
