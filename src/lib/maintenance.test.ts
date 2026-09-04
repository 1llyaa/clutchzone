import assert from 'node:assert/strict';
import { test, before } from 'node:test';

process.env.MAINTENANCE_USER = 'crew';
process.env.MAINTENANCE_PASS = 'hesloß:s heslem';

let credentialsMatch: typeof import('./maintenance').credentialsMatch;
let parseBasicAuth: typeof import('./maintenance').parseBasicAuth;

before(async () => {
  ({ credentialsMatch, parseBasicAuth } = await import('./maintenance'));
});

const encode = (user: string, pass: string) =>
  `Basic ${Buffer.from(`${user}:${pass}`, 'utf-8').toString('base64')}`;

test('parses a Basic header into user and password', () => {
  assert.deepEqual(parseBasicAuth(encode('crew', 'secret')), { user: 'crew', pass: 'secret' });
});

test('keeps non-ASCII credentials intact', () => {
  assert.deepEqual(parseBasicAuth(encode('crew', 'hesloß')), { user: 'crew', pass: 'hesloß' });
});

test('splits on the first colon only, so passwords may contain colons', () => {
  assert.deepEqual(parseBasicAuth(encode('crew', 'a:b:c')), { user: 'crew', pass: 'a:b:c' });
});

test('rejects a missing, non-Basic, malformed or separator-less header', () => {
  assert.equal(parseBasicAuth(null), null);
  assert.equal(parseBasicAuth('Bearer abc'), null);
  assert.equal(parseBasicAuth('Basic !!!not-base64!!!'), null);
  assert.equal(parseBasicAuth(`Basic ${Buffer.from('nocolon').toString('base64')}`), null);
});

test('accepts the configured credentials', async () => {
  assert.equal(await credentialsMatch('crew', 'hesloß:s heslem'), true);
});

test('rejects a wrong password and a wrong user', async () => {
  assert.equal(await credentialsMatch('crew', 'wrong'), false);
  assert.equal(await credentialsMatch('nobody', 'hesloß:s heslem'), false);
});

test('rejects the empty pair rather than treating unset input as a match', async () => {
  assert.equal(await credentialsMatch('', ''), false);
});

test('lets nobody through when the environment is not configured', async () => {
  const user = process.env.MAINTENANCE_USER;
  delete process.env.MAINTENANCE_USER;
  try {
    assert.equal(await credentialsMatch('crew', 'hesloß:s heslem'), false);
  } finally {
    process.env.MAINTENANCE_USER = user;
  }
});
