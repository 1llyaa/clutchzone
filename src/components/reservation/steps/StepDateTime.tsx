'use client';

import { useTranslations } from 'next-intl';
import { getStartTimeSlots, getOpeningHours } from '@/lib/utils/pricing';
import type { BookingForm } from '@/types';

interface Props {
  form: BookingForm;
  setForm: (f: BookingForm) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepDateTime({ form, setForm, onNext, onBack }: Props) {
  const t = useTranslations('booking');

  const today = new Date().toISOString().split('T')[0];
  const slots = form.date ? getStartTimeSlots(form.date) : [];
  const isClosed = form.date ? getOpeningHours(form.date) === null : false;

  const canProceed = form.date && form.startTime && !isClosed;

  return (
    <div className="flex flex-col gap-6" style={{ marginTop: 8 }}>
      {/* Date */}
      <div>
        <label
          className="font-mono text-cz-gray-light uppercase block"
          style={{ fontSize: 10, letterSpacing: 3, marginBottom: 10 }}
        >
          {t('selectDate')}
        </label>
        <input
          type="date"
          min={today}
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value, startTime: '', option: null })}
          className="w-full bg-cz-black border border-cz-gray-dark rounded-cz font-mono text-white"
          style={{ padding: '12px 16px', fontSize: 14, letterSpacing: 1, colorScheme: 'dark' }}
        />
        {isClosed && (
          <p className="font-mono text-cz-orange" style={{ fontSize: 11, letterSpacing: 1, marginTop: 8 }}>
            {t('monday')}
          </p>
        )}
      </div>

      {/* Time slots */}
      {slots.length > 0 && (
        <div>
          <label
            className="font-mono text-cz-gray-light uppercase block"
            style={{ fontSize: 10, letterSpacing: 3, marginBottom: 10 }}
          >
            {t('selectTime')}
          </label>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => {
              const selected = form.startTime === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setForm({ ...form, startTime: slot, option: null })}
                  className="font-mono uppercase rounded-[2px] border transition-all duration-150 cursor-pointer"
                  style={{
                    fontSize: 12,
                    letterSpacing: 1,
                    padding: '8px 14px',
                    background: selected ? '#E84A1A' : '#0A0A0A',
                    borderColor: selected ? '#E84A1A' : '#2A2A2A',
                    color: selected ? '#fff' : '#888',
                  }}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="flex gap-3" style={{ marginTop: 8 }}>
        <button
          onClick={onBack}
          className="font-display uppercase rounded-[2px] cursor-pointer transition-colors"
          style={{ fontSize: 15, letterSpacing: 2, padding: '11px 24px', background: 'transparent', border: '1.5px solid #2A2A2A', color: '#888' }}
        >
          {t('back')}
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="font-display uppercase rounded-[2px] cursor-pointer transition-colors flex-1"
          style={{
            fontSize: 15,
            letterSpacing: 2,
            padding: '11px 24px',
            background: canProceed ? '#E84A1A' : '#2A2A2A',
            border: 'none',
            color: canProceed ? '#fff' : '#555',
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
}
