import { getCache } from "@vercel/functions";

/** Shared across all function instances via Vercel Runtime Cache (in-memory locally). */
export const sharedCache = () => getCache({ namespace: "raay" });

/** Approximate counter: fine for budget guards and quotas, not for billing. */
export async function bump(key: string, ttl: number): Promise<number> {
  const cache = sharedCache();
  const n = Number((await cache.get(key).catch(() => 0)) ?? 0) + 1;
  await cache.set(key, n, { ttl, name: "raay-counter" }).catch(() => {});
  return n;
}
