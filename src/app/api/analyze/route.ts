import type { NextRequest } from "next/server";
import { analyze } from "@/lib/analyze";
import { overLimit, tooMany, validAppRef, visitorId } from "@/lib/visitor";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store");
  const id = req.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!validAppRef(store, id)) {
    return Response.json({ error: "That doesn't look like a valid app link or id." }, { status: 400 });
  }
  const ip = await visitorId(req);
  // Requests only reach here on a CDN miss; cap how fast one visitor can trigger fresh fetches.
  if (await overLimit("analyze", ip, 40, 600)) return tooMany();
  try {
    const data = await analyze(store, id, ip);
    const ttl = data.engine === "lexicon" ? 1800 : 21600;
    return Response.json(data, {
      headers: {
        "Cache-Control": data.personal ? "private, no-store" : `public, s-maxage=${ttl}, stale-while-revalidate=86400`,
      },
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
