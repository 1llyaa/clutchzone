'use client';

import { useTranslations } from 'next-intl';

export default function SavingsBadge({ amount }: { amount: number }) {
  const t = useTranslations('calculator');
  if (amount <= 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: "'Space Mono',monospace",
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: 1,
        color: '#E84A1A',
        marginTop: 12,
      }}
    >
      {t('savings', { amount })}
    </div>
  );
}
