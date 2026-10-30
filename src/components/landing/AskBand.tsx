import Link from "next/link";
import { LogoMark } from "../Logo";

// A real Ask Raay answer (30 Oct 2026, Zepto), shortened for the page. The
// bullet heads and quotes are verbatim; nothing is invented.
const QUESTION = "Why are people unhappy with delivery this week?";
const INTRO = "Looking at roughly the last week (Oct 22–29), delivery complaints fall into a few clusters:";
const POINTS = [
  "Late deliveries despite the 10-minute promise (about 8 reviews).",
  "Missing or wrong items at the doorstep (about 10 reviews).",
  "Rotten, expired or damaged goods, especially fresh produce (about 15 reviews).",
];
const OUTRO = "On the positive side, around 20 reviews this week still praise “fast delivery”.";
const QUOTES = [
  { meta: "1★ · 29 Oct · v26.10.2", text: "…they are showing some time and always deliver it way late…" },
  { meta: "1★ · 28 Oct · v26.10.2", text: "…recently you added 5rs handling fees but didn't serve a speed service promise." },
];

export default function AskBand() {
  return (
    <section className="bg-[#121211] text-[#f2efe9] dark:bg-[#0b0b0a] dark:border-y dark:border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32 grid gap-14 lg:grid-cols-[0.9fr_1.1fr] items-center">
        <div>
          <p className="text-sm font-medium text-[#ff7a2e]">Ask Raay</p>
          <h2 className="mt-4 font-serif text-5xl sm:text-6xl leading-[1.02] tracking-[-0.01em] text-balance">
            Ask anything. Get answers with receipts.
          </h2>
          <p className="mt-6 text-lg text-[#c3c2b7] leading-relaxed max-w-md">
            Ask in English or Hinglish. Raay answers in plain words and cites the exact reviews behind every claim.
          </p>
          <Link
            href="/app/play/com.zeptoconsumerapp"
            className="mt-8 h-12 px-6 inline-flex items-center rounded-full bg-[#f2efe9] text-[#121211] text-sm font-semibold hover:bg-white"
          >
            Try it on a live report
          </Link>
        </div>

        <figure>
          <div className="rounded-3xl bg-[#1b1b1a] ring-1 ring-white/10 p-5 sm:p-7 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.8)]">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[#f2efe9] text-[#121211] px-4 py-3 text-[15px]">
              {QUESTION}
            </p>
            <div className="mt-6 flex gap-3">
              <span className="mt-0.5 shrink-0 text-[#f2efe9]">
                <LogoMark size={18} />
              </span>
              <div className="text-[15px] leading-relaxed text-[#e4e1d9]">
                <p>{INTRO}</p>
                <ul className="mt-3 space-y-2">
                  {POINTS.map((p) => (
                    <li key={p} className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff7a2e]" />
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-3">{OUTRO}</p>
                <p className="mt-5 text-xs uppercase tracking-[0.12em] text-[#8f8e86]">Cited reviews</p>
                <ul className="mt-2.5 space-y-2">
                  {QUOTES.map((q) => (
                    <li key={q.text} className="rounded-xl bg-white/[0.04] ring-1 ring-white/10 px-3.5 py-2.5 text-sm">
                      <span className="text-[#8f8e86]">{q.meta}</span>
                      <span className="block mt-0.5 text-[#e4e1d9]">“{q.text}”</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <figcaption className="mt-4 text-xs text-[#8f8e86]">
            A real answer from Raay on 30 Oct 2026, shortened. Public Google Play reviews of Zepto; Raay is not affiliated
            with Zepto.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
