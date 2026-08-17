'use client';

import { useLocale } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useReservation } from './ReservationContext';
import { calculatePricing, reservedHoursOnSite } from '@/lib/pricing/engine';
import { dayTypeForDate } from '@/lib/pricing/dates';
import type { CalcInput, Offer, PricingConfig } from '@/lib/pricing/types';
import StepSummaryDate from './steps/StepSummaryDate';
import StepContact from './steps/StepContact';
import StepPayment from './steps/StepPayment';
import StepDone from './steps/StepDone';

const STEP_TITLES = ['SOUHRN A DATUM', 'KONTAKT', 'PLATBA A POTVRZENÍ'];

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  discord: string;
  clutchzoneAccount: string;
  noAccountYet: boolean;
}
const EMPTY_CONTACT: ContactInfo = { name: '', email: '', phone: '', discord: '', clutchzoneAccount: '', noAccountYet: false };

interface BookingResult {
  reference: string;
  stationLabels: string[];
  totalAmount: number;
  isCredit: boolean;
}

export default function ReservationModal() {
  const locale = useLocale();
  const { isOpen, prefill, close } = useReservation();
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [step, setStep] = useState(1);

  const [calcInput, setCalcInput] = useState<CalcInput | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{ available: number; total: number } | null>(null);

  const [contact, setContact] = useState<ContactInfo>(EMPTY_CONTACT);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);

  useEffect(() => {
    if (isOpen && !config) {
      fetch('/api/pricing')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setConfig(d); })
        .catch(() => {});
    }
  }, [isOpen, config]);

  useEffect(() => {
    if (!isOpen || !prefill || !config || calcInput) return;
    const input: CalcInput = {
      stationType: prefill.stationType,
      dayTypeKey: prefill.dayTypeKey,
      startHour: prefill.startHour,
      durationHours: prefill.durationHours,
      stationsCount: prefill.stationsCount,
    };
    const res = calculatePricing(input, config);
    const found = res?.all.find((o) => o.id === prefill.offerId) ?? res?.recommended ?? null;
    if (found) {
      setCalcInput(input);
      setOffer(found);
    }
  }, [isOpen, prefill, config, calcInput]);

  const dayType = calcInput && config ? config.dayTypes.find((d) => d.key === calcInput.dayTypeKey) ?? null : null;

  const { activeOffer, dateWarning } = useMemo(() => {
    if (!config || !calcInput || !offer || !date) return { activeOffer: offer, dateWarning: null as string | null };
    const dt = dayTypeForDate(config.dayTypes, date);
    if (!dt) return { activeOffer: offer, dateWarning: 'V tento den je zavřeno — vyber prosím jiné datum.' };
    if (dt.key === calcInput.dayTypeKey) return { activeOffer: offer, dateWarning: null };
    const res = calculatePricing({ ...calcInput, dayTypeKey: dt.key }, config);
    if (!res) return { activeOffer: offer, dateWarning: 'Pro vybrané datum nejde cenu spočítat, vyber prosím jiné.' };
    const stillThere = res.all.find((o) => o.id === offer.id);
    if (stillThere) {
      return {
        activeOffer: stillThere,
        dateWarning: stillThere.totalAmount !== offer.totalAmount ? `Pro vybrané datum je cena ${stillThere.totalAmount} Kč.` : null,
      };
    }
    return {
      activeOffer: res.recommended,
      dateWarning: `Zvolené datum má jiný typ dne — cena se přepočítala na ${res.recommended.label} za ${res.recommended.totalAmount} Kč.`,
    };
  }, [config, calcInput, offer, date]);

  useEffect(() => {
    const dt = date && config ? dayTypeForDate(config.dayTypes, date) : null;
    const off = activeOffer ?? offer;
    if (!config || !calcInput || !date || !dt || !off) {
      setAvailability(null);
      return;
    }
    const reservedHours = reservedHoursOnSite(off, calcInput, dt);
    const startTime = `${String(calcInput.startHour % 24).padStart(2, '0')}:00`;
    const params = new URLSearchParams({
      date,
      start: startTime,
      duration: String(reservedHours * 60),
      type: calcInput.stationType,
    });
    let cancelled = false;
    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setAvailability({ available: d.available ?? 0, total: d.total ?? 0 }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [config, calcInput, date, activeOffer, offer]);

  function reset() {
    setStep(1);
    setCalcInput(null);
    setOffer(null);
    setDate(null);
    setAvailability(null);
    setContact(EMPTY_CONTACT);
    setTermsAccepted(false);
    setConsentError(false);
    setSubmitError('');
    setResult(null);
    setLoading(false);
  }

  function handleClose() {
    close();
    setTimeout(reset, 300);
  }

  function handleOfferChosen(input: CalcInput, chosenOffer: Offer) {
    setCalcInput(input);
    setOffer(chosenOffer);
  }

  function handleEditCalculator() {
    handleClose();
    document.getElementById('cenik')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleConfirm(method: 'online' | 'onsite') {
    if (!termsAccepted) {
      setConsentError(true);
      return;
    }
    const off = activeOffer ?? offer;
    if (!calcInput || !date || !off) return;

    setSubmitError('');
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationType: calcInput.stationType,
          date,
          startHour: calcInput.startHour,
          durationHours: calcInput.durationHours,
          stationsCount: calcInput.stationsCount,
          offerKind: off.kind,
          offerId: off.id,
          expectedAmount: off.totalAmount,
          termsAccepted: true,
          clutchzoneAccount: contact.clutchzoneAccount.trim() || undefined,
          paymentMethod: method,
          customerName: contact.name,
          customerEmail: contact.email,
          customerPhone: contact.phone,
          customerDiscord: contact.discord.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? 'Něco se pokazilo, zkus to prosím znovu.');
        setLoading(false);
        return;
      }

      if (method === 'online') {
        const checkoutRes = await fetch(`/api/bookings/${data.id}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale }),
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutRes.ok && checkoutData.url) {
          window.location.href = checkoutData.url; // full redirect — intentionally leaves the SPA
          return;
        }
        setSubmitError(checkoutData.error ?? 'Chyba při vytváření platby');
        setLoading(false);
        return;
      }

      setResult({ reference: data.reference, stationLabels: data.stationLabels, totalAmount: data.totalAmount, isCredit: data.isCredit });
      setStep(4);
      setLoading(false);
    } catch {
      setSubmitError('Něco se pokazilo, zkus to prosím znovu.');
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const effectiveOffer = activeOffer ?? offer;
  const stepIndex = Math.min(step, 3) - 1;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-backdrop-in"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="relative w-full bg-cz-black-mid border border-cz-gray-dark rounded-cz flex flex-col animate-modal-in"
        style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <span className="absolute top-0 left-0 right-0 bg-cz-orange rounded-t-cz" style={{ height: 2 }} />

        <div className="flex items-center justify-between" style={{ padding: '28px 32px 0' }}>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-cz-orange uppercase" style={{ fontSize: 14, letterSpacing: 3 }}>
              REZERVACE {step <= 3 ? `· ${step}/3` : ''}
            </span>
            <span className="font-display text-white uppercase" style={{ fontSize: 26, letterSpacing: 1 }}>
              {step <= 3 ? STEP_TITLES[stepIndex] : 'HOTOVO'}
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

        {step <= 3 && (
          <div className="flex items-center gap-2" style={{ padding: '16px 32px 0' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className="rounded-full" style={{ width: 8, height: 8, background: s <= step ? '#E84A1A' : '#2A2A2A', transition: 'background 0.2s' }} />
                {s < 3 && <span style={{ width: 24, height: 1, background: s < step ? '#E84A1A' : '#2A2A2A' }} />}
              </div>
            ))}
          </div>
        )}

        <div key={step} className="animate-step-in" style={{ padding: '24px 32px 32px', flex: 1 }}>
          {!config ? (
            <p className="font-mono text-cz-gray-light" style={{ fontSize: 15, letterSpacing: 1, textAlign: 'center', padding: '40px 0' }}>
              Načítám ceník…
            </p>
          ) : (
            <>
              {step === 1 && (
                <StepSummaryDate
                  config={config}
                  calcInput={calcInput}
                  offer={offer}
                  onOfferChosen={handleOfferChosen}
                  dayType={dayType}
                  date={date}
                  onDate={setDate}
                  activeOffer={activeOffer}
                  dateWarning={dateWarning}
                  availability={availability}
                  onEditCalculator={handleEditCalculator}
                  onNext={() => setStep(2)}
                />
              )}
              {step === 2 && effectiveOffer && (
                <StepContact
                  contact={contact}
                  onChange={setContact}
                  requireClutchzoneAccount
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              )}
              {step === 3 && effectiveOffer && (
                <StepPayment
                  offer={effectiveOffer}
                  termsAccepted={termsAccepted}
                  onToggleConsent={() => { setTermsAccepted((v) => !v); setConsentError(false); }}
                  consentError={consentError}
                  loading={loading}
                  error={submitError}
                  onConfirm={handleConfirm}
                />
              )}
              {step === 4 && result && (
                <StepDone
                  reference={result.reference}
                  stationLabels={result.stationLabels}
                  date={date ?? ''}
                  startTime={calcInput ? `${String(calcInput.startHour % 24).padStart(2, '0')}:00` : ''}
                  totalAmount={result.totalAmount}
                  offerLabel={effectiveOffer?.label ?? ''}
                  isCredit={result.isCredit}
                  creditExpiryMonths={config.creditExpiryMonths}
                  onClose={handleClose}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
