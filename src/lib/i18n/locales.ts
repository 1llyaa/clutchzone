import { routing } from '@/../i18n/routing';

export type AppLocale = (typeof routing.locales)[number];

// The URL segment and the language tag are not the same thing. We route
// Ukrainian under /ua because that is what visitors recognise, but `ua` is the
// ISO country code for Ukraine — the language is `uk`. Google drops hreflang
// and og:locale values it cannot parse as BCP 47, so the two are mapped apart
// here rather than reusing the segment.
const HREFLANG: Record<AppLocale, string> = {
  cs: 'cs',
  en: 'en',
  de: 'de',
  ua: 'uk',
};

const OG_LOCALE: Record<AppLocale, string> = {
  cs: 'cs_CZ',
  en: 'en_US',
  de: 'de_DE',
  ua: 'uk_UA',
};

export function resolveLocale(value: unknown): AppLocale {
  return routing.locales.includes(value as AppLocale)
    ? (value as AppLocale)
    : routing.defaultLocale;
}

export function hreflangFor(locale: AppLocale): string {
  return HREFLANG[locale];
}

export function ogLocaleFor(locale: AppLocale): string {
  return OG_LOCALE[locale];
}
