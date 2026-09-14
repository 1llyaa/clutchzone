import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toMapView } from './view';

test('a panned Google Maps URL yields its viewport and zoom', () => {
  assert.deepEqual(
    toMapView('https://www.google.com/maps/@48.9744,14.4744,17z'),
    { lat: 48.9744, lng: 14.4744, zoom: 17 },
  );
});

test('a place URL yields the viewport', () => {
  assert.deepEqual(
    toMapView('https://www.google.com/maps/place/Clutch+Zone/@48.9744,14.4744,18z/data=!3m1'),
    { lat: 48.9744, lng: 14.4744, zoom: 18 },
  );
});

test('a place URL with no viewport falls back to the pin coordinates', () => {
  // !3d/!4d is the pin itself. Without an @ viewport there is no zoom in the
  // URL, so the default applies.
  assert.deepEqual(
    toMapView('https://www.google.com/maps/place/X/data=!3m1!4b1!3d48.9744!4d14.4744'),
    { lat: 48.9744, lng: 14.4744, zoom: 16 },
  );
});

test('a q= link yields its coordinates', () => {
  assert.deepEqual(
    toMapView('https://maps.google.com/?q=48.9744,14.4744'),
    { lat: 48.9744, lng: 14.4744, zoom: 16 },
  );
});

test('bare coordinates typed by hand work', () => {
  assert.deepEqual(toMapView('48.9744, 14.4744'), { lat: 48.9744, lng: 14.4744, zoom: 16 });
  assert.deepEqual(toMapView('48.9744,14.4744'),  { lat: 48.9744, lng: 14.4744, zoom: 16 });
});

test('bare coordinates can carry an explicit zoom', () => {
  assert.deepEqual(toMapView('48.9744, 14.4744, 14'), { lat: 48.9744, lng: 14.4744, zoom: 14 });
});

test('negative coordinates parse', () => {
  assert.deepEqual(
    toMapView('https://www.google.com/maps/@-33.8688,151.2093,15z'),
    { lat: -33.8688, lng: 151.2093, zoom: 15 },
  );
});

test('an old <iframe> embed snippet still parses', () => {
  // So an admin who saved an embed code before the switch is not stranded.
  assert.deepEqual(
    toMapView('<iframe src="https://www.google.com/maps/embed?pb=x&q=48.9744,14.4744"></iframe>'),
    { lat: 48.9744, lng: 14.4744, zoom: 16 },
  );
});

test('zoom is clamped to what the tiles actually serve', () => {
  assert.equal(toMapView('https://www.google.com/maps/@48.9744,14.4744,25z')?.zoom, 19);
  assert.equal(toMapView('https://www.google.com/maps/@48.9744,14.4744,0z')?.zoom, 1);
});

test('a My Maps link is rejected — its id says nothing about where it is', () => {
  // Guessing a centre from a mid would drop the pin in the wrong country.
  assert.equal(
    toMapView('https://www.google.com/maps/d/u/1/edit?mid=1AnB1hHvl0oiV_aKcgnroRfQxsWtpnJA'),
    null,
  );
});

test('out-of-range coordinates are rejected', () => {
  assert.equal(toMapView('91.0, 14.4744'), null);
  assert.equal(toMapView('48.9744, 181.0'), null);
});

test('a plain address is rejected — there is no geocoder here', () => {
  assert.equal(toMapView('Krajinská 2381/17, České Budějovice'), null);
});

test('empty input is null', () => {
  assert.equal(toMapView(''), null);
  assert.equal(toMapView('   '), null);
});
