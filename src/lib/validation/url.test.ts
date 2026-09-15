import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isSafeExternalUrl } from './url';

test('accepts ordinary http and https links', () => {
  assert.equal(isSafeExternalUrl('https://example.com'), true);
  assert.equal(isSafeExternalUrl('http://example.com/path?a=1'), true);
});

test('rejects the script scheme in every casing and with padding', () => {
  assert.equal(isSafeExternalUrl('javascript:alert(1)'), false);
  assert.equal(isSafeExternalUrl('JaVaScRiPt:alert(1)'), false);
  assert.equal(isSafeExternalUrl('  javascript:alert(1)  '), false);
});

test('rejects data and other non-http schemes', () => {
  assert.equal(isSafeExternalUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isSafeExternalUrl('file:///etc/passwd'), false);
  assert.equal(isSafeExternalUrl('vbscript:msgbox(1)'), false);
});

test('rejects values that are not strings or not URLs at all', () => {
  assert.equal(isSafeExternalUrl(null), false);
  assert.equal(isSafeExternalUrl(42), false);
  assert.equal(isSafeExternalUrl(''), false);
  assert.equal(isSafeExternalUrl('not a url'), false);
});

test('rejects anything longer than the cap', () => {
  assert.equal(isSafeExternalUrl(`https://example.com/${'a'.repeat(2100)}`), false);
});

test('restricts to an allowed host list when one is given', () => {
  const opts = { allowHosts: ['tvecbr.supabase.co'] };
  assert.equal(isSafeExternalUrl('https://tvecbr.supabase.co/x.png', opts), true);
  assert.equal(isSafeExternalUrl('https://evil.example.com/x.png', opts), false);
});

test('host matching is exact, not a suffix match', () => {
  const opts = { allowHosts: ['tvecbr.supabase.co'] };
  assert.equal(isSafeExternalUrl('https://nottvecbr.supabase.co/x.png', opts), false);
  assert.equal(isSafeExternalUrl('https://tvecbr.supabase.co.evil.com/x.png', opts), false);
});

test('an allowed host list forces https', () => {
  const opts = { allowHosts: ['tvecbr.supabase.co'] };
  assert.equal(isSafeExternalUrl('http://tvecbr.supabase.co/x.png', opts), false);
});
