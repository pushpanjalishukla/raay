import { sharedCache } from "@/lib/counters";
import { computePulse, type PulseRow } from "@/lib/pulse";

export const maxDuration = 60;

type Board = { at: string; rows: PulseRow[] };
// One rebuild at a time per instance, so a burst of visitors can't trigger many scrapes.
let building: Promise<Board> | null = null;

async function rebuild(): Promise<Board> {
  const data = { at: new Date().toISOString(), rows: await computePulse() };
  if (data.rows.length) await sharedCache().set("pulse:board:v1", data, { ttl: 6 * 3600, name: "raay-pulse-board" }).catch(() => {});
  return data;
}

export async function GET() {
  let data = (await sharedCache().get("pulse:board:v1").catch(() => null)) as Board | null;
  if (!data) {
    building ??= rebuild().finally(() => {
      building = null;
    });
    data = await building;
  }
  return Response.json(data, {
    headers: {
      "Cache-Control": data.rows.length ? "public, s-maxage=21600, stale-while-revalidate=86400" : "public, s-maxage=60",
    },
  });
}
