/**
 * Turns whatever an admin pastes into the map field into a URL safe to put in
 * an iframe `src`, or `null` if it is not a Google Maps URL at all.
 *
 * The host allowlist is the security boundary. Without it the settings form is
 * an arbitrary-iframe injection point on the homepage, so this runs
 * server-side in the settings PATCH route as well as in the section.
 */

const ALLOWED_HOSTS = new Set(['google.com', 'www.google.com', 'maps.google.com']);

export function toEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Google's "Share → Embed a map" hands over a whole <iframe> tag, and that
  // is what gets pasted in practice.
  const iframeSrc = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  const candidate = (iframeSrc ? iframeSrc[1] : trimmed).trim();
  if (!candidate) return null;

  let url: URL | null = null;
  try {
    url = new URL(candidate);
  } catch {
    url = null;
  }

  if (url) {
    // Blocks javascript:, data: and friends before the host check even runs.
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;
    // Already an embed URL — pass it through untouched.
    if (url.pathname.startsWith('/maps/embed')) return url.toString();
    // A Google Maps link that is not an embed URL (a place link, say): hand
    // the whole thing to q= and let Google resolve it.
    return `https://www.google.com/maps?q=${encodeURIComponent(candidate)}&output=embed`;
  }

  // Not a URL at all, so it is a plain address the admin typed.
  return `https://www.google.com/maps?q=${encodeURIComponent(candidate)}&output=embed`;
}
