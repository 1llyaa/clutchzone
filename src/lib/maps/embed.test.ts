import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toEmbedUrl } from './embed';

const EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2600';

test('an embed URL passes through untouched', () => {
  assert.equal(toEmbedUrl(EMBED), EMBED);
});

test('a pasted <iframe> snippet yields its src', () => {
  // What Google's "Share → Embed a map" actually puts on the clipboard.
  const snippet = `<iframe src="${EMBED}" width="600" height="450" style="border:0" allowfullscreen loading="lazy"></iframe>`;
  assert.equal(toEmbedUrl(snippet), EMBED);
});

test('a snippet using single quotes works too', () => {
  assert.equal(toEmbedUrl(`<iframe src='${EMBED}' width='600'></iframe>`), EMBED);
});

test('a My Maps embed passes through, account index and all', () => {
  // The real URL that broke this: /maps/d/u/2/embed, not /maps/embed. The
  // `u/2` is the signed-in Google account index and shows up whenever the
  // admin is logged into more than one account.
  const myMaps =
    'https://www.google.com/maps/d/u/2/embed?mid=1FHt7foDxfct5PujnpLdeQYpZrOkgVyw&ehbc=2E312F';
  assert.equal(toEmbedUrl(myMaps), myMaps);
});

test('a My Maps embed without an account index passes through', () => {
  const myMaps = 'https://www.google.com/maps/d/embed?mid=abc123';
  assert.equal(toEmbedUrl(myMaps), myMaps);
});

test('a My Maps <iframe> snippet yields its src untouched', () => {
  const myMaps =
    'https://www.google.com/maps/d/u/2/embed?mid=1FHt7foDxfct5PujnpLdeQYpZrOkgVyw&ehbc=2E312F';
  assert.equal(
    toEmbedUrl(`<iframe src="${myMaps}" width="640" height="480"></iframe>`),
    myMaps,
  );
});

test('a My Maps viewer link is converted to the embed path', () => {
  // /maps/d/viewer is the share link. Google refuses to frame it, so passing
  // it through unchanged would render nothing.
  assert.equal(
    toEmbedUrl('https://www.google.com/maps/d/viewer?mid=abc123&usp=sharing'),
    'https://www.google.com/maps/d/embed?mid=abc123',
  );
});

test('a My Maps edit link is converted to the embed path', () => {
  // The editor URL — what is in the address bar while building the map, and
  // the easiest thing to copy by mistake. It demands a logged-in owner and
  // cannot be framed at all.
  assert.equal(
    toEmbedUrl('https://www.google.com/maps/d/u/1/edit?mid=1AnB1hHvl0oiV_aKcgnroRfQxsWtpnJA&usp=sharing'),
    'https://www.google.com/maps/d/embed?mid=1AnB1hHvl0oiV_aKcgnroRfQxsWtpnJA',
  );
});

test('converting drops the account index but keeps the background colour', () => {
  // A public map needs no account index, and keeping it would make the embed
  // depend on which Google account the visitor is signed into.
  assert.equal(
    toEmbedUrl('https://www.google.com/maps/d/u/2/edit?mid=abc123&ehbc=2E312F'),
    'https://www.google.com/maps/d/embed?mid=abc123&ehbc=2E312F',
  );
});

test('a My Maps URL with no map id is rejected', () => {
  assert.equal(toEmbedUrl('https://www.google.com/maps/d/u/1/edit'), null);
});

test('an embed path on a non-Google host is still rejected', () => {
  assert.equal(toEmbedUrl('https://evil.example.com/maps/d/u/2/embed?mid=x'), null);
});

test('a plain address is wrapped as a q= embed', () => {
  assert.equal(
    toEmbedUrl('Krajinská 2381/17, České Budějovice 37001'),
    'https://www.google.com/maps?q=Krajinsk%C3%A1%202381%2F17%2C%20%C4%8Cesk%C3%A9%20Bud%C4%9Bjovice%2037001&output=embed',
  );
});

test('a Google place link is wrapped rather than passed through', () => {
  const place = 'https://www.google.com/maps/place/Clutch+Zone';
  const out = toEmbedUrl(place);
  assert.ok(out?.startsWith('https://www.google.com/maps?q='));
  assert.ok(out?.endsWith('&output=embed'));
});

test('maps.google.com is an accepted host', () => {
  assert.ok(toEmbedUrl('https://maps.google.com/maps?q=Clutch+Zone'));
});

test('a non-Google host is rejected', () => {
  // The security boundary: without it the settings form is an
  // arbitrary-iframe injection point on the homepage.
  assert.equal(toEmbedUrl('https://evil.example.com/maps/embed?pb=1'), null);
});

test('a non-Google host inside an iframe snippet is rejected', () => {
  assert.equal(
    toEmbedUrl('<iframe src="https://evil.example.com/x"></iframe>'),
    null,
  );
});

test('a lookalike host is rejected', () => {
  assert.equal(toEmbedUrl('https://google.com.evil.example/maps/embed?pb=1'), null);
});

test('a javascript: URL is rejected', () => {
  assert.equal(toEmbedUrl('javascript:alert(1)'), null);
});

test('empty or whitespace-only input is null, not an empty embed', () => {
  assert.equal(toEmbedUrl(''), null);
  assert.equal(toEmbedUrl('   '), null);
});
