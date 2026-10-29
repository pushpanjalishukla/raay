import type { NextRequest } from "next/server";
import { analyze } from "@/lib/analyze";
import type { Store } from "@/lib/types";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store") as Store | null;
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if ((store !== "play" && store !== "ios") || !id || !/^[\w.]{3,200}$/.test(id)) {
    return Response.json({ error: "Pass ?store=play|ios&id=<app id>" }, { status: 400 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  try {
    const data = await analyze(store, id, ip);
    const ttl = data.engine === "lexicon" ? 1800 : 21600;
    return Response.json(data, {
      headers: { "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=86400` },
    });
  } catch (err) {
    console.error("[raay] analyze failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    const notFound = /not found|404/i.test(message);
    return Response.json(
      { error: notFound ? "We couldn't find that app on the Indian store." : "Couldn't fetch reviews right now. Please try again." },
      { status: notFound ? 404 : 502 },
    );
  }
}
