'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';

export default function KreditCancelledPage() {
  const t = useTranslations('kredit');
  const locale = useLocale();

  return (
    <>
      <Navbar />
      <main className="flex items-center justify-center" style={{ minHeight: '60vh', padding: '64px 16px' }}>
        <div className="relative w-full bg-cz-black-mid border border-cz-gray-dark rounded-cz" style={{ maxWidth: 560 }}>
          <span className="absolute top-0 left-0 right-0 bg-cz-orange rounded-t-cz" style={{ height: 2 }} />
          <div className="flex flex-col items-center text-center gap-6" style={{ padding: '40px 32px' }}>
            <span className="font-display text-white uppercase" style={{ fontSize: 28, letterSpacing: 1 }}>{t('cancelledTitle')}</span>
            <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 380 }}>
              {t('cancelledMessage')}
            </p>
            <div className="flex flex-col items-center gap-3 w-full">
              <Button href={`/${locale}/kredit`} className="w-full text-center">
                {t('tryAgain')}
              </Button>
              <Link href={`/${locale}`} className="font-mono text-cz-gray-light hover:text-white transition-colors" style={{ fontSize: 17, letterSpacing: 1 }}>
                {t('backHome')}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
