// Free, offline classifier for English, Hinglish and Indic-script reviews.
// Used when no ANTHROPIC_API_KEY is configured, and as a fallback if a Claude call fails.
import type { Category, Lang, LabeledReview, RawReview, Sentiment } from "./types";

const KEYWORDS: Record<Exclude<Category, "other">, string[]> = {
  trust_fraud: [
    "fraud", "frod", "froud", "scam", "scammer", "cheat", "cheated", "cheating", "fake", "chor",
    "dhokha", "dhoka", "loot", "looting", "thief", "thieves", "धोखा", "फ्रॉड", "ठग", "चोर",
  ],
  payment_refund: [
    "payment", "refund", "refunded", "deducted", "debited", "money", "paisa kat", "paise kat",
    "paisa wapas", "paise wapas", "upi", "transaction", "cashback", "wallet", "charged twice",
    "amount", "gpay", "phonepe", "card", "emi", "pay", "paid", "भुगतान", "पैसे", "रिफंड",
  ],
  bug_crash: [
    "crash", "crashes", "crashing", "bug", "bugs", "glitch", "error", "not working", "doesn't work",
    "does not work", "isn't working", "not opening", "won't open", "wont open", "stuck", "freeze",
    "freezes", "blank screen", "white screen", "after update", "after the update", "kaam nahi",
    "chal nahi", "khul nahi", "khulta nahi", "band ho", "काम नहीं", "खुल नहीं", "बंद",
  ],
  login_account: [
    "login", "log in", "otp", "sign in", "signin", "password", "kyc", "verification", "verify",
    "logged out", "logout", "account blocked", "account block", "account deleted", "account suspended",
    "register", "signup", "sign up", "लॉगिन", "ओटीपी", "केवाईसी",
  ],
  delivery_service: [
    "delivery", "delivered", "deliver", "late", "order", "orders", "cancelled", "canceled", "cancel",
    "wrong item", "missing", "damaged", "expired", "rotten", "spoiled", "stale", "quality", "packaging",
    "rider", "delivery boy", "delivery partner", "out of stock", "not available", "my area",
    "pincode", "pin code", "service area", "der se", "nahi aaya", "nahi mila", "ऑर्डर", "डिलीवरी",
    "delay", "delayed", "wrong product", "fresh", "product", "products", "item", "items", "return",
    "replace", "replacement", "exchange", "mangaya", "mangwaya", "saman", "packet", "leak", "पैकेट",
    "क्वालिटी", "मिलावट", "सामान", "पुराने",
  ],
  customer_support: [
    "customer care", "customer service", "customer support", "support", "helpline", "no response",
    "not responding", "chatbot", "bot", "agent", "executive", "complaint", "ticket", "call",
    "koi response", "jawab nahi", "ग्राहक सेवा", "शिकायत",
  ],
  pricing_charges: [
    "price", "prices", "pricing", "expensive", "costly", "charges", "charge", "fee", "fees",
    "hidden", "handling fee", "platform fee", "delivery fee", "surge", "overpriced", "mehenga",
    "mehnga", "mahanga", "extra charge", "subscription", "membership", "gst", "महंगा", "चार्ज",
  ],
  performance: [
    "slow", "lag", "laggy", "lagging", "loading", "takes time", "battery", "heavy", "buffering",
    "dheere", "dhima", "load nahi", "hang", "hangs", "hanging", "धीमा",
  ],
  ads_notifications: [
    "ads", "advertisement", "advertisements", "notification", "notifications", "spam", "sms",
    "promotional", "popup", "pop up", "pop-up", "विज्ञापन",
  ],
  ux_design: [
    "ui", "interface", "design", "confusing", "difficult to use", "hard to use", "navigation", "font",
    "dark mode", "layout", "user friendly", "complicated", "samajh nahi", "button", "option nahi",
    "language", "भाषा",
  ],
  feature_request: [
    "please add", "pls add", "plz add", "add option", "add feature", "should add", "would be nice",
    "wish", "kindly add", "need option", "please start", "start service", "start delivery",
    "please provide", "feature", "suggestion", "suggest", "hona chahiye", "add karo", "add kijiye",
  ],
  praise: [
    "good", "great", "excellent", "awesome", "amazing", "best", "nice", "love", "superb", "fantastic",
    "helpful", "easy", "smooth", "badhiya", "badiya", "mast", "zabardast", "accha", "achha", "acha",
    "shandar", "बढ़िया", "अच्छा", "शानदार",
  ],
};

// Strong negative words that override a high star rating (users often tap 5 stars by mistake).
const NEGATIVE_WORDS = [
  "worst", "bakwas", "bkwas", "bekar", "bekaar", "ghatiya", "faltu", "ganda", "kharab", "useless",
  "pathetic", "horrible", "terrible", "very bad", "not working", "refund", "fraud", "scam",
  "बेकार", "घटिया", "खराब", "बकवास",
].map((w) => (/^[\x00-\x7F]+$/.test(w) ? new RegExp(`(^|[^a-z])${w}($|[^a-z])`) : new RegExp(w)));

// Priority when several categories match a complaint: most damaging first.
const PRIORITY: Exclude<Category, "other" | "praise">[] = [
  "trust_fraud",
  "payment_refund",
  "bug_crash",
  "login_account",
  "delivery_service",
  "customer_support",
  "pricing_charges",
  "performance",
  "ads_notifications",
  "ux_design",
  "feature_request",
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isLatin = (s: string) => /^[\x00-\x7F]+$/.test(s);
const MATCHERS = Object.fromEntries(
  Object.entries(KEYWORDS).map(([cat, words]) => [
    cat,
    words.map((w) =>
      isLatin(w) ? new RegExp(`(^|[^a-z])${escape(w)}($|[^a-z])`) : new RegExp(escape(w)),
    ),
  ]),
) as Record<Exclude<Category, "other">, RegExp[]>;

const HINGLISH_STRONG = new Set([
  "nahi", "nahin", "nhi", "bahut", "bohot", "bhut", "bakwas", "bkwas", "bekar", "bekaar", "accha",
  "achha", "acha", "kya", "kyu", "kyun", "mujhe", "muje", "hai", "hain", "chahiye", "paisa", "paise",
  "ghatiya", "faltu", "badhiya", "badiya", "raha", "rahi", "gaya", "gya", "kar", "karo", "karte",
  "diya", "liya", "wala", "wali", "bhai", "yaar", "abhi", "bilkul", "ekdum", "lekin", "kuch", "koi",
  "mera", "meri", "mere", "hota", "hoti", "tha", "thi", "sahi", "jaldi", "bhi", "aur", "nahi hai",
]);

export function detectLang(text: string): Lang {
  if (/[ऀ-ॿ]/.test(text)) {
    // Marathi markers; otherwise default Devanagari to Hindi.
    return /(आहे|नाही|आणि|खूप|मला)/.test(text) ? "marathi" : "hindi";
  }
  if (/[஀-௿]/.test(text)) return "tamil";
  if (/[ఀ-౿]/.test(text)) return "telugu";
  if (/[ಀ-೿]/.test(text)) return "kannada";
  if (/[ഀ-ൿ]/.test(text)) return "malayalam";
  if (/[ঀ-৿]/.test(text)) return "bengali";
  if (/[઀-૿]/.test(text)) return "gujarati";
  if (/[਀-੿]/.test(text)) return "punjabi";
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  if (!words.length) return "other";
  const hits = words.filter((w) => HINGLISH_STRONG.has(w)).length;
  if (hits >= 2 || (hits === 1 && words.length <= 6)) return "hinglish";
  return "english";
}

function sentimentFromRating(r: number): Sentiment {
  return r <= 2 ? "negative" : r === 3 ? "neutral" : "positive";
}

export function classify(review: RawReview): LabeledReview {
  const text = review.text.toLowerCase();
  const hits = (cat: Exclude<Category, "other">) =>
    MATCHERS[cat].reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);

  let category: Category = "other";
  const negativeText = NEGATIVE_WORDS.some((re) => re.test(text));
  if (review.rating >= 4 && !negativeText) {
    category = hits("feature_request") ? "feature_request" : "praise";
  } else {
    let best = 0;
    for (const cat of PRIORITY) {
      const h = hits(cat);
      if (h > best) {
        best = h;
        category = cat;
      }
    }
    if (category === "other" && review.rating === 3 && hits("praise")) category = "praise";
  }

  const sentiment: Sentiment =
    review.rating >= 3 && negativeText ? "negative" : sentimentFromRating(review.rating);
  const severe: Category[] = ["trust_fraud", "payment_refund", "bug_crash", "login_account"];
  const severity: 1 | 2 | 3 =
    review.rating === 1 && severe.includes(category) ? 3 : sentiment === "negative" ? 2 : 1;

  return { ...review, category, sentiment, lang: detectLang(review.text), severity };
}
