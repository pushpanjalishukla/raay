export const BRAND = {
  name: "Raay",
  native: "राय",
  tagline: "Your users already told you what to fix.",
  description:
    "Raay reads every Play Store and App Store review of your app and your competitors', in Hinglish, Hindi, Tamil or English, and turns them into a ranked fix list, bad-release alerts and replies in each user's own language.",
  github: "https://github.com/pushpanjalishukla/raay",
  author: "pushpanjalishukla",
  authorUrl: "https://github.com/pushpanjalishukla",
  /** Public contact link for "Talk to us" buttons. Leave empty to hide them. */
  contactUrl: process.env.NEXT_PUBLIC_CONTACT_URL ?? "",
};

export const SAMPLE_APPS = [
  { store: "play", id: "com.zeptoconsumerapp", name: "Zepto", icon: "https://play-lh.googleusercontent.com/jrtmMFv4qjtgMPQeaQzUFZ3EYBkHd_8OFYl6O1Ngt5Pey52RJAR4u8K4IoPILkJz76a7s5U3DNaY3r3xnl7t8X4" },
  { store: "play", id: "com.grofers.customerapp", name: "Blinkit", icon: "https://play-lh.googleusercontent.com/dY1ryTjOaVsnslxvNamNvSBulmDUkvW5f5FJ_HDApMfecSOIxjCafpNAv4LTG8TJVyp0XR9tAAaRI4K77Eiqfg" },
  { store: "play", id: "in.swiggy.android", name: "Swiggy", icon: "https://play-lh.googleusercontent.com/FJ5W5ygiN-DYfpd2-3LqyN5F-OxDtQ7z_9v5nAeD4vOrN8kQitoOwULactKgKvktXowVEM491wE-unmGmnt8OWM" },
  { store: "play", id: "com.phonepe.app", name: "PhonePe", icon: "https://play-lh.googleusercontent.com/ARGoCZk-5QCKPpyTsGhn1WahhPbVMa95T1U7clwnI8gjtW-YNY96rAANqFkuENbU35IbYF2Gjg2UjZXA495x0A" },
  { store: "play", id: "net.one97.paytm", name: "Paytm", icon: "https://play-lh.googleusercontent.com/WDGsMRuVENnZPEpV4DEaXw12qtMY3em85xpmZqcXzeh0iT_eXFtAU9VUj-Z7xNQQd5DMqrkKSs9D0qbI1rlt" },
  { store: "play", id: "com.meesho.supply", name: "Meesho", icon: "https://play-lh.googleusercontent.com/lQrsRJ7PT25f2J8n14Zp4j0695_2NIpIUEQpG6bEuljhk7oJ8q_GeA5iYgWm1DiDq0WFPBWP4iaJcXi4XPwoWCk" },
] as const;

export const SAMPLE_COMPARE = "play:com.zeptoconsumerapp,play:com.grofers.customerapp,play:com.bigbasket.mobileapp";
