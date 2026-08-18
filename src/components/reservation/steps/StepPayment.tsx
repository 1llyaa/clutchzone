'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Check } from '@phosphor-icons/react';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import { labelText, secondaryText, bodyText } from '@/lib/typography';
import type { Offer } from '@/lib/pricing/types';

interface Props {
  offer: Offer;
  termsAccepted: boolean;
  onToggleConsent: () => void;
  consentError: boolean;
  loading: boolean;
  error: string;
  onConfirm: (method: 'online' | 'onsite' | 'credit') => void;
  showCreditOption: boolean;
}

export default function StepPayment({ offer, termsAccepted, onToggleConsent, consentError, loading, error, onConfirm, showCreditOption }: Props) {
  const t = useTranslations('booking');
  const [coinsAmount, setCoinsAmount] = useState(50);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/settings/pay-now-coins')
      .then((res) => res.json())
      .then((data) => { if (!cancelled && typeof data?.amount === 'number') setCoinsAmount(data.amount); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col gap-4" style={{ marginTop: 8 }}>
      <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
        <span className="font-mono text-cz-gray-light uppercase" style={{ ...labelText, letterSpacing: 2 }}>{t('amountDue')}</span>
        <span className="font-display text-white" style={{ fontSize: 28 }}>
          {offer.totalAmount} <span className="font-mono text-cz-gray-light" style={{ ...secondaryText }}>KČ</span>
        </span>
      </div>

      <Button variant="primary" size="md" className="w-full" onClick={() => onConfirm('online')} disabled={loading}>
        {loading ? '...' : t('payNowCta')}
      </Button>

      <div className="flex items-center gap-2 justify-center">
        <span className="font-mono text-cz-orange" style={{ ...secondaryText, letterSpacing: 1 }}>{t('coinsAmount', { amount: coinsAmount })}</span>
        <Tooltip content={t('coinsTooltipNew')}>
          <span
            className="font-mono text-cz-gray-light rounded-full border border-cz-gray-dark inline-flex items-center justify-center"
            style={{ width: 20, height: 20, ...labelText, lineHeight: 1, cursor: 'help' }}
          >
            i
          </span>
        </Tooltip>
      </div>

      <Button variant="ghost" size="sm" className="w-full" onClick={() => onConfirm('onsite')} disabled={loading}>
        {t('payAtClubCta')}
      </Button>

      {showCreditOption && (
        <Button variant="ghost" size="sm" className="w-full" onClick={() => onConfirm('credit')} disabled={loading}>
          {t('haveCredit')}
        </Button>
      )}

      <div
        onClick={onToggleConsent}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          minHeight: 44,
          padding: '12px 14px',
          marginTop: 6,
          borderRadius: 'var(--radius-control)',
          border: `1px solid ${consentError ? '#E84A1A' : '#2A2A2A'}`,
          background: '#0A0A0A',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            flexShrink: 0,
            marginTop: 2,
            border: `1.5px solid ${termsAccepted || consentError ? '#E84A1A' : '#555555'}`,
            background: termsAccepted ? '#E84A1A' : 'transparent',
            borderRadius: 'var(--radius-control)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          {termsAccepted && <Check weight="bold" size={14} />}
        </div>
        <div className="font-body" style={{ ...bodyText, color: consentError ? '#E84A1A' : '#E8E8E8' }}>
          {t('agreeTermsPrefix')}{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'underline' }}>{t('termsLink')}</a>{' '}
          {t('andAcknowledge')}{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'underline' }}>{t('privacyLink')}</a>.
          {offer.isCredit && ` ${t('creditExpiryNote', { months: 3 })}`}
        </div>
      </div>
      {consentError && (
        <p className="font-mono text-cz-orange" style={{ ...labelText, letterSpacing: 1 }}>
          {t('consentErrorBooking')}
        </p>
      )}

      {error && (
        <p className="font-mono text-cz-orange" style={{ ...labelText, letterSpacing: 1 }}>{error}</p>
      )}
    </div>
  );
}
