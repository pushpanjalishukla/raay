import type { Metadata } from "next";
import PulseTable from "@/components/PulseTable";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `India App Pulse: which apps are users unhappiest with? · ${BRAND.name}`,
  description: "A live leaderboard of how unhappy users are with India's most popular apps, from the latest Play Store reviews.",
};

export default function PulsePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-accent">India App Pulse</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">Which apps are users unhappiest with right now?</h1>
        <p className="mt-4 text-lg text-ink-2">
          A live leaderboard of India&apos;s most popular apps, ranked by the share of unhappy reviews in their latest Play Store
          feedback. Refreshed every 6 hours. Click any app for the full report.
        </p>
      </div>
      <div className="mt-10">
        <PulseTable />
      </div>
    </div>
  );
}
