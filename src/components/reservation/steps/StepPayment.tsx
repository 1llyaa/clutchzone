'use client';

import { useEffect, useState } from 'react';
import Tooltip from '@/components/ui/Tooltip';
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
        <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 13, letterSpacing: 2 }}>K ÚHRADĚ</span>
        <span className="font-display text-white" style={{ fontSize: 28 }}>
          {offer.totalAmount} <span className="font-mono text-cz-gray-light" style={{ fontSize: 13 }}>KČ</span>
        </span>
      </div>

      <button
        onClick={() => onConfirm('online')}
        disabled={loading}
        className="w-full bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark transition-colors rounded-[2px] border-none cursor-pointer"
        style={{ fontSize: 17, letterSpacing: 2, padding: 14, opacity: loading ? 0.6 : 1 }}
      >
        {loading ? '...' : 'ZAPLATIT NYNÍ'}
      </button>

      <div className="flex items-center gap-2 justify-center">
        <span className="font-mono text-cz-orange" style={{ fontSize: 15, letterSpacing: 1 }}>+ {coinsAmount} MINCÍ</span>
        <Tooltip content="Mince se počítají do žebříčku a jdou vyměnit za odměny v klubu.">
          <span
            className="font-mono text-cz-gray-light rounded-full border border-cz-gray-dark inline-flex items-center justify-center"
            style={{ width: 18, height: 18, fontSize: 13, lineHeight: 1, cursor: 'help' }}
          >
            i
          </span>
        </Tooltip>
      </div>

      <button
        onClick={() => onConfirm('onsite')}
        disabled={loading}
        className="w-full font-display uppercase rounded-[2px] cursor-pointer transition-colors"
        style={{ fontSize: 15, letterSpacing: 2, padding: 12, background: 'transparent', border: '1.5px solid #2A2A2A', color: '#888', opacity: loading ? 0.6 : 1 }}
      >
        ZAPLATIT V KLUBU
      </button>

      {showCreditOption && (
        <button
          onClick={() => onConfirm('credit')}
          disabled={loading}
          className="w-full font-display uppercase rounded-[2px] cursor-pointer transition-colors"
          style={{ fontSize: 15, letterSpacing: 2, padding: 12, background: 'transparent', border: '1.5px solid #2A2A2A', color: '#888', opacity: loading ? 0.6 : 1 }}
        >
          MÁM KREDIT
        </button>
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
          borderRadius: 2,
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
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            color: '#fff',
          }}
        >
          {termsAccepted ? '✓' : ''}
        </div>
        <div className="font-body" style={{ fontSize: 15, lineHeight: 1.6, color: consentError ? '#E84A1A' : '#E8E8E8' }}>
          Souhlasím s <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'underline' }}>obchodními podmínkami</a>{' '}
          a beru na vědomí <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'underline' }}>zásady ochrany osobních údajů</a>.
          {offer.isCredit && ' Hodiny mají platnost 3 měsíce od nákupu. Nevyužité hodiny po uplynutí propadají.'}
        </div>
      </div>
      {consentError && (
        <p className="font-mono text-cz-orange" style={{ fontSize: 13, letterSpacing: 1 }}>
          BEZ SOUHLASU S PODMÍNKAMI NEMŮŽEME REZERVACI DOKONČIT.
        </p>
      )}

      {error && (
        <p className="font-mono text-cz-orange" style={{ fontSize: 15, letterSpacing: 1 }}>{error}</p>
      )}
    </div>
  );
}
