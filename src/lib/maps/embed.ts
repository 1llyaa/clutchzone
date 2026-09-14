/**
 * Turns whatever an admin pastes into the map field into a URL safe to put in
 * an iframe `src`, or `null` if it is not a Google Maps URL at all.
 *
 * The host allowlist is the security boundary. Without it the settings form is
 * an arbitrary-iframe injection point on the homepage, so this runs
 * server-side in the settings PATCH route as well as in the section.
 */

const ALLOWED_HOSTS = new Set(['google.com', 'www.google.com', 'maps.google.com']);

/** A place embed: what "Share → Embed a map" gives you on a normal pin. */
const PLACE_EMBED_PATH = /^\/maps\/embed(?:\/|$)/;

/**
 * Any My Maps URL, in all three shapes the admin can arrive with:
 *
 *   /maps/d/embed?mid=…      — the embed code, ready to frame
 *   /maps/d/u/2/embed?mid=…  — the same, from a second signed-in account
 *   /maps/d/viewer?mid=…     — the "share" link
 *   /maps/d/u/1/edit?mid=…   — the editor, i.e. the address bar while building it
 *
 * `u/<n>` is the signed-in account index and shows up whenever the admin is
 * logged into more than one Google account, which is the usual case.
 */
const MY_MAPS_PATH = /^\/maps\/d\/(?:u\/\d+\/)?(embed|edit|viewer)(?:\/|$)/;

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
    // Already a place embed — pass it through untouched.
    if (PLACE_EMBED_PATH.test(url.pathname)) return url.toString();

    const myMaps = url.pathname.match(MY_MAPS_PATH);
    if (myMaps) {
      // Every My Maps URL is the same map behind a different UI, identified by
      // `mid`. Without one there is no map to show.
      const mid = url.searchParams.get('mid');
      if (!mid) return null;

      // The embed code came straight from Google — do not second-guess it.
      if (myMaps[1] === 'embed') return url.toString();

      // /edit is the editor and /viewer is the share view. Google refuses to
      // frame either, and /edit additionally demands a logged-in owner, so
      // pasting one is the single most likely way to end up with a map that
      // renders nothing. Same map id, embed path.
      //
      // The account index is dropped rather than carried over: a public map
      // needs no account, and keeping it makes the embed depend on which
      // Google account the *visitor* happens to be signed into.
      const embed = new URL('https://www.google.com/maps/d/embed');
      embed.searchParams.set('mid', mid);
      // Background colour, if Google's embed dialog set one.
      const ehbc = url.searchParams.get('ehbc');
      if (ehbc) embed.searchParams.set('ehbc', ehbc);
      return embed.toString();
    }
    // A Google Maps link that is not an embed URL (a place link, say): hand
    // the whole thing to q= and let Google resolve it.
    return `https://www.google.com/maps?q=${encodeURIComponent(candidate)}&output=embed`;
  }

  // Not a URL at all, so it is a plain address the admin typed.
  return `https://www.google.com/maps?q=${encodeURIComponent(candidate)}&output=embed`;
}
