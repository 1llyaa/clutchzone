'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const EMPTY = { name: '', email: '', message: '' };

export default function Contact() {
  const t = useTranslations('contact');
  const [form, setForm]         = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');

  function field(key: keyof typeof EMPTY) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    });

    setSubmitting(false);

    if (res.ok) {
      setDone(true);
      setForm(EMPTY);
      return;
    }

    setError(t('errorGeneral'));
  }

  return (
    <section
      id="kontakt"
      className="bg-cz-black px-6 py-14 md:px-16 md:py-[120px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">

        {/* Left — heading + info */}
        <div>
          <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 11, letterSpacing: 4, marginBottom: 10 }}>
            {t('eyebrow')}
          </span>
          <h2 className="font-display text-white uppercase" style={{ fontSize: 'clamp(32px, 5vw, 60px)', letterSpacing: 1.5, lineHeight: 0.95, marginBottom: 20 }}>
            {t('heading')}
          </h2>
          <p className="font-body text-cz-gray-light" style={{ fontSize: 15, lineHeight: 1.8, maxWidth: 420, marginBottom: 36 }}>
            {t('subtext')}
          </p>

          <div className="flex flex-col gap-5">
            {[
              { label: t('locationLabel'), value: t('locationValue') },
              { label: t('hoursLabel'),    value: t('hoursValue') },
              { label: t('emailLabel'),    value: t('emailValue') },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 3, marginBottom: 4 }}>{label}</div>
                <div className="font-body text-white" style={{ fontSize: 15 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="bg-cz-black-mid rounded-cz" style={{ padding: 'clamp(24px, 4vw, 40px)', border: '1px solid #2A2A2A' }}>
          {done ? (
            <div className="flex flex-col items-center text-center" style={{ padding: '40px 0' }}>
              <span style={{ fontSize: 44 }}>✓</span>
              <p className="font-body text-white" style={{ fontSize: 16, lineHeight: 1.7, marginTop: 20, maxWidth: 320 }}>
                {t('success')}
              </p>
              <button
                onClick={() => setDone(false)}
                className="font-mono text-cz-orange uppercase hover:underline"
                style={{ fontSize: 11, letterSpacing: 2, marginTop: 24 }}
              >
                {t('sendAnother')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={field('name')}
                  required
                  maxLength={100}
                  placeholder={t('namePlaceholder')}
                  className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange transition-colors"
                  style={{ padding: '11px 14px', fontSize: 14, border: '1px solid #2A2A2A' }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={field('email')}
                  required
                  placeholder={t('emailPlaceholder')}
                  className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange transition-colors"
                  style={{ padding: '11px 14px', fontSize: 14, border: '1px solid #2A2A2A' }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
                  {t('message')}
                </label>
                <textarea
                  value={form.message}
                  onChange={field('message')}
                  required
                  maxLength={2000}
                  rows={5}
                  placeholder={t('messagePlaceholder')}
                  className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange transition-colors resize-none"
                  style={{ padding: '11px 14px', fontSize: 14, border: '1px solid #2A2A2A' }}
                />
              </div>

              {error && (
                <p className="font-mono text-red-400" style={{ fontSize: 11, letterSpacing: 1 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark active:not-disabled:scale-[0.96] transition-[background-color,scale] duration-150 ease-out rounded-[2px] border-none cursor-pointer disabled:opacity-50"
                style={{ fontSize: 15, letterSpacing: 2, padding: '14px 0', marginTop: 4 }}
              >
                {submitting ? '...' : t('submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
