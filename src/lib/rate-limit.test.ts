import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkLimit, clientKey, __resetLimiter } from './rate-limit';

test('checkLimit: allows up to the limit then refuses', () => {
  __resetLimiter();
  assert.equal(checkLimit('t', 'ip1', 3, 60_000), true);
  assert.equal(checkLimit('t', 'ip1', 3, 60_000), true);
  assert.equal(checkLimit('t', 'ip1', 3, 60_000), true);
  assert.equal(checkLimit('t', 'ip1', 3, 60_000), false);
});

test('checkLimit: separate keys and buckets do not share a budget', () => {
  __resetLimiter();
  assert.equal(checkLimit('t', 'ip1', 1, 60_000), true);
  assert.equal(checkLimit('t', 'ip2', 1, 60_000), true);
  assert.equal(checkLimit('other', 'ip1', 1, 60_000), true);
  assert.equal(checkLimit('t', 'ip1', 1, 60_000), false);
});

test('clientKey: takes the last forwarded hop, not the client-supplied first', () => {
  const req = new Request('https://x.test', {
    headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' },
  });
  assert.equal(clientKey(req), '3.3.3.3');
});

test('clientKey: falls back to the real-ip header, then to a constant', () => {
  const withReal = new Request('https://x.test', { headers: { 'x-real-ip': '9.9.9.9' } });
  assert.equal(clientKey(withReal), '9.9.9.9');
  assert.equal(clientKey(new Request('https://x.test')), 'unknown');
});
