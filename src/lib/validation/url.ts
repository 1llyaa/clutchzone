/**
 * Whether a string is safe to store and later render as a link target or an
 * image source.
 *
 * React does not block `javascript:` in an href — it logs a warning and
 * renders it — so a value that reaches `<a href>` has to be checked before it
 * is written, not after it is read. `new URL()` is the only parser worth
 * trusting here: scheme detection by string prefix misses casing, leading
 * whitespace and embedded control characters.
 */
const MAX_URL_LENGTH = 2048;

export function isSafeExternalUrl(
  value: unknown,
  opts: { allowHosts?: string[] } = {},
): boolean {
  if (typeof value !== 'string') return false;
  const raw = value.trim();
  if (!raw || raw.length > MAX_URL_LENGTH) return false;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }

  const { allowHosts } = opts;

  // A host allowlist always means "our own storage", which is https-only.
  if (allowHosts) {
    if (parsed.protocol !== 'https:') return false;
    // Exact match: endsWith would accept `tvecbr.supabase.co.evil.com`.
    return allowHosts.includes(parsed.hostname);
  }

  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}

/**
 * The hostnames this deployment's own storage serves from.
 *
 * Read from the environment rather than hardcoded so dev and production each
 * validate against their own Supabase host. Empty when the variable is unset
 * or unparseable, in which case callers fall back to the scheme check alone —
 * a narrower check than nothing, and the tooling contexts where the variable
 * is missing do not write rows.
 */
export function storageHosts(): string[] {
  const hosts: string[] = [];
  try {
    hosts.push(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname);
  } catch {
    /* unset in some tooling contexts; fall through to no allowlist */
  }
  return hosts;
}
