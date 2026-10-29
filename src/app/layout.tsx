import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { BRAND } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${BRAND.name}: app review intelligence for Indian apps`,
  description: BRAND.description,
  openGraph: {
    title: `${BRAND.name} (${BRAND.native}): ${BRAND.tagline}`,
    description: BRAND.description,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-20">
          <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-6">
            <Link href="/" className="flex items-baseline gap-2 font-semibold text-lg tracking-tight">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent translate-y-[-1px]" />
              {BRAND.name}
              <span className="text-ink-3 text-sm font-normal">{BRAND.native}</span>
            </Link>
            <div className="ml-auto flex items-center gap-5 text-sm text-ink-2">
              <Link href="/compare" className="hover:text-ink">Compare</Link>
              <Link href="/#pricing" className="hover:text-ink">Pricing</Link>
              <a href={BRAND.github} target="_blank" rel="noreferrer" className="hover:text-ink">GitHub</a>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border mt-16">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-ink-3 flex flex-wrap gap-x-6 gap-y-2">
            <span>
              {BRAND.name} ({BRAND.native}) · Made in India by{" "}
              <a className="underline hover:text-ink" href={BRAND.authorUrl} target="_blank" rel="noreferrer">
                @{BRAND.author}
              </a>
            </span>
            <span>Reviews are fetched live from public Google Play and App Store India listings.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
