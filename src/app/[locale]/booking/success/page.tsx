'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Tooltip from '@/components/ui/Tooltip';

interface BookingStatus {
  reference: string;
  stationLabel: string | null;
  date: string;
  startTime: string;
  totalPrice: number;
  paymentStatus: string;
  coinsAwarded: number;
}

const MAX_POLL_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 1000;

export default function BookingSuccessPage() {
  const t = useTranslations('booking');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');

  const [status, setStatus] = useState<BookingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function poll() {
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        if (cancelled) return;
        try {
          const res = await fetch(`/api/bookings/${bookingId}/status`);
          if (res.ok) {
            const data: BookingStatus = await res.json();
            if (cancelled) return;
            setStatus(data);
            if (data.paymentStatus === 'paid') {
              setLoading(false);
              return;
            }
          }
        } catch {
          // network hiccup — fall through to retry
        }
        if (cancelled) return;
        if (attempt < MAX_POLL_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }
      }
      // Hard upper bound reached without a confirmed `paid` status — stop polling
      // and fall back to a softer message rather than spinning forever.
      if (!cancelled) setLoading(false);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const isPaid = status?.paymentStatus === 'paid';

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
              {isPaid ? t('successTitle') : t('successUnconfirmedTitle')}
            </span>

            {loading && (
              <p className="font-mono text-cz-gray-light" style={{ fontSize: 17, letterSpacing: 1 }}>
                {t('paymentProcessing')}
              </p>
            )}

            {!loading && !status && (
              <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 380 }}>
                {t('successUnconfirmedMessage')}
              </p>
            )}

            {!loading && status && (
              <>
                {/* Reference */}
                <div>
                  <span
                    className="font-mono text-cz-gray-light uppercase block"
                    style={{ fontSize: 16, letterSpacing: 3, marginBottom: 12 }}
                  >
                    {t('referenceLabel')}
                  </span>
                  <div
                    className="font-display text-white rounded-cz border border-cz-orange inline-block"
                    style={{ fontSize: 48, letterSpacing: 4, padding: '16px 40px', background: 'rgba(232,74,26,0.06)' }}
                  >
                    {status.reference}
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
                    <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>
                      {t('stationLabel')}
                    </span>
                    <span className="font-mono text-white" style={{ fontSize: 17, letterSpacing: 1 }}>
                      {status.stationLabel}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
                    <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>
                      {t('selectDate')}
                    </span>
                    <span className="font-mono text-white" style={{ fontSize: 17, letterSpacing: 1 }}>
                      {status.date} {status.startTime?.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
                    <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>
                      {t('total')}
                    </span>
                    <span className="font-display text-cz-orange" style={{ fontSize: 20, letterSpacing: 1 }}>
                      {status.totalPrice} Kč
                    </span>
                  </div>
                </div>

                {isPaid ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cz-orange" style={{ fontSize: 17, letterSpacing: 1 }}>
                      {t('successCoinsMessage', { amount: status.coinsAwarded })}
                    </span>
                    <Tooltip content={t('coinsTooltip')}>
                      <span
                        className="font-mono text-cz-gray-light rounded-full border border-cz-gray-dark inline-flex items-center justify-center"
                        style={{ width: 22, height: 22, fontSize: 16, lineHeight: 1, cursor: 'help' }}
                      >
                        i
                      </span>
                    </Tooltip>
                  </div>
                ) : (
                  <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 380 }}>
                    {t('paymentProcessing')}
                  </p>
                )}
              </>
            )}

            <Link
              href={`/${locale}`}
              className="w-full bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark transition-colors rounded-[2px] border-none cursor-pointer inline-block text-center"
              style={{ fontSize: 17, letterSpacing: 2, padding: '14px' }}
            >
              {t('backHome')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
