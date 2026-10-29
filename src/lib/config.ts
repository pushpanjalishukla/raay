export const BRAND = {
  name: "Raay",
  native: "राय",
  tagline: "What your users really think, in every Indian language.",
  description:
    "Raay reads every Play Store and App Store review of your app and your competitors', in English, Hinglish, Hindi, Tamil and more. It turns them into the problems your team should fix this week, flags bad releases, and drafts replies in the user's own language.",
  github: "https://github.com/pushpanjalishukla/raay",
  author: "pushpanjalishukla",
  authorUrl: "https://github.com/pushpanjalishukla",
  /** Public contact link for "Talk to us" buttons. Leave empty to hide them. */
  contactUrl: process.env.NEXT_PUBLIC_CONTACT_URL ?? "",
};

export const SAMPLE_APPS = [
  { store: "play", id: "com.zeptoconsumerapp", name: "Zepto" },
  { store: "play", id: "com.grofers.customerapp", name: "Blinkit" },
  { store: "play", id: "in.swiggy.android", name: "Swiggy" },
  { store: "play", id: "com.phonepe.app", name: "PhonePe" },
  { store: "play", id: "com.dreamplug.androidapp", name: "CRED" },
  { store: "play", id: "com.meesho.supply", name: "Meesho" },
] as const;

export const SAMPLE_COMPARE = "play:com.zeptoconsumerapp,play:com.grofers.customerapp,play:com.bigbasket.mobileapp";
