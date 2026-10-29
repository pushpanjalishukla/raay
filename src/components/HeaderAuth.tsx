"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { AUTH_ON } from "@/lib/client-flags";

export default function HeaderAuth() {
  if (!AUTH_ON)
    return (
      <Link href="/#top" className="h-9 px-4 inline-flex items-center rounded-lg bg-ink text-bg text-sm font-medium hover:opacity-90">
        Try free
      </Link>
    );
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button" className="text-sm text-ink-2 hover:text-ink">
            Sign in
          </button>
        </SignInButton>
        <Link href="/#top" className="h-9 px-4 inline-flex items-center rounded-lg bg-ink text-bg text-sm font-medium hover:opacity-90">
          Try free
        </Link>
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
