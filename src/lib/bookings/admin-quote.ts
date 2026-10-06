import { calculatePricing } from '@/lib/pricing/engine';
import { dayTypeForDate } from '@/lib/pricing/dates';
import type { OfferKind, PricingConfig, StationType } from '@/lib/pricing/types';

export interface AdminQuote {
  amountPerStation: number;
  label: string;
  kind: OfferKind;
  passId: string | null;
}

/**
 * Price suggestion for a booking staff enter on the timeline. The engine works
 * in whole hours, so a half hour rounds up; the admin can overwrite the
 * number. Returns null on a closed day — there is no day type to price from,
 * and staff type the price themselves.
 *
 * `startMinutes` is on the club-day axis of `date` (Friday 25:00 = 1500).
 */
export function adminQuote(
  config: PricingConfig,
  input: {
    date: string;
    startMinutes: number;
    durationMinutes: number;
    stationType: StationType;
    stationsCount: number;
  },
): AdminQuote | null {
  const dayType = dayTypeForDate(config.dayTypes, input.date);
  if (!dayType) return null;

  const result = calculatePricing(
    {
      stationType: input.stationType,
      dayTypeKey: dayType.key,
      startHour: Math.floor(input.startMinutes / 60),
      durationHours: Math.max(1, Math.ceil(input.durationMinutes / 60)),
      stationsCount: input.stationsCount,
    },
    config,
  );
  if (!result) return null;

  const { recommended } = result;
  return {
    amountPerStation: recommended.amountPerStation,
    label: recommended.label,
    kind: recommended.kind,
    passId: recommended.passId,
  };
}
