// Feature tiles with small product visuals (illustrative content, no real brands).

function Tile({
  className = "",
  visual = "min-h-[150px]",
  title,
  body,
  children,
}: {
  className?: string;
  visual?: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-3xl border border-border bg-surface p-6 sm:p-7 flex flex-col overflow-hidden ${className}`}>
      <div className={`flex-1 flex items-center ${visual}`}>{children}</div>
      <h3 className="mt-6 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-2 leading-relaxed">{body}</p>
    </div>
  );
}

function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "neg" | "good" | "warn" }) {
  const cls = {
    plain: "bg-surface-2 text-ink-2",
    neg: "bg-[color-mix(in_oklab,var(--critical)_12%,transparent)] text-critical",
    good: "bg-[color-mix(in_oklab,var(--good)_14%,transparent)] text-good",
    warn: "bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-accent",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{children}</span>;
}

export default function FeatureBento() {
  return (
    <div className="grid gap-4 md:grid-cols-6">
      {/* Ask Raay */}
      <Tile
        className="md:col-span-4"
        title="Ask Raay anything"
        body="Ask in plain English or Hinglish. Get a straight answer, backed by the exact reviews it came from."
      >
        <div className="w-full space-y-3">
          <p className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-ink text-bg px-4 py-2.5 text-sm">
            Why are people angry about refunds this week?
          </p>
          <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3 text-sm leading-relaxed">
            14 of 260 reviews say money was deducted but the order never came. Most are on the latest version, and users
            wait 5+ days for the refund.
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip>“paise cut gaye”</Chip>
              <Chip>“refund nahi mila”</Chip>
              <Chip>+12 reviews</Chip>
            </div>
          </div>
        </div>
      </Tile>

      {/* Waterfall */}
      <Tile className="md:col-span-2" title="See where your stars go" body="How much each problem costs your rating, from late deliveries to OTP failures.">
        <div className="w-full flex items-end gap-2 h-32">
          {[
            { h: 92, top: 0, total: true },
            { h: 22, top: 8 },
            { h: 12, top: 30 },
            { h: 8, top: 42 },
            { h: 50, top: 50, total: true },
          ].map((b, i) => (
            <div key={i} className="flex-1 h-full relative">
              <div
                className={`absolute inset-x-0 rounded-t-[4px] ${b.total ? "bg-series" : "bg-[var(--neg)]"}`}
                style={b.total ? { bottom: 0, height: `${b.h}%` } : { top: `${b.top}%`, height: `${b.h}%` }}
              />
            </div>
          ))}
        </div>
      </Tile>

      {/* Churn */}
      <Tile className="md:col-span-2" title="Catch churn early" body="Find users who say they're leaving, and which rival app they're moving to.">
        <div className="w-full">
          <p className="text-sm">
            <span className="font-semibold">11 users</span> <span className="text-ink-3">said they&apos;re leaving this week</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip tone="neg">“uninstalling today”</Chip>
            <Chip tone="neg">“switching apps”</Chip>
            <Chip tone="neg">“never again”</Chip>
          </div>
        </div>
      </Tile>

      {/* Languages */}
      <Tile className="md:col-span-2" title="Fluent in Hinglish" body="Reads English, Hinglish and Indian scripts, typos included, and replies in the user's own language.">
        <div className="w-full flex flex-wrap gap-2">
          {["English", "Hinglish", "हिंदी", "मराठी", "தமிழ்", "తెలుగు", "ಕನ್ನಡ", "বাংলা", "ગુજરાતી"].map((l) => (
            <span key={l} className="rounded-full border border-border px-3 py-1.5 text-sm">
              {l}
            </span>
          ))}
        </div>
      </Tile>

      {/* Releases */}
      <Tile className="md:col-span-2" title="Know if the update fixed it" body="Every problem gets a verdict for your latest release.">
        <ul className="w-full space-y-2 text-sm">
          {[
            ["Payments & refunds", "Getting worse", "neg"],
            ["Login & OTP", "Improving", "good"],
            ["App crashes", "Gone", "good"],
            ["Delivery delays", "No change", "plain"],
          ].map(([t, v, tone]) => (
            <li key={t} className="flex items-center justify-between gap-3">
              <span className="text-ink-2">{t}</span>
              <Chip tone={tone as "neg" | "good" | "plain"}>{v}</Chip>
            </li>
          ))}
        </ul>
      </Tile>

      {/* Share */}
      <Tile className="md:col-span-6" visual="" title="Share it in one click" body="Send the weekly review to Slack, save a PDF for leadership, or export every labelled review to Excel.">
        <div className="w-full grid gap-3 sm:grid-cols-4">
          {[
            ["Slack digest", "Top 3 issues, posted to your channel"],
            ["PDF report", "For the weekly product review"],
            ["CSV export", "Every review, labelled, for Excel"],
            ["Compare rivals", "Up to 4 apps side by side"],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-border bg-bg px-4 py-3.5">
              <p className="text-sm font-semibold">{t}</p>
              <p className="mt-0.5 text-xs text-ink-3">{d}</p>
            </div>
          ))}
        </div>
      </Tile>
    </div>
  );
}
