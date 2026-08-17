import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getPricingConfig } from '@/lib/pricing/config-server';
import KreditClient from './KreditClient';

export const dynamic = 'force-dynamic';

export default async function KreditPage() {
  const config = await getPricingConfig();
  const hourTiers = config.hourTiers.filter((t) => t.isActive);

  return (
    <>
      <Navbar />
      <KreditClient hourTiers={hourTiers} creditExpiryMonths={config.creditExpiryMonths} />
      <Footer />
    </>
  );
}
