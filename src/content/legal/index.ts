import { routing } from '../../../i18n/routing';
import type { LegalDocument } from './types';

import { TERMS_CS } from './terms.cs';
import { TERMS_EN } from './terms.en';
import { TERMS_DE } from './terms.de';
import { TERMS_UA } from './terms.ua';

import { PRIVACY_CS } from './privacy.cs';
import { PRIVACY_EN } from './privacy.en';
import { PRIVACY_DE } from './privacy.de';
import { PRIVACY_UA } from './privacy.ua';

import { COOKIES_CS } from './cookies.cs';
import { COOKIES_EN } from './cookies.en';
import { COOKIES_DE } from './cookies.de';
import { COOKIES_UA } from './cookies.ua';

export type LegalDocId = 'terms' | 'privacy' | 'cookies';

const DOCS: Record<LegalDocId, Record<string, LegalDocument>> = {
  terms: { cs: TERMS_CS, en: TERMS_EN, de: TERMS_DE, ua: TERMS_UA },
  privacy: { cs: PRIVACY_CS, en: PRIVACY_EN, de: PRIVACY_DE, ua: PRIVACY_UA },
  cookies: { cs: COOKIES_CS, en: COOKIES_EN, de: COOKIES_DE, ua: COOKIES_UA },
};

/**
 * The Czech version is the binding one — every other locale is a convenience
 * translation, so an unknown locale falls back to `cs` rather than to English.
 */
export function getLegalDocument(doc: LegalDocId, locale: string): LegalDocument {
  return DOCS[doc][locale] ?? DOCS[doc][routing.defaultLocale];
}
