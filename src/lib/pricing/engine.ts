import { dayTypeCloseHour } from './dayTypes';
import type {
  CalcInput,
  DayTypeGroup,
  HourTier,
  Offer,
  OfferBreakdownLine,
  OfferResult,
  PricingConfig,
  TimePass,
} from './types';

/**
 * How many hours actually block a station on the reservation date.
 * Pass offers consume exactly their coverage; hours/hours_upsell offers
 * only occupy the station for what fits before closing today — any
 * surplus purchased hours are banked credit, not extra on-site time
 * (spec §3.7).
 */
export function reservedHoursOnSite(offer: Offer, input: CalcInput, dayType: DayTypeGroup): number {
  if (offer.kind === 'pass') return offer.hoursCovered;
  const closeHour = dayTypeCloseHour(dayType);
  return Math.max(0, Math.min(input.durationHours, closeHour - input.startHour));
}

function parseTimeToHours(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

function hoursWordCs(n: number): string {
  if (n === 1) return 'HODINA';
  if (n >= 2 && n <= 4) return 'HODINY';
  return 'HODIN';
}

interface Combo {
  totalHours: number;
  amount: number;
  breakdown: OfferBreakdownLine[];
}

/**
 * Cheapest combination of active hour tiers whose combined hours are
 * >= targetHours (surplus becomes credit). Coin-change over small
 * integers — spec §3.2.
 */
export function cheapestCombo(tiers: HourTier[], targetHours: number): Combo | null {
  const active = tiers.filter((t) => t.isActive && t.hours > 0);
  if (!active.length || targetHours <= 0) return null;

  const maxTierHours = Math.max(...active.map((t) => t.hours));
  const upperBound = targetHours + maxTierHours - 1;

  const cost: number[] = new Array(upperBound + 1).fill(Infinity);
  const choice: (HourTier | null)[] = new Array(upperBound + 1).fill(null);
  cost[0] = 0;

  for (let h = 1; h <= upperBound; h++) {
    for (const tier of active) {
      const prev = h - tier.hours;
      if (prev < 0 || cost[prev] === Infinity) continue;
      const candidate = cost[prev] + tier.amount;
      if (candidate < cost[h]) {
        cost[h] = candidate;
        choice[h] = tier;
      }
    }
  }

  let bestH = -1;
  for (let h = targetHours; h <= upperBound; h++) {
    if (cost[h] === Infinity) continue;
    if (bestH === -1 || cost[h] < cost[bestH]) bestH = h;
  }
  if (bestH === -1) return null;

  const counts = new Map<string, { tier: HourTier; qty: number }>();
  let cursor = bestH;
  while (cursor > 0) {
    const tier = choice[cursor];
    if (!tier) return null; // unreachable, guards against bad DP state
    const entry = counts.get(tier.id);
    if (entry) entry.qty += 1;
    else counts.set(tier.id, { tier, qty: 1 });
    cursor -= tier.hours;
  }

  const breakdown = [...counts.values()]
    .sort((a, b) => b.tier.hours - a.tier.hours)
    .map(({ tier, qty }) => ({ label: `${tier.hours}H`, qty, unitAmount: tier.amount }));

  return { totalHours: bestH, amount: cost[bestH], breakdown };
}

function smallestActiveTierAmount(tiers: HourTier[], stationType: string): number | null {
  const active = tiers.filter((t) => t.isActive && t.stationType === stationType);
  if (!active.length) return null;
  return Math.min(...active.map((t) => t.amount));
}

function buildHoursOffer(
  kind: 'hours' | 'hours_upsell',
  combo: Combo,
  input: CalcInput,
  baseTierAmount: number,
  fitsClosingTime: boolean,
): Offer {
  const totalAmount = combo.amount * input.stationsCount;
  return {
    id: `${kind}:${combo.totalHours}`,
    kind,
    passId: null,
    label: `${combo.totalHours} ${hoursWordCs(combo.totalHours)}`,
    totalAmount,
    amountPerStation: combo.amount,
    hoursCovered: combo.totalHours,
    bonusHours: Math.max(0, combo.totalHours - input.durationHours),
    breakdown: combo.breakdown,
    isCredit: true,
    creditRemainderHours: Math.max(0, combo.totalHours - input.durationHours),
    effectiveHourly: Math.round(combo.amount / combo.totalHours),
    savingsVsHourly: input.durationHours * baseTierAmount * input.stationsCount - totalAmount,
    fitsClosingTime,
    timeWindowLabel: null,
  };
}

function formatClock(t: string): string {
  return t.slice(0, 5);
}

function buildPassOffer(pass: TimePass, dayType: DayTypeGroup, input: CalcInput, locale: 'cs' | 'en', baseTierAmount: number): Offer | null {
  if (pass.stationType !== 'any' && pass.stationType !== input.stationType) return null;
  if (!dayType.closeTime) return null;

  const windowStart = parseTimeToHours(pass.windowStart);
  const windowEnd = parseTimeToHours(pass.windowEnd) + (pass.crossesMidnight ? 24 : 0);
  if (input.startHour < windowStart || input.startHour >= windowEnd) return null;

  const closeHour = parseTimeToHours(dayType.closeTime) + (dayType.crossesMidnight ? 24 : 0);
  const maxHoursEnd = pass.maxHours != null ? input.startHour + pass.maxHours : Infinity;
  const coverageEnd = Math.min(windowEnd, closeHour, maxHoursEnd);
  const coverage = coverageEnd - input.startHour;
  if (coverage < input.durationHours) return null; // must cover the full requested length

  const unitPrice = pass.priceMode === 'flat' ? pass.amount : coverage * pass.amount;
  const totalAmount = unitPrice * input.stationsCount;
  const name = locale === 'en' ? pass.nameEn : pass.nameCs;

  return {
    id: `pass:${pass.id}`,
    kind: 'pass',
    passId: pass.id,
    label: name,
    totalAmount,
    amountPerStation: unitPrice,
    hoursCovered: coverage,
    bonusHours: Math.max(0, coverage - input.durationHours),
    breakdown: [{ label: name, qty: input.stationsCount, unitAmount: unitPrice }],
    isCredit: false,
    creditRemainderHours: 0,
    effectiveHourly: Math.round(unitPrice / coverage),
    savingsVsHourly: input.durationHours * baseTierAmount * input.stationsCount - totalAmount,
    fitsClosingTime: true,
    timeWindowLabel: `${formatClock(pass.windowStart)}–${formatClock(pass.windowEnd)}`,
  };
}

/**
 * Builds all candidate offers for a given input — spec §3.3.
 */
export function buildOffers(input: CalcInput, config: PricingConfig, locale: 'cs' | 'en' = 'cs'): Offer[] {
  const dayType = config.dayTypes.find((d) => d.key === input.dayTypeKey);
  if (!dayType) return [];

  const tiersForStation = config.hourTiers.filter((t) => t.stationType === input.stationType);
  const baseTierAmount = smallestActiveTierAmount(config.hourTiers, input.stationType) ?? 0;

  const closeHour = dayType.closeTime
    ? parseTimeToHours(dayType.closeTime) + (dayType.crossesMidnight ? 24 : 0)
    : input.startHour;
  const fitsClosingTime = input.durationHours <= closeHour - input.startHour;

  const offers: Offer[] = [];

  // 1. hours — always available
  const baseCombo = cheapestCombo(tiersForStation, input.durationHours);
  if (baseCombo) offers.push(buildHoursOffer('hours', baseCombo, input, baseTierAmount, fitsClosingTime));

  // 2. hours_upsell — exactly one tier level up, only if the extra hours are cheap enough
  const activeSorted = tiersForStation.filter((t) => t.isActive).sort((a, b) => a.hours - b.hours);
  const nextTier = activeSorted.find((t) => t.hours > input.durationHours);
  if (baseCombo && nextTier) {
    const nextCombo = cheapestCombo(tiersForStation, nextTier.hours);
    if (nextCombo && nextCombo.totalHours > baseCombo.totalHours) {
      const deltaAmount = nextCombo.amount - baseCombo.amount;
      const deltaHours = nextCombo.totalHours - baseCombo.totalHours;
      const smallestAmount = activeSorted[0].amount;
      if (deltaAmount / deltaHours < smallestAmount) {
        offers.push(buildHoursOffer('hours_upsell', nextCombo, input, baseTierAmount, fitsClosingTime));
      }
    }
  }

  // 3. pass — one per eligible active pass valid for this day type
  for (const passId of dayType.passIds) {
    const pass = config.timePasses.find((p) => p.id === passId && p.isActive);
    if (!pass) continue;
    const offer = buildPassOffer(pass, dayType, input, locale, baseTierAmount);
    if (offer) offers.push(offer);
  }

  return offers;
}

/**
 * Sorts, applies the dominance filter, and picks recommended / better-choice
 * — spec §3.5.
 */
export function rankOffers(offers: Offer[]): OfferResult | null {
  if (!offers.length) return null;

  const sorted = [...offers].sort((a, b) => a.totalAmount - b.totalAmount);
  const recommended = sorted[0];

  // Dominance filter: drop anything that's both pricier-or-equal AND doesn't
  // give more hours than the recommended offer.
  const survivors = sorted.filter(
    (o) => o === recommended || o.hoursCovered > recommended.hoursCovered,
  );

  const betterChoice =
    survivors.find(
      (o) => o !== recommended && o.totalAmount <= recommended.totalAmount && o.hoursCovered > recommended.hoursCovered,
    ) ?? null;

  const alternatives = survivors.filter((o) => o !== recommended && o !== betterChoice);

  return { recommended, betterChoice, alternatives, all: survivors };
}

export function calculatePricing(input: CalcInput, config: PricingConfig, locale: 'cs' | 'en' = 'cs'): OfferResult | null {
  return rankOffers(buildOffers(input, config, locale));
}
