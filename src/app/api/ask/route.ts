import type { NextRequest } from "next/server";
import { checkAllowance } from "@/lib/entitlements";
import { aiEnabled, askWithClaude } from "@/lib/claude";
import { FREE_LIMITS } from "@/lib/plans";
import { fetchAppCached } from "@/lib/stores";
import { overLimit, tooMany, tryAcquire, validAppRef, visitorId } from "@/lib/visitor";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!aiEnabled()) return Response.json({ error: "Ask Raay needs an Anthropic API key on the server." }, { status: 503 });
  const body = await req.json().catch(() => null);
  const store = body?.store;
  const id = String(body?.id ?? "");
  const question = String(body?.question ?? "").trim().slice(0, 300);
  const history = Array.isArray(body?.history)
    ? body.history
        .slice(-3)
        .map((h: { q?: unknown; a?: unknown }) => ({ q: String(h?.q ?? "").slice(0, 300), a: String(h?.a ?? "").slice(0, 1500) }))
    : [];
  if (!validAppRef(store, id) || question.length < 3) {
    return Response.json({ error: "Ask a question about a specific app." }, { status: 400 });
  }
  const ip = await visitorId(req);
  if (await overLimit("ask", ip, 20, 600)) return tooMany();
  const allowance = await checkAllowance("question", ip);
  if (!allowance.ok) {
    const message = {
      login: `Sign in to ask Raay. Every account gets ${FREE_LIMITS.question} free questions.`,
      upgrade: `You've used your ${FREE_LIMITS.question} free questions. Pick a plan to keep asking.`,
      quota: "You've used this month's questions on your plan. Upgrade to keep asking.",
      busy: "Free questions are at capacity right now. Please try again later.",
    }[allowance.gate];
    return Response.json({ error: message, gate: allowance.gate }, { status: 402 });
  }
  const release = tryAcquire("ask", Number(process.env.RAAY_MAX_CONCURRENT_ASK ?? 6));
  if (!release) return Response.json({ error: "Raay is busy answering other questions. Please try again in a moment." }, { status: 503 });
  try {
    const { app, reviews } = await fetchAppCached(store, id);
    const result = await askWithClaude(app, reviews, question, history);
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[raay] ask failed:", err);
    return Response.json({ error: "Couldn't answer that right now. Please try again." }, { status: 502 });
  } finally {
    release();
  }
}
