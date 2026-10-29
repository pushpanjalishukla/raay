// Plan definitions shared by the server (limits) and the UI (pricing).
export type PlanKey = "starter" | "growth";

export const FREE_LIMITS = {
  /** Fresh AI reports per day for visitors without a paid plan (cached reports are always free). */
  report: Number(process.env.NEXT_PUBLIC_FREE_REPORTS_PER_DAY ?? 3),
  /** Ask Raay questions per day for visitors without a paid plan. */
  question: Number(process.env.NEXT_PUBLIC_FREE_QUESTIONS_PER_DAY ?? 5),
};

export const PLANS: Record<
  PlanKey,
  { name: string; price: number; tagline: string; limits: { report: number; question: number }; features: string[] }
> = {
  starter: {
    name: "Starter",
    price: 2999,
    tagline: "For one app team tracking its rivals",
    limits: { report: 150, question: 1000 },
    features: [
      "150 fresh AI reports a month",
      "1,000 Ask Raay questions a month",
      "Churn & rival tracking",
      "Release verdicts & rating waterfall",
      "CSV, PDF & Slack digest exports",
    ],
  },
  growth: {
    name: "Growth",
    price: 9999,
    tagline: "For product, support & growth teams",
    limits: { report: 600, question: 5000 },
    features: [
      "600 fresh AI reports a month",
      "5,000 Ask Raay questions a month",
      "Everything in Starter",
      "Priority analysis queue",
      "Early access to alerts & API",
    ],
  },
};

export const isPlanKey = (v: unknown): v is PlanKey => v === "starter" || v === "growth";
