import type { MetadataRoute } from 'next';
import { routing } from '@/../i18n/routing';
import { hreflangFor } from '@/lib/i18n/locales';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clutchzone.club';

// Google only uses <lastmod> when it is "consistently and verifiably accurate",
// so it has to be the date of the last significant change to the page's content
// — not the moment the sitemap happened to be generated. Bump a date by hand
// when the main content, structured data or links of that page actually change;
// a dependency bump or a translation-file edit does not count.
const PAGES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  lastModified: string;
}[] = [
  { path: '', priority: 1, changeFrequency: 'daily', lastModified: '2026-09-02' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly', lastModified: '2026-08-31' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly', lastModified: '2026-08-31' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    PAGES.map(({ path, priority, changeFrequency, lastModified }) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified,
      changeFrequency,
      priority: locale === routing.defaultLocale ? priority : priority * 0.9,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [hreflangFor(l), `${SITE_URL}/${l}${path}`]),
        ),
      },
    })),
  );
}
