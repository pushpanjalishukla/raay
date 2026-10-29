# Raay (राय)

**App review intelligence for Indian apps.** Raay reads every Google Play and App Store review of your app and your competitors' (in English, Hinglish, Hindi, Tamil, Marathi and more) and turns them into the problems your team should fix this week. It flags bad releases and drafts replies in each user's own language.

**Live demo:** _coming with the first deploy_

## Why it exists

Indian consumer apps get thousands of reviews a week, and a large share are code-mixed Hinglish or written in Indian scripts. Existing review tools are priced in dollars and built for English. Pasting reviews into a chatbot gives you a one-off answer on a sample you picked by hand.

Raay fetches the data itself, labels every review, tracks complaint rates per release, and compares you against competitors.

## Features

- **Search any app** on Google Play or the App Store (India). No login and no SDK.
- **Multilingual labelling.** Each review gets a topic (payments, delivery, login/OTP, crashes, fraud…), a sentiment, a severity, a language and a one-line English summary.
- **"Fix these first" brief** with real quotes and a concrete action for each issue.
- **Release health.** Negative-review share per app version, with automatic spike detection.
- **Reply drafts** in the reviewer's own language and script (Hinglish to Hinglish, Hindi to Hindi).
- **Competitor comparison.** A heat table of complaint mix across up to 4 apps.
- **Review explorer.** Filter reviews by topic, language and sentiment.
- **Works without an API key.** A built-in English/Hinglish/Indic-script keyword classifier runs when no key is set. Claude takes over when `ANTHROPIC_API_KEY` is present.

## How it works

```
Google Play (google-play-scraper) ─┐
App Store RSS + iTunes lookup ─────┼─► fetch latest ~250 reviews (en + hi)
                                   │
                                   ▼
             ┌─────────────── Claude (structured outputs) ───────────────┐
             │ 1. label reviews in parallel chunks of 50                 │
             │    → category · sentiment · language · gist · severity    │
             │ 2. write the brief → insights · actions · reply drafts    │
             └───────── falls back to the built-in classifier ──────────┘
                                   │
                                   ▼
        stats: complaint mix · language mix · per-version spikes · trends
                                   │
                                   ▼
          cached 6h (in memory + Vercel CDN) → Next.js report UI
```

## Tech stack

- **Next.js 16** (App Router, route handlers) + **TypeScript** + **Tailwind CSS 4**
- **Claude API** via `@anthropic-ai/sdk`: structured outputs with Zod schemas, server-side refusal fallbacks
- **google-play-scraper** and Apple's public RSS/iTunes APIs for review data
- Deployed on **Vercel**

## Run locally

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY (optional)
npm run dev
```

Open http://localhost:3000 and search for any app.

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Turns on AI labelling, insights and reply drafts |
| `RAAY_MODEL` | No | Claude model ID (default `claude-opus-5-5`; `claude-haiku-5-5` is much cheaper) |
| `RAAY_AI_PER_IP_PER_HOUR` | No | Fresh AI analyses allowed per visitor per hour (default 5) |
| `NEXT_PUBLIC_CONTACT_URL` | No | Link for the "Talk to us" buttons (hidden when empty) |

## Business model

| Plan | Price | Includes |
|---|---|---|
| Free | ₹0 | Any public app, latest ~250 reviews, shareable report |
| Starter | ₹2,999/mo | Your app + 3 competitors, daily refresh & history, Slack/email digest |
| Growth | ₹9,999/mo | 10 apps, spike alerts, API & CSV export, custom categories |

## Roadmap

- [ ] Accounts and saved apps (Supabase)
- [ ] Daily refresh with Vercel Cron, plus a review history database
- [ ] Slack and email weekly digest, plus spike alerts
- [ ] Razorpay subscriptions
- [ ] Public "India App Pulse" monthly report (e.g. quick-commerce complaints by category)

---

Built by [@pushpanjalishukla](https://github.com/pushpanjalishukla).
