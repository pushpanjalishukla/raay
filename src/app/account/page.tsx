import type { Metadata } from "next";
import { Suspense } from "react";
import AccountView from "@/components/AccountView";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: `Account · ${BRAND.name}` };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:py-16">
      <p className="text-sm font-medium text-accent">Account</p>
      <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">Your account</h1>
      <p className="mt-3 text-lg text-ink-2">Your plan, what you&apos;ve used, and where to go next.</p>
      <div className="mt-10">
        <Suspense>
          <AccountView />
        </Suspense>
      </div>
    </div>
  );
}
