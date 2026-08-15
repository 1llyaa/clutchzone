import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { deriveDayTypes } from './dayTypes';
import type { HourTier, OpeningHoursRow, PricingConfig, TimePass } from './types';

async function loadPricingConfig(): Promise<PricingConfig> {
  const admin = createAdminClient();

  const [hourTiersRes, timePassesRes, openingHoursRes, settingsRes] = await Promise.all([
    admin.from('hour_tiers').select('*').order('station_type').order('sort_order'),
    admin.from('time_passes').select('*').order('sort_order'),
    admin.from('opening_hours').select('*').order('day_of_week'),
    admin.from('site_settings').select('value').eq('key', 'credit_expiry_months').single(),
  ]);

  const hourTiers: HourTier[] = (hourTiersRes.data ?? []).map((r) => ({
    id: r.id,
    stationType: r.station_type,
    hours: r.hours,
    amount: r.amount,
    isActive: r.is_active,
    sortOrder: r.sort_order,
  }));

  const timePasses: TimePass[] = (timePassesRes.data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    nameCs: r.name_cs,
    nameEn: r.name_en,
    descriptionCs: r.description_cs,
    descriptionEn: r.description_en,
    stationType: r.station_type,
    priceMode: r.price_mode,
    amount: r.amount,
    daysOfWeek: r.days_of_week,
    windowStart: r.window_start,
    windowEnd: r.window_end,
    crossesMidnight: r.crosses_midnight,
    maxHours: r.max_hours,
    isActive: r.is_active,
    sortOrder: r.sort_order,
  }));

  const openingHours: OpeningHoursRow[] = (openingHoursRes.data ?? []).map((r) => ({
    dayOfWeek: r.day_of_week,
    isClosed: r.is_closed,
    openTime: r.open_time,
    closeTime: r.close_time,
    crossesMidnight: r.crosses_midnight,
  }));

  return {
    hourTiers,
    timePasses,
    openingHours,
    dayTypes: deriveDayTypes(openingHours, timePasses),
    creditExpiryMonths: Number(settingsRes.data?.value ?? 3),
  };
}

export const getPricingConfig = unstable_cache(loadPricingConfig, ['pricing-config'], {
  tags: ['pricing'],
  revalidate: 60,
});
