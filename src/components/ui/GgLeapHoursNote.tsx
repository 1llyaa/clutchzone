'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatHours } from '@/lib/ggleap/hours';
import type { GgLeapHoursState } from '@/lib/ggleap/useGgLeapHours';
import { labelText, bodyText } from '@/lib/typography';

interface Props {
  state: GgLeapHoursState;
  minutes: number | null;
  /**
   * Booking length in minutes. When the balance falls short of it the note adds
   * a warning line. Omit where there is nothing to compare against (/kredit).
   */
  requiredMinutes?: number | null;
}

/**
 * Remaining-hours note shown next to a ggLeap nickname. Purely informational —
 * it never blocks or disables the payment options around it.
 */
export default function GgLeapHoursNote({ state, minutes, requiredMinutes = null }: Props) {
  const t = useTranslations('ggleap');
  const locale = useLocale();

  if (state === 'idle') return null;

  const notEnough = state === 'ok' && requiredMinutes !== null && (minutes ?? 0) < requiredMinutes;
  const muted = state === 'not_found' || state === 'unavailable';

  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 'var(--radius-control)',
        border: `1px solid ${notEnough ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)'}`,
        background: '#0A0A0A',
      }}
    >
      {state === 'loading' && (
        <p className="font-mono text-cz-gray-light uppercase" style={{ ...labelText, letterSpacing: 2 }}>
          {t('checking')}
        </p>
      )}

      {state === 'ok' && (
        <p className="font-body" style={{ ...bodyText, color: 'var(--color-cz-white-soft)' }}>
          {t('hours', { hours: formatHours(minutes ?? 0, locale) })}
        </p>
      )}

      {muted && (
        <p className="font-body" style={{ ...bodyText, color: 'var(--color-cz-warning)' }}>
          {state === 'not_found' ? t('notFound') : t('unavailable')}
        </p>
      )}

      {notEnough && (
        <p className="font-mono text-cz-orange uppercase" style={{ ...labelText, letterSpacing: 1, marginTop: 6 }}>
          {t('notEnough')}
        </p>
      )}
    </div>
  );
}
