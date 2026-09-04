import assert from 'node:assert/strict';
import { test } from 'node:test';
import { routing } from '@/../i18n/routing';
import { hreflangFor, ogLocaleFor } from './locales';

test('locales: ua routes advertise Ukrainian as uk, not the country code', () => {
  assert.equal(hreflangFor('ua'), 'uk');
  assert.equal(ogLocaleFor('ua'), 'uk_UA');
});

test('locales: the other locales keep their own tag', () => {
  assert.equal(hreflangFor('cs'), 'cs');
  assert.equal(hreflangFor('en'), 'en');
  assert.equal(hreflangFor('de'), 'de');
});

test('locales: every routed locale has a tag, so none can be added without one', () => {
  for (const locale of routing.locales) {
    assert.match(hreflangFor(locale), /^[a-z]{2}$/);
    assert.match(ogLocaleFor(locale), /^[a-z]{2}_[A-Z]{2}$/);
  }
});

test('locales: tags are unique, so no two locales collide on one hreflang', () => {
  const tags = routing.locales.map(hreflangFor);
  assert.equal(new Set(tags).size, tags.length);
});
