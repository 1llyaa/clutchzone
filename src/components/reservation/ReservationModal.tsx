'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useReservation } from './ReservationContext';
import type { BookingForm, BookingResult } from '@/types';
import StepType from './steps/StepType';
import StepDateTime from './steps/StepDateTime';
import StepDuration from './steps/StepDuration';
import StepContact from './steps/StepContact';
import StepDone from './steps/StepDone';

const STEPS = 5;

const EMPTY_FORM: BookingForm = {
  stationType: null,
  date: '',
  startTime: '',
  option: null,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerDiscord: '',
};

export default function ReservationModal() {
  const t = useTranslations('booking');
  const { isOpen, close } = useReservation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  function handleClose() {
    close();
    setTimeout(() => {
      setStep(1);
      setForm(EMPTY_FORM);
      setResult(null);
      setError('');
    }, 300);
  }

  function next() { setStep((s) => Math.min(s + 1, STEPS)); }
  function back() { setStep((s) => Math.max(s - 1, 1)); }

  async function submit() {
    setError('');
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stationType: form.stationType,
        date: form.date,
        startTime: form.startTime,
        durationMinutes: form.option!.duration_minutes,
        totalPrice: form.option!.amount,
        packageLabel: form.option!.label,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        customerDiscord: form.customerDiscord,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t('errorGeneral'));
      return;
    }
    setResult(data);
    setStep(5);
  }

  const stepTitles: Record<number, string> = {
    1: t('step1title'),
    2: t('step2title'),
    3: t('step3title'),
    4: t('step4title'),
    5: t('doneTitle'),
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="relative w-full bg-cz-black-mid border border-cz-gray-dark rounded-cz flex flex-col"
        style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Orange top bar */}
        <span className="absolute top-0 left-0 right-0 bg-cz-orange rounded-t-cz" style={{ height: 2 }} />

        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '28px 32px 0' }}
        >
          <div className="flex flex-col gap-1">
            <span className="font-mono text-cz-orange uppercase" style={{ fontSize: 10, letterSpacing: 3 }}>
              {t('title')} · {step < 5 ? `${step}/4` : ''}
            </span>
            <span className="font-display text-white uppercase" style={{ fontSize: 28, letterSpacing: 1 }}>
              {stepTitles[step]}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="font-mono text-cz-gray-light hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            style={{ fontSize: 20, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Step indicators */}
        {step < 5 && (
          <div className="flex items-center gap-2" style={{ padding: '16px 32px 0' }}>
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className="rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: s <= step ? '#E84A1A' : '#2A2A2A',
                    transition: 'background 0.2s',
                  }}
                />
                {s < 4 && <span style={{ width: 24, height: 1, background: s < step ? '#E84A1A' : '#2A2A2A' }} />}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '24px 32px 32px', flex: 1 }}>
          {step === 1 && (
            <StepType form={form} setForm={setForm} onNext={next} />
          )}
          {step === 2 && (
            <StepDateTime form={form} setForm={setForm} onNext={next} onBack={back} />
          )}
          {step === 3 && (
            <StepDuration form={form} setForm={setForm} onNext={next} onBack={back} />
          )}
          {step === 4 && (
            <StepContact
              form={form}
              setForm={setForm}
              onBack={back}
              onSubmit={submit}
              error={error}
            />
          )}
          {step === 5 && result && (
            <StepDone result={result} form={form} onClose={handleClose} />
          )}
        </div>
      </div>
    </div>
  );
}
