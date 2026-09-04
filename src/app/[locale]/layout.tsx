import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/../i18n/routing';
import { hreflangFor, ogLocaleFor, resolveLocale } from '@/lib/i18n/locales';
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
  const appLocale = resolveLocale(locale);

  const t = await getTranslations({ locale, namespace: 'meta' });
  const title = t('title');
  const description = t('description');

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [hreflangFor(l), `/${l}`])),
        'x-default': `/${routing.defaultLocale}`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: ogLocaleFor(appLocale),
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

  if (!routing.locales.includes(locale as 'cs' | 'en' | 'de' | 'ua')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={hreflangFor(resolveLocale(locale))} data-locale={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,100..900&family=Inter:wght@400;500;600;700&family=Oswald:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap"
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
