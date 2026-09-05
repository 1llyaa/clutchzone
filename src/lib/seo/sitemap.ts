import { routing } from '@/../i18n/routing';
import { hreflangFor } from '@/lib/i18n/locales';

// The sitemap ships as a committed static file (public/sitemap.xml) rather than
// a Next route: a route is re-rendered per request behind the CDN, so Google
// fetches a `must-revalidate` / `Vary: rsc` response for a document that only
// changes when someone edits the list below. A flat file is cached normally.
//
// Regenerate with `npm run sitemap` after editing anything here;
// sitemap.test.ts fails if the committed file has drifted.

// Hard-coded rather than read from NEXT_PUBLIC_SITE_URL, unlike the rest of the
// app. The generator runs on a developer machine, where .env.local points at
// localhost — reading the env here would commit localhost URLs to the sitemap.
// The deploy never regenerates this file, so there is no build env to inherit.
export const SITE_URL = 'https://clutchzone.club';

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

// Google only uses <lastmod> when it is "consistently and verifiably accurate",
// so it has to be the date of the last significant change to the page's content
// — not the moment the sitemap happened to be generated. Bump a date by hand
// when the main content, structured data or links of that page actually change;
// a dependency bump does not count.
//
// Check the page's *content*, not its route folder. The legal text lives in
// src/content/legal/{terms,privacy}.<locale>.ts and the home page's copy in
// src/components/sections/ — editing the route's page.tsx is usually plumbing,
// and dating from it reports the content as older than it is.
export const PAGES: {
  path: string;
  priority: number;
  changeFrequency: ChangeFrequency;
  lastModified: string;
}[] = [
  { path: '', priority: 1, changeFrequency: 'daily', lastModified: '2026-09-03' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly', lastModified: '2026-09-04' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly', lastModified: '2026-09-04' },
  { path: '/cookies', priority: 0.3, changeFrequency: 'yearly', lastModified: '2026-09-04' },
];

// Sitemaps cap <priority> at one decimal place in practice, but the secondary
// locales land on values like 0.27; two decimals, trailing zeros stripped,
// matches what the previous Next-generated sitemap published.
function formatPriority(value: number): string {
  return String(Math.round(value * 100) / 100);
}

export function buildSitemapXml(): string {
  const urls = routing.locales.flatMap((locale) =>
    PAGES.map(({ path, priority, changeFrequency, lastModified }) => {
      const alternates = routing.locales
        .map(
          (l) =>
            `<xhtml:link rel="alternate" hreflang="${hreflangFor(l)}" href="${SITE_URL}/${l}${path}" />`,
        )
        .join('\n');

      return [
        '<url>',
        `<loc>${SITE_URL}/${locale}${path}</loc>`,
        alternates,
        `<lastmod>${lastModified}</lastmod>`,
        `<changefreq>${changeFrequency}</changefreq>`,
        `<priority>${formatPriority(locale === routing.defaultLocale ? priority : priority * 0.9)}</priority>`,
        '</url>',
      ].join('\n');
    }),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
