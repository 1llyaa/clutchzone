import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { routing } from '@/../i18n/routing';
import { hreflangFor } from '@/lib/i18n/locales';
import {
  buildSitemapIndexXml,
  buildUrlsetXml,
  SITE_URL,
  SITEMAP_NAMES,
  SITEMAPS,
  sitemapPath,
  type SitemapName,
} from './sitemap';

const urlBlocks = (xml: string) => [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);

test('every <url> puts <lastmod> before the xhtml extensions', () => {
  // sitemap.xsd's tUrl is a strict sequence ending in `xsd:any namespace="##other"`,
  // so a <lastmod> after an <xhtml:link> is "not expected" and the document fails
  // to validate. Next's own serializer gets this wrong, which is why we build the
  // XML by hand — this test is the guard against drifting back.
  for (const name of SITEMAP_NAMES) {
    for (const block of urlBlocks(buildUrlsetXml(name))) {
      const lastmod = block.indexOf('<lastmod>');
      const firstLink = block.indexOf('<xhtml:link');
      assert.notEqual(lastmod, -1, `${name}: missing <lastmod>`);
      assert.notEqual(firstLink, -1, `${name}: missing <xhtml:link>`);
      assert.ok(lastmod < firstLink, `${name}: <lastmod> must precede <xhtml:link>\n${block}`);
    }
  }
});

test('every <url> lists all locales plus x-default, including itself', () => {
  const expected = [...routing.locales.map(hreflangFor), 'x-default'];
  for (const name of SITEMAP_NAMES) {
    for (const block of urlBlocks(buildUrlsetXml(name))) {
      const langs = [...block.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]);
      assert.deepEqual(langs, expected, `${name}: wrong hreflang set\n${block}`);

      // Self-reference: the page's own <loc> has to appear among its alternates.
      const loc = /<loc>([^<]+)<\/loc>/.exec(block)?.[1];
      assert.ok(loc);
      assert.ok(block.includes(`href="${loc}"`), `${name}: ${loc} does not link to itself`);
    }
  }
});

// `force-static` bakes the origin in at build time, so reading it from the
// environment would publish whatever .env.local happens to say.
test('the origin is the production one, not taken from the environment', () => {
  assert.equal(SITE_URL, 'https://clutchzone.club');
});

test('every <loc> is absolute and on the production origin', () => {
  for (const name of SITEMAP_NAMES) {
    const locs = [...buildUrlsetXml(name).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.equal(locs.length, SITEMAPS[name].length * routing.locales.length);
    for (const loc of locs) assert.ok(loc.startsWith(`${SITE_URL}/`), loc);
  }
});

test('changefreq and priority are omitted — Google ignores both', () => {
  for (const name of SITEMAP_NAMES) {
    const xml = buildUrlsetXml(name);
    assert.ok(!xml.includes('<changefreq>'), name);
    assert.ok(!xml.includes('<priority>'), name);
  }
});

test('the index lists every child sitemap, and each one is served by a route', () => {
  const locs = [...buildSitemapIndexXml().matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(
    locs,
    SITEMAP_NAMES.map((name) => `${SITE_URL}${sitemapPath(name)}`),
  );

  // A <loc> pointing at a path with no handler would be a 404 in the index.
  for (const name of SITEMAP_NAMES) {
    const route = new URL(`../../app/${name}-sitemap.xml/route.ts`, import.meta.url);
    assert.ok(existsSync(route), `missing route handler for ${sitemapPath(name)}`);
  }
});

test("each child's <lastmod> in the index is the newest date it contains", () => {
  const entries = [...buildSitemapIndexXml().matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/g)].map(
    (m) => m[1],
  );
  assert.equal(entries.length, SITEMAP_NAMES.length);

  SITEMAP_NAMES.forEach((name: SitemapName, i) => {
    const newest = SITEMAPS[name].map((e) => e.lastModified).sort().at(-1);
    assert.match(entries[i], new RegExp(`<lastmod>${newest}</lastmod>`), name);
  });
});

test('both documents are well-formed enough to declare their namespaces', () => {
  for (const name of SITEMAP_NAMES) {
    const xml = buildUrlsetXml(name);
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset '));
    assert.ok(xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
  }
  const index = buildSitemapIndexXml();
  assert.ok(index.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex '));
  assert.ok(!index.includes('<url>'));
});
