/**
 * Fixed-window limiter, in process.
 *
 * This is not distributed: with more than one instance each gets its own
 * budget. That is a deliberate trade for now — the endpoints it guards are
 * abuse-prone rather than security-critical, and an approximate ceiling beats
 * none. Move to a shared store if the app is ever scaled out.
 */
type Entry = { count: number; resetAt: number };
const windows = new Map<string, Entry>();

export function checkLimit(bucket: string, key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const id = `${bucket}:${key}`;
  const entry = windows.get(id);

  if (!entry || entry.resetAt <= now) {
    windows.set(id, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

/** Test seam. Not for production use. */
export function __resetLimiter(): void {
  windows.clear();
}

/**
 * The caller's address, as far as it can be trusted.
 *
 * The LAST entry in x-forwarded-for is the one this deployment's own reverse
 * proxy appended; earlier entries are whatever the client chose to send. Using
 * the first entry — as the ggLeap route did — hands the attacker the key and
 * therefore the whole budget.
 */
export function clientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
}
