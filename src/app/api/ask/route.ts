import type { NextRequest } from "next/server";
import { checkAllowance } from "@/lib/entitlements";
import { aiEnabled, askWithClaude } from "@/lib/claude";
import { fetchAppCached } from "@/lib/stores";
import type { Store } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!aiEnabled()) return Response.json({ error: "Ask Raay needs an Anthropic API key on the server." }, { status: 503 });
  const body = await req.json().catch(() => null);
  const store = body?.store as Store;
  const id = String(body?.id ?? "");
  const question = String(body?.question ?? "").trim().slice(0, 300);
  const history = Array.isArray(body?.history)
    ? body.history
        .slice(-3)
        .map((h: { q?: unknown; a?: unknown }) => ({ q: String(h?.q ?? "").slice(0, 300), a: String(h?.a ?? "").slice(0, 1500) }))
    : [];
  if ((store !== "play" && store !== "ios") || !/^[\w.]{3,200}$/.test(id) || question.length < 3) {
    return Response.json({ error: "Ask a question about a specific app." }, { status: 400 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const allowance = await checkAllowance("question", ip);
  if (!allowance.ok) {
    const message = {
      login: "You've used today's free questions. Sign in to keep asking.",
      upgrade: "You've used today's free questions. Pick a plan to keep asking.",
      quota: "You've used this month's questions on your plan. Upgrade to keep asking.",
      busy: "Today's free questions are used up. Please come back tomorrow.",
    }[allowance.gate];
    return Response.json({ error: message, gate: allowance.gate }, { status: 402 });
  }
  try {
    const { app, reviews } = await fetchAppCached(store, id);
    const result = await askWithClaude(app, reviews, question, history);
    return Response.json(result);
  } catch (err) {
    console.error("[raay] ask failed:", err);
    return Response.json({ error: "Couldn't answer that right now. Please try again." }, { status: 502 });
  }
}
