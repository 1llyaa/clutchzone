import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/../i18n/routing';
import { ReservationProvider } from '@/components/reservation/ReservationContext';
import ReservationModal from '@/components/reservation/ReservationModal';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Clutch Zone — Esport Club České Budějovice',
  description:
    'Prémiový esport gaming klub v Českých Budějovicích. Herní PC, PS5, turnaje a komunita.',
  openGraph: {
    title: 'Clutch Zone — Esport Club České Budějovice',
    description: 'Prémiový esport gaming klub v Českých Budějovicích.',
    type: 'website',
  },
};

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
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-cz-black">
        <NextIntlClientProvider messages={messages}>
          <ReservationProvider>
            {children}
            <ReservationModal />
          </ReservationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
