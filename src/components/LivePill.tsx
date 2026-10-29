"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PulseRow } from "@/lib/pulse-shared";

/** A live headline from India App Pulse, e.g. "47% of Amazon's latest reviews are unhappy". */
export default function LivePill() {
  const [top, setTop] = useState<PulseRow | null>(null);
  useEffect(() => {
    fetch("/api/pulse")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.rows?.[0] && setTop(d.rows[0]))
      .catch(() => {});
  }, []);
  return (
    <Link
      href="/pulse"
      className="inline-flex items-center gap-2.5 rounded-full border border-border bg-surface/80 backdrop-blur pl-2 pr-4 py-1.5 text-sm text-ink-2 hover:border-ink-3 shadow-sm"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--critical)_12%,transparent)] px-2 py-0.5 text-xs font-semibold text-critical">
        <span className="w-1.5 h-1.5 rounded-full bg-critical pulse-dot" />
        LIVE
      </span>
      {top ? (
        <span>
          <span className="font-semibold text-ink tabular">{Math.round(top.negativeShare * 100)}%</span> of {top.name}&apos;s latest
          reviews are unhappy
        </span>
      ) : (
        <span>India App Pulse: 18 popular apps, tracked every 6 hours</span>
      )}
      <span aria-hidden className="text-ink-3">→</span>
    </Link>
  );
}
