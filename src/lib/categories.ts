import type { Category, Lang } from "./types";

export const CATEGORY_INFO: Record<
  Category,
  { label: string; hint: string; action: string }
> = {
  bug_crash: {
    label: "Bugs & crashes",
    hint: "App crashes, errors, features not working",
    action: "Reproduce on the flagged versions and ship a hotfix; reply to affected users once fixed.",
  },
  performance: {
    label: "Slow & laggy",
    hint: "Loading time, lag, battery, app size",
    action: "Profile cold-start and key screens on low-end Android devices common in India.",
  },
  login_account: {
    label: "Login, OTP & account",
    hint: "OTP not arriving, KYC, blocked accounts",
    action: "Audit the OTP provider's delivery rate by telecom operator and add a fallback (voice/WhatsApp OTP).",
  },
  payment_refund: {
    label: "Payments & refunds",
    hint: "Money deducted, failed UPI, refund delays",
    action: "Publish a refund SLA in-app and auto-notify users when a failed payment is reversed.",
  },
  delivery_service: {
    label: "Orders & delivery",
    hint: "Late, cancelled, wrong or damaged orders, availability",
    action: "Break complaints down by city/pincode and share with ops; flag the worst dark stores or partners.",
  },
  customer_support: {
    label: "Customer support",
    hint: "No response, bots, unresolved tickets",
    action: "Add a human escalation path from the bot and track first-response time on review-linked tickets.",
  },
  pricing_charges: {
    label: "Pricing & hidden fees",
    hint: "Platform fees, surge, high prices",
    action: "Show every fee before checkout; test removing or capping the fee users mention most.",
  },
  ux_design: {
    label: "UX & design",
    hint: "Confusing flows, missing options",
    action: "Run 5 quick usability calls on the flow users name; fix the top friction point first.",
  },
  ads_notifications: {
    label: "Ads & spam",
    hint: "Too many ads, notifications, promo calls",
    action: "Cap promotional notifications per week and add an easy opt-out by category.",
  },
  trust_fraud: {
    label: "Fraud & trust",
    hint: "Users calling the app a scam or fraud",
    action: "Treat as urgent: trace each case, respond publicly with resolution steps, and fix root causes.",
  },
  feature_request: {
    label: "Feature requests",
    hint: "New features, cities, options users ask for",
    action: "Log requests to the roadmap with counts; tell users when a requested feature ships.",
  },
  praise: {
    label: "Praise",
    hint: "Happy users",
    action: "Prompt these users for referrals or ratings at the right moment.",
  },
  other: {
    label: "Other",
    hint: "Uncategorised feedback",
    action: "Review manually.",
  },
};

export const LANG_LABEL: Record<Lang, string> = {
  english: "English",
  hinglish: "Hinglish",
  hindi: "Hindi",
  marathi: "Marathi",
  tamil: "Tamil",
  telugu: "Telugu",
  kannada: "Kannada",
  malayalam: "Malayalam",
  bengali: "Bengali",
  gujarati: "Gujarati",
  punjabi: "Punjabi",
  other: "Other",
};
