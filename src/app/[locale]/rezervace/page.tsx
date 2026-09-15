import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { alternatesFor } from '@/lib/seo/alternates';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RezervaceClient from './RezervaceClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const title = t('rezervaceTitle');
  const description = t('rezervaceDescription');
  return {
    title,
    description,
    alternates: alternatesFor(locale, '/rezervace'),
    openGraph: { title, description, url: `/${locale}/rezervace` },
  };
}

export default function RezervacePage() {
  return (
    <>
      <Navbar />
      {/* Suspense is required: the child reads useSearchParams, which opts out of
          prerendering. Without it the build fails instead of the page. */}
      <Suspense fallback={null}>
        <RezervaceClient />
      </Suspense>
      <Footer />
    </>
  );
}
