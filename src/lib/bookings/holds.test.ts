import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clampHoldMinutes, holdExpiryFrom, MIN_ONLINE_HOLD_MINUTES } from './holds';

test('a configured hold longer than the Stripe floor is used as-is', () => {
  assert.equal(clampHoldMinutes('45'), 45);
});

test('a hold shorter than the Stripe floor is raised to it', () => {
  // Below 30 minutes Stripe refuses the session expiry, which would leave a
  // live checkout able to pay for a slot we already released.
  assert.equal(clampHoldMinutes('5'), MIN_ONLINE_HOLD_MINUTES);
});

test('a missing or unparseable setting falls back to the floor', () => {
  assert.equal(clampHoldMinutes(undefined), MIN_ONLINE_HOLD_MINUTES);
  assert.equal(clampHoldMinutes(null), MIN_ONLINE_HOLD_MINUTES);
  assert.equal(clampHoldMinutes('brzy'), MIN_ONLINE_HOLD_MINUTES);
});

test('the expiry is the hold window past the given instant', () => {
  const now = new Date('2026-09-01T10:00:00.000Z');
  assert.equal(holdExpiryFrom(30, now), '2026-09-01T10:30:00.000Z');
});

import { cappedHoldExpiry } from './holds';

test('cappedHoldExpiry: a booking with no hold yet takes the proposed expiry', () => {
  const proposed = '2026-09-15T12:33:00.000Z';
  const ceiling  = '2026-09-15T13:00:00.000Z';
  assert.equal(cappedHoldExpiry(null, proposed, ceiling), proposed);
});

test('cappedHoldExpiry: a later proposal is accepted while under the ceiling', () => {
  const current  = '2026-09-15T12:10:00.000Z';
  const proposed = '2026-09-15T12:33:00.000Z';
  const ceiling  = '2026-09-15T13:00:00.000Z';
  assert.equal(cappedHoldExpiry(current, proposed, ceiling), proposed);
});

test('cappedHoldExpiry: the ceiling wins once the proposal passes it', () => {
  const current  = '2026-09-15T12:50:00.000Z';
  const proposed = '2026-09-15T13:20:00.000Z';
  const ceiling  = '2026-09-15T13:00:00.000Z';
  assert.equal(cappedHoldExpiry(current, proposed, ceiling), ceiling);
});

test('cappedHoldExpiry: never moves an existing hold backwards', () => {
  const current  = '2026-09-15T12:50:00.000Z';
  const proposed = '2026-09-15T12:20:00.000Z';
  const ceiling  = '2026-09-15T13:00:00.000Z';
  assert.equal(cappedHoldExpiry(current, proposed, ceiling), current);
});
