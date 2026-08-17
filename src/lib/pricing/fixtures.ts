import { deriveDayTypes } from './dayTypes';
import type { HourTier, OpeningHoursRow, PricingConfig, TimePass } from './types';

// Mirrors the seed data in supabase/migrations/015_pricing_v2.sql —
// current production ceník (spec §2.1 / §2.2), used as fixtures for
// engine/dayTypes unit tests, not as hardcoded rules.

export const hourTiersFixture: HourTier[] = [
  { id: 'pc-1', stationType: 'pc', hours: 1, amount: 75, isActive: true, sortOrder: 1 },
  { id: 'pc-3', stationType: 'pc', hours: 3, amount: 215, isActive: true, sortOrder: 2 },
  { id: 'pc-5', stationType: 'pc', hours: 5, amount: 345, isActive: true, sortOrder: 3 },
  { id: 'pc-7', stationType: 'pc', hours: 7, amount: 475, isActive: true, sortOrder: 4 },
  { id: 'pc-10', stationType: 'pc', hours: 10, amount: 660, isActive: true, sortOrder: 5 },
  { id: 'ps5-1', stationType: 'ps5', hours: 1, amount: 120, isActive: true, sortOrder: 1 },
  { id: 'ps5-3', stationType: 'ps5', hours: 3, amount: 330, isActive: true, sortOrder: 2 },
  { id: 'ps5-5', stationType: 'ps5', hours: 5, amount: 560, isActive: true, sortOrder: 3 },
];

export const timePassesFixture: TimePass[] = [
  {
    id: 'happy-hours', slug: 'happy-hours', nameCs: 'HAPPY HOURS', nameEn: 'HAPPY HOURS',
    descriptionCs: 'Paušál za okno 14:00–17:00', descriptionEn: 'Flat rate for the 14:00–17:00 window',
    stationType: 'pc', priceMode: 'flat', amount: 165, daysOfWeek: [2, 3, 4, 5],
    windowStart: '14:00:00', windowEnd: '17:00:00', crossesMidnight: false, maxHours: null,
    isActive: true, sortOrder: 1,
  },
  {
    id: 'evening-pass', slug: 'evening-pass', nameCs: 'EVENING PASS', nameEn: 'EVENING PASS',
    descriptionCs: 'Paušál za okno 19:00–24:00', descriptionEn: 'Flat rate for the 19:00–24:00 window',
    stationType: 'pc', priceMode: 'flat', amount: 285, daysOfWeek: [2, 3, 4, 0],
    windowStart: '19:00:00', windowEnd: '24:00:00', crossesMidnight: false, maxHours: null,
    isActive: true, sortOrder: 2,
  },
  {
    id: 'weekend-pass', slug: 'weekend-pass', nameCs: 'WEEKEND PASS', nameEn: 'WEEKEND PASS',
    descriptionCs: 'Paušál za okno 22:00–04:00', descriptionEn: 'Flat rate for the 22:00–04:00 window',
    stationType: 'pc', priceMode: 'flat', amount: 340, daysOfWeek: [5, 6],
    windowStart: '22:00:00', windowEnd: '04:00:00', crossesMidnight: true, maxHours: null,
    isActive: true, sortOrder: 3,
  },
];

export const openingHoursFixture: OpeningHoursRow[] = [
  { dayOfWeek: 0, isClosed: false, openTime: '14:00:00', closeTime: '24:00:00', crossesMidnight: false },
  { dayOfWeek: 1, isClosed: true, openTime: null, closeTime: null, crossesMidnight: false },
  { dayOfWeek: 2, isClosed: false, openTime: '14:00:00', closeTime: '24:00:00', crossesMidnight: false },
  { dayOfWeek: 3, isClosed: false, openTime: '14:00:00', closeTime: '24:00:00', crossesMidnight: false },
  { dayOfWeek: 4, isClosed: false, openTime: '14:00:00', closeTime: '24:00:00', crossesMidnight: false },
  { dayOfWeek: 5, isClosed: false, openTime: '14:00:00', closeTime: '04:00:00', crossesMidnight: true },
  { dayOfWeek: 6, isClosed: false, openTime: '14:00:00', closeTime: '04:00:00', crossesMidnight: true },
];

export function buildFixtureConfig(): PricingConfig {
  return {
    hourTiers: hourTiersFixture,
    timePasses: timePassesFixture,
    openingHours: openingHoursFixture,
    dayTypes: deriveDayTypes(openingHoursFixture, timePassesFixture),
    creditExpiryMonths: 3,
  };
}
