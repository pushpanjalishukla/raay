"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { AUTH_ON } from "@/lib/client-flags";

function SignedOutLinks() {
  return (
    <>
      <Link href="/sign-in" className="hidden sm:inline text-sm text-ink-2 hover:text-ink">
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="h-9 px-4 inline-flex items-center rounded-full bg-ink text-bg text-sm font-medium hover:opacity-90"
      >
        Try free
      </Link>
    </>
  );
}

export default function HeaderAuth() {
  if (!AUTH_ON) return <SignedOutLinks />;
  return (
    <>
      <Show when="signed-out">
        <SignedOutLinks />
      </Show>
      <Show when="signed-in">
        <Link href="/account" className="text-sm text-ink-2 hover:text-ink">
          Account
        </Link>
        <UserButton />
      </Show>
    </>
  );
}
