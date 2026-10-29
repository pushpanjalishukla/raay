"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CATEGORY_INFO, LANG_LABEL } from "@/lib/categories";
import { BRAND } from "@/lib/config";
import type { Analysis, Category, LabeledReview, Lang, Sentiment, Store } from "@/lib/types";
import { StoreBadge } from "./AppSearch";
import { BarList, Stat } from "./charts";

const pct = (n: number) => `${Math.round(n * 100)}%`;
const compact = (n: number) => new Intl.NumberFormat("en-IN", { notation: "compact" }).format(n);
const day = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const LOADING_STEPS = [
  "Fetching the latest reviews from the store",
  "Reading Hinglish, Hindi and English reviews",
  "Grouping complaints and checking each release",
  "Writing your fix-first brief",
];

export function useAnalysis(store: Store, id: string) {
  const key = `${store}:${id}`;
  const [res, setRes] = useState<{ key: string; data?: Analysis; error?: string } | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/analyze?store=${store}&id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({ error: "The analysis timed out. Please try again." }));
        if (!alive) return;
        if (!r.ok || body.error) setRes({ key, error: body.error ?? "Something went wrong" });
        else setRes({ key, data: body });
      })
      .catch(() => alive && setRes({ key, error: "Network error. Please try again." }));
    return () => {
      alive = false;
    };
  }, [key, store, id]);
  const current = res?.key === key ? res : null;
  return { data: current?.data ?? null, error: current?.error ?? null };
}

function Loading() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <p className="text-sm text-ink-3 mb-6">This takes 10 to 60 seconds the first time. Reports are cached after that.</p>
      <ol className="space-y-4">
        {LOADING_STEPS.map((s, i) => (
          <li key={s} className={`flex items-center gap-3 ${i > step ? "text-ink-3" : "text-ink"}`}>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                i < step ? "bg-good" : i === step ? "bg-accent pulse-dot" : "bg-border"
              }`}
            />
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="tabular text-sm" aria-label={`${n} out of 5 stars`}>
      <span className={n <= 2 ? "text-critical" : "text-ink"}>{"★".repeat(n)}</span>
      <span className="text-border">{"★".repeat(5 - n)}</span>
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] px-1.5 py-0.5 rounded border border-border text-ink-2 whitespace-nowrap">
      {children}
    </span>
  );
}

function ReviewCard({ r, compactView = false }: { r: LabeledReview; compactView?: boolean }) {
  const text = compactView && r.text.length > 220 ? `${r.text.slice(0, 220)}…` : r.text;
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Stars n={r.rating} />
        <span className="text-xs text-ink-3">{day(r.date)}</span>
        {r.version && <Chip>v{r.version}</Chip>}
        <Chip>{LANG_LABEL[r.lang]}</Chip>
        {!compactView && <Chip>{CATEGORY_INFO[r.category].label}</Chip>}
        {r.thumbsUp > 0 && <span className="text-xs text-ink-3">👍 {r.thumbsUp}</span>}
      </div>
      <p className="mt-2 text-sm leading-relaxed">{text}</p>
      {r.gist && r.lang !== "english" && <p className="mt-1.5 text-sm text-ink-2 italic">→ {r.gist}</p>}
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="text-sm px-3 py-1.5 rounded-lg border border-border hover:border-ink-3"
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {sub && <p className="mt-1 text-sm text-ink-2">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Report({ store, id }: { store: Store; id: string }) {
  const { data, error } = useAnalysis(store, id);
  const [cat, setCat] = useState<Category | null>(null);
  const [lang, setLang] = useState<Lang | null>(null);
  const [sent, setSent] = useState<Sentiment | null>(null);
  const [limit, setLimit] = useState(30);

  const byId = useMemo(() => new Map((data?.reviews ?? []).map((r) => [r.id, r])), [data]);
  const filtered = useMemo(
    () =>
      (data?.reviews ?? []).filter(
        (r) => (!cat || r.category === cat) && (!lang || r.lang === lang) && (!sent || r.sentiment === sent),
      ),
    [data, cat, lang, sent],
  );

  if (error)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-lg font-medium">{error}</p>
        <Link href="/" className="mt-6 inline-block underline text-ink-2">
          Search another app
        </Link>
      </div>
    );
  if (!data) return <Loading />;

  const { app, stats } = data;
  const indicShare = stats.langs
    .filter((l) => l.lang !== "english" && l.lang !== "other")
    .reduce((a, l) => a + l.share, 0);
  const spike = stats.versions.find((v) => v.spike);
  const issueRows = stats.issues.map((i) => ({
    key: i.category,
    label: CATEGORY_INFO[i.category].label,
    value: i.count,
    display: String(i.count),
    tip: `${pct(i.share)} of complaints`,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={app.icon} alt="" className="w-16 h-16 rounded-2xl border border-border" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{app.title}</h1>
            <StoreBadge store={app.store} />
          </div>
          <p className="text-ink-2 mt-1 text-sm">
            {app.developer}
            {app.genre ? ` · ${app.genre}` : ""} · ★ {app.rating.toFixed(2)} from {compact(app.ratingsCount)} ratings
            {app.installs ? ` · ${app.installs} installs` : ""}
          </p>
          <p className="text-ink-3 mt-1 text-sm">
            {stats.total} latest reviews, {day(stats.firstDate)} to {day(stats.lastDate)} ·{" "}
            {data.engine === "lexicon" ? "Built-in classifier" : `AI analysis by Claude`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={typeof window !== "undefined" ? window.location.href : ""} label="Copy report link" />
          <Link
            href={`/compare?apps=${store}:${id}`}
            className="text-sm px-3 py-1.5 rounded-lg bg-ink text-bg hover:opacity-90"
          >
            Compare with competitors
          </Link>
        </div>
      </div>

      {data.note && (
        <p className="mt-6 rounded-lg bg-warning-bg text-warning-ink text-sm px-4 py-3">{data.note}</p>
      )}

      {/* Summary + stats */}
      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <p className="text-sm font-medium text-accent">Summary</p>
        <p className="mt-2 text-lg leading-relaxed">{data.summary}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Reviews analyzed" value={String(stats.total)} sub="newest first" />
        <Stat label="Negative" value={pct(stats.negativeShare)} sub="1–2★ or clearly unhappy" />
        <Stat
          label="Recent avg rating"
          value={`★ ${stats.sampleAvgRating.toFixed(2)}`}
          sub={`vs ★ ${app.rating.toFixed(2)} all-time`}
          tone={stats.sampleAvgRating < app.rating - 0.5 ? "critical" : undefined}
        />
        <Stat label="Indian-language reviews" value={pct(indicShare)} sub="Hinglish + Indian scripts" />
        <Stat
          label="Developer replies"
          value={app.store === "play" ? pct(stats.replyRate) : "n/a"}
          sub={app.store === "play" ? "of these reviews got a reply" : "not public on iOS"}
        />
      </div>

      {/* Insights */}
      <Section
        title="Fix these first"
        sub={data.engine === "lexicon" ? "Ranked by number of complaints." : "Written by Claude from the reviews below."}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {data.insights.map((ins, i) => (
            <div key={ins.title} className="rounded-xl border border-border bg-surface p-5 flex flex-col">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 shrink-0 rounded-full bg-surface-2 grid place-items-center text-sm font-semibold">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold leading-snug">{ins.title}</h3>
                  <p className="mt-1 text-xs text-ink-3">
                    {CATEGORY_INFO[ins.category].label}
                    {ins.count ? ` · ${ins.count} reviews` : ""}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-2">{ins.detail}</p>
              <p className="mt-3 text-sm rounded-lg bg-surface-2 px-3 py-2">
                <span className="font-medium">Do this: </span>
                {ins.action}
              </p>
              <div className="mt-3 space-y-2">
                {ins.quoteIds
                  .slice(0, 2)
                  .map((qid) => byId.get(qid))
                  .filter((r): r is LabeledReview => Boolean(r))
                  .map((r) => (
                    <ReviewCard key={r.id} r={r} compactView />
                  ))}
              </div>
            </div>
          ))}
          {data.insights.length === 0 && <p className="text-ink-2">No clear complaint pattern in the latest reviews.</p>}
        </div>
      </Section>

      <div className="grid gap-x-10 lg:grid-cols-2">
        <Section title="What users complain about" sub="Click a bar to read those reviews.">
          <BarList
            rows={issueRows}
            selected={cat}
            onSelect={(k) => {
              setCat(cat === k ? null : (k as Category));
              setLimit(30);
              document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </Section>

        <Section
          title="Release health"
          sub={
            spike
              ? `⚠ v${spike.version} has a spike in negative reviews.`
              : "Share of negative reviews per app version (versions with 6+ reviews)."
          }
        >
          {stats.versions.length ? (
            <BarList
              max={1}
              labelWidth="w-24"
              rows={stats.versions.map((v) => ({
                key: v.version,
                label: `v${v.version}`,
                value: v.negShare,
                display: pct(v.negShare),
                badge: v.spike ? "⚠ Spike" : undefined,
                critical: v.spike,
                tip: `${v.negative} of ${v.total} reviews negative${
                  v.topIssue ? `, mostly ${CATEGORY_INFO[v.topIssue].label.toLowerCase()}` : ""
                }`,
              }))}
            />
          ) : (
            <p className="text-sm text-ink-2">The store doesn&apos;t show versions for these reviews.</p>
          )}
        </Section>

        <Section title="Languages" sub="Click a bar to filter reviews by language.">
          <BarList
            selected={lang}
            onSelect={(k) => {
              setLang(lang === k ? null : (k as Lang));
              setLimit(30);
            }}
            rows={stats.langs.map((l) => ({
              key: l.lang,
              label: LANG_LABEL[l.lang],
              value: l.count,
              display: pct(l.share),
              tip: `${l.count} reviews`,
            }))}
          />
        </Section>

        <Section title="Star ratings" sub="Across the reviews analyzed.">
          <BarList
            labelWidth="w-12"
            rows={([5, 4, 3, 2, 1] as const).map((s) => ({
              key: String(s),
              label: `${s}★`,
              value: stats.ratingDist[s],
              display: String(stats.ratingDist[s]),
              tip: pct(stats.ratingDist[s] / Math.max(1, stats.total)),
            }))}
          />
        </Section>
      </div>

      {data.replies.length > 0 && (
        <Section title="Reply drafts" sub="Written in each reviewer's own language. Edit before posting.">
          <div className="grid gap-4 lg:grid-cols-3">
            {data.replies.map((rep) => {
              const r = byId.get(rep.reviewId);
              return (
                <div key={rep.reviewId} className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
                  {r && <ReviewCard r={r} compactView />}
                  <p className="text-sm leading-relaxed flex-1">
                    <span className="font-medium">Reply: </span>
                    {rep.reply}
                  </p>
                  <div>
                    <CopyButton text={rep.reply} label="Copy reply" />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Explorer */}
      <section id="reviews" className="mt-10 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">Reviews</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {(["negative", "neutral", "positive"] as Sentiment[]).map((s) => (
            <button
              key={s}
              onClick={() => setSent(sent === s ? null : s)}
              className={`px-3 py-1 rounded-full border capitalize ${
                sent === s ? "bg-ink text-bg border-ink" : "border-border hover:border-ink-3"
              }`}
            >
              {s}
            </button>
          ))}
          {cat && (
            <button onClick={() => setCat(null)} className="px-3 py-1 rounded-full bg-surface-2">
              {CATEGORY_INFO[cat].label} ✕
            </button>
          )}
          {lang && (
            <button onClick={() => setLang(null)} className="px-3 py-1 rounded-full bg-surface-2">
              {LANG_LABEL[lang]} ✕
            </button>
          )}
          <span className="text-ink-3 ml-auto tabular">{filtered.length} reviews</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filtered.slice(0, limit).map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </div>
        {filtered.length > limit && (
          <button
            onClick={() => setLimit(limit + 30)}
            className="mt-4 text-sm px-4 py-2 rounded-lg border border-border hover:border-ink-3"
          >
            Show more
          </button>
        )}
      </section>

      <div className="mt-12 rounded-xl bg-ink text-bg p-6 sm:p-8 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[16rem]">
          <p className="text-lg font-semibold">Get this report every morning in Slack</p>
          <p className="text-sm opacity-80 mt-1">
            Track {app.title} and 3 competitors daily, with alerts when a release goes bad. Starter plan, ₹2,999/month.
          </p>
        </div>
        <a
          href={BRAND.contactUrl || "/#pricing"}
          className="rounded-lg bg-accent text-accent-ink px-5 py-2.5 text-sm font-medium"
        >
          {BRAND.contactUrl ? "Talk to us" : "See plans"}
        </a>
      </div>
    </div>
  );
}
