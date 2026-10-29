export type Store = "play" | "ios";

export const CATEGORY_KEYS = [
  "bug_crash",
  "performance",
  "login_account",
  "payment_refund",
  "delivery_service",
  "customer_support",
  "pricing_charges",
  "ux_design",
  "ads_notifications",
  "trust_fraud",
  "feature_request",
  "praise",
  "other",
] as const;
export type Category = (typeof CATEGORY_KEYS)[number];

export const LANG_KEYS = [
  "english",
  "hinglish",
  "hindi",
  "marathi",
  "tamil",
  "telugu",
  "kannada",
  "malayalam",
  "bengali",
  "gujarati",
  "punjabi",
  "other",
] as const;
export type Lang = (typeof LANG_KEYS)[number];

export type Sentiment = "positive" | "neutral" | "negative";

export interface AppMeta {
  id: string;
  store: Store;
  title: string;
  developer: string;
  icon: string;
  rating: number;
  ratingsCount: number;
  installs?: string;
  version?: string;
  genre?: string;
  url: string;
}

export interface RawReview {
  id: string;
  rating: number;
  text: string;
  date: string;
  version?: string;
  thumbsUp: number;
  replied: boolean;
  /** Hours between the review and the developer's reply (Play Store only). */
  replyHours?: number;
}

export interface LabeledReview extends RawReview {
  category: Category;
  sentiment: Sentiment;
  lang: Lang;
  /** One-line English summary (AI mode, non-praise reviews). */
  gist?: string;
  severity: 1 | 2 | 3;
}

export interface Insight {
  title: string;
  detail: string;
  category: Category;
  count: number;
  action: string;
  quoteIds: string[];
}

export interface VersionStat {
  version: string;
  total: number;
  negative: number;
  negShare: number;
  topIssue: Category | null;
  topIssueCount: number;
  spike: boolean;
}

export interface Stats {
  total: number;
  sampleAvgRating: number;
  negativeShare: number;
  replyRate: number;
  ratingDist: Record<1 | 2 | 3 | 4 | 5, number>;
  /** Negative + neutral reviews per category, sorted desc. */
  issues: { category: Category; count: number; share: number }[];
  langs: { lang: Lang; count: number; share: number }[];
  versions: VersionStat[];
  days: { day: string; count: number; avgRating: number }[];
  firstDate: string;
  lastDate: string;
}

export interface ReplyDraft {
  reviewId: string;
  reply: string;
}

export interface Analysis {
  app: AppMeta;
  generatedAt: string;
  engine: "claude" | "lexicon" | "hybrid";
  /** Whether the server has AI configured (Ask Raay works even if this report used the built-in classifier). */
  aiAvailable?: boolean;
  /** Set when the report was downgraded for one visitor only; never cache it for others. */
  personal?: boolean;
  /** Why AI was withheld for this visitor: sign in, upgrade, monthly quota used, or site-wide cap. */
  gate?: "login" | "upgrade" | "quota" | "busy";
  model?: string;
  note?: string;
  summary: string;
  insights: Insight[];
  replies: ReplyDraft[];
  stats: Stats;
  reviews: LabeledReview[];
}
