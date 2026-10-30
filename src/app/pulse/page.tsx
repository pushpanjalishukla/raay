import type { Metadata } from "next";
import PulseCards from "@/components/PulseCards";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `India App Pulse: which apps are users unhappiest with? · ${BRAND.name}`,
  description: "A live leaderboard of how unhappy users are with India's most popular apps, from the latest Play Store reviews.",
};

export default function PulsePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-accent">India App Pulse · updated every 6 hours</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">How happy are users with India&apos;s top apps?</h1>
        <p className="mt-4 text-lg text-ink-2">
          18 popular apps, ranked by the share of unhappy reviews in their latest Play Store feedback. Filter by category,
          change the sort, and open any app for its full report.
        </p>
      </div>
      <div className="mt-10">
        <PulseCards />
      </div>
    </div>
  );
}
