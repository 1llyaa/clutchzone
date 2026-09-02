import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkEmail, checkPhone } from './contact';

test('checkPhone: empty value reports empty, not a format problem', () => {
  assert.equal(checkPhone(''), 'empty');
  assert.equal(checkPhone('+'), 'empty');
});

test('checkPhone: a number with too few digits reports tooShort', () => {
  assert.equal(checkPhone('+42011111'), 'tooShort');
});

test('checkPhone: right length but impossible prefix reports invalid', () => {
  assert.equal(checkPhone('+420111111111'), 'invalid');
});

test('checkPhone: a real Czech mobile passes', () => {
  assert.equal(checkPhone('+420777123456'), null);
});

test('checkPhone: a real German mobile passes', () => {
  assert.equal(checkPhone('+4915123456789'), null);
});

test('checkEmail: blank and whitespace-only report empty', () => {
  assert.equal(checkEmail(''), 'empty');
  assert.equal(checkEmail('   '), 'empty');
});

test('checkEmail: missing @ is reported separately from a general format error', () => {
  assert.equal(checkEmail('jan.novak'), 'missingAt');
});

test('checkEmail: an address with no dot in the domain reports missingDomain', () => {
  assert.equal(checkEmail('jan@email'), 'missingDomain');
});

test('checkEmail: anything else malformed reports invalid', () => {
  assert.equal(checkEmail('jan novak@email.cz'), 'invalid');
  assert.equal(checkEmail('jan@@email.cz'), 'invalid');
  assert.equal(checkEmail('@email.cz'), 'invalid');
});

test('checkEmail: a normal address passes', () => {
  assert.equal(checkEmail('jan@email.cz'), null);
  assert.equal(checkEmail('  jan@email.cz  '), null);
});
