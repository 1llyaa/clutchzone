import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { alternatesFor } from '@/lib/seo/alternates';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getPricingConfig } from '@/lib/pricing/config-server';
import KreditClient from './KreditClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const title = t('kreditTitle');
  const description = t('kreditDescription');
  return {
    title,
    description,
    alternates: alternatesFor(locale, '/kredit'),
    openGraph: { title, description, url: `/${locale}/kredit` },
  };
}

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
