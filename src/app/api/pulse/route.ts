import { sharedCache } from "@/lib/counters";
import { computePulse, type PulseRow } from "@/lib/pulse";

export const maxDuration = 60;

export async function GET() {
  const cache = sharedCache();
  let data = (await cache.get("pulse:board:v1").catch(() => null)) as { at: string; rows: PulseRow[] } | null;
  if (!data) {
    data = { at: new Date().toISOString(), rows: await computePulse() };
    if (data.rows.length) await cache.set("pulse:board:v1", data, { ttl: 6 * 3600, name: "raay-pulse-board" }).catch(() => {});
  }
  return Response.json(data, {
    headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
  });
}
