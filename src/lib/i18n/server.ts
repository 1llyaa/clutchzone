import { createTranslator } from 'next-intl';
import { routing } from '@/../i18n/routing';

export type AppLocale = (typeof routing.locales)[number];

export function resolveLocale(value: unknown): AppLocale {
  return routing.locales.includes(value as AppLocale)
    ? (value as AppLocale)
    : routing.defaultLocale;
}

// next-intl's getTranslations() needs a request scope. Route handlers have one,
// but Stripe webhooks and the fire-and-forget mailers do not — they run after
// the response, on a locale carried in payment metadata. createTranslator is the
// scope-free path, so both worlds share one lookup.
export async function getServerTranslator<N extends string>(locale: unknown, namespace: N) {
  const resolved = resolveLocale(locale);
  const messages = (await import(`../../../messages/${resolved}.json`)).default;
  return createTranslator({ locale: resolved, messages, namespace });
}
