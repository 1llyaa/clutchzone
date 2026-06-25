'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { BookingForm } from '@/types';

interface Props {
  form: BookingForm;
  setForm: (f: BookingForm) => void;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  error: string;
}

function Field({
  label, value, onChange, placeholder, type = 'text', required = true,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="font-mono text-cz-gray-light uppercase block" style={{ fontSize: 10, letterSpacing: 3, marginBottom: 8 }}>
        {label}{!required && <span className="text-cz-gray-mid"> (nepovinné)</span>}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-cz-black border border-cz-gray-dark rounded-cz text-white font-body placeholder:text-cz-gray-mid focus:border-cz-orange outline-none transition-colors"
        style={{ padding: '12px 16px', fontSize: 14 }}
      />
    </div>
  );
}

export default function StepContact({ form, setForm, onBack, onSubmit, error }: Props) {
  const t = useTranslations('booking');
  const [loading, setLoading] = useState(false);

  const valid =
    form.customerName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail) &&
    form.customerPhone.trim().length >= 9;

  async function handleSubmit() {
    if (!valid || loading) return;
    setLoading(true);
    await onSubmit();
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4" style={{ marginTop: 8 }}>
      {/* Order summary */}
      <div
        className="flex items-center justify-between rounded-cz border border-cz-gray-dark"
        style={{ padding: '14px 18px', background: '#0A0A0A' }}
      >
        <span className="font-mono text-cz-gray-light" style={{ fontSize: 11, letterSpacing: 1 }}>
          {form.stationType?.toUpperCase()} · {form.option?.label} · {form.date} {form.startTime}
        </span>
        <span className="font-display text-cz-orange" style={{ fontSize: 24, letterSpacing: 1 }}>
          {form.option?.amount} Kč
        </span>
      </div>

      <Field label={t('name')} value={form.customerName} onChange={(v) => setForm({ ...form, customerName: v })} placeholder={t('namePlaceholder')} />
      <Field label={t('email')} value={form.customerEmail} onChange={(v) => setForm({ ...form, customerEmail: v })} placeholder={t('emailPlaceholder')} type="email" />
      <Field label={t('phone')} value={form.customerPhone} onChange={(v) => setForm({ ...form, customerPhone: v })} placeholder={t('phonePlaceholder')} type="tel" />
      <Field label={t('discord')} value={form.customerDiscord} onChange={(v) => setForm({ ...form, customerDiscord: v })} placeholder={t('discordPlaceholder')} required={false} />

      {error && (
        <p className="font-mono text-cz-orange" style={{ fontSize: 11, letterSpacing: 1 }}>
          {error}
        </p>
      )}

      <div className="flex gap-3" style={{ marginTop: 4 }}>
        <button
          onClick={onBack}
          className="font-display uppercase rounded-[2px] cursor-pointer"
          style={{ fontSize: 15, letterSpacing: 2, padding: '11px 24px', background: 'transparent', border: '1.5px solid #2A2A2A', color: '#888' }}
        >
          {t('back')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!valid || loading}
          className="font-display uppercase rounded-[2px] flex-1 transition-colors"
          style={{
            fontSize: 15,
            letterSpacing: 2,
            padding: '11px 24px',
            background: valid && !loading ? '#E84A1A' : '#2A2A2A',
            border: 'none',
            color: valid && !loading ? '#fff' : '#555',
            cursor: valid && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? '...' : t('confirm')}
        </button>
      </div>
    </div>
  );
}
