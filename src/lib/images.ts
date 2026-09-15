/**
 * The hosts `next/image` is allowed to fetch from.
 *
 * Kept here rather than only in next.config.ts so the config and the runtime
 * check below cannot drift apart — next.config.ts imports this list.
 *
 * Exact hostnames, not a `*.supabase.co` wildcard: the wildcard matched every
 * Supabase project in existence, which let anyone point the image optimizer at
 * files they host themselves.
 */
export const ALLOWED_IMAGE_HOSTS = [
  'tvecbrfhcuyqmsxlsvkc.supabase.co',
  'supabasekong-alfa5ntltxm2x4650331a8mr.clutchzone.club',
] as const;

/**
 * Whether a URL's host is covered by next.config.ts's `images.remotePatterns`.
 * `next/image` throws at render time for any src host outside that allowlist,
 * so callers that accept free-text URLs (e.g. the admin "COVER URL" field on
 * games) must check this before rendering `<Image>` and fall back to a plain
 * `<img>` otherwise.
 */
export function isAllowedImageHost(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:'
      && (ALLOWED_IMAGE_HOSTS as readonly string[]).includes(hostname);
  } catch {
    return false;
  }
}
