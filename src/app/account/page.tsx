import type { Metadata } from "next";
import { Suspense } from "react";
import AccountView from "@/components/AccountView";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: `Account · ${BRAND.name}` };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Your account</h1>
      <Suspense>
        <AccountView />
      </Suspense>
    </div>
  );
}
