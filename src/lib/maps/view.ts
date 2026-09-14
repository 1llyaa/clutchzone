/**
 * Where the homepage map should point.
 *
 * The map is rendered with Leaflet over open tiles rather than a Google
 * iframe, so what the admin field needs is a coordinate, not an embed URL.
 * Admins still paste a Google Maps link — that is what the "share" button
 * gives them — and the coordinate is pulled out of it here.
 */
export interface MapView {
  lat: number;
  lng: number;
  zoom: number;
}

const DEFAULT_ZOOM = 16;
const MIN_ZOOM = 1;
const MAX_ZOOM = 19;

function isLat(n: number): boolean {
  return Number.isFinite(n) && n >= -90 && n <= 90;
}
function isLng(n: number): boolean {
  return Number.isFinite(n) && n >= -180 && n <= 180;
}

function build(lat: number, lng: number, zoom?: number): MapView | null {
  if (!isLat(lat) || !isLng(lng)) return null;
  const z = zoom !== undefined && Number.isFinite(zoom)
    ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom)))
    : DEFAULT_ZOOM;
  return { lat, lng, zoom: z };
}

/**
 * Parses whatever an admin pastes into a map centre, or `null`.
 *
 * Handles, in order of how often they turn up in practice:
 *
 *   .../maps/@48.9744,14.4744,17z       the URL after panning the map
 *   .../maps/place/X/@48.97,14.47,17z   a place page
 *   ...!3d48.9744!4d14.4744             the place's own pin, inside the URL
 *   ...?q=48.9744,14.4744               a query link
 *   48.9744, 14.4744                    coordinates typed by hand
 *   48.9744, 14.4744, 17                the same with an explicit zoom
 *
 * A My Maps link (/maps/d/... ?mid=) deliberately returns null: the map id
 * says nothing about where the map is, so there is no centre to extract and
 * guessing one would drop the pin in the wrong country.
 */
export function toMapView(input: string): MapView | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // An <iframe> snippet: work from its src, so an old embed code still parses.
  const iframeSrc = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  const text = (iframeSrc ? iframeSrc[1] : trimmed).trim();

  // `@lat,lng,17z` — the viewport, which is what the admin was looking at.
  const at = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?)z)?/);
  if (at) {
    const view = build(Number(at[1]), Number(at[2]), at[3] ? Number(at[3]) : undefined);
    if (view) return view;
  }

  // `!3dlat!4dlng` — the pin itself. Preferred over @ when both exist, but @
  // is checked first because it carries the zoom; fall through to here only
  // when the viewport was not parseable.
  const bang = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (bang) {
    const view = build(Number(bang[1]), Number(bang[2]));
    if (view) return view;
  }

  // `?q=lat,lng` or `?ll=lat,lng`
  const query = text.match(/[?&](?:q|ll|center)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (query) {
    const view = build(Number(query[1]), Number(query[2]));
    if (view) return view;
  }

  // Bare `lat, lng` or `lat, lng, zoom`, typed by hand. Anchored, so a random
  // URL full of numbers cannot accidentally match.
  const bare = text.match(
    /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(\d+(?:\.\d+)?))?$/,
  );
  if (bare) {
    return build(Number(bare[1]), Number(bare[2]), bare[3] ? Number(bare[3]) : undefined);
  }

  return null;
}
