'use client';

import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { labelText, secondaryText, bodyText } from '@/lib/typography';

interface Props {
  reference: string;
  stationLabels: string[];
  date: string;
  startTime: string;
  totalAmount: number;
  offerLabel: string;
  isCredit: boolean;
  /** Paying with hours already banked — nothing is bought, nothing is due. */
  paysWithCredit: boolean;
  creditExpiryMonths: number;
  onClose: () => void;
}

export default function StepDone({ reference, stationLabels, date, startTime, totalAmount, offerLabel, isCredit, paysWithCredit, creditExpiryMonths, onClose }: Props) {
  const t = useTranslations('booking');
  return (
    <div className="flex flex-col items-center text-center gap-6" style={{ marginTop: 16 }}>
      <div>
        <span className="font-mono text-cz-gray-light uppercase block" style={{ ...labelText, letterSpacing: 3, marginBottom: 12 }}>
          {t('referenceLabel')}
        </span>
        <div
          className="font-display text-white rounded-cz border border-cz-orange inline-block"
          style={{ fontSize: 48, letterSpacing: 4, padding: '16px 40px', background: 'rgba(232,74,26,0.06)' }}
        >
          {reference}
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ ...labelText, letterSpacing: 2 }}>{t('stationsLabelDone')}</span>
          <span className="font-mono text-white" style={{ ...secondaryText, letterSpacing: 1 }}>{stationLabels.join(', ')}</span>
        </div>
        <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ ...labelText, letterSpacing: 2 }}>{t('variantLabel')}</span>
          <span className="font-mono text-white" style={{ ...secondaryText, letterSpacing: 1 }}>{offerLabel}</span>
        </div>
        <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ ...labelText, letterSpacing: 2 }}>{t('dateLabelDone')}</span>
          <span className="font-mono text-white" style={{ ...secondaryText, letterSpacing: 1 }}>{date} {startTime}</span>
        </div>
        <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ ...labelText, letterSpacing: 2 }}>{t('total')}</span>
          {paysWithCredit ? (
            <span className="font-mono text-white" style={{ ...secondaryText, letterSpacing: 1 }}>{t('paidWithCredit')}</span>
          ) : (
            <span className="font-display text-cz-orange" style={{ fontSize: 20, letterSpacing: 1 }}>{totalAmount} Kč</span>
          )}
        </div>
      </div>

      {/* isCredit means hours were BOUGHT. Spending banked hours buys none,
          so this note would contradict the "nothing to pay" line. */}
      {isCredit && !paysWithCredit && (
        <div style={{ background: 'rgba(232,74,26,0.08)', border: '1px solid rgba(232,74,26,0.25)', padding: '16px 18px', width: '100%' }}>
          <div className="font-mono text-cz-orange uppercase" style={{ ...labelText, fontWeight: 700, letterSpacing: 2 }}>{t('creditNoteTitle')}</div>
          <p className="font-body text-cz-gray-light" style={{ ...bodyText, marginTop: 8 }}>
            {t('creditNoteBody', { months: creditExpiryMonths })}
          </p>
        </div>
      )}

      <p className="font-body text-cz-gray-light" style={{ fontSize: 16, lineHeight: 1.6, maxWidth: 380 }}>
        {t('confirmationSentNote')}
      </p>

      <Button type="button" onClick={onClose} className="w-full">
        {t('close')}
      </Button>
    </div>
  );
}
