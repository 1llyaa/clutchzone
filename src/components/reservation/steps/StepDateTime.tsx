'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { getHourSlots, getOpeningHours } from '@/lib/utils/pricing';
import type { BookingForm } from '@/types';

interface Props {
  form: BookingForm;
  setForm: (f: BookingForm) => void;
  onNext: () => void;
  onBack: () => void;
}

const QUARTER_OFFSETS = ['00', '15', '30', '45'];

export default function StepDateTime({ form, setForm, onNext, onBack }: Props) {
  const t = useTranslations('booking');
  const [expandedHour, setExpandedHour] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const hourSlots = form.date ? getHourSlots(form.date) : [];
  const isClosed = form.date ? getOpeningHours(form.date) === null : false;

  const selectedHour = form.startTime ? form.startTime.split(':')[0] : null;
  const canProceed = form.date && form.startTime && !isClosed;

  function selectHour(hour: string) {
    if (expandedHour === hour) {
      setExpandedHour(null);
    } else {
      setExpandedHour(hour);
      setForm({ ...form, startTime: `${hour}:00`, option: null });
    }
  }

  function selectQuarter(hour: string, minutes: string) {
    setForm({ ...form, startTime: `${hour}:${minutes}`, option: null });
  }

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
          onChange={(e) => {
            setForm({ ...form, date: e.target.value, startTime: '', option: null });
            setExpandedHour(null);
          }}
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
      {hourSlots.length > 0 && (
        <div>
          <label
            className="font-mono text-cz-gray-light uppercase block"
            style={{ fontSize: 10, letterSpacing: 3, marginBottom: 10 }}
          >
            {t('selectTime')}
          </label>
          <div className="flex flex-wrap gap-2">
            {hourSlots.map((slot) => {
              const hour = slot.split(':')[0];
              const isExpanded = expandedHour === hour;
              const isSelectedHour = selectedHour === hour;

              return (
                <div key={slot} className="flex flex-col gap-1">
                  <button
                    onClick={() => selectHour(hour)}
                    className="font-mono uppercase rounded-[2px] border transition-all duration-150 cursor-pointer"
                    style={{
                      fontSize: 12,
                      letterSpacing: 1,
                      padding: '8px 14px',
                      background: isSelectedHour ? '#E84A1A' : '#0A0A0A',
                      borderColor: isSelectedHour ? '#E84A1A' : '#2A2A2A',
                      color: isSelectedHour ? '#fff' : '#888',
                    }}
                  >
                    {slot}
                  </button>
                  {isExpanded && (
                    <div className="flex gap-1">
                      {QUARTER_OFFSETS.map((m) => {
                        const full = `${hour}:${m}`;
                        const active = form.startTime === full;
                        return (
                          <button
                            key={m}
                            onClick={() => selectQuarter(hour, m)}
                            className="font-mono rounded-[2px] border transition-all duration-150 cursor-pointer"
                            style={{
                              fontSize: 10,
                              padding: '4px 6px',
                              background: active ? '#E84A1A' : 'transparent',
                              borderColor: active ? '#E84A1A' : '#2A2A2A',
                              color: active ? '#fff' : '#666',
                            }}
                          >
                            :{m}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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
