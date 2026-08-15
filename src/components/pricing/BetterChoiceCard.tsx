'use client';

import type { Offer } from '@/lib/pricing/types';

interface Props {
  offer: Offer;
  recommended: Offer;
  onApply: () => void;
}

export default function BetterChoiceCard({ offer, recommended, onApply }: Props) {
  const extraHours = offer.hoursCovered - recommended.hoursCovered;
  return (
    <div
      style={{
        border: '1px solid #2A2A2A',
        borderLeft: '2px solid #E84A1A',
        background: '#111111',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, letterSpacing: 2, color: '#E84A1A', textTransform: 'uppercase', marginBottom: 8 }}>
          LEPŠÍ VOLBA
        </div>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, lineHeight: 1.75, color: '#E8E8E8' }}>
          {offer.label} dá o {extraHours === 1 ? 'hodinu' : `${extraHours} hodiny`} víc za{' '}
          {offer.totalAmount === recommended.totalAmount ? 'stejnou cenu' : `${offer.totalAmount} Kč`}.
        </div>
      </div>
      <button
        onClick={onApply}
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 16,
          letterSpacing: 1.5,
          lineHeight: 1,
          color: '#FFFFFF',
          background: '#E84A1A',
          border: '1px solid #E84A1A',
          padding: '10px 18px',
          cursor: 'pointer',
          borderRadius: 2,
        }}
      >
        POUŽÍT
      </button>
    </div>
  );
}
