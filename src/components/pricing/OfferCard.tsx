'use client';

import type { Offer } from '@/lib/pricing/types';
import SavingsBadge from './SavingsBadge';

interface Props {
  offer: Offer;
  creditExpiryMonths: number;
  badgeLabel?: string;
  isOverride?: boolean;
  onRevert?: () => void;
  upsell?: Offer | null;
  onApplyUpsell?: () => void;
  onReserve: () => void;
  onGoKredit: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function OfferCard({
  offer,
  creditExpiryMonths,
  badgeLabel = 'DOPORUČUJEME',
  isOverride = false,
  onRevert,
  upsell,
  onApplyUpsell,
  onReserve,
  onGoKredit,
}: Props) {
  return (
    <div
      style={{
        position: 'relative',
        background: '#111111',
        border: '1px solid #2A2A2A',
        borderTop: '2px solid #E84A1A',
        padding: 32,
        boxShadow: '0 0 60px rgba(232,74,26,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div
          style={{
            display: 'inline-block',
            fontFamily: "'Space Mono',monospace",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#E84A1A',
            background: 'rgba(232,74,26,0.15)',
            padding: '4px 10px',
            textTransform: 'uppercase',
          }}
        >
          {badgeLabel}
        </div>
        {isOverride && onRevert && (
          <button
            onClick={onRevert}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: 13, letterSpacing: 1.5, color: '#888888', textTransform: 'uppercase' }}
          >
            VRÁTIT ZPĚT
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
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: '#888888' }}>KČ</span>
      </div>

      <SavingsBadge amount={offer.savingsVsHourly} />

      {upsell && onApplyUpsell && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#1A1A1A', border: '1px solid #2A2A2A', padding: '12px 16px', marginTop: 12 }}>
          <span style={{ flex: 1, fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 16, color: '#FFFFFF', textTransform: 'uppercase' }}>
            Za +{upsell.totalAmount - offer.totalAmount} Kč máš {upsell.hoursCovered - offer.hoursCovered === 1 ? 'o hodinu' : `o ${upsell.hoursCovered - offer.hoursCovered} hodiny`} víc
          </span>
          <button
            onClick={onApplyUpsell}
            style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 1.5, lineHeight: 1, color: '#E84A1A', background: 'transparent', border: '1px solid #E84A1A', padding: '6px 14px', cursor: 'pointer', borderRadius: 2 }}
          >
            PŘIDAT
          </button>
        </div>
      )}

      <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 16, color: '#E8E8E8', marginTop: 10 }}>
        {offer.effectiveHourly} Kč / hodina
      </div>

      <div style={{ height: 1, background: '#2A2A2A', margin: '24px 0 16px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {offer.breakdown.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 1.5, color: '#E8E8E8', textTransform: 'uppercase' }}>
              {b.qty}× {b.label}
            </span>
            <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 16, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
              {b.unitAmount} KČ
            </span>
          </div>
        ))}
      </div>

      {offer.isCredit ? (
        <div
          style={{
            fontFamily: "'Space Mono',monospace",
            fontSize: 13,
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
          HODINY ZŮSTÁVAJÍ · PLATNOST {creditExpiryMonths} MĚSÍCE
        </div>
      ) : (
        <div
          style={{
            fontFamily: "'Space Mono',monospace",
            fontSize: 13,
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
          PLATÍ JEN V TOMTO ČASE · NEPŘENÁŠÍ SE
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
          borderRadius: 2,
          color: '#FFFFFF',
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 18,
          letterSpacing: 1.5,
          lineHeight: 1,
          cursor: 'pointer',
          textTransform: 'uppercase',
        }}
      >
        REZERVOVAT
      </button>
      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <a href="#kredit" onClick={onGoKredit} style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, color: '#E84A1A' }}>
          Nebo si kup jen hodiny do zásoby →
        </a>
      </div>
    </div>
  );
}
