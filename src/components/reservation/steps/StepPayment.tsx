'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import type { BookingForm, BookingResult } from '@/types';

interface Props {
  result: BookingResult;
  form: BookingForm;
  onPayAtClub: () => void;
}

export default function StepPayment({ result, form, onPayAtClub }: Props) {
  const t = useTranslations('booking');
  const locale = useLocale();
  const [coinsAmount, setCoinsAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/settings/pay-now-coins')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data?.amount === 'number') {
          setCoinsAmount(data.amount);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePayNow() {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${result.id}/checkout`, {
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
    <div className="flex flex-col items-center text-center gap-6" style={{ marginTop: 16 }}>
      {/* Reference */}
      <div>
        <span
          className="font-mono text-cz-gray-light uppercase block"
          style={{ fontSize: 10, letterSpacing: 3, marginBottom: 12 }}
        >
          {t('referenceLabel')}
        </span>
        <div
          className="font-display text-white rounded-cz border border-cz-orange inline-block"
          style={{ fontSize: 48, letterSpacing: 4, padding: '16px 40px', background: 'rgba(232,74,26,0.06)' }}
        >
          {result.reference}
        </div>
      </div>

      {/* Order summary */}
      <div className="flex flex-col gap-3 w-full">
        <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
            {t('stationLabel')}
          </span>
          <span className="font-mono text-white" style={{ fontSize: 12, letterSpacing: 1 }}>
            {result.stationLabel}
          </span>
        </div>
        <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
            {t('total')}
          </span>
          <span className="font-display text-cz-orange" style={{ fontSize: 20, letterSpacing: 1 }}>
            {form.option?.amount} Kč
          </span>
        </div>
      </div>

      {/* Pay now — primary CTA */}
      <div className="flex flex-col items-center gap-3 w-full">
        <Button
          variant="primary"
          className="w-full"
          onClick={handlePayNow}
          disabled={loading}
        >
          {loading ? t('paymentProcessing') : t('payNowCta')}
        </Button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-cz-orange" style={{ fontSize: 13, letterSpacing: 1 }}>
            {t('coinsEarned', { amount: coinsAmount })}
          </span>
          <Tooltip content={t('coinsTooltip')}>
            <span
              className="font-mono text-cz-gray-light rounded-full border border-cz-gray-dark inline-flex items-center justify-center"
              style={{ width: 16, height: 16, fontSize: 10, lineHeight: 1, cursor: 'help' }}
            >
              i
            </span>
          </Tooltip>
        </div>

        {error && (
          <p className="font-mono text-cz-orange" style={{ fontSize: 11, letterSpacing: 1 }}>
            {error}
          </p>
        )}
      </div>

      {/* Pay at club — secondary/ghost CTA */}
      <Button variant="ghost" size="sm" className="w-full" onClick={onPayAtClub} disabled={loading}>
        {t('payAtClubCta')}
      </Button>
    </div>
  );
}
