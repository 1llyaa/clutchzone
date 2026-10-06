'use client';

import { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { minutesLabel } from '@/lib/bookings/timeline';

/** Cells picked on the timeline, on the board day's minute axis. */
export interface CellSelection {
  stationIds: string[];
  stationLabels: string[];
  stationType: string;
  start: number;
  end: number;
}

interface Quote {
  amountPerStation: number;
  label: string;
  kind: string;
  passId: string | null;
}

/** 30 min up to 12 h, the same ceiling the public calculator has. */
const DURATIONS = Array.from({ length: 24 }, (_, i) => (i + 1) * 30);

function durationLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} MIN`;
  return m ? `${h},5 H` : `${h} H`;
}

const inputClass =
  'bg-cz-black text-white font-body rounded-control focus:outline-none focus:border-cz-orange w-full';
const inputStyle = { padding: '8px 12px', fontSize: 17, border: '1px solid var(--color-cz-gray-dark)' };
const labelClass = 'font-mono text-cz-gray-light uppercase';
const labelStyle = { fontSize: 16, letterSpacing: 2 };

/**
 * Staff entering a booking for a walk-in or a phone call. Only a name is
 * required — a walk-in rarely gives more. The price is the engine's
 * suggestion and stays editable: it is whatever staff agreed at the counter.
 */
export default function CreateBookingModal({
  boardDate,
  selection,
  onClose,
  onCreated,
}: {
  boardDate: string;
  selection: CellSelection;
  onClose: () => void;
  onCreated: () => void;
}) {
  const count = selection.stationIds.length;
  const [duration, setDuration] = useState(selection.end - selection.start);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [account, setAccount] = useState('');
  const [locale, setLocale] = useState<'cs' | 'en'>('cs');
  const [paid, setPaid] = useState(false);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [price, setPrice] = useState('');
  // Until staff type a price, it follows the quote as the duration changes.
  const [priceEdited, setPriceEdited] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setQuoteLoading(true);
    const params = new URLSearchParams({
      date: boardDate,
      startMinutes: String(selection.start),
      durationMinutes: String(duration),
      stationType: selection.stationType,
      stationsCount: String(count),
    });
    fetch(`/api/admin/bookings/quote?${params}`)
      .then((r) => r.json())
      .then((d: { quote?: Quote | null }) => {
        if (cancelled) return;
        setQuote(d.quote ?? null);
        setQuoteLoading(false);
        if (!priceEdited && d.quote) setPrice(String(d.quote.amountPerStation));
      })
      .catch(() => { if (!cancelled) setQuoteLoading(false); });
    return () => { cancelled = true; };
    // priceEdited only gates the prefill; it must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardDate, selection.start, selection.stationType, count, duration]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const priceNum = Number(price);
  const priceValid = price !== '' && Number.isInteger(priceNum) && priceNum >= 0;
  const canSubmit = name.trim().length >= 2 && priceValid && !saving;

  // A pass is only kept when staff took the engine's price as offered.
  const usesQuotedPass = quote?.passId && !priceEdited ? quote.passId : null;

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: boardDate,
        startMinutes: selection.start,
        durationMinutes: duration,
        stationIds: selection.stationIds,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        clutchzoneAccount: account,
        pricePerStation: priceNum,
        timePassId: usesQuotedPass,
        paymentStatus: paid ? 'paid' : 'unpaid',
        locale,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? 'Rezervaci se nepodařilo vytvořit');
      return;
    }
    onCreated();
  }

  const dateLabel = new Date(boardDate + 'T12:00:00').toLocaleDateString('cs-CZ', {
    weekday: 'long', day: 'numeric', month: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', padding: 16 }}
      onClick={onClose}
    >
      <form
        className="bg-cz-black-mid rounded-cz w-full flex flex-col"
        style={{ maxWidth: 'min(520px, 100%)', maxHeight: '100%', border: '1px solid var(--color-cz-gray-dark)' }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); submit(); }}
      >
        <div className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-cz-gray-dark)' }}>
          <div>
            <div className="font-mono text-cz-orange uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>
              {selection.stationLabels.join(', ')}
            </div>
            <div className="font-display text-white uppercase" style={{ fontSize: 20 }}>NOVÁ REZERVACE</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Zavřít" className="text-cz-gray-light hover:text-white transition-colors">
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="flex-1 overflow-auto flex flex-col gap-4" style={{ padding: 24 }}>
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <span className={labelClass} style={labelStyle}>TERMÍN</span>
              <span className="font-mono text-white" style={{ fontSize: 17 }}>
                {dateLabel} · {minutesLabel(selection.start)}–{minutesLabel(selection.start + duration)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="cb-duration" className={labelClass} style={labelStyle}>DÉLKA</label>
              <select
                id="cb-duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="bg-cz-black text-white font-mono rounded-control focus:outline-none focus:border-cz-orange"
                style={inputStyle}
              >
                {DURATIONS.map((d) => <option key={d} value={d}>{durationLabel(d)}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="cb-name" className={labelClass} style={labelStyle}>JMÉNO *</label>
            <input id="cb-name" autoFocus required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="cb-phone" className={labelClass} style={labelStyle}>TELEFON</label>
              <input id="cb-phone" type="tel" maxLength={32} value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="cb-account" className={labelClass} style={labelStyle}>GGLEAP ÚČET</label>
              <input id="cb-account" maxLength={64} value={account} onChange={(e) => setAccount(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="cb-email" className={labelClass} style={labelStyle}>E-MAIL</label>
              <input id="cb-email" type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
            {email && (
              <div className="flex flex-col gap-1">
                <label htmlFor="cb-locale" className={labelClass} style={labelStyle}>JAZYK E-MAILU</label>
                <select
                  id="cb-locale"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as 'cs' | 'en')}
                  className="bg-cz-black text-white font-mono rounded-control focus:outline-none focus:border-cz-orange"
                  style={inputStyle}
                >
                  <option value="cs">CS</option>
                  <option value="en">EN</option>
                </select>
              </div>
            )}
          </div>
          <p className="font-body text-cz-white-soft" style={{ fontSize: 16, marginTop: -8 }}>
            {email
              ? paid ? 'Zákazníkovi odejde potvrzení o platbě.' : 'Zákazníkovi odejde potvrzení rezervace.'
              : 'Bez e-mailu zákazník nic nedostane.'}
          </p>

          <div className="flex gap-4 items-end">
            <div className="flex flex-col gap-1" style={{ width: 160 }}>
              <label htmlFor="cb-price" className={labelClass} style={labelStyle}>
                CENA / STANICE
              </label>
              <input
                id="cb-price"
                inputMode="numeric"
                value={price}
                onChange={(e) => { setPrice(e.target.value.replace(/[^\d]/g, '')); setPriceEdited(true); }}
                className="bg-cz-black text-white font-mono rounded-control focus:outline-none focus:border-cz-orange w-full"
                style={inputStyle}
              />
            </div>
            <div className="font-mono text-cz-gray-light" style={{ fontSize: 16, paddingBottom: 10 }}>
              {quoteLoading
                ? 'Počítám cenu…'
                : quote
                  ? `Ceník: ${quote.amountPerStation} Kč (${quote.label})${count > 1 ? ` · celkem ${priceValid ? priceNum * count : '—'} Kč` : ''}`
                  : 'Ceník pro tento den nemá cenu — zadej ručně'}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" size="sm" variant="ghost" active={!paid} onClick={() => setPaid(false)}>
              NEZAPLACENO
            </Button>
            <Button type="button" size="sm" variant="ghost" active={paid} onClick={() => setPaid(true)}>
              ZAPLACENO
            </Button>
          </div>

          {error && (
            <div role="alert" className="font-mono" style={{ fontSize: 17, color: 'var(--color-cz-danger)' }}>
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end" style={{ padding: '16px 24px', borderTop: '1px solid var(--color-cz-gray-dark)' }}>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>ZPĚT</Button>
          <Button type="submit" size="sm" disabled={!canSubmit}>
            {saving ? '...' : 'VYTVOŘIT'}
          </Button>
        </div>
      </form>
    </div>
  );
}
