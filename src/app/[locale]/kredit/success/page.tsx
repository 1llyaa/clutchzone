'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { track } from '@/lib/analytics/track';

interface OrderStatus {
  reference: string;
  totalAmount: number;
  paymentStatus: string;
  expiresAt: string;
  items: { station_type: string; hours: number; quantity: number }[];
}

const MAX_POLL_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 1000;

function formatCzechDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${Number(d)}. ${Number(m)}. ${y}`;
}

export default function KreditSuccessPage() {
  const t = useTranslations('kredit');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    let cancelled = false;

    async function poll() {
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        if (cancelled) return;
        try {
          const res = await fetch(`/api/credits/${orderId}/status`);
          if (res.ok) {
            const data: OrderStatus = await res.json();
            if (cancelled) return;
            setStatus(data);
            if (data.paymentStatus === 'paid') { setLoading(false); return; }
          }
        } catch {
          // network hiccup — fall through to retry
        }
        if (cancelled) return;
        if (attempt < MAX_POLL_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
      if (!cancelled) setLoading(false);
    }

    poll();
    return () => { cancelled = true; };
  }, [orderId]);

  const isPaid = status?.paymentStatus === 'paid';

  const trackedRef = useRef(false);
  useEffect(() => {
    if (isPaid && status && !trackedRef.current) {
      trackedRef.current = true;
      track('credit_purchase_completed', { amount: status.totalAmount });
    }
  }, [isPaid, status]);

  return (
    <>
      <Navbar />
      <main className="flex items-center justify-center" style={{ minHeight: '60vh', padding: '64px 16px' }}>
        <div className="relative w-full bg-cz-black-mid border border-cz-gray-dark rounded-cz" style={{ maxWidth: 560 }}>
          <span className="absolute top-0 left-0 right-0 bg-cz-orange rounded-t-cz" style={{ height: 2 }} />
          <div className="flex flex-col items-center text-center gap-6" style={{ padding: '40px 32px' }}>
            <span className="font-display text-white uppercase" style={{ fontSize: 28, letterSpacing: 1 }}>
              {isPaid ? t('successTitlePaid') : t('successTitlePending')}
            </span>

            {loading && <p className="font-mono text-cz-gray-light" style={{ fontSize: 17, letterSpacing: 1 }}>{t('processingPayment')}</p>}

            {!loading && status && (
              <>
                <div>
                  <span className="font-mono text-cz-gray-light uppercase block" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 12 }}>{t('referenceLabel')}</span>
                  <div className="font-display text-white rounded-cz border border-cz-orange inline-block" style={{ fontSize: 48, letterSpacing: 4, padding: '16px 40px', background: 'rgba(232,74,26,0.06)' }}>
                    {status.reference}
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  {status.items.map((i) => (
                    <div key={`${i.station_type}-${i.hours}`} className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
                      <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>{i.station_type.toUpperCase()}</span>
                      <span className="font-mono text-white" style={{ fontSize: 17, letterSpacing: 1 }}>{i.quantity}× {i.hours}H</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
                    <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>{t('validUntilDone')}</span>
                    <span className="font-mono text-white" style={{ fontSize: 17, letterSpacing: 1 }}>{formatCzechDate(status.expiresAt)}</span>
                  </div>
                  <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
                    <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>{t('totalDone')}</span>
                    <span className="font-display text-cz-orange" style={{ fontSize: 20, letterSpacing: 1 }}>{status.totalAmount} Kč</span>
                  </div>
                </div>
                <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 380 }}>
                  {isPaid ? t('successNotePaid') : t('successNotePending')}
                </p>
              </>
            )}

            {!loading && !status && (
              <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 380 }}>
                {t('orderNotFound')}
              </p>
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
