import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildSitemapXml, SITE_URL } from './sitemap';

// public/sitemap.xml is committed, so nothing regenerates it at build time.
// This is the guard against it silently going stale after someone edits PAGES.
test('committed public/sitemap.xml matches the generator', () => {
  const committed = readFileSync(new URL('../../../public/sitemap.xml', import.meta.url), 'utf8');
  assert.equal(committed, buildSitemapXml());
});

test('every URL is absolute and on the production origin', () => {
  const locs = [...buildSitemapXml().matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 0);
  for (const loc of locs) assert.ok(loc.startsWith(`${SITE_URL}/`), loc);
});
