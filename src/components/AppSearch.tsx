"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Store } from "@/lib/types";

export interface Hit {
  id: string;
  store: Store;
  title: string;
  developer: string;
  icon: string;
  rating: number;
}

export function StoreBadge({ store }: { store: Store }) {
  return (
    <span className="text-[11px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-border text-ink-2">
      {store === "play" ? "Play" : "iOS"}
    </span>
  );
}

export default function AppSearch({
  onPick,
  placeholder = "Search any app: Zepto, PhonePe, Swiggy… or paste a store link",
  autoFocus = false,
}: {
  onPick?: (hit: { store: Store; id: string; title?: string }) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const visible = q.trim().length < 2 ? [] : hits;
  const pick = (h: { store: Store; id: string; title?: string }) => {
    setOpen(false);
    setQ("");
    if (onPick) onPick(h);
    else router.push(`/app/${h.store}/${encodeURIComponent(h.id)}`);
  };

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = await res.json();
        if (data.direct) {
          pick(data.direct);
          return;
        }
        setHits(data.hits ?? []);
        setOpen(true);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 h-14 shadow-sm focus-within:border-ink-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-ink-3 shrink-0" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => visible.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && visible[0]) pick(visible[0]);
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-base placeholder:text-ink-3 min-w-0"
          aria-label="Search for an app"
        />
        {loading && <span className="w-2 h-2 rounded-full bg-accent pulse-dot" aria-label="Searching" />}
      </div>
      {open && visible.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
          {visible.map((h) => (
            <li key={`${h.store}:${h.id}`}>
              <button
                onClick={() => pick(h)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.icon} alt="" className="w-9 h-9 rounded-lg" />
                <span className="flex-1 min-w-0">
                  <span className="block truncate font-medium">{h.title}</span>
                  <span className="block truncate text-sm text-ink-3">{h.developer}</span>
                </span>
                <span className="text-sm text-ink-2 tabular">{h.rating ? `★ ${h.rating.toFixed(1)}` : ""}</span>
                <StoreBadge store={h.store} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
