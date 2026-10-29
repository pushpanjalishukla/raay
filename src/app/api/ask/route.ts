import type { NextRequest } from "next/server";
import { bump } from "@/lib/analyze";
import { aiEnabled, askWithClaude } from "@/lib/claude";
import { fetchAppCached } from "@/lib/stores";
import type { Store } from "@/lib/types";

export const maxDuration = 120;

// Per-visitor and global daily limits on questions so the public site can't
// drain the API budget. Counters live in Vercel Runtime Cache (shared by all instances).
const PER_HOUR = Number(process.env.RAAY_ASK_PER_IP_PER_HOUR ?? 15);
const PER_DAY = Number(process.env.RAAY_ASK_DAILY_LIMIT ?? 300);
async function allow(ip: string): Promise<"ok" | "ip" | "day"> {
  const hour = Math.floor(Date.now() / 3_600_000);
  if ((await bump(`ask-ip:${ip}:${hour}`, 3600)) > PER_HOUR) return "ip";
  if ((await bump(`ask-day:${new Date().toISOString().slice(0, 10)}`, 2 * 86400)) > PER_DAY) return "day";
  return "ok";
}

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
  const ok = await allow(ip);
  if (ok !== "ok")
    return Response.json(
      { error: ok === "ip" ? "You've hit the question limit for this hour. Try again later." : "Today's free questions are used up. Please come back tomorrow." },
      { status: 429 },
    );
  try {
    const { app, reviews } = await fetchAppCached(store, id);
    const result = await askWithClaude(app, reviews, question, history);
    return Response.json(result);
  } catch (err) {
    console.error("[raay] ask failed:", err);
    return Response.json({ error: "Couldn't answer that right now. Please try again." }, { status: 502 });
  }
}
