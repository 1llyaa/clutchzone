import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/../i18n/routing';
import { ReservationProvider } from '@/components/reservation/ReservationContext';
import ReservationModal from '@/components/reservation/ReservationModal';
import JsonLd from '@/components/seo/JsonLd';
import CookieBar from '@/components/layout/CookieBar';
import '../globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clutchzone.club';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isCs = locale === 'cs';

  const title = isCs
    ? 'Clutch Zone — Esport Club České Budějovice'
    : 'Clutch Zone — Esports Club in České Budějovice';
  const description = isCs
    ? 'Prémiový esport gaming klub v Českých Budějovicích. Herní PC, PS5, turnaje a komunita.'
    : 'Premium esports gaming club in České Budějovice. Gaming PCs, PS5, tournaments and community.';

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: { cs: '/cs', en: '/en', 'x-default': '/cs' },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: isCs ? 'cs_CZ' : 'en_US',
      url: `/${locale}`,
      siteName: 'Clutch Zone',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'cs' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-cz-black">
        <JsonLd locale={locale} />
        <NextIntlClientProvider messages={messages}>
          <ReservationProvider>
            {children}
            <ReservationModal />
          </ReservationProvider>
          <CookieBar />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
