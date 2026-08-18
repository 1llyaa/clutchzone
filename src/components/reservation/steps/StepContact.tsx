'use client';

import { useTranslations } from 'next-intl';
import { Check } from '@phosphor-icons/react';
import { labelText, secondaryText, bodyText } from '@/lib/typography';

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  discord: string;
  clutchzoneAccount: string;
  noAccountYet: boolean;
}

interface Props {
  contact: ContactInfo;
  onChange: (c: ContactInfo) => void;
  requireClutchzoneAccount: boolean;
  onBack: () => void;
  onNext: () => void;
}

function Field({
  label, value, onChange, placeholder, type = 'text', required = true, optionalHint, hint, disabled = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; required?: boolean; optionalHint?: string; hint?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="font-mono text-cz-gray-light uppercase block" style={{ ...labelText, letterSpacing: 2.5, marginBottom: 8 }}>
        {label}{!required && <span className="text-cz-gray-light"> {optionalHint}</span>}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-cz-black border border-cz-gray-dark rounded-cz text-white font-body placeholder:text-cz-gray-light focus:border-cz-orange outline-none transition-colors"
        style={{ padding: '12px 16px', ...bodyText, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
      />
      {hint && <p className="font-body text-cz-gray-light" style={{ ...secondaryText, marginTop: 6 }}>{hint}</p>}
    </div>
  );
}

export default function StepContact({ contact, onChange, requireClutchzoneAccount, onBack, onNext }: Props) {
  const t = useTranslations('booking');
  const accountNeeded = requireClutchzoneAccount && !contact.noAccountYet;
  const valid =
    contact.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) &&
    contact.phone.trim().length >= 9 &&
    (!accountNeeded || contact.clutchzoneAccount.trim().length >= 2);

  const set = (patch: Partial<ContactInfo>) => onChange({ ...contact, ...patch });

  return (
    <div className="flex flex-col gap-4" style={{ marginTop: 8 }}>
      <Field label={t('nameField')} value={contact.name} onChange={(v) => set({ name: v })} placeholder="Jan Novák" />
      <Field label={t('emailField')} value={contact.email} onChange={(v) => set({ email: v })} placeholder="jan@email.cz" type="email" />
      <Field label={t('phoneField')} value={contact.phone} onChange={(v) => set({ phone: v })} placeholder="+420 123 456 789" type="tel" />

      {requireClutchzoneAccount && (
        <div>
          <Field
            label={t('clutchzoneAccountLabel')}
            value={contact.clutchzoneAccount}
            onChange={(v) => set({ clutchzoneAccount: v })}
            placeholder={t('clutchzoneAccountPlaceholder')}
            required={accountNeeded}
            disabled={contact.noAccountYet}
            hint={accountNeeded ? t('clutchzoneAccountHint') : undefined}
          />
          <div
            onClick={() => set({ noAccountYet: !contact.noAccountYet, clutchzoneAccount: contact.noAccountYet ? contact.clutchzoneAccount : '' })}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, cursor: 'pointer' }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                flexShrink: 0,
                border: `1.5px solid ${contact.noAccountYet ? 'var(--color-cz-orange)' : '#555555'}`,
                background: contact.noAccountYet ? 'var(--color-cz-orange)' : 'transparent',
                borderRadius: 'var(--radius-control)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              {contact.noAccountYet && <Check weight="bold" size={11} />}
            </div>
            <span className="font-body text-cz-gray-light" style={{ ...secondaryText }}>
              {t('noAccountYetLabel')}
            </span>
          </div>
          {contact.noAccountYet && (
            <p className="font-body text-cz-gray-light" style={{ ...bodyText, marginTop: 6 }}>
              {t('noAccountYetNote')}
            </p>
          )}
        </div>
      )}

      <Field label={t('discordField')} value={contact.discord} onChange={(v) => set({ discord: v })} placeholder="uživatel#0000" required={false} optionalHint={t('optionalHint')} />

      <div className="flex gap-3" style={{ marginTop: 4 }}>
        <button
          onClick={onBack}
          className="font-display uppercase rounded-control cursor-pointer"
          style={{ fontSize: 16, letterSpacing: 2, padding: '11px 24px', background: 'transparent', border: '1.5px solid var(--color-cz-gray-dark)', color: '#888' }}
        >
          {t('back')}
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="font-display uppercase rounded-control flex-1 transition-colors"
          style={{
            fontSize: 16,
            letterSpacing: 2,
            padding: '11px 24px',
            background: valid ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)',
            border: 'none',
            color: valid ? '#fff' : '#888888',
            cursor: valid ? 'pointer' : 'not-allowed',
          }}
        >
          {t('continueToPayment')}
        </button>
      </div>
    </div>
  );
}
