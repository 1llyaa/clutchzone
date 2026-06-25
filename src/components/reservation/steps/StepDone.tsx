'use client';

import { useTranslations } from 'next-intl';
import type { BookingForm, BookingResult } from '@/types';

interface Props {
  result: BookingResult;
  form: BookingForm;
  onClose: () => void;
}

export default function StepDone({ result, form, onClose }: Props) {
  const t = useTranslations('booking');

  return (
    <div className="flex flex-col items-center text-center gap-6" style={{ marginTop: 16 }}>
      {/* Reference */}
      <div>
        <span
          className="font-mono text-cz-gray-light uppercase block"
          style={{ fontSize: 10, letterSpacing: 3, marginBottom: 12 }}
        >
          {t('referenceLabel')}
        </span>
        <div
          className="font-display text-white rounded-cz border border-cz-orange inline-block"
          style={{ fontSize: 48, letterSpacing: 4, padding: '16px 40px', background: 'rgba(232,74,26,0.06)' }}
        >
          {result.reference}
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-3 w-full">
        <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
            {t('stationLabel')}
          </span>
          <span className="font-mono text-white" style={{ fontSize: 12, letterSpacing: 1 }}>
            {result.stationLabel}
          </span>
        </div>
        <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
            {t('selectDate')}
          </span>
          <span className="font-mono text-white" style={{ fontSize: 12, letterSpacing: 1 }}>
            {form.date} {form.startTime}
          </span>
        </div>
        <div className="flex justify-between border-b border-cz-gray-dark" style={{ paddingBottom: 12 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
            {t('total')}
          </span>
          <span className="font-display text-cz-orange" style={{ fontSize: 20, letterSpacing: 1 }}>
            {form.option?.amount} Kč
          </span>
        </div>
      </div>

      <p className="font-body text-cz-gray-light" style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 380 }}>
        {t('doneMessage')}
      </p>

      <button
        onClick={onClose}
        className="w-full bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark transition-colors rounded-[2px] border-none cursor-pointer"
        style={{ fontSize: 17, letterSpacing: 2, padding: '14px' }}
      >
        {t('close')}
      </button>
    </div>
  );
}
