'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';

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
      className="bg-cz-black px-6 py-14 md:px-16 md:py-[104px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">

        {/* Left — heading + info */}
        <div>
          <Reveal>
            <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 16, letterSpacing: 4, marginBottom: 10 }}>
              {t('eyebrow')}
            </span>
            <h2 className="font-display text-white uppercase" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', letterSpacing: 1.5, lineHeight: 0.98, marginBottom: 20 }}>
              {t('heading')}
            </h2>
            <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.8, maxWidth: 420, marginBottom: 36 }}>
              {t('subtext')}
            </p>
          </Reveal>

          <Reveal delay={70} className="flex flex-col gap-[22px]">
            {[
              { label: t('locationLabel'), value: t('locationValue') },
              { label: t('hoursLabel'),    value: t('hoursValue') },
              { label: t('emailLabel'),    value: t('emailValue') },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 4 }}>{label}</div>
                <div className="font-body text-white" style={{ fontSize: 17 }}>{value}</div>
              </div>
            ))}
          </Reveal>
        </div>

        {/* Right — form */}
        <Reveal delay={100}>
        <div className="bg-cz-black-mid rounded-cz border border-cz-gray-dark" style={{ padding: 'clamp(24px, 4vw, 40px)' }}>
          {done ? (
            <div className="flex flex-col items-center text-center" style={{ padding: '40px 0' }}>
              <Check size={44} weight="bold" className="text-white" />
              <p className="font-body text-white" style={{ fontSize: 16, lineHeight: 1.7, marginTop: 20, maxWidth: 320 }}>
                {t('success')}
              </p>
              <button
                type="button"
                onClick={() => setDone(false)}
                className="font-mono text-cz-orange uppercase hover:underline"
                style={{ fontSize: 16, letterSpacing: 2, marginTop: 24 }}
              >
                {t('sendAnother')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={field('name')}
                  required
                  maxLength={100}
                  placeholder={t('namePlaceholder')}
                  className="bg-cz-black text-white font-body border border-cz-gray-dark rounded-control focus:outline-none focus:border-cz-orange transition-[border-color] duration-150 ease-out"
                  style={{ padding: '11px 14px', fontSize: 19 }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={field('email')}
                  required
                  placeholder={t('emailPlaceholder')}
                  className="bg-cz-black text-white font-body border border-cz-gray-dark rounded-control focus:outline-none focus:border-cz-orange transition-[border-color] duration-150 ease-out"
                  style={{ padding: '11px 14px', fontSize: 19 }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>
                  {t('message')}
                </label>
                <textarea
                  value={form.message}
                  onChange={field('message')}
                  required
                  maxLength={2000}
                  rows={5}
                  placeholder={t('messagePlaceholder')}
                  className="bg-cz-black text-white font-body border border-cz-gray-dark rounded-control focus:outline-none focus:border-cz-orange transition-[border-color] duration-150 ease-out resize-none"
                  style={{ padding: '11px 14px', fontSize: 19 }}
                />
              </div>

              {error && (
                <p className="font-mono text-cz-danger" style={{ fontSize: 17, letterSpacing: 1 }}>{error}</p>
              )}

              <Button type="submit" disabled={submitting} className="w-full mt-1">
                {submitting ? '...' : t('submit')}
              </Button>
            </form>
          )}
        </div>
        </Reveal>
      </div>
    </section>
  );
}
