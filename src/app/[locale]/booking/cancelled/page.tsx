'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';

export default function BookingCancelledPage() {
  const t = useTranslations('booking');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleTryAgain() {
    if (!bookingId || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url; // full redirect — intentionally leaves the SPA
      } else {
        setError(data.error ?? t('errorGeneral'));
        setLoading(false);
      }
    } catch {
      setError(t('errorGeneral'));
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex items-center justify-center" style={{ minHeight: '60vh', padding: '64px 16px' }}>
        <div
          className="relative w-full bg-cz-black-mid border border-cz-gray-dark rounded-cz"
          style={{ maxWidth: 560 }}
        >
          <span className="absolute top-0 left-0 right-0 bg-cz-orange rounded-t-cz" style={{ height: 2 }} />

          <div className="flex flex-col items-center text-center gap-6" style={{ padding: '40px 32px' }}>
            <span className="font-display text-white uppercase" style={{ fontSize: 28, letterSpacing: 1 }}>
              {t('cancelledTitle')}
            </span>

            <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 380 }}>
              {t('cancelledMessage')}
            </p>

            {error && (
              <p className="font-mono text-cz-orange" style={{ fontSize: 17, letterSpacing: 1 }}>
                {error}
              </p>
            )}

            <div className="flex flex-col items-center gap-3 w-full">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleTryAgain}
                disabled={loading || !bookingId}
              >
                {loading ? t('paymentProcessing') : t('tryAgain')}
              </Button>

              <Link
                href={`/${locale}`}
                className="font-mono text-cz-gray-light hover:text-white transition-colors"
                style={{ fontSize: 17, letterSpacing: 1 }}
              >
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
