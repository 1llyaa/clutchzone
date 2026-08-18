'use client';

import { useTranslations } from 'next-intl';
import type { Offer } from '@/lib/pricing/types';
import { labelText } from '@/lib/typography';

interface Props {
  offer: Offer;
  recommended: Offer;
  onApply: () => void;
}

export default function BetterChoiceCard({ offer, recommended, onApply }: Props) {
  const t = useTranslations('calculator');
  const extraHours = offer.hoursCovered - recommended.hoursCovered;
  const hoursText = extraHours === 1 ? t('sameHourSingular') : t('sameHourPlural', { n: extraHours });
  const priceText = offer.totalAmount === recommended.totalAmount ? t('samePrice') : `${offer.totalAmount} Kč`;

  return (
    <div
      style={{
        border: '1px solid var(--color-cz-gray-dark)',
        borderLeft: '2px solid var(--color-cz-orange)',
        background: '#111111',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <div style={{ flex: 1 }}>
        <div className="font-mono" style={{ ...labelText, letterSpacing: 2, color: 'var(--color-cz-orange)', textTransform: 'uppercase', marginBottom: 8 }}>
          {t('betterChoice')}
        </div>
        <div className="font-body" style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--color-cz-white-soft)' }}>
          {t('betterChoiceMoreHours', { label: offer.label, hours: hoursText, price: priceText })}
        </div>
      </div>
      <button
        onClick={onApply}
        className="font-display"
        style={{
          fontSize: 16,
          letterSpacing: 1.5,
          lineHeight: 1,
          color: '#FFFFFF',
          background: 'var(--color-cz-orange)',
          border: '1px solid var(--color-cz-orange)',
          padding: '10px 18px',
          cursor: 'pointer',
          borderRadius: 'var(--radius-control)',
        }}
      >
        {t('use')}
      </button>
    </div>
  );
}
