'use client';

import type { DayTypeGroup } from '@/lib/pricing/types';

export default function ImpactPanel({ dayTypes, isDirty }: { dayTypes: DayTypeGroup[]; isDirty: boolean }) {
  const tooMany = dayTypes.length > 5;

  return (
    <div
      style={{
        background: '#111111',
        border: `1px solid ${tooMany ? 'rgba(232,74,26,0.4)' : '#2A2A2A'}`,
        borderRadius: 2,
        padding: '20px 24px',
        marginBottom: 32,
      }}
    >
      {isDirty && (
        <div
          className="font-mono uppercase inline-block"
          style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: '#E84A1A', background: 'rgba(232,74,26,0.15)', padding: '4px 10px', marginBottom: 14 }}
        >
          NÁHLED NEULOŽENÝCH ZMĚN
        </div>
      )}
      <div className="font-mono uppercase" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2.5, color: tooMany ? '#E84A1A' : '#888888' }}>
        {tooMany
          ? `PŘÍLIŠ MNOHO SKUPIN DNÍ (${dayTypes.length}/5) — ZVAŽ ZJEDNODUŠENÍ CENÍKU`
          : `KALKULAČKA BUDE MÍT ${dayTypes.length} ${dayTypes.length === 1 ? 'SKUPINU' : dayTypes.length < 5 ? 'SKUPINY' : 'SKUPIN'} DNÍ`}
      </div>
      <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 14 }}>
        {dayTypes.map((g) => (
          <span
            key={g.key}
            className="font-mono"
            style={{ fontSize: 15, letterSpacing: 1, color: '#E8E8E8', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 100, padding: '5px 12px' }}
          >
            {g.label}
          </span>
        ))}
      </div>
    </div>
  );
}
