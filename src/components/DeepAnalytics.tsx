"use client";

import { useMemo, useState } from "react";
import { rampCell } from "@/lib/analytics";
import { CATEGORY_INFO } from "@/lib/categories";
import {
  featureRequests,
  FIX_STATUS,
  fixTracker,
  langTopicMatrix,
  phraseContrast,
  replyStats,
  testimonials,
} from "@/lib/deep";
import type { Analysis, Category } from "@/lib/types";
import { BarList } from "./charts";

const pct = (n: number) => `${Math.round(n * 100)}%`;
const day = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5 min-w-0">
      <h3 className="font-semibold">{title}</h3>
      {sub && <p className="text-xs text-ink-3 mt-0.5 mb-4">{sub}</p>}
      {!sub && <div className="mb-4" />}
      {children}
    </section>
  );
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-6 text-lg font-semibold tracking-tight">{children}</h2>;
}

function CopyLink({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="text-xs underline text-ink-3 hover:text-ink"
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        })
      }
    >
      {done ? "Copied ✓" : "Copy"}
    </button>
  );
}

export default function DeepAnalytics({
  data,
  onSearch,
  onTopic,
}: {
  data: Analysis;
  onSearch: (q: string) => void;
  onTopic: (c: Category) => void;
}) {
  const fix = useMemo(() => fixTracker(data.reviews, data.stats.versions), [data]);
  const phrases = useMemo(() => phraseContrast(data.reviews, data.app.title), [data]);
  const lt = useMemo(() => langTopicMatrix(data.reviews), [data]);
  const replies = useMemo(() => replyStats(data.reviews), [data]);
  const requests = useMemo(() => featureRequests(data.reviews), [data]);
  const quotes = useMemo(() => testimonials(data.reviews), [data]);
  const isPlay = data.app.store === "play";

  return (
    <div className="space-y-4">
      <GroupTitle>Release tracking</GroupTitle>
      <Card
        title={fix ? `Did v${fix.latest} fix things?` : "Did the latest release fix things?"}
        sub={
          fix
            ? `Complaint rate per topic in v${fix.latest} (${fix.latestTotal} reviews) vs the ${fix.earlierVersions} earlier versions (${fix.earlierTotal} reviews).${fix.lowSample ? " ⚠ Small sample: treat as directional." : ""}`
            : undefined
        }
      >
        {fix ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ink-2">
                  <th className="text-left font-medium pb-2">Topic</th>
                  <th className="text-right font-medium pb-2 px-3">Earlier</th>
                  <th className="text-right font-medium pb-2 px-3">v{fix.latest}</th>
                  <th className="text-left font-medium pb-2 pl-3">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {fix.rows.map((r) => {
                  const st = FIX_STATUS[r.status];
                  const color = st.tone === "critical" ? "text-critical" : st.tone === "good" ? "text-good" : "text-ink-3";
                  return (
                    <tr key={r.category} className="border-t border-border hover:bg-surface-2 cursor-pointer" onClick={() => onTopic(r.category)}>
                      <td className="py-2">{r.label}</td>
                      <td className="py-2 px-3 text-right tabular text-ink-2">
                        {pct(r.earlierShare)} <span className="text-ink-3 text-xs">({r.earlierCount})</span>
                      </td>
                      <td className="py-2 px-3 text-right tabular">
                        {pct(r.latestShare)} <span className="text-ink-3 text-xs">({r.latestCount})</span>
                      </td>
                      <td className={`py-2 pl-3 whitespace-nowrap font-medium ${color}`}>
                        <span aria-hidden>{st.icon}</span> {st.label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink-2">Needs at least two app versions with 6+ reviews each.</p>
        )}
      </Card>

      <GroupTitle>Text analytics</GroupTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Words behind 1–2★ reviews" sub="Phrases far more common in unhappy reviews. Click to read them.">
          {phrases.negative.length ? (
            <BarList
              onSelect={onSearch}
              rows={phrases.negative.map((p) => ({
                key: p.phrase,
                label: `“${p.phrase}”`,
                value: p.neg,
                display: String(p.neg),
                tip: `${p.neg} unhappy vs ${p.pos} happy reviews`,
              }))}
            />
          ) : (
            <p className="text-sm text-ink-2">Not enough unhappy reviews.</p>
          )}
        </Card>
        <Card title="Words behind 4–5★ reviews" sub="What happy users praise. Great for ad copy and store listings.">
          {phrases.positive.length ? (
            <BarList
              onSelect={onSearch}
              rows={phrases.positive.map((p) => ({
                key: p.phrase,
                label: `“${p.phrase}”`,
                value: p.pos,
                display: String(p.pos),
                tip: `${p.pos} happy vs ${p.neg} unhappy reviews`,
              }))}
            />
          ) : (
            <p className="text-sm text-ink-2">Not enough happy reviews.</p>
          )}
        </Card>
      </div>

      <Card title="What each language complains about" sub="Complaints in each topic as a share of that language's reviews. Darker means a bigger share.">
        {lt.langs.length && lt.cats.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left font-medium text-ink-2 pb-2 pr-3">Topic</th>
                  {lt.langs.map((l) => (
                    <th key={l.lang} className="font-medium text-ink-2 pb-2 px-1 text-center whitespace-nowrap">
                      {l.label} <span className="text-ink-3 font-normal">({l.total})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lt.cats.map((c, i) => (
                  <tr key={c}>
                    <td className="py-1 pr-3 text-ink-2 whitespace-nowrap">{CATEGORY_INFO[c].label}</td>
                    {lt.cells[i].map((cell, j) => (
                      <td key={j} className="p-1 text-center">
                        <span
                          className="block rounded-md py-1.5 tabular min-w-14"
                          style={rampCell(cell.share, lt.max)}
                          title={`${lt.langs[j].label}: ${cell.count} of ${lt.langs[j].total} reviews`}
                        >
                          {cell.count ? pct(cell.share) : "–"}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink-2">Needs at least one language with 5+ reviews.</p>
        )}
      </Card>

      <GroupTitle>Support performance</GroupTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Developer reply rate by star rating" sub={isPlay ? "Share of reviews that got a public reply from the developer." : "Developer replies aren't public on the App Store feed."}>
          {isPlay ? (
            <BarList
              max={1}
              labelWidth="w-12"
              rows={replies.byStar.map((b) => ({
                key: String(b.star),
                label: `${b.star}★`,
                value: b.rate,
                display: pct(b.rate),
                tip: `${b.replied} of ${b.total} replied`,
              }))}
            />
          ) : (
            <p className="text-sm text-ink-2">Not available for iOS.</p>
          )}
        </Card>
        <Card title="Support at a glance">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-ink-2">Unhappy reviews with no reply</dt>
              <dd className={`text-2xl font-semibold tabular mt-1 ${replies.unansweredNegative.length ? "text-critical" : ""}`}>
                {isPlay ? replies.unansweredNegative.length : "n/a"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-2">Median time to reply</dt>
              <dd className="text-2xl font-semibold tabular mt-1">
                {replies.medianHours === null
                  ? "–"
                  : replies.medianHours < 1
                    ? "< 1 hr"
                    : replies.medianHours < 48
                      ? `${Math.round(replies.medianHours)} hrs`
                      : `${Math.round(replies.medianHours / 24)} days`}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-ink-2">
            Replying to 1–2★ reviews quickly is one of the few ways to win back a rating. Raay drafts those replies in the user&apos;s own language on the Overview tab.
          </p>
        </Card>
      </div>

      <GroupTitle>Product & marketing</GroupTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="What users are asking for" sub="Feature requests, most-upvoted first.">
          {requests.length ? (
            <ul className="space-y-2">
              {requests.map((r) => (
                <li key={r.id} className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <p>{r.gist || r.text}</p>
                  <p className="text-xs text-ink-3 mt-1">
                    {day(r.date)}
                    {r.thumbsUp ? ` · 👍 ${r.thumbsUp}` : ""}
                    {r.gist && r.gist !== r.text ? ` · “${r.text.slice(0, 60)}${r.text.length > 60 ? "…" : ""}”` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-2">No feature requests in the latest reviews.</p>
          )}
        </Card>
        <Card title="Quotable 5★ reviews" sub="Real words from happy users, ready for your store listing, ads or landing page.">
          {quotes.length ? (
            <ul className="space-y-2">
              {quotes.map((r) => (
                <li key={r.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                  <p className="leading-relaxed">“{r.text}”</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-xs text-ink-3">
                      ★★★★★ · {day(r.date)}
                      {r.thumbsUp ? ` · 👍 ${r.thumbsUp}` : ""}
                    </span>
                    <CopyLink text={`“${r.text}” (5★ review, ${data.app.store === "play" ? "Google Play" : "App Store"})`} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-2">No detailed 5★ reviews in this sample.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
