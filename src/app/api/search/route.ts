import type { NextRequest } from "next/server";
import { parseAppRef, searchApps } from "@/lib/stores";
import { overLimit, tooMany, visitorId } from "@/lib/visitor";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ hits: [] });
  if (await overLimit("search", await visitorId(req), 90, 600)) return tooMany();
  const ref = parseAppRef(q);
  if (ref) return Response.json({ direct: ref, hits: [] });
  try {
    const hits = await searchApps(q.slice(0, 80));
    return Response.json({ hits }, { headers: { "Cache-Control": "public, s-maxage=3600" } });
  } catch (err) {
    console.error("[raay] search failed:", err);
    return Response.json({ hits: [], error: "Search failed" }, { status: 502 });
  }
}
