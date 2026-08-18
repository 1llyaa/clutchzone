import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['cs', 'en', 'de', 'ua'],
  defaultLocale: 'cs',
  localePrefix: 'always',
});
