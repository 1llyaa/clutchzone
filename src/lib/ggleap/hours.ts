/**
 * Pure helpers behind the ggLeap hours lookup.
 *
 * Everything here is deliberately free of `fetch` and of `process.env` so it can
 * be unit-tested — the networking lives in `./client`.
 */

/** Max lookups a single IP may make per `RATE_WINDOW_MS`. */
export const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

/** How long a nickname's lookup result is reused before ggLeap is asked again. */
const CACHE_TTL_MS = 60_000;
/** Hard cap on cached nicknames; the oldest entry is dropped past this. */
export const CACHE_MAX = 500;

export function secondsToMinutes(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.floor(raw / 60);
}

/**
 * Remaining play time on a ggLeap account.
 *
 * It deliberately does NOT come from `User.TimeRemaining`, which reads 0 even
 * for accounts that clearly have hours — this club sells time as GamePasses,
 * and `/users/gamepasses/list` is where that balance actually lives. Call it
 * with `IncludeInactive=false` so consumed and expired passes are already
 * filtered out server-side; the clamp below only guards against a pass whose
 * recorded usage overshoots its own total.
 */
export function sumRemainingSeconds(offers: unknown): number {
  if (!Array.isArray(offers)) return 0;
  return offers.reduce<number>((sum, offer) => {
    if (!offer || typeof offer !== 'object') return sum;
    const { Seconds, SecondsUsed } = offer as { Seconds?: unknown; SecondsUsed?: unknown };
    const total = typeof Seconds === 'number' && Number.isFinite(Seconds) ? Seconds : 0;
    const used = typeof SecondsUsed === 'number' && Number.isFinite(SecondsUsed) ? SecondsUsed : 0;
    return sum + Math.max(0, total - used);
  }, 0);
}

/**
 * ggLeap reports an unknown nickname as `400` with a body of
 * `{"Error":"User not found."}` rather than the `404` the status alone would
 * imply, so status-code matching alone misreports a typo'd nickname as an
 * outage. Verified against the live API on 2026-08-27.
 */
export function isUserNotFound(status: number, body: string): boolean {
  if (status === 404) return true;
  if (status !== 400) return false;
  return /not found/i.test(body);
}

const UNITS: Record<string, { h: string; m: string }> = {
  cs: { h: 'h', m: 'min' },
  en: { h: 'h', m: 'min' },
  de: { h: 'Std.', m: 'Min.' },
  ua: { h: 'год', m: 'хв' },
};

export function formatHours(minutes: number, locale: string): string {
  const units = UNITS[locale] ?? UNITS.en;
  const total = Math.max(0, Math.floor(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;

  if (h === 0) return `${m} ${units.m}`;
  if (m === 0) return `${h} ${units.h}`;
  return `${h} ${units.h} ${m} ${units.m}`;
}

// Module-scope state. The app ships as a single `output: 'standalone'` container,
// so one process holds all traffic. If it is ever scaled horizontally both the
// limit and the cache become per-instance — acceptable for a read-only lookup,
// but worth swapping for a shared store at that point.
const rateBuckets = new Map<string, number[]>();
const cache = new Map<string, { value: unknown; expiresAt: number }>();

/** Returns true when the call is allowed, false when the key is over its limit. */
export function checkRateLimit(key: string, now: number = Date.now()): boolean {
  const cutoff = now - RATE_WINDOW_MS;
  const recent = (rateBuckets.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= RATE_LIMIT) {
    rateBuckets.set(key, recent);
    return false;
  }

  recent.push(now);
  rateBuckets.set(key, recent);
  return true;
}

export function readCache<T>(key: string, now: number = Date.now()): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= now) {
    cache.delete(key);
    return null;
  }
  return hit.value as T;
}

export function writeCache(key: string, value: unknown, now: number = Date.now()): void {
  if (!cache.has(key) && cache.size >= CACHE_MAX) {
    // Map preserves insertion order, so the first key is the oldest.
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
}

/** Test-only escape hatch — clears both module caches between cases. */
export function resetGgLeapState(): void {
  rateBuckets.clear();
  cache.clear();
}
