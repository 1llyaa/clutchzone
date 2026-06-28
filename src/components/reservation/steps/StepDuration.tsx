'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getDurationOptions, addHours } from '@/lib/utils/pricing';
import type { BookingForm, DurationOption } from '@/types';

interface Props {
  form: BookingForm;
  setForm: (f: BookingForm) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepDuration({ form, setForm, onNext, onBack }: Props) {
  const t = useTranslations('booking');
  const [available, setAvailable] = useState<number | null>(null);

  const options = getDurationOptions(form.stationType!, form.startTime, form.date);

  useEffect(() => {
    if (!form.option) return;
    const params = new URLSearchParams({
      date: form.date,
      start: form.startTime,
      duration: String(form.option.duration_minutes),
      type: form.stationType!,
    });
    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((d) => setAvailable(d.available ?? null));
  }, [form.option, form.date, form.startTime, form.stationType]);

  function select(opt: DurationOption) {
    setForm({ ...form, option: opt });
    setAvailable(null);
  }

  return (
    <div className="flex flex-col gap-4" style={{ marginTop: 8 }}>
      {/* Summary line */}
      <div className="font-mono text-cz-gray-light" style={{ fontSize: 11, letterSpacing: 1 }}>
        {form.stationType?.toUpperCase()} · {form.date} · {form.startTime}
      </div>

      {/* Duration cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {options.map((opt) => {
          const selected = form.option?.label === opt.label;
          return (
            <button
              key={opt.label}
              onClick={() => select(opt)}
              className="flex flex-col text-left cursor-pointer rounded-cz border transition-all duration-150"
              style={{
                padding: '20px 18px',
                background: selected ? 'rgba(232,74,26,0.08)' : '#0A0A0A',
                borderColor: selected ? '#E84A1A' : '#2A2A2A',
              }}
            >
              {(opt.isHappyHour || opt.isPass) && (
                <span
                  className="font-mono text-cz-orange uppercase"
                  style={{ fontSize: 9, letterSpacing: 2, marginBottom: 6 }}
                >
                  {opt.isHappyHour ? t('happyHourBadge') : t('passBadge')}
                </span>
              )}
              <span className="font-display text-white" style={{ fontSize: 22, letterSpacing: 1, lineHeight: 1 }}>
                {opt.label}
              </span>
              {opt.timeLabel && (
                <span className="font-mono text-cz-gray-mid" style={{ fontSize: 10, letterSpacing: 1, marginTop: 4 }}>
                  {opt.timeLabel}
                </span>
              )}
              {!opt.isPass && (
                <span className="font-mono text-cz-gray-mid" style={{ fontSize: 10, letterSpacing: 1, marginTop: 4 }}>
                  {form.startTime} – {addHours(form.startTime, opt.duration_h)}
                </span>
              )}
              <span className="font-display text-cz-orange" style={{ fontSize: 28, marginTop: 12, letterSpacing: 1 }}>
                {opt.amount}
                <span className="font-body text-cz-gray-light" style={{ fontSize: 13, marginLeft: 4, fontWeight: 400 }}>
                  Kč
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Approximate price note */}
      <p className="font-mono text-cz-gray-mid" style={{ fontSize: 10, letterSpacing: 1 }}>
        {t('priceApprox')}
      </p>

      {/* Availability */}
      {available !== null && (
        <p className="font-mono" style={{ fontSize: 11, letterSpacing: 1, color: available > 0 ? '#888' : '#E84A1A' }}>
          {available > 0 ? `${available} ${t('stationsFree')}` : t('errorUnavailable')}
        </p>
      )}

      {/* Nav */}
      <div className="flex gap-3" style={{ marginTop: 4 }}>
        <button
          onClick={onBack}
          className="font-display uppercase rounded-[2px] cursor-pointer"
          style={{ fontSize: 15, letterSpacing: 2, padding: '11px 24px', background: 'transparent', border: '1.5px solid #2A2A2A', color: '#888' }}
        >
          {t('back')}
        </button>
        <button
          onClick={onNext}
          disabled={!form.option}
          className="font-display uppercase rounded-[2px] flex-1"
          style={{
            fontSize: 15,
            letterSpacing: 2,
            padding: '11px 24px',
            background: form.option ? '#E84A1A' : '#2A2A2A',
            border: 'none',
            color: form.option ? '#fff' : '#555',
            cursor: form.option ? 'pointer' : 'not-allowed',
          }}
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
}
