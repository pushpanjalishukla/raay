import type { Metadata } from "next";
import { Suspense } from "react";
import PricingPlans from "@/components/PricingPlans";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: `Pricing · ${BRAND.name}` };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-accent">Pricing</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">Simple plans in rupees</h1>
        <p className="mt-4 text-lg text-ink-2">
          Start free. Upgrade when your team wants fresh AI reports for any app, every day.
        </p>
      </div>
      <div className="mt-12">
        <Suspense>
          <PricingPlans />
        </Suspense>
      </div>
    </div>
  );
}
