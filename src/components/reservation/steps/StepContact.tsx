'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check } from '@phosphor-icons/react';
import { getExampleNumber } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';
import PhoneField from '@/components/ui/PhoneField';
import { checkEmail, checkPhone } from '@/lib/validation/contact';
import { labelText, secondaryText, bodyText } from '@/lib/typography';

const EMAIL_ERROR_KEY = {
  empty: 'emailErrorEmpty',
  missingAt: 'emailErrorMissingAt',
  missingDomain: 'emailErrorMissingDomain',
  invalid: 'emailErrorInvalid',
} as const;

const PHONE_ERROR_KEY = {
  empty: 'phoneErrorEmpty',
  tooShort: 'phoneErrorTooShort',
  tooLong: 'phoneErrorTooLong',
  invalid: 'phoneErrorInvalid',
} as const;

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
  error, onBlur,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; required?: boolean; optionalHint?: string; hint?: string; disabled?: boolean;
  error?: string; onBlur?: () => void;
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
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        className={`w-full bg-cz-black border rounded-cz text-white font-body placeholder:text-cz-gray-light focus:border-cz-orange outline-none transition-colors ${error ? 'border-cz-orange' : 'border-cz-gray-dark'}`}
        style={{ padding: '12px 16px', ...bodyText, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
      />
      {error && <p className="font-body text-cz-orange" style={{ ...secondaryText, marginTop: 6 }}>{error}</p>}
      {!error && hint && <p className="font-body text-cz-gray-light" style={{ ...secondaryText, marginTop: 6 }}>{hint}</p>}
    </div>
  );
}

export default function StepContact({ contact, onChange, requireClutchzoneAccount, onBack, onNext }: Props) {
  const t = useTranslations('booking');
  const locale = useLocale() === 'en' ? 'en' : 'cs';
  const accountNeeded = requireClutchzoneAccount && !contact.noAccountYet;

  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('CZ');
  const [touchedName, setTouchedName] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [touchedAccount, setTouchedAccount] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const emailIssue = checkEmail(contact.email);
  const phoneIssue = checkPhone(contact.phone);
  // Name and account are only ever checked for presence — no format rules, so
  // there is nothing to report beyond "you left this blank".
  const nameMissing = !contact.name.trim();
  const accountMissing = accountNeeded && !contact.clutchzoneAccount.trim();

  const valid = !nameMissing && !emailIssue && !phoneIssue && !accountMissing;

  // Never scold mid-typing: a message appears once the field is left, or once
  // Continue has been pressed on an incomplete form.
  const nameError = nameMissing && (touchedName || submitAttempted) ? t('fieldRequired') : undefined;
  const accountError = accountMissing && (touchedAccount || submitAttempted) ? t('fieldRequired') : undefined;
  const emailError = emailIssue && (touchedEmail || submitAttempted) ? t(EMAIL_ERROR_KEY[emailIssue]) : undefined;

  const phoneExample = getExampleNumber(phoneCountry, examples)?.formatNational();
  const phoneError =
    phoneIssue && (touchedPhone || submitAttempted)
      ? [t(PHONE_ERROR_KEY[phoneIssue]), phoneIssue !== 'empty' && phoneExample ? t('phoneExample', { example: phoneExample }) : '']
          .filter(Boolean)
          .join(' ')
      : undefined;

  const set = (patch: Partial<ContactInfo>) => onChange({ ...contact, ...patch });

  return (
    <div className="flex flex-col gap-4" style={{ marginTop: 8 }}>
      <Field
        label={t('nameField')}
        value={contact.name}
        onChange={(v) => set({ name: v })}
        placeholder={t('namePlaceholder')}
        error={nameError}
        onBlur={() => setTouchedName(true)}
      />
      <Field
        label={t('emailField')}
        value={contact.email}
        onChange={(v) => set({ email: v })}
        placeholder="jan@email.cz"
        type="email"
        error={emailError}
        onBlur={() => setTouchedEmail(true)}
      />
      <PhoneField
        label={t('phoneField')}
        value={contact.phone}
        onChange={(v) => set({ phone: v })}
        locale={locale}
        placeholder={phoneExample}
        error={phoneError}
        onBlur={() => setTouchedPhone(true)}
        onCountryChange={setPhoneCountry}
      />

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
            error={accountError}
            onBlur={() => setTouchedAccount(true)}
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

      <Field label={t('discordField')} value={contact.discord} onChange={(v) => set({ discord: v })} placeholder={t('discordPlaceholder')} required={false} optionalHint={t('optionalHint')} />

      <div className="flex gap-3" style={{ marginTop: 4 }}>
        <button
          onClick={onBack}
          className="font-display uppercase rounded-control cursor-pointer"
          style={{ fontSize: 16, letterSpacing: 2, padding: '11px 24px', background: 'transparent', border: '1.5px solid var(--color-cz-gray-dark)', color: '#888' }}
        >
          {t('back')}
        </button>
        <button
          onClick={() => (valid ? onNext() : setSubmitAttempted(true))}
          className="font-display uppercase rounded-control flex-1 transition-colors"
          style={{
            fontSize: 16,
            letterSpacing: 2,
            padding: '11px 24px',
            background: valid ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)',
            border: 'none',
            color: valid ? '#fff' : '#888888',
            cursor: 'pointer',
          }}
        >
          {t('continueToPayment')}
        </button>
      </div>
    </div>
  );
}
