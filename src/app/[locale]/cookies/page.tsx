import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LegalSection from '@/components/legal/LegalSection';
import { getLegalDocument } from '@/content/legal';
import CookieSettingsClient from './CookieSettingsClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cookies' });
  const title = `${t('heading')} — Clutch Zone`;
  return {
    title,
    alternates: { canonical: `/${locale}/cookies` },
    openGraph: { title, url: `/${locale}/cookies` },
  };
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cookies' });

  // The explanatory text is the cookies section of the privacy policy — kept
  // in one place so the two pages can't drift apart.
  const privacy = getLegalDocument('privacy', locale);
  const cookiesSection = privacy.sections.find((s) => s.id === 'cookies');

  return (
    <>
      <Navbar />
      <main className="bg-cz-black px-6 py-20 md:px-16 md:py-28">
        <div className="max-w-[760px] mx-auto">
          <span
            className="font-mono text-cz-orange uppercase block"
            style={{ fontSize: 16, letterSpacing: 4, marginBottom: 10 }}
          >
            {privacy.eyebrow}
          </span>
          <h1
            className="font-display text-white uppercase"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: 1.5, lineHeight: 0.95 }}
          >
            {t('heading')}
          </h1>

          <CookieSettingsClient />

          {cookiesSection && <LegalSection section={cookiesSection} />}
        </div>
      </main>
      <Footer />
    </>
  );
}
