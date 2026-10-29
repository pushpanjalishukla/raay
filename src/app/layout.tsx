import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";
import { AUTH_ON } from "@/lib/client-flags";
import { BRAND } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${BRAND.name}: app review intelligence for Indian apps`,
  description: BRAND.description,
  openGraph: {
    title: `${BRAND.name} (${BRAND.native}): ${BRAND.tagline}`,
    description: BRAND.description,
    type: "website",
  },
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
      <span className="grid place-items-center w-7 h-7 rounded-lg bg-ink text-bg text-sm">र</span>
      {BRAND.name}
    </Link>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
        <nav className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-8">
          <Logo />
          <div className="hidden md:flex items-center gap-6 text-sm text-ink-2">
            <Link href="/#features" className="hover:text-ink">Features</Link>
            <Link href="/#how" className="hover:text-ink">How it works</Link>
            <Link href="/compare" className="hover:text-ink">Compare apps</Link>
            <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <HeaderAuth />
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-ink-2 max-w-xs">{BRAND.tagline}</p>
            <p className="mt-4 text-xs text-ink-3">
              Made in India by{" "}
              <a className="underline hover:text-ink" href={BRAND.authorUrl} target="_blank" rel="noreferrer">
                @{BRAND.author}
              </a>
            </p>
          </div>
          <div className="text-sm">
            <p className="font-medium">Product</p>
            <ul className="mt-3 space-y-2 text-ink-2">
              <li><Link href="/#features" className="hover:text-ink">Features</Link></li>
              <li><Link href="/compare" className="hover:text-ink">Compare apps</Link></li>
              <li><Link href="/pricing" className="hover:text-ink">Pricing</Link></li>
              {AUTH_ON && <li><Link href="/account" className="hover:text-ink">Account</Link></li>}
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-medium">Resources</p>
            <ul className="mt-3 space-y-2 text-ink-2">
              <li><Link href="/#how" className="hover:text-ink">How it works</Link></li>
              <li><Link href="/#faq" className="hover:text-ink">FAQ</Link></li>
              <li><a href={BRAND.github} target="_blank" rel="noreferrer" className="hover:text-ink">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-3">
            Raay reads public Google Play and App Store India reviews. It never needs access to your app or users.
          </p>
        </div>
      </footer>
    </>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {AUTH_ON ? (
          <ClerkProvider>
            <Shell>{children}</Shell>
          </ClerkProvider>
        ) : (
          <Shell>{children}</Shell>
        )}
      </body>
    </html>
  );
}
