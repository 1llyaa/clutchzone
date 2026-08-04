import type { MetadataRoute } from 'next';
import { routing } from '@/../i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clutchzone.club';

const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', priority: 1, changeFrequency: 'daily' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    PAGES.map(({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority: locale === routing.defaultLocale ? priority : priority * 0.9,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${SITE_URL}/${l}${path}`]),
        ),
      },
    })),
  );
}
