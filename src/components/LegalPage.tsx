import Link from "next/link";
import { BRAND } from "@/lib/config";

export function Contact() {
  return BRAND.contactEmail ? (
    <a className="underline" href={`mailto:${BRAND.contactEmail}`}>
      {BRAND.contactEmail}
    </a>
  ) : (
    <a className="underline" href={BRAND.authorUrl} target="_blank" rel="noreferrer">
      @{BRAND.author} on GitHub
    </a>
  );
}

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-medium text-accent">Legal</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-ink-3">Last updated {updated}</p>
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-ink-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-ink">
        {children}
      </div>
      <p className="mt-12 text-sm text-ink-3">
        See also: <Link className="underline" href="/privacy">Privacy Policy</Link> · <Link className="underline" href="/terms">Terms of Service</Link>
      </p>
    </article>
  );
}
