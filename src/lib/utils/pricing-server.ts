import { createAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_PRICES, type PriceConfig } from '@/lib/utils/pricing';

// Builds the live price config from the DB, falling back to defaults
// for any missing rows.
export async function fetchPriceConfig(): Promise<PriceConfig> {
  const admin = createAdminClient();

  const [pc, ps5, tiers] = await Promise.all([
    admin.from('pc_duration_prices').select('duration_h, amount'),
    admin.from('ps5_duration_prices').select('duration_h, amount'),
    admin.from('pricing_tiers').select('tier, amount').in('tier', ['happy_hour', 'evening_pass', 'weekend_pass']),
  ]);

  const tierMap = Object.fromEntries((tiers.data ?? []).map((t) => [t.tier, t.amount])) as Record<string, number>;

  return {
    pc:  { ...DEFAULT_PRICES.pc,  ...Object.fromEntries((pc.data ?? []).map((r) => [r.duration_h, r.amount])) },
    ps5: { ...DEFAULT_PRICES.ps5, ...Object.fromEntries((ps5.data ?? []).map((r) => [r.duration_h, r.amount])) },
    happyHourRate: tierMap.happy_hour   ?? DEFAULT_PRICES.happyHourRate,
    eveningPass:   tierMap.evening_pass ?? DEFAULT_PRICES.eveningPass,
    weekendPass:   tierMap.weekend_pass ?? DEFAULT_PRICES.weekendPass,
  };
}
