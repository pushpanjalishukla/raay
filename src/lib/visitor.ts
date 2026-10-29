// Privacy-preserving visitor identity for usage limits.
// - The IP comes from Vercel's own x-real-ip header (clients can't spoof it).
// - It is never stored: we keep only an HMAC with a secret that rotates daily,
//   so counters can't be traced back to a person or linked across days.
import { createHmac, randomBytes } from "node:crypto";
import { ipAddress } from "@vercel/functions";
import { bump, sharedCache } from "./counters";

async function dailySecret(): Promise<string> {
  if (process.env.RAAY_HASH_SALT) return `${process.env.RAAY_HASH_SALT}:${new Date().toISOString().slice(0, 10)}`;
  const key = `salt:${new Date().toISOString().slice(0, 10)}`;
  const cache = sharedCache();
  const existing = (await cache.get(key).catch(() => null)) as string | null;
  if (existing) return existing;
  const fresh = randomBytes(32).toString("hex");
  await cache.set(key, fresh, { ttl: 2 * 86400, name: "raay-salt" }).catch(() => {});
  return fresh;
}

export async function visitorId(req: Request): Promise<string> {
  const ip = ipAddress(req) ?? "local";
  return createHmac("sha256", await dailySecret()).update(ip).digest("hex").slice(0, 32);
}

/** Fixed-window rate limit. Returns true when the caller is over the limit. */
export async function overLimit(name: string, who: string, max: number, windowSeconds: number): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  return (await bump(`rl:${name}:${who}:${bucket}`, windowSeconds)) > max;
}

/** Strict app id formats: Play package names, numeric App Store ids. */
export function validAppRef(store: unknown, id: unknown): store is "play" | "ios" {
  if (typeof id !== "string" || id.length > 150) return false;
  if (store === "play") return /^[a-zA-Z][\w]*(\.[a-zA-Z_][\w]*)+$/.test(id);
  if (store === "ios") return /^\d{5,12}$/.test(id);
  return false;
}

export const tooMany = () =>
  Response.json({ error: "Too many requests. Please slow down and try again in a few minutes." }, { status: 429, headers: { "Retry-After": "120" } });
