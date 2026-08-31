import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shouldSendPaymentReceipt } from './payment-receipt';

test('a paid card booking is owed a receipt', () => {
  assert.equal(shouldSendPaymentReceipt({ paid: true, paysWithCredit: false }), true);
});

test('an unpaid booking gets no receipt — nothing to receipt yet', () => {
  // Covers both an abandoned online checkout and a "zaplatím v klubu" booking
  // staff has not marked paid.
  assert.equal(shouldSendPaymentReceipt({ paid: false, paysWithCredit: false }), false);
});

test('a booking paid with banked hours never gets a receipt', () => {
  // Hours come off the ggLeap account for time actually played — no money moved.
  assert.equal(shouldSendPaymentReceipt({ paid: true, paysWithCredit: true }), false);
});
