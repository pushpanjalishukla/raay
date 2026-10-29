// Privacy-preserving visitor identity for usage limits.
// - The IP comes from Vercel's own x-real-ip header (clients can't spoof it).
// - It is never stored: we keep only an HMAC with a secret that rotates daily,
//   so counters can't be traced back to a person or linked across days.
import { createHmac, randomBytes } from "node:crypto";
import { ipAddress } from "@vercel/functions";
import { bump, sharedCache } from "./counters";

async function dailySecret(): Promise<string> {
  const day = new Date().toISOString().slice(0, 10);
  // Derive the daily secret from a server-only secret so it survives cache evictions
  // (if it changed per request, every visitor would look new and limits would stop working).
  const base = process.env.RAAY_HASH_SALT || process.env.ANTHROPIC_API_KEY || process.env.CLERK_SECRET_KEY;
  if (base) return createHmac("sha256", base).update(`raay-visitor:${day}`).digest("hex");
  // Local development without secrets: a random per-day secret kept in cache.
  const key = `salt:${day}`;
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

// In-memory counters are atomic within one server instance (single-threaded JS);
// they backstop the shared, approximate counters against bursts of parallel requests.
const local = new Map<string, number>();
export function localBump(key: string): number {
  const n = (local.get(key) ?? 0) + 1;
  local.set(key, n);
  if (local.size > 5000) local.clear();
  return n;
}

/** Limits how many expensive jobs run at once in this instance. */
const running = new Map<string, number>();
export function tryAcquire(name: string, max: number): (() => void) | null {
  const n = running.get(name) ?? 0;
  if (n >= max) return null;
  running.set(name, n + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    running.set(name, Math.max(0, (running.get(name) ?? 1) - 1));
  };
}

/** Fixed-window rate limit. Returns true when the caller is over the limit. */
export async function overLimit(name: string, who: string, max: number, windowSeconds: number): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `rl:${name}:${who}:${bucket}`;
  if (localBump(key) > max) return true;
  return (await bump(key, windowSeconds)) > max;
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
