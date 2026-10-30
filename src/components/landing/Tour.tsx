"use client";

import { useState } from "react";
import churn from "@/assets/shots/churn.png";
import releases from "@/assets/shots/releases.png";
import trends from "@/assets/shots/trends.png";
import words from "@/assets/shots/words.png";
import Frame from "./Frame";

const TABS = [
  {
    key: "trends",
    label: "Trends",
    line: "See the day things went wrong: review volume and rating every two hours, split by mood.",
    img: trends,
    alt: "Raay trends: review volume by sentiment and average rating over time",
  },
  {
    key: "releases",
    label: "Releases",
    line: "Know if the update fixed it. Every complaint topic, release by release.",
    img: releases,
    alt: "Raay release tracking: complaint topics by app version",
  },
  {
    key: "churn",
    label: "Churn & rivals",
    line: "Catch users who say they're leaving, and see which rival they're moving to.",
    img: churn,
    alt: "Raay churn view: competitors users mention and reviews from users who say they're leaving",
  },
  {
    key: "words",
    label: "In their words",
    line: "The exact phrases behind 1★ and 5★ reviews, for your next fix or your next ad.",
    img: words,
    alt: "Raay text analytics: words behind unhappy and happy reviews",
  },
] as const;

export default function Tour() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];
  return (
    <div>
      <div role="tablist" aria-label="Product tour" className="flex flex-wrap justify-center gap-1.5">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            role="tab"
            id={`tour-tab-${t.key}`}
            aria-selected={i === active}
            aria-controls={`tour-panel-${t.key}`}
            onClick={() => setActive(i)}
            className={`h-10 px-4 rounded-full text-sm font-medium transition-colors ${
              i === active ? "bg-ink text-bg" : "text-ink-2 hover:text-ink hover:bg-surface-2"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-6 mx-auto max-w-xl text-center text-ink-2 text-[17px] leading-relaxed min-h-[3.25rem]">{tab.line}</p>
      <div className="mt-8">
        {TABS.map((t, i) => (
          <div
            key={t.key}
            role="tabpanel"
            id={`tour-panel-${t.key}`}
            aria-labelledby={`tour-tab-${t.key}`}
            hidden={i !== active}
          >
            <Frame src={t.img} alt={t.alt} />
          </div>
        ))}
      </div>
    </div>
  );
}
