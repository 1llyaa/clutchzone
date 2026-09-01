'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Check, Minus, Plus } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import GgLeapHoursNote from '@/components/ui/GgLeapHoursNote';
import { useGgLeapHours } from '@/lib/ggleap/useGgLeapHours';
import { labelText, secondaryText, bodyText } from '@/lib/typography';
import type { HourTier, StationType } from '@/lib/pricing/types';

interface Props {
  hourTiers: HourTier[];
  creditExpiryMonths: number;
}

interface Contact {
  name: string;
  email: string;
  phone: string;
  clutchzoneAccount: string;
  noAccountYet: boolean;
}
const EMPTY_CONTACT: Contact = { name: '', email: '', phone: '', clutchzoneAccount: '', noAccountYet: false };

function cartKey(stationType: StationType, hours: number): string {
  return `${stationType}:${hours}`;
}

function expiresLabel(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

export default function KreditClient({ hourTiers, creditExpiryMonths }: Props) {
  const t = useTranslations('kredit');
  const tc = useTranslations('calculator');
  const locale = useLocale();
  const [tab, setTab] = useState<StationType>('pc');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);

  // Debounced so typing a nickname fires one lookup, not one per keystroke.
  const { state: hoursState, minutes: hoursMinutes } = useGgLeapHours(
    contact.clutchzoneAccount,
    !contact.noAccountYet,
    600,
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tiersByType = (t: StationType) => hourTiers.filter((h) => h.stationType === t).sort((a, b) => a.hours - b.hours);
  const baseAmount = (t: StationType) => tiersByType(t).find((h) => h.hours === 1)?.amount ?? 0;

  function setQty(t: StationType, hours: number, qty: number) {
    setCart((prev) => ({ ...prev, [cartKey(t, hours)]: Math.max(0, qty) }));
  }

  const cartLines = useMemo(() => {
    const lines: { stationType: StationType; hours: number; amount: number; qty: number }[] = [];
    for (const tier of hourTiers) {
      const qty = cart[cartKey(tier.stationType, tier.hours)] ?? 0;
      if (qty > 0) lines.push({ stationType: tier.stationType, hours: tier.hours, amount: tier.amount, qty });
    }
    return lines;
  }, [cart, hourTiers]);

  const cartTotal = cartLines.reduce((sum, l) => sum + l.amount * l.qty, 0);
  const cartSave = cartLines.reduce((sum, l) => sum + (l.hours * l.qty * baseAmount(l.stationType) - l.amount * l.qty), 0);

  const requireClutchzoneAccount = !contact.noAccountYet;
  const valid =
    cartLines.length > 0 &&
    contact.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) &&
    contact.phone.trim().length >= 9 &&
    (!requireClutchzoneAccount || contact.clutchzoneAccount.trim().length >= 2);

  async function handlePay() {
    if (!termsAccepted) { setConsentError(true); return; }
    if (!valid) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartLines.map((l) => ({ stationType: l.stationType, hours: l.hours, quantity: l.qty })),
          customerName: contact.name,
          customerEmail: contact.email,
          customerPhone: contact.phone,
          clutchzoneAccount: contact.clutchzoneAccount.trim() || undefined,
          termsAccepted: true,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t('submitError')); setLoading(false); return; }
      window.location.href = data.url;
    } catch {
      setError(t('submitError'));
      setLoading(false);
    }
  }

  return (
    <section style={{ padding: '104px 24px', background: '#0A0A0A' }} className="md:px-16">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <span className="font-mono" style={{ ...labelText, letterSpacing: 2.5, color: 'var(--color-cz-orange)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
            {t('eyebrow')}
          </span>
          <h1 className="font-display" style={{ margin: 0, fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 0.98, letterSpacing: 1, color: '#FFFFFF', textTransform: 'uppercase' }}>
            {t('heading')}
          </h1>
          <div style={{ width: 64, height: 2, background: 'var(--color-cz-orange)', marginTop: 20 }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 320, marginBottom: 28 }}>
              {(['pc', 'ps5'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setTab(st)}
                  className="font-display"
                  style={{
                    height: 44, border: `1px solid ${tab === st ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)'}`, background: tab === st ? 'rgba(232,74,26,0.12)' : '#111111',
                    color: tab === st ? '#FFFFFF' : 'var(--color-cz-white-soft)', ...labelText, letterSpacing: 1, cursor: 'pointer', borderRadius: 'var(--radius-control)',
                  }}
                >
                  {st === 'pc' ? tc('pc') : tc('ps5')}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {tiersByType(tab).map((tier) => {
                const qty = cart[cartKey(tier.stationType, tier.hours)] ?? 0;
                const perHour = Math.round(tier.amount / tier.hours);
                const save = tier.hours * baseAmount(tab) - tier.amount;
                return (
                  <div key={tier.id} style={{ background: '#111111', border: `1px solid ${qty > 0 ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)'}`, borderRadius: 'var(--radius-control)', padding: 20 }}>
                    <div className="font-display" style={{ fontSize: 40, lineHeight: 1, letterSpacing: 1, color: '#FFFFFF', textTransform: 'uppercase' }}>{tier.hours}H</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                      <span className="font-display" style={{ fontSize: 32, color: '#FFFFFF' }}>{tier.amount}</span>
                      <span className="font-mono" style={{ ...secondaryText, letterSpacing: 1.5, color: 'var(--color-cz-white-soft)' }}>KČ</span>
                    </div>
                    <div className="font-mono" style={{ ...secondaryText, letterSpacing: 1.5, color: 'var(--color-cz-white-soft)', marginTop: 6 }}>{perHour} KČ/H</div>
                    {save > 0 && (
                      <div className="font-mono" style={{ ...labelText, fontWeight: 700, letterSpacing: 1.5, color: 'var(--color-cz-orange)', marginTop: 10 }}>
                        {t('savings', { amount: save })}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 20, borderTop: '1px solid var(--color-cz-gray-dark)', paddingTop: 16 }}>
                      <Button
                        variant="ghost"
                        iconOnly
                        onClick={() => setQty(tab, tier.hours, qty - 1)}
                        aria-label={locale === 'en' ? 'Decrease quantity' : 'Snížit počet'}
                      >
                        <Minus weight="bold" size={16} />
                      </Button>
                      <span className="font-display" style={{ fontSize: 26, color: '#FFFFFF' }}>{qty}</span>
                      <Button
                        variant="ghost"
                        iconOnly
                        onClick={() => setQty(tab, tier.hours, qty + 1)}
                        aria-label={locale === 'en' ? 'Increase quantity' : 'Zvýšit počet'}
                      >
                        <Plus weight="bold" size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ position: 'sticky', top: 88, background: '#111111', border: '1px solid var(--color-cz-gray-dark)', borderTop: '2px solid var(--color-cz-orange)', padding: 28 }}>
            <div className="font-mono" style={{ ...labelText, letterSpacing: 2.5, color: 'var(--color-cz-white-soft)', textTransform: 'uppercase', marginBottom: 18 }}>{t('summary')}</div>

            {cartLines.length === 0 ? (
              <p className="font-body" style={{ ...secondaryText, color: '#888888' }}>{t('emptyCart')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cartLines.map((l) => (
                  <div key={cartKey(l.stationType, l.hours)} className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, ...labelText, letterSpacing: 1, color: 'var(--color-cz-white-soft)', textTransform: 'uppercase' }}>
                    <span>{l.qty}x {l.hours}H {l.stationType.toUpperCase()}</span>
                    <span>{l.amount * l.qty} KČ</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ height: 1, background: 'var(--color-cz-gray-dark)', margin: '20px 0' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <span className="font-mono" style={{ ...labelText, letterSpacing: 2, color: '#888888', textTransform: 'uppercase' }}>{t('total')}</span>
              <span className="font-display" style={{ fontSize: 48, lineHeight: 1, color: '#FFFFFF' }}>{cartTotal} <span className="font-mono" style={{ ...secondaryText, letterSpacing: 1.5, color: 'var(--color-cz-white-soft)' }}>KČ</span></span>
            </div>
            {cartSave > 0 && (
              <div className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, ...labelText, fontWeight: 700, letterSpacing: 1, color: 'var(--color-cz-orange)', marginTop: 12, textTransform: 'uppercase' }}>
                <span>{t('save')}</span><span>{cartSave} KČ</span>
              </div>
            )}
            <div className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, ...labelText, letterSpacing: 1, color: 'var(--color-cz-white-soft)', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-cz-gray-dark)', textTransform: 'uppercase' }}>
              <span>{t('validUntil')}</span><span>{expiresLabel(creditExpiryMonths)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
              <input placeholder={t('namePlaceholder')} value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                style={{ padding: '10px 14px', ...bodyText, background: '#0A0A0A', border: '1px solid var(--color-cz-gray-dark)', color: '#fff', borderRadius: 'var(--radius-control)' }} />
              <input placeholder={t('emailPlaceholder')} type="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                style={{ padding: '10px 14px', ...bodyText, background: '#0A0A0A', border: '1px solid var(--color-cz-gray-dark)', color: '#fff', borderRadius: 'var(--radius-control)' }} />
              <input placeholder={t('phonePlaceholder')} type="tel" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                style={{ padding: '10px 14px', ...bodyText, background: '#0A0A0A', border: '1px solid var(--color-cz-gray-dark)', color: '#fff', borderRadius: 'var(--radius-control)' }} />
              <input placeholder={t('clutchzoneAccountPlaceholder')} disabled={contact.noAccountYet} value={contact.clutchzoneAccount} onChange={(e) => setContact((c) => ({ ...c, clutchzoneAccount: e.target.value }))}
                style={{ padding: '10px 14px', ...bodyText, background: '#0A0A0A', border: '1px solid var(--color-cz-gray-dark)', color: '#fff', borderRadius: 'var(--radius-control)', opacity: contact.noAccountYet ? 0.4 : 1 }} />
              <label className="font-body" style={{ display: 'flex', alignItems: 'center', gap: 8, ...secondaryText, color: '#888888', cursor: 'pointer' }}>
                <input type="checkbox" checked={contact.noAccountYet} onChange={(e) => setContact((c) => ({ ...c, noAccountYet: e.target.checked, clutchzoneAccount: e.target.checked ? '' : c.clutchzoneAccount }))} />
                {t('noAccountYetLabel')}
              </label>
              <GgLeapHoursNote state={hoursState} minutes={hoursMinutes} />
            </div>

            <div className="font-body" style={{ background: '#1A1A1A', border: '1px solid var(--color-cz-gray-dark)', padding: '12px 14px', marginTop: 18, ...bodyText, lineHeight: 1.75, color: '#FFFFFF' }}>
              {t('creditExpiryNote', { months: creditExpiryMonths })}
            </div>

            <div
              onClick={() => { setTermsAccepted((v) => !v); setConsentError(false); }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minHeight: 44, padding: '12px 14px', marginTop: 10, borderRadius: 'var(--radius-control)', border: `1px solid ${consentError ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)'}`, background: '#0A0A0A', cursor: 'pointer' }}
            >
              <div style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2, border: `1.5px solid ${termsAccepted || consentError ? 'var(--color-cz-orange)' : '#555555'}`, background: termsAccepted ? 'var(--color-cz-orange)' : 'transparent', borderRadius: 'var(--radius-control)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {termsAccepted && <Check weight="bold" size={14} />}
              </div>
              <div className="font-body" style={{ ...bodyText, color: consentError ? 'var(--color-cz-orange)' : 'var(--color-cz-white-soft)' }}>
                {t('agreeTermsPrefix')}{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'underline' }}>{t('termsLink')}</a>{' '}
                {t('andAcknowledge')}{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'underline' }}>{t('privacyLink')}</a>.
              </div>
            </div>
            {consentError && (
              <p className="font-mono" style={{ ...labelText, letterSpacing: 1, color: 'var(--color-cz-orange)', marginTop: 8 }}>
                {t('consentError')}
              </p>
            )}

            <Button variant="primary" size="md" className="w-full mt-3.5" onClick={handlePay} disabled={!valid || loading}>
              {loading ? '...' : t('payByCard')}
            </Button>
            {error && <p className="font-mono" style={{ ...labelText, color: 'var(--color-cz-orange)', marginTop: 8 }}>{error}</p>}

            <p className="font-body" style={{ ...secondaryText, color: '#888888', marginTop: 14 }}>
              {t('creditFootnote')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
