'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { PricingConfig } from '@/lib/pricing/types';
import { labelText } from '@/lib/typography';

function formatTime(t: string): string {
  return t.slice(0, 5);
}

export default function FullPriceTable({ config }: { config: PricingConfig }) {
  const t = useTranslations('calculator');
  const locale = useLocale() === 'en' ? 'en' : 'cs';
  const [open, setOpen] = useState(false);

  const pc = config.hourTiers.filter((tier) => tier.stationType === 'pc' && tier.isActive).sort((a, b) => a.hours - b.hours);
  const ps5 = config.hourTiers.filter((tier) => tier.stationType === 'ps5' && tier.isActive).sort((a, b) => a.hours - b.hours);
  const passes = config.timePasses.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  const tables = [
    { title: t('pcHoursTitle'), rows: pc.map((tier) => ({ label: `${tier.hours}H`, value: `${tier.amount} KČ` })) },
    { title: t('ps5HoursTitle'), rows: ps5.map((tier) => ({ label: `${tier.hours}H`, value: `${tier.amount} KČ` })) },
    {
      title: t('timePassesTitle'),
      rows: passes.map((p) => ({
        label: locale === 'en' ? p.nameEn : p.nameCs,
        value: `${p.amount} KČ · ${formatTime(p.windowStart)}–${formatTime(p.windowEnd)}`,
      })),
    },
  ].filter((table) => table.rows.length > 0);

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto 0', borderTop: '1px solid var(--color-cz-gray-dark)', paddingTop: 24 }}>
      <button
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-display" style={{ fontSize: 28, letterSpacing: 1, color: '#FFFFFF', textTransform: 'uppercase' }}>
          {t('fullPriceTable')}
        </span>
        <span className="font-mono" style={{ ...labelText, letterSpacing: 2, color: 'var(--color-cz-orange)' }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, marginTop: 32, minWidth: 0 }}>
          {tables.map((table) => (
            <div key={table.title} style={{ minWidth: 0, background: '#111111', border: '1px solid var(--color-cz-gray-dark)', padding: 24 }}>
              <div
                className="font-mono"
                style={{
                  ...labelText,
                  letterSpacing: 2.5,
                  color: 'var(--color-cz-orange)',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: '1px solid var(--color-cz-gray-dark)',
                }}
              >
                {table.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {table.rows.map((r) => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--color-cz-gray-dark)' }}>
                    <span className="font-mono" style={{ ...labelText, letterSpacing: 1.5, color: 'var(--color-cz-white-soft)', textTransform: 'uppercase' }}>{r.label}</span>
                    <span className="font-body" style={{ fontWeight: 500, fontSize: 16, color: '#FFFFFF', whiteSpace: 'nowrap' }}>{r.value}</span>
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
