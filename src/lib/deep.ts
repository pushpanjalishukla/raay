// Deeper analyses computed client-side from an Analysis payload:
// rating impact, fix verification, churn/competitor signals, text analytics,
// reply performance and product/marketing pulls.
import { CATEGORY_INFO, LANG_LABEL } from "./categories";
import type { Analysis, Category, LabeledReview, Lang, VersionStat } from "./types";

const isComplaint = (r: LabeledReview) => r.sentiment !== "positive" && r.category !== "praise";
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/* ---------- Rating impact waterfall ---------- */

const SHORT: Record<Category | "rest", string> = {
  bug_crash: "Bugs",
  performance: "Speed",
  login_account: "Login/OTP",
  payment_refund: "Payments",
  delivery_service: "Delivery",
  customer_support: "Support",
  pricing_charges: "Pricing",
  ux_design: "UX",
  ads_notifications: "Ads",
  trust_fraud: "Trust",
  feature_request: "Requests",
  praise: "Praise",
  other: "Other",
  rest: "Rest",
};

export interface WaterfallStep {
  category: Category | "rest";
  label: string;
  short: string;
  delta: number;
  count: number;
}

/**
 * Splits the gap between the rating the app *could* have and the rating it has
 * into per-topic losses. Each complaint is assumed to become an average happy
 * review once its issue is fixed, so the steps add up exactly.
 */
export function ratingWaterfall(reviews: LabeledReview[]) {
  const n = reviews.length || 1;
  const actual = mean(reviews.map((r) => r.rating));
  const happy = reviews.filter((r) => r.sentiment === "positive").map((r) => r.rating);
  const baseline = happy.length ? mean(happy) : 4.5;
  const loss = new Map<Category, { delta: number; count: number }>();
  for (const r of reviews) {
    if (!isComplaint(r) || r.rating >= baseline) continue;
    const cur = loss.get(r.category) ?? { delta: 0, count: 0 };
    cur.delta += (baseline - r.rating) / n;
    cur.count++;
    loss.set(r.category, cur);
  }
  const sorted = [...loss.entries()]
    .map(([category, v]) => ({ category, label: CATEGORY_INFO[category].label, short: SHORT[category], ...v }))
    .sort((a, b) => b.delta - a.delta);
  const top: WaterfallStep[] = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  if (rest.length)
    top.push({
      category: "rest",
      label: "All other topics",
      short: SHORT.rest,
      delta: rest.reduce((a, s) => a + s.delta, 0),
      count: rest.reduce((a, s) => a + s.count, 0),
    });
  const potential = actual + top.reduce((a, s) => a + s.delta, 0);
  return { actual, potential, baseline, steps: top };
}

/* ---------- Fix verification across releases ---------- */

export type FixStatus = "new" | "worse" | "better" | "gone" | "same";
export const FIX_STATUS: Record<FixStatus, { label: string; icon: string; tone: "critical" | "good" | "neutral" }> = {
  new: { label: "New in latest", icon: "▲", tone: "critical" },
  worse: { label: "Getting worse", icon: "▲", tone: "critical" },
  better: { label: "Improving", icon: "▼", tone: "good" },
  gone: { label: "Not seen in latest", icon: "✓", tone: "good" },
  same: { label: "No clear change", icon: "•", tone: "neutral" },
};

export function fixTracker(reviews: LabeledReview[], versions: VersionStat[]) {
  if (versions.length < 2) return null;
  const latest = versions[versions.length - 1];
  const earlier = new Set(versions.slice(0, -1).map((v) => v.version));
  const latestReviews = reviews.filter((r) => r.version === latest.version);
  const earlierReviews = reviews.filter((r) => r.version && earlier.has(r.version));
  if (!latestReviews.length || !earlierReviews.length) return null;
  const cats = new Set<Category>();
  for (const r of [...latestReviews, ...earlierReviews]) if (isComplaint(r) && r.category !== "other") cats.add(r.category);
  const rows = [...cats].map((category) => {
    const lc = latestReviews.filter((r) => isComplaint(r) && r.category === category).length;
    const ec = earlierReviews.filter((r) => isComplaint(r) && r.category === category).length;
    const ls = lc / latestReviews.length;
    const es = ec / earlierReviews.length;
    const diff = ls - es;
    let status: FixStatus = "same";
    if (lc + ec < 3) status = "same"; // too few reviews to call a trend
    else if (ec === 0 && lc > 0) status = "new";
    else if (lc === 0 && ec > 0) status = "gone";
    else if (diff >= 0.04) status = "worse";
    else if (diff <= -0.04) status = "better";
    return { category, label: CATEGORY_INFO[category].label, latestCount: lc, earlierCount: ec, latestShare: ls, earlierShare: es, diff, status };
  });
  const order: FixStatus[] = ["new", "worse", "same", "better", "gone"];
  rows.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || b.latestShare - a.latestShare);
  return {
    latest: latest.version,
    latestTotal: latestReviews.length,
    earlierTotal: earlierReviews.length,
    earlierVersions: versions.length - 1,
    lowSample: latestReviews.length < 20 || earlierReviews.length < 20,
    rows,
  };
}

/* ---------- Churn & competitor signals ---------- */

const COMPETITORS: { name: string; re: RegExp }[] = [
  ["Blinkit", /\bblink ?it\b|\bgrofers\b/],
  ["Zepto", /\bzepto\b/],
  ["Instamart", /\binstamart\b/],
  ["Swiggy", /\bswiggy\b/],
  ["Zomato", /\bzomato\b/],
  ["BigBasket", /\bbig ?basket\b|\bbb now\b/],
  ["Flipkart", /\bflipkart\b|\bflip kart\b/],
  ["Amazon", /\bamazon\b/],
  ["JioMart", /\bjio ?mart\b/],
  ["Dunzo", /\bdunzo\b/],
  ["DMart", /\bd ?mart\b/],
  ["Meesho", /\bmeesho\b/],
  ["Myntra", /\bmyntra\b/],
  ["Ajio", /\bajio\b/],
  ["Nykaa", /\bnykaa\b/],
  ["PhonePe", /\bphone ?pe\b/],
  ["Paytm", /\bpaytm\b/],
  ["Google Pay", /\bgoogle ?pay\b|\bgpay\b|\bg pay\b/],
  ["CRED", /\bcred\b/],
  ["BHIM", /\bbhim\b/],
  ["MobiKwik", /\bmobikwik\b/],
  ["Ola", /\bola\b(?! ?electric)/],
  ["Uber", /\buber\b/],
  ["Rapido", /\brapido\b/],
  ["Magicpin", /\bmagic ?pin\b/],
  ["Licious", /\blicious\b/],
  ["Groww", /\bgroww\b/],
  ["Zerodha", /\bzerodha\b|\bkite\b/],
  ["Upstox", /\bupstox\b/],
  ["Urban Company", /\burban ?company\b|\burbanclap\b/],
].map(([name, re]) => ({ name: name as string, re: re as RegExp }));

const CHURN = [
  /\buninstall(ed|ing)?\b/,
  /\bdelet(e|ed|ing) (the |this )?app\b/,
  /\bswitch(ed|ing)? (to|back)\b/,
  /\bmov(e|ed|ing) (to|back)\b/,
  /\bgo(ing)? back to\b/,
  /\bnever (order|use|buy|shop|again|recommend)/,
  /\bnot (going to|gonna) (use|order)/,
  /\blast (time|order)\b/,
  /\b(good ?)?bye\b/,
  /\binstead\b/,
  /\bbetter than\b/,
  /\bdobara nahi\b|\bkabhi nahi\b|\bchhod (diya|dunga|denge)\b|\bband kar (diya|dunga)\b/,
  /अनइंस्टॉल|कभी नहीं|छोड़/,
];

export function churnSignals(reviews: LabeledReview[], appTitle: string) {
  const own = appTitle.toLowerCase();
  const competitors = COMPETITORS.filter((c) => !c.re.test(own));
  const churn = reviews.filter((r) => r.sentiment !== "positive" && CHURN.some((re) => re.test(r.text.toLowerCase())));
  const byComp = competitors
    .map((c) => {
      const hits = reviews.filter((r) => c.re.test(r.text.toLowerCase()));
      const negative = hits.filter((r) => r.sentiment === "negative");
      return {
        name: c.name,
        mentions: hits.length,
        negative: negative.length,
        positive: hits.filter((r) => r.sentiment === "positive").length,
        quoteIds: [...negative, ...hits.filter((r) => r.sentiment !== "negative")].slice(0, 4).map((r) => r.id),
      };
    })
    .filter((c) => c.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions);
  const negatives = reviews.filter((r) => r.sentiment === "negative").length;
  return {
    churn: churn.sort((a, b) => b.thumbsUp - a.thumbsUp || b.date.localeCompare(a.date)),
    churnShareOfNegative: negatives ? churn.length / negatives : 0,
    competitors: byComp,
    mentionReviews: new Set(byComp.flatMap((c) => reviews.filter((r) => COMPETITORS.find((x) => x.name === c.name)!.re.test(r.text.toLowerCase())).map((r) => r.id))).size,
  };
}

/* ---------- Words behind 1★ vs 5★ ---------- */

const STOP = new Set(
  (
    "a an the and or but if of to in on at for from by with without is are was were be been being am i me my we our you your he she it its they them their this that these those there here what which who whom how why when where all any both each few more most other some such no nor not only own same so than too very can will just should now also as do does did done have has had having get got app apps application please pls plz ok okay one two even still really much many like dont don't im i'm it's its ive i've its u ur" +
    " hai hain ho hota hoti tha thi the ka ki ke ko se me mein mai main par pe bhi aur ya to toh jo ye yeh wo woh is us iss uss kya kar karo karna kiya kiye raha rahi rahe hu hoon hun ek koi sab bhai ji"
  ).split(/\s+/),
);

function tokens(text: string, own: Set<string>): string[] {
  return (text.toLowerCase().match(/[a-z]+|[ऀ-ॿ]+/g) ?? []).filter((w) => w.length > 1 && !own.has(w));
}

export interface Phrase {
  phrase: string;
  neg: number;
  pos: number;
  score: number;
}

/** Phrases most distinctive of 1–2★ reviews vs 4–5★ reviews (smoothed log-odds). */
export function phraseContrast(reviews: LabeledReview[], appTitle: string) {
  const own = new Set(appTitle.toLowerCase().match(/[a-z]+/g) ?? []);
  const count = (list: LabeledReview[]) => {
    const df = new Map<string, number>();
    for (const r of list) {
      const t = tokens(r.text, own);
      const grams = new Set<string>();
      for (let i = 0; i < t.length; i++) {
        if (!STOP.has(t[i]) && t[i].length > 2) grams.add(t[i]);
        if (i + 1 < t.length && !(STOP.has(t[i]) && STOP.has(t[i + 1]))) {
          if (!STOP.has(t[i]) || !STOP.has(t[i + 1])) grams.add(`${t[i]} ${t[i + 1]}`);
        }
      }
      for (const g of grams) df.set(g, (df.get(g) ?? 0) + 1);
    }
    return df;
  };
  const negList = reviews.filter((r) => r.rating <= 2);
  const posList = reviews.filter((r) => r.rating >= 4);
  const neg = count(negList);
  const pos = count(posList);
  const all = new Set([...neg.keys(), ...pos.keys()]);
  const nN = Math.max(1, negList.length);
  const nP = Math.max(1, posList.length);
  const rows: Phrase[] = [];
  for (const g of all) {
    const a = neg.get(g) ?? 0;
    const b = pos.get(g) ?? 0;
    if (a + b < 3) continue;
    // Bigrams that are mostly stopwords ("is not") are noise unless frequent.
    const parts = g.split(" ");
    if (parts.length === 2 && parts.some((p) => STOP.has(p)) && a + b < 5) continue;
    const score = Math.log((a + 0.5) / (nN + 1)) - Math.log((b + 0.5) / (nP + 1));
    rows.push({ phrase: g, neg: a, pos: b, score });
  }
  const pick = (list: Phrase[]) => {
    const out: Phrase[] = [];
    for (const p of list) {
      // Skip a single word already covered by a chosen phrase with similar counts.
      if (out.some((o) => o.phrase.split(" ").includes(p.phrase) || p.phrase.split(" ").every((w) => o.phrase.includes(w)))) continue;
      out.push(p);
      if (out.length === 10) break;
    }
    return out;
  };
  return {
    negative: pick(rows.filter((r) => r.score > 0.4 && r.neg >= 2).sort((a, b) => b.score * Math.sqrt(b.neg) - a.score * Math.sqrt(a.neg))),
    positive: pick(rows.filter((r) => r.score < -0.4 && r.pos >= 2).sort((a, b) => a.score * Math.sqrt(a.pos) - b.score * Math.sqrt(b.pos))),
  };
}

/* ---------- Language × topic ---------- */

export function langTopicMatrix(reviews: LabeledReview[]) {
  const complaints = reviews.filter((r) => isComplaint(r) && r.category !== "other");
  const langCount = new Map<Lang, number>();
  for (const r of reviews) langCount.set(r.lang, (langCount.get(r.lang) ?? 0) + 1);
  const langs = [...langCount.entries()].filter(([l, c]) => l !== "other" && c >= 5).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([l]) => l);
  const catCount = new Map<Category, number>();
  for (const r of complaints) catCount.set(r.category, (catCount.get(r.category) ?? 0) + 1);
  const cats = [...catCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c);
  const cells = cats.map((c) =>
    langs.map((l) => {
      const total = langCount.get(l) ?? 1;
      const count = complaints.filter((r) => r.lang === l && r.category === c).length;
      return { count, share: count / total };
    }),
  );
  const max = Math.max(0.01, ...cells.flat().map((x) => x.share));
  return { langs: langs.map((l) => ({ lang: l, label: LANG_LABEL[l], total: langCount.get(l) ?? 0 })), cats, cells, max };
}

/* ---------- Reply performance ---------- */

export function replyStats(reviews: LabeledReview[]) {
  const byStar = ([1, 2, 3, 4, 5] as const).map((star) => {
    const list = reviews.filter((r) => Math.round(r.rating) === star);
    const replied = list.filter((r) => r.replied).length;
    return { star, total: list.length, replied, rate: list.length ? replied / list.length : 0 };
  });
  const hours = reviews.map((r) => r.replyHours).filter((h): h is number => typeof h === "number").sort((a, b) => a - b);
  const median = hours.length ? hours[Math.floor(hours.length / 2)] : null;
  const unansweredNegative = reviews.filter((r) => r.sentiment === "negative" && !r.replied);
  return { byStar, medianHours: median, unansweredNegative };
}

/* ---------- Product & marketing pulls ---------- */

export function featureRequests(reviews: LabeledReview[]) {
  return reviews
    .filter((r) => r.category === "feature_request")
    .sort((a, b) => b.thumbsUp - a.thumbsUp || b.date.localeCompare(a.date))
    .slice(0, 8);
}

export function testimonials(reviews: LabeledReview[]) {
  return reviews
    .filter((r) => r.rating === 5 && r.sentiment === "positive" && r.text.length >= 40 && r.text.length <= 400)
    .sort((a, b) => b.thumbsUp - a.thumbsUp || b.text.length - a.text.length)
    .slice(0, 6);
}

export function mostUpvotedComplaints(reviews: LabeledReview[]) {
  return reviews
    .filter((r) => r.sentiment === "negative" && r.thumbsUp > 0)
    .sort((a, b) => b.thumbsUp - a.thumbsUp)
    .slice(0, 5);
}

/* ---------- Shareable digest ---------- */

export function slackDigest(data: Analysis, url: string) {
  const { app, stats } = data;
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const wf = ratingWaterfall(data.reviews);
  const churn = churnSignals(data.reviews, app.title);
  const lines = [
    `*${app.title}: review pulse* (${stats.total} latest reviews, ${app.store === "play" ? "Google Play" : "App Store"} India)`,
    `• Negative: ${pct(stats.negativeShare)} · Recent rating ★${stats.sampleAvgRating.toFixed(2)} (all-time ★${app.rating.toFixed(2)})`,
    `• Rating left on the table: +${(wf.potential - wf.actual).toFixed(2)}★ if complaints were fixed`,
    ...data.insights.slice(0, 3).map((i, n) => `${n + 1}. *${i.title}*: ${i.action}`),
  ];
  const spike = stats.versions.find((v) => v.spike);
  if (spike) lines.push(`• ⚠ v${spike.version} shows a spike in negative reviews`);
  if (churn.churn.length) lines.push(`• Churn risk: ${churn.churn.length} reviews say they're leaving${churn.competitors[0] ? ` (most-mentioned rival: ${churn.competitors[0].name})` : ""}`);
  lines.push(`Full report: ${url}`);
  return lines.join("\n");
}
