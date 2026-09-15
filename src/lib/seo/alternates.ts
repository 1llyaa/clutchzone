import type { Metadata } from 'next';
import { routing } from '@/../i18n/routing';
import { hreflangFor } from '@/lib/i18n/locales';

/**
 * Canonical plus the full hreflang map for one page.
 *
 * `alternates` is replaced, not merged, when a page overrides the layout's
 * metadata — so a page that sets only `canonical` silently drops every
 * `<link rel="alternate">` the layout contributed. Every page that needs its own
 * canonical must use this instead of writing the object inline.
 */
export function alternatesFor(locale: string, path = ''): Metadata['alternates'] {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [hreflangFor(l), `/${l}${path}`])),
      'x-default': `/${routing.defaultLocale}${path}`,
    },
  };
}
