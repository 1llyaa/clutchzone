'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import type { Offer } from '@/lib/pricing/types';
import { labelText, secondaryText } from '@/lib/typography';
import SavingsBadge from './SavingsBadge';

interface Props {
  offer: Offer;
  creditExpiryMonths: number;
  badgeLabel?: string;
  isOverride?: boolean;
  onRevert?: () => void;
  upsell?: Offer | null;
  onApplyUpsell?: () => void;
  alts?: Offer[];
  onSelectAlt?: (id: string) => void;
  onReserve: () => void;
  reserveLabel?: string;
  showKreditLink?: boolean;
}

export default function OfferCard({
  offer,
  creditExpiryMonths,
  badgeLabel,
  isOverride = false,
  onRevert,
  upsell,
  onApplyUpsell,
  alts = [],
  onSelectAlt,
  onReserve,
  reserveLabel,
  showKreditLink = false,
}: Props) {
  const t = useTranslations('calculator');
  const resolvedBadgeLabel = badgeLabel ?? t('recommended');
  const resolvedReserveLabel = reserveLabel ?? t('reserve');
  const upsellHoursDelta = upsell ? upsell.hoursCovered - offer.hoursCovered : 0;

  return (
    <div
      style={{
        position: 'relative',
        background: '#111111',
        border: '1px solid #2A2A2A',
        borderTop: '2px solid #E84A1A',
        padding: 32,
        boxShadow: 'var(--shadow-ambient-glow)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div
          style={{
            display: 'inline-block',
            fontFamily: "'Space Mono',monospace",
            ...labelText,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#E84A1A',
            background: 'rgba(232,74,26,0.15)',
            padding: '4px 10px',
            textTransform: 'uppercase',
          }}
        >
          {resolvedBadgeLabel}
        </div>
        {isOverride && onRevert && (
          <button
            onClick={onRevert}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Space Mono',monospace", ...labelText, letterSpacing: 1.5, color: '#888888', textTransform: 'uppercase' }}
          >
            {t('revert')}
          </button>
        )}
      </div>

      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 1, color: '#FFFFFF', textTransform: 'uppercase', marginTop: 16 }}>
        {offer.label}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 88, lineHeight: 0.9, letterSpacing: 1, color: '#FFFFFF' }}>
          {offer.totalAmount}
        </span>
        <span style={{ fontFamily: "'Space Mono',monospace", ...secondaryText, color: '#888888' }}>KČ</span>
      </div>

      <SavingsBadge amount={offer.savingsVsHourly} />

      <div className="font-body" style={{ fontWeight: 500, fontSize: 16, color: '#E8E8E8', marginTop: 10 }}>
        {t('perHour', { amount: offer.effectiveHourly })}
      </div>

      <div style={{ height: 1, background: '#2A2A2A', margin: '24px 0 16px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {offer.breakdown.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
            <span style={{ fontFamily: "'Space Mono',monospace", ...labelText, letterSpacing: 1.5, color: '#E8E8E8', textTransform: 'uppercase' }}>
              {b.qty}× {b.label}
            </span>
            <span className="font-body" style={{ fontWeight: 500, fontSize: 16, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
              {b.unitAmount} KČ
            </span>
          </div>
        ))}
      </div>

      {offer.isCredit ? (
        <div
          style={{
            fontFamily: "'Space Mono',monospace",
            ...labelText,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#E84A1A',
            background: 'rgba(232,74,26,0.08)',
            border: '1px solid rgba(232,74,26,0.25)',
            padding: '10px 14px',
            marginTop: 20,
            textTransform: 'uppercase',
          }}
        >
          {t('creditTag', { months: creditExpiryMonths })}
        </div>
      ) : (
        <div
          style={{
            fontFamily: "'Space Mono',monospace",
            ...labelText,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#888888',
            background: '#1A1A1A',
            border: '1px solid #2A2A2A',
            padding: '10px 14px',
            marginTop: 20,
            textTransform: 'uppercase',
          }}
        >
          {t('timeTag', { window: offer.timeWindowLabel ?? t('timeTagDefault') })}
        </div>
      )}

      {upsell && onApplyUpsell && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#1A1A1A', border: '1px solid #E84A1A', padding: '12px 16px', marginTop: 16 }}>
          <span className="font-body" style={{ flex: 1, fontWeight: 500, fontSize: 16, color: '#FFFFFF', textTransform: 'uppercase' }}>
            {t('upsellText', {
              delta: upsell.totalAmount - offer.totalAmount,
              hours: upsellHoursDelta === 1 ? t('hourSingular') : t('hourPlural', { n: upsellHoursDelta }),
            })}
          </span>
          <button
            onClick={onApplyUpsell}
            style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 1.5, lineHeight: 1, color: '#E84A1A', background: 'transparent', border: '1px solid #E84A1A', padding: '6px 14px', cursor: 'pointer', borderRadius: 'var(--radius-control)' }}
          >
            {t('add')}
          </button>
        </div>
      )}

      {alts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", ...labelText, letterSpacing: 2.5, color: '#E8E8E8', textTransform: 'uppercase' }}>
            {t('orTopUp')}
          </div>
          {alts.map((a) => {
            const delta = a.totalAmount - offer.totalAmount;
            return (
              <div
                key={a.id}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 'var(--radius-control)' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 1, color: '#FFFFFF', textTransform: 'uppercase' }}>
                    {a.label}
                  </div>
                  <div style={{ fontFamily: "'Space Mono',monospace", ...labelText, letterSpacing: 1, marginTop: 6, color: a.isCredit ? '#E84A1A' : '#888888', textTransform: 'uppercase' }}>
                    {a.isCredit ? t('timeTagAltCredit') : t('timeTagAlt', { window: a.timeWindowLabel ?? t('timeTagDefault') })} · {a.effectiveHourly} KČ/H
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 1, color: '#FFFFFF' }}>
                    {a.totalAmount} <span style={{ fontFamily: "'Space Mono',monospace", ...secondaryText, letterSpacing: 1.5, color: '#E8E8E8' }}>KČ</span>
                  </div>
                  <div style={{ fontFamily: "'Space Mono',monospace", ...secondaryText, fontWeight: 700, letterSpacing: 1, color: delta > 0 ? '#888888' : '#E84A1A', marginTop: 4 }}>
                    {delta > 0 ? `+${delta} KČ` : delta < 0 ? `${delta} KČ` : '='}
                  </div>
                </div>
                <button
                  onClick={() => onSelectAlt?.(a.id)}
                  style={{
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: 16,
                    letterSpacing: 1.5,
                    lineHeight: 1,
                    color: '#E84A1A',
                    background: 'transparent',
                    border: '1.5px solid #E84A1A',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-control)',
                  }}
                >
                  {t('select')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={onReserve}
        style={{
          width: '100%',
          height: 56,
          marginTop: 20,
          background: '#E84A1A',
          border: '1.5px solid #E84A1A',
          borderRadius: 'var(--radius-control)',
          color: '#FFFFFF',
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 18,
          letterSpacing: 1.5,
          lineHeight: 1,
          cursor: 'pointer',
          textTransform: 'uppercase',
        }}
      >
        {resolvedReserveLabel}
      </button>
      {showKreditLink && (
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <Link href="/kredit" className="font-body" style={{ fontSize: 16, color: '#E84A1A' }}>
            {t('buyHoursLink')}
          </Link>
        </div>
      )}
    </div>
  );
}
