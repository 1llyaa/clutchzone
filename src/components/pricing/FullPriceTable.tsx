'use client';

import { useState } from 'react';
import type { PricingConfig } from '@/lib/pricing/types';

function formatTime(t: string): string {
  return t.slice(0, 5);
}

export default function FullPriceTable({ config }: { config: PricingConfig }) {
  const [open, setOpen] = useState(false);

  const pc = config.hourTiers.filter((t) => t.stationType === 'pc' && t.isActive).sort((a, b) => a.hours - b.hours);
  const ps5 = config.hourTiers.filter((t) => t.stationType === 'ps5' && t.isActive).sort((a, b) => a.hours - b.hours);
  const passes = config.timePasses.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  const tables = [
    { title: 'PC HODINY (KREDIT)', rows: pc.map((t) => ({ label: `${t.hours}H`, value: `${t.amount} KČ` })) },
    { title: 'PS5 HODINY (KREDIT)', rows: ps5.map((t) => ({ label: `${t.hours}H`, value: `${t.amount} KČ` })) },
    {
      title: 'ČASOVÉ PASY',
      rows: passes.map((p) => ({
        label: p.nameCs,
        value: `${p.amount} KČ · ${formatTime(p.windowStart)}–${formatTime(p.windowEnd)}`,
      })),
    },
  ].filter((t) => t.rows.length > 0);

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto 0', borderTop: '1px solid #2A2A2A', paddingTop: 24 }}>
      <button
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        onClick={() => setOpen((v) => !v)}
      >
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 1, color: '#FFFFFF', textTransform: 'uppercase' }}>
          KOMPLETNÍ CENÍK
        </span>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, letterSpacing: 2, color: '#E84A1A' }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, marginTop: 32, minWidth: 0 }}>
          {tables.map((t) => (
            <div key={t.title} style={{ minWidth: 0, background: '#111111', border: '1px solid #2A2A2A', padding: 24 }}>
              <div
                style={{
                  fontFamily: "'Space Mono',monospace",
                  fontSize: 13,
                  letterSpacing: 2.5,
                  color: '#E84A1A',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: '1px solid #2A2A2A',
                }}
              >
                {t.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {t.rows.map((r) => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, padding: '8px 0', borderBottom: '1px solid #2A2A2A' }}>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 1.5, color: '#E8E8E8', textTransform: 'uppercase' }}>{r.label}</span>
                    <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 16, color: '#FFFFFF', whiteSpace: 'nowrap' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
