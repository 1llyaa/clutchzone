import { createAdminClient } from '@/lib/supabase/admin';
import PricingClient from './PricingClient';

async function fetchPricingData() {
  const admin = createAdminClient();

  const [tiers, pc, ps5] = await Promise.all([
    admin.from('pricing_tiers').select('*').order('amount'),
    admin.from('pc_duration_prices').select('*').order('duration_h'),
    admin.from('ps5_duration_prices').select('*').order('duration_h'),
  ]);

  return {
    tiers: tiers.data ?? [],
    pcPrices: pc.data ?? [],
    ps5Prices: ps5.data ?? [],
  };
}

export default async function PricingPage() {
  const data = await fetchPricingData();
  return <PricingClient {...data} />;
}
