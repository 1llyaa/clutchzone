'use client';

import { useTranslations } from 'next-intl';

export default function SavingsBadge({ amount }: { amount: number }) {
  const t = useTranslations('calculator');
  if (amount <= 0) return null;
  return (
    <div
      className="font-mono"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: 1,
        color: 'var(--color-cz-orange)',
        marginTop: 12,
      }}
    >
      {t('savings', { amount })}
    </div>
  );
}
