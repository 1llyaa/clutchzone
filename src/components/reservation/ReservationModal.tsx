'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { X } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { useReservation } from './ReservationContext';
import { useGgLeapHours } from '@/lib/ggleap/useGgLeapHours';
import { track } from '@/lib/analytics/track';
import { calculatePricing, reservedHoursOnSite } from '@/lib/pricing/engine';
import { offerDisplayLabel } from '@/lib/pricing/offerLabel';
import { dayTypeForDate } from '@/lib/pricing/dates';
import type { CalcInput, Offer, PricingConfig } from '@/lib/pricing/types';
import { labelText, secondaryText } from '@/lib/typography';
import StepSummaryDate from './steps/StepSummaryDate';
import StepContact from './steps/StepContact';
import StepPayment from './steps/StepPayment';
import StepDone from './steps/StepDone';

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
  paysWithCredit: boolean;
}

export default function ReservationModal() {
  const t = useTranslations('booking');
  const tc = useTranslations('calculator');
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

  const STEP_TITLES = [t('stepSummaryTitle'), t('stepContactTitle'), t('stepPaymentTitle')];

  useEffect(() => {
    if (isOpen) track('reservation_step_reached', { step });
  }, [isOpen, step]);

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
    if (!dt) return { activeOffer: offer, dateWarning: t('closedDayWarning') };
    if (dt.key === calcInput.dayTypeKey) return { activeOffer: offer, dateWarning: null };
    const res = calculatePricing({ ...calcInput, dayTypeKey: dt.key }, config);
    if (!res) return { activeOffer: offer, dateWarning: t('cannotComputePrice') };
    const stillThere = res.all.find((o) => o.id === offer.id);
    if (stillThere) {
      return {
        activeOffer: stillThere,
        dateWarning: stillThere.totalAmount !== offer.totalAmount ? t('priceChangedForDate', { amount: stillThere.totalAmount }) : null,
      };
    }
    return {
      activeOffer: res.recommended,
      dateWarning: t('dayTypeChangedWarning', { label: offerDisplayLabel(res.recommended, tc), amount: res.recommended.totalAmount }),
    };
  }, [config, calcInput, offer, date, t]);

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

  async function handleConfirm(method: 'online' | 'onsite' | 'credit') {
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
          paymentMethod: method === 'credit' ? 'onsite' : method,
          paysWithCredit: method === 'credit',
          customerName: contact.name,
          customerEmail: contact.email,
          customerPhone: contact.phone,
          customerDiscord: contact.discord.trim() || undefined,
          // Decides which locale the confirmation email's cancellation link
          // points at.
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? t('submitError'));
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
        setSubmitError(checkoutData.error ?? t('checkoutError'));
        setLoading(false);
        return;
      }

      track('reservation_completed', { kind: off.kind, stations: calcInput.stationsCount, amount: off.totalAmount });
      setResult({ reference: data.reference, stationLabels: data.stationLabels, totalAmount: data.totalAmount, isCredit: data.isCredit, paysWithCredit: method === 'credit' });
      setStep(4);
      setLoading(false);
    } catch {
      setSubmitError(t('submitError'));
      setLoading(false);
    }
  }

  const effectiveOffer = activeOffer ?? offer;

  // ggLeap balance for the nickname typed on the contact step. Looked up only
  // once the customer actually reaches the payment step, and never when they
  // said they have no account yet.
  const { state: hoursState, minutes: hoursMinutes } = useGgLeapHours(
    contact.clutchzoneAccount,
    isOpen && step === 3 && !contact.noAccountYet,
  );

  // What the booking would actually draw from that balance: the hours spent on
  // site (surplus tier hours stay as credit), once per reserved station.
  const requiredMinutes = useMemo(() => {
    const dt = date && config ? dayTypeForDate(config.dayTypes, date) : null;
    if (!effectiveOffer || !calcInput || !dt) return null;
    return reservedHoursOnSite(effectiveOffer, calcInput, dt) * 60 * calcInput.stationsCount;
  }, [effectiveOffer, calcInput, date, config]);

  if (!isOpen) return null;

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
            <span className="font-mono text-cz-orange uppercase" style={{ ...labelText, letterSpacing: 3 }}>
              {t('title')} {step <= 3 ? `· ${step}/3` : ''}
            </span>
            <span className="font-display text-white uppercase" style={{ fontSize: 26, letterSpacing: 1 }}>
              {step <= 3 ? STEP_TITLES[stepIndex] : t('doneStepLabel')}
            </span>
          </div>
          <Button variant="ghost" iconOnly onClick={handleClose} aria-label={t('close')}>
            <X size={20} weight="bold" />
          </Button>
        </div>

        {step <= 3 && (
          <div className="flex items-center gap-2" style={{ padding: '16px 32px 0' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className="rounded-full" style={{ width: 8, height: 8, background: s <= step ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)', transition: 'background 0.2s' }} />
                {s < 3 && <span style={{ width: 24, height: 1, background: s < step ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)' }} />}
              </div>
            ))}
          </div>
        )}

        <div key={step} className="animate-step-in" style={{ padding: '24px 32px 32px', flex: 1 }}>
          {!config ? (
            <p className="font-body text-cz-gray-light" style={{ ...secondaryText, textAlign: 'center', padding: '40px 0' }}>
              {t('loadingPricing')}
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
                  showCreditOption={effectiveOffer.kind !== 'pass'}
                  hoursState={hoursState}
                  hoursMinutes={hoursMinutes}
                  requiredMinutes={requiredMinutes}
                />
              )}
              {step === 4 && result && (
                <StepDone
                  reference={result.reference}
                  stationLabels={result.stationLabels}
                  date={date ?? ''}
                  startTime={calcInput ? `${String(calcInput.startHour % 24).padStart(2, '0')}:00` : ''}
                  totalAmount={result.totalAmount}
                  offerLabel={effectiveOffer ? offerDisplayLabel(effectiveOffer, tc) : ''}
                  isCredit={result.isCredit}
                  paysWithCredit={result.paysWithCredit}
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
