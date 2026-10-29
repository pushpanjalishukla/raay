"use client";

import { useRef, useState } from "react";
import type { Analysis, RawReview } from "@/lib/types";

interface Turn {
  q: string;
  a?: string;
  quotes?: RawReview[];
  followUps?: string[];
  error?: string;
}

const STARTERS = [
  "Why are people giving 1 star this week?",
  "What exactly goes wrong with payments and refunds?",
  "Which competitors do users mention, and why?",
  "What features are users asking for?",
  "What do Hinglish and Hindi reviewers complain about?",
  "Summarise this for my CEO in 3 bullets",
];

function Answer({ text }: { text: string }) {
  const blocks = text.split(/\n+/).filter(Boolean);
  return (
    <div className="space-y-2 text-[15px] leading-relaxed">
      {blocks.map((b, i) =>
        /^\s*[-•*]\s+/.test(b) ? (
          <p key={i} className="flex gap-2">
            <span className="text-accent" aria-hidden>
              •
            </span>
            <span>{b.replace(/^\s*[-•*]\s+/, "")}</span>
          </p>
        ) : (
          <p key={i}>{b}</p>
        ),
      )}
    </div>
  );
}

export default function AskRaay({ data, disabled }: { data: Analysis; disabled?: boolean }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    setQ("");
    setBusy(true);
    const history = turns.filter((t) => t.a).map((t) => ({ q: t.q, a: t.a! }));
    setTurns((t) => [...t, { q: text }]);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: data.app.store, id: data.app.id, question: text, history }),
      });
      const body = await res.json().catch(() => ({ error: "The answer timed out. Please try again." }));
      setTurns((t) =>
        t.map((x, i) =>
          i === t.length - 1
            ? body.error
              ? { ...x, error: body.error }
              : { ...x, a: body.answer, quotes: body.quotes, followUps: body.followUps }
            : x,
        ),
      );
    } catch {
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, error: "Network error. Please try again." } : x)));
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    }
  };

  if (disabled)
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-ink-2">
        Ask Raay needs an Anthropic API key on the server. Add <code>ANTHROPIC_API_KEY</code> in Vercel to switch it on.
      </div>
    );

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold">Ask Raay about {data.app.title.split(/[:\-–]/)[0].trim()}&apos;s reviews</h3>
        <p className="text-sm text-ink-3 mt-0.5">
          Answers come only from the latest {data.stats.total} reviews, with the reviews they&apos;re based on.
        </p>
      </div>

      <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
        {turns.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="text-sm text-left px-3 py-2 rounded-lg border border-border hover:border-ink-3 hover:bg-surface-2"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-ink text-bg px-4 py-2 text-sm">{t.q}</p>
            </div>
            {t.error ? (
              <p className="text-sm text-critical">{t.error}</p>
            ) : t.a ? (
              <div className="space-y-3">
                <Answer text={t.a} />
                {t.quotes && t.quotes.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {t.quotes.map((r) => (
                      <blockquote key={r.id} className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
                        <span className={r.rating <= 2 ? "text-critical" : "text-ink-2"}>{"★".repeat(r.rating)}</span>
                        <span className="text-xs text-ink-3 ml-2">
                          {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          {r.version ? ` · v${r.version}` : ""}
                        </span>
                        <p className="mt-1 line-clamp-4">{r.text}</p>
                      </blockquote>
                    ))}
                  </div>
                )}
                {i === turns.length - 1 && t.followUps && t.followUps.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {t.followUps.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => ask(f)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-ink-3"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink-3">
                <span className="w-2 h-2 rounded-full bg-accent pulse-dot" /> Reading {data.stats.total} reviews…
              </p>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="p-3 border-t border-border flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={300}
          placeholder="Ask anything about these reviews… (English or Hinglish)"
          className="flex-1 h-11 rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:border-ink-3 min-w-0"
          aria-label="Ask a question about the reviews"
        />
        <button
          type="submit"
          disabled={busy || q.trim().length < 3}
          className="h-11 px-5 rounded-lg bg-accent text-accent-ink text-sm font-medium disabled:opacity-40"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
