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
