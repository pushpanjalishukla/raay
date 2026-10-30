import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import AuthShell, { AuthComingSoon } from "@/components/AuthShell";
import { AUTH_ON } from "@/lib/client-flags";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: `Sign in · ${BRAND.name}` };

export default function SignInPage() {
  return (
    <AuthShell title="Start free with Raay">
      {AUTH_ON ? (
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" withSignUp fallbackRedirectUrl="/" />
      ) : (
        <AuthComingSoon />
      )}
    </AuthShell>
  );
}
