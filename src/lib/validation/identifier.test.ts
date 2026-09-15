import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isUuid } from './identifier';

test('accepts a canonical v4 uuid in either casing', () => {
  assert.equal(isUuid('3f2504e0-4f89-41d3-9a0c-0305e82c3301'), true);
  assert.equal(isUuid('3F2504E0-4F89-41D3-9A0C-0305E82C3301'), true);
});

test('rejects a uuid carrying an injected filter clause', () => {
  assert.equal(isUuid('3f2504e0-4f89-41d3-9a0c-0305e82c3301,status.neq.zzz'), false);
  assert.equal(isUuid('3f2504e0-4f89-41d3-9a0c-0305e82c3301,created_at.gte.2000-01-01'), false);
});

test('rejects near-misses and non-strings', () => {
  assert.equal(isUuid('not-a-uuid'), false);
  assert.equal(isUuid(''), false);
  assert.equal(isUuid('3f2504e0-4f89-41d3-9a0c-0305e82c330'), false);
  assert.equal(isUuid(null), false);
  assert.equal(isUuid(123), false);
});
