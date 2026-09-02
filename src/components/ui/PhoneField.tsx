'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import { labelText, secondaryText, bodyText } from '@/lib/typography';

const SEARCH_PLACEHOLDER = { cs: 'Hledat zemi…', en: 'Search country…', de: 'Land suchen…', ua: 'Пошук країни…' };
const NO_RESULTS = { cs: 'Nic nenalezeno', en: 'No results', de: 'Keine Ergebnisse', ua: 'Нічого не знайдено' };

function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  locale: 'cs' | 'en' | 'de' | 'ua';
  defaultCountry?: CountryCode;
  placeholder?: string;
  error?: string;
  onBlur?: () => void;
  onCountryChange?: (code: CountryCode) => void;
}

export default function PhoneField({
  label, value, onChange, locale, defaultCountry = 'CZ', placeholder, error, onBlur, onCountryChange,
}: Props) {
  const [country, setCountry] = useState<CountryCode>(defaultCountry);
  const [national, setNational] = useState('');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  // Only burn the one-shot guard once a value actually parses, so a parent that
  // fills `value` in asynchronously still gets its country picked up.
  useEffect(() => {
    if (hydrated.current || !value) return;
    const parsed = parsePhoneNumberFromString(value);
    if (!parsed?.country) return;
    hydrated.current = true;
    setCountry(parsed.country);
    setNational(parsed.formatNational());
  }, [value]);

  useEffect(() => {
    onCountryChange?.(country);
  }, [country, onCountryChange]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const countryNames = useMemo(() => new Intl.DisplayNames([locale], { type: 'region' }), [locale]);

  const countries = useMemo(
    () =>
      getCountries()
        .map((code) => ({ code, dial: getCountryCallingCode(code), name: countryNames.of(code) ?? code }))
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [countryNames, locale],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q));
  }, [countries, query]);

  function commit(nextCountry: CountryCode, nextNational: string) {
    const digits = nextNational.replace(/\D/g, '');
    onChange(digits ? `+${getCountryCallingCode(nextCountry)}${digits}` : '');
  }

  function handleNationalChange(raw: string) {
    // A pasted or typed international number already carries its own country code;
    // running it through commit() would prepend the selected dial code a second time.
    const international = raw.trim().startsWith('00') ? `+${raw.trim().slice(2)}` : raw.trim();
    if (international.startsWith('+')) {
      const typing = new AsYouType();
      const formatted = typing.input(international);
      const detected = typing.getCountry();
      if (detected) setCountry(detected);
      setNational(formatted);
      onChange(`+${formatted.replace(/\D/g, '')}`);
      return;
    }
    const formatted = new AsYouType(country).input(raw);
    setNational(formatted);
    commit(country, formatted);
  }

  // Once the field is left, collapse whatever was typed back into the national
  // form so the dial-code button and the input stop showing the country twice.
  function handleBlur() {
    const parsed = parsePhoneNumberFromString(value);
    if (parsed?.country) {
      setCountry(parsed.country);
      setNational(parsed.formatNational());
    }
    onBlur?.();
  }

  function selectCountry(code: CountryCode) {
    setCountry(code);
    setOpen(false);
    setQuery('');
    commit(code, national);
  }

  const current = countries.find((c) => c.code === country);

  return (
    <div>
      <label className="font-mono text-cz-gray-light uppercase block" style={{ ...labelText, letterSpacing: 2.5, marginBottom: 8 }}>
        {label}
      </label>
      <div
        ref={ref}
        className="bg-cz-black rounded-cz"
        style={{
          position: 'relative',
          display: 'flex',
          border: `1px solid ${error ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)'}`,
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="font-mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '12px 10px',
            background: 'transparent',
            border: 'none',
            borderRight: '1px solid var(--color-cz-gray-dark)',
            color: '#FFFFFF',
            cursor: 'pointer',
            flexShrink: 0,
            ...bodyText,
          }}
        >
          <span>{flagEmoji(country)}</span>
          <span>+{current?.dial}</span>
        </button>
        <input
          type="tel"
          value={national}
          placeholder={placeholder}
          onChange={(e) => handleNationalChange(e.target.value)}
          onBlur={handleBlur}
          aria-invalid={error ? true : undefined}
          className="text-white font-body placeholder:text-cz-gray-light outline-none"
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', padding: '12px 16px', ...bodyText }}
        />

        {open && (
          <div
            className="font-mono"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 50,
              background: '#111111',
              border: '1px solid var(--color-cz-gray-dark)',
              borderRadius: 'var(--radius-control)',
              width: '100%',
              maxHeight: 280,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-float-sm)',
            }}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={SEARCH_PLACEHOLDER[locale]}
              className="text-white placeholder:text-cz-gray-light outline-none"
              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-cz-gray-dark)', padding: '10px 14px', ...bodyText }}
            />
            <div style={{ overflowY: 'auto' }}>
              {filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => selectCountry(c.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 14px',
                    background: c.code === country ? 'rgba(232,74,26,0.12)' : 'transparent',
                    border: 'none',
                    color: 'var(--color-cz-white-soft)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    ...secondaryText,
                  }}
                >
                  <span>{flagEmoji(c.code)}</span>
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <span style={{ color: '#888888' }}>+{c.dial}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: '10px 14px', color: '#888888', ...secondaryText }}>
                  {NO_RESULTS[locale]}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="font-body text-cz-orange" style={{ ...secondaryText, marginTop: 6 }}>
          {error}
        </p>
      )}
    </div>
  );
}
