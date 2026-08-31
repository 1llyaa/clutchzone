import assert from 'node:assert/strict';
import { test, before } from 'node:test';

process.env.BOOKING_CANCEL_SECRET = 'test-secret-do-not-use-in-production';

let signToken: typeof import('./cancel-token').signToken;
let verifyToken: typeof import('./cancel-token').verifyToken;

before(async () => {
  ({ signToken, verifyToken } = await import('./cancel-token'));
});

const GROUP = '11111111-2222-3333-4444-555555555555';
const future = () => Math.floor(Date.now() / 1000) + 3600;

test('a freshly signed token verifies', async () => {
  const exp = future();
  const token = await signToken('booking-cancel', GROUP, exp);
  assert.equal(await verifyToken('booking-cancel', GROUP, exp, token), true);
});

test('a token does not verify for a different booking id', async () => {
  const exp = future();
  const token = await signToken('booking-cancel', GROUP, exp);
  const other = '99999999-8888-7777-6666-555555555555';
  assert.equal(await verifyToken('booking-cancel', other, exp, token), false);
});

test('extending exp in the URL invalidates the signature', async () => {
  const exp = future();
  const token = await signToken('booking-cancel', GROUP, exp);
  assert.equal(await verifyToken('booking-cancel', GROUP, exp + 86400, token), false);
});

test('an expired token is rejected even though its signature is valid', async () => {
  const exp = Math.floor(Date.now() / 1000) - 60;
  const token = await signToken('booking-cancel', GROUP, exp);
  assert.equal(await verifyToken('booking-cancel', GROUP, exp, token), false);
});

test('scopes do not cross over — a cancel token cannot withdraw a credit order', async () => {
  const exp = future();
  const token = await signToken('booking-cancel', GROUP, exp);
  assert.equal(await verifyToken('credit-withdraw', GROUP, exp, token), false);
});

test('garbage and empty tokens are rejected, not thrown on', async () => {
  const exp = future();
  assert.equal(await verifyToken('booking-cancel', GROUP, exp, ''), false);
  assert.equal(await verifyToken('booking-cancel', GROUP, exp, 'not-base64!!'), false);
  assert.equal(await verifyToken('booking-cancel', GROUP, exp, 'AAAA'), false);
});

test('a non-finite exp is rejected', async () => {
  const token = await signToken('booking-cancel', GROUP, future());
  assert.equal(await verifyToken('booking-cancel', GROUP, NaN, token), false);
});
