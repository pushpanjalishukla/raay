import { getFeatured } from "@/lib/featured";

// Reads caches only; never triggers a paid analysis.
export async function GET() {
  const snap = await getFeatured();
  return Response.json(snap ? { available: true, snap } : { available: false }, {
    headers: { "Cache-Control": `public, s-maxage=${snap ? 3600 : 300}, stale-while-revalidate=86400` },
  });
}
