import assert from 'node:assert/strict';
import test from 'node:test';
import robots from '@/app/robots';

// Google evaluates only the single most specific matching User-agent group and
// ignores every other one — a group named `Googlebot` (or any named crawler)
// does NOT inherit the rules from `*`. So each named group has to repeat the
// full disallow list, or that crawler silently gets the run of the site.
test('every named user-agent group repeats the full disallow list', () => {
  const rules = robots().rules as { userAgent: string; disallow?: string | string[] }[];
  const wildcard = rules.find((rule) => rule.userAgent === '*');
  assert.ok(wildcard, 'a wildcard group must exist');

  const expected = [wildcard.disallow ?? []].flat().sort();
  assert.ok(expected.length > 0);

  for (const rule of rules) {
    assert.deepEqual([rule.disallow ?? []].flat().sort(), expected, rule.userAgent);
  }
});

// The route handlers are never locale-prefixed, so a `/*/api` pattern matches
// none of them. Guards against that regression coming back.
test('the api prefix is disallowed at the root, not behind a locale', () => {
  const disallow = [(robots().rules as { disallow?: string | string[] }[])[0].disallow ?? []].flat();
  assert.ok(disallow.includes('/api'));
  assert.ok(!disallow.includes('/*/api'));
});

// The origin tracks NEXT_PUBLIC_SITE_URL like the rest of the app (so a staging
// deploy advertises itself, not production), which means only the shape is
// fixed here — the value differs per environment.
test('the sitemap reference is an absolute url at /sitemap.xml', () => {
  const sitemap = robots().sitemap as string;
  assert.match(sitemap, /^https?:\/\/[^/]+\/sitemap\.xml$/);
});
