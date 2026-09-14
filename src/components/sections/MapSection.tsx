'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toMapView } from '@/lib/maps/view';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Props {
  /** Whatever the admin pasted — a Google Maps link or bare coordinates. */
  location: string;
  visible: boolean;
}

/**
 * Dark basemap with street labels, from OpenFreeMap.
 *
 * Deliberately not a Google embed. The My Maps iframe forces a header bar
 * carrying the map's title, owner and share controls that no parameter can
 * remove, and neither My Maps nor the classic place embed can be styled at
 * all — Google's dark map is a Maps JS API feature, which needs an API key
 * and a billing account the design set out to avoid.
 *
 * OpenFreeMap over CARTO: CARTO's basemap CDN still answers, but using it in
 * production now means an account and an organisation signup. OpenFreeMap is
 * free with no account, no key and no request cap, commercial use included.
 *
 * Its `dark` style is rgb(12,12,12) — near the site's own #0A0A0A — and keeps
 * fifteen label layers, street names among them.
 *
 * maplibre-gl is pinned to v4 on purpose. From v5 the package is ESM-only and
 * loads its tile-parsing worker as a separate .mjs chunk, which Next's webpack
 * does not wire up: the style and the TileJSON fetch fine, the canvas appears,
 * and then not one vector tile is ever requested — a silent black band with no
 * error in the console. v4 ships a UMD bundle with the worker inlined and
 * works. Verify tiles actually render before raising this.
 */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

export default function MapSection({ location, visible }: Props) {
  const t = useTranslations('map');
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // maplibre-gl is ~160 kB gzipped. The map is the last band before the
  // footer, so most visitors never reach it — the library is not worth
  // fetching until it is about to be seen.
  const [inView, setInView] = useState(false);

  const view = toMapView(location);
  const lat = view?.lat;
  const lng = view?.lng;
  const zoom = view?.zoom;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    // No IntersectionObserver (very old browser, some crawlers): load rather
    // than leave a blank band forever.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      // Start fetching a screen early, so the tiles are in place by the time
      // the band is actually on screen.
      { rootMargin: '300px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (lat === undefined || lng === undefined || zoom === undefined) return;
    const container = containerRef.current;
    if (!container) return;

    let map: import('maplibre-gl').Map | null = null;
    let cancelled = false;

    // maplibre-gl touches `window` at import time, so it cannot be a top-level
    // import in a component Next renders on the server first. Loading it here
    // also keeps it out of the shared bundle for every page without a map.
    import('maplibre-gl').then(({ Map, Marker, NavigationControl }) => {
      if (cancelled || !containerRef.current) return;

      map = new Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: [lng, lat],
        zoom,
        // Requires ctrl/⌘ + scroll on desktop and two fingers on touch, so a
        // full-bleed map never swallows the page scroll. MapLibre draws and
        // localises the hint overlay itself.
        cooperativeGestures: true,
        // No customAttribution: the source's TileJSON already carries the
        // OpenFreeMap / OpenMapTiles / OpenStreetMap credit that ODbL
        // requires, and passing it again renders the whole line twice.
        attributionControl: { compact: true },
        locale: {
          'CooperativeGesturesHandler.WindowsHelpText': t('scrollHintWindows'),
          'CooperativeGesturesHandler.MacHelpText': t('scrollHintMac'),
          'CooperativeGesturesHandler.MobileHelpText': t('touchHint'),
        },
      });

      // Without this, a failed style, tile or glyph fetch leaves a silently
      // empty black band and no trace of why.
      map.on('error', (e) => console.error('Map error:', e.error?.message ?? e));

      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

      // A div marker rather than a shipped PNG pin: no image asset, and it
      // takes the brand accent straight from the token.
      const pin = document.createElement('span');
      pin.className = 'cz-map-pin';
      new Marker({ element: pin }).setLngLat([lng, lat]).addTo(map);
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [inView, lat, lng, zoom, t]);

  if (!visible || !view) return null;

  return (
    <section
      ref={sectionRef}
      id="mapa"
      // Full-bleed on purpose: the map is a band directly above the footer,
      // deliberately outside the max-w-[1440px] container.
      className="relative bg-cz-black w-full"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)', height: 'clamp(320px, 45vh, 520px)' }}
      aria-label={t('label')}
    >
      <div ref={containerRef} className="cz-map" style={{ width: '100%', height: '100%' }} />

      <style>{`
        .cz-map { background: #0A0A0A; }
        .cz-map-pin {
          display: block; width: 18px; height: 18px; border-radius: 50%;
          background: var(--color-cz-orange);
          box-shadow: 0 0 0 4px rgba(232,74,26,0.25), 0 0 18px 4px rgba(232,74,26,0.35);
        }
        /* MapLibre ships light chrome; recolour it to the site palette rather
           than leaving white boxes on a near-black map. */
        .cz-map .maplibregl-ctrl-group {
          background: #1a1a1a;
          border: 1px solid var(--color-cz-gray-dark);
          box-shadow: none;
        }
        .cz-map .maplibregl-ctrl-group button + button { border-top-color: var(--color-cz-gray-dark); }
        .cz-map .maplibregl-ctrl-group button:hover { background: #2A2A2A; }
        .cz-map .maplibregl-ctrl-icon { filter: invert(1) brightness(0.9); }
        .cz-map .maplibregl-ctrl-attrib {
          background: rgba(10,10,10,0.75) !important;
          color: #888888;
        }
        .cz-map .maplibregl-ctrl-attrib a { color: #E8E8E8; }
        .cz-map .maplibregl-ctrl-attrib-button { filter: invert(1) brightness(0.9); }
        .cz-map .maplibregl-cooperative-gesture-screen {
          background: rgba(10,10,10,0.7);
          font-family: var(--font-body), sans-serif;
        }
      `}</style>
    </section>
  );
}
