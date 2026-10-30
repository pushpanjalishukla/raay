import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import AuthShell, { AuthComingSoon } from "@/components/AuthShell";
import { AUTH_ON } from "@/lib/client-flags";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: `Create your account · ${BRAND.name}` };

export default function SignUpPage() {
  return (
    <AuthShell title="Create your free account">
      {AUTH_ON ? <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" /> : <AuthComingSoon />}
    </AuthShell>
  );
}
