/**
 * Whether a URL's host is covered by next.config.ts's `images.remotePatterns`
 * (currently only `*.supabase.co` over https). `next/image` throws at render
 * time for any src host outside that allowlist, so callers that accept
 * free-text URLs (e.g. the admin "COVER URL" field on games) must check this
 * before rendering `<Image>` and fall back to a plain `<img>` otherwise.
 */
export function isAllowedImageHost(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}
