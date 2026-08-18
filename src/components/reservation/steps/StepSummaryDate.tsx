'use client';

import { useLocale, useTranslations } from 'next-intl';
import PriceCalculator from '@/components/pricing/PriceCalculator';
import { nextDatesForDayType } from '@/lib/pricing/dates';
import { labelText, secondaryText, bodyText } from '@/lib/typography';
import type { CalcInput, DayTypeGroup, Offer, PricingConfig } from '@/lib/pricing/types';

const DAY_NAMES_SHORT_CS = ['NE', 'PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO'];
const DAY_NAMES_SHORT_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
}

interface Props {
  config: PricingConfig;
  calcInput: CalcInput | null;
  offer: Offer | null;
  onOfferChosen: (input: CalcInput, offer: Offer) => void;
  dayType: DayTypeGroup | null;
  date: string | null;
  onDate: (d: string) => void;
  activeOffer: Offer | null;
  dateWarning: string | null;
  availability: { available: number; total: number } | null;
  onEditCalculator: () => void;
  onNext: () => void;
}

export default function StepSummaryDate({
  config,
  calcInput,
  offer,
  onOfferChosen,
  dayType,
  date,
  onDate,
  activeOffer,
  dateWarning,
  availability,
  onEditCalculator,
  onNext,
}: Props) {
  const t = useTranslations('booking');
  const tc = useTranslations('calculator');
  const locale = useLocale() === 'en' ? 'en' : 'cs';
  const dayNames = locale === 'en' ? DAY_NAMES_SHORT_EN : DAY_NAMES_SHORT_CS;

  if (!calcInput || !offer) {
    return <PriceCalculator config={config} variant="compact" onOfferChosen={onOfferChosen} />;
  }

  const shownOffer = activeOffer ?? offer;
  const quickDates = dayType ? nextDatesForDayType(dayType, 4) : [];
  const today = new Date().toISOString().slice(0, 10);
  const canProceed = !!date && (!availability || availability.available >= calcInput.stationsCount);

  const hours = calcInput.durationHours;
  const hoursWord = hours === 1 ? tc('hoursWord1') : hours >= 2 && hours <= 4 ? tc('hoursWord2to4') : tc('hoursWord5plus');
  const stations = calcInput.stationsCount;
  const stationsWord = stations <= 4 ? tc('stationsWord1to4') : tc('stationsWord5plus');

  return (
    <div className="flex flex-col gap-5" style={{ marginTop: 8 }}>
      <div style={{ background: '#0A0A0A', border: '1px solid var(--color-cz-gray-dark)', padding: 20 }}>
        <div className="font-mono" style={{ ...labelText, letterSpacing: 1.5, color: 'var(--color-cz-white-soft)', textTransform: 'uppercase' }}>
          {calcInput.stationType === 'pc' ? tc('pc') : tc('ps5')} · {dayType?.label} · {String(calcInput.startHour % 24).padStart(2, '0')}:00 ·{' '}
          {hours} {hoursWord} · {stations} {stationsWord}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginTop: 14 }}>
          <span className="font-display" style={{ fontSize: 26, letterSpacing: 1, color: '#FFFFFF', textTransform: 'uppercase' }}>
            {shownOffer.label}
          </span>
          <span className="font-display" style={{ fontSize: 34, color: '#FFFFFF' }}>
            {shownOffer.totalAmount} <span className="font-mono" style={{ ...secondaryText, letterSpacing: 1.5, color: 'var(--color-cz-white-soft)' }}>KČ</span>
          </span>
        </div>
        <div style={{ textAlign: 'right', marginTop: 10 }}>
          <button
            onClick={onEditCalculator}
            className="font-mono"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', ...labelText, letterSpacing: 2, color: 'var(--color-cz-orange)', textTransform: 'uppercase' }}
          >
            {t('editCalculator')}
          </button>
        </div>
      </div>

      <div>
        <div className="font-mono" style={{ ...labelText, letterSpacing: 2.5, color: 'var(--color-cz-white-soft)', textTransform: 'uppercase', marginBottom: 10 }}>
          {t('pickDate')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {quickDates.map((d) => {
            const active = date === d;
            const dow = new Date(d + 'T12:00:00').getDay();
            return (
              <button
                key={d}
                onClick={() => onDate(d)}
                className="font-mono"
                style={{
                  padding: '10px 6px',
                  border: `1px solid ${active ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)'}`,
                  background: active ? 'rgba(232,74,26,0.12)' : '#111111',
                  color: active ? '#FFFFFF' : 'var(--color-cz-white-soft)',
                  ...labelText,
                  letterSpacing: 1,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-control)',
                  textAlign: 'center',
                }}
              >
                {dayNames[dow]} {formatDateLabel(d)}
              </button>
            );
          })}
        </div>
        <input
          type="date"
          min={today}
          value={date ?? ''}
          onChange={(e) => onDate(e.target.value)}
          className="w-full bg-cz-black border border-cz-gray-dark rounded-cz font-mono text-white"
          style={{ padding: '10px 14px', ...bodyText, letterSpacing: 1, colorScheme: 'dark', marginTop: 10 }}
        />
      </div>

      {availability && (
        <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: 8, ...labelText, letterSpacing: 1, color: 'var(--color-cz-white-soft)', textTransform: 'uppercase' }}>
          <span
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              background: availability.available >= calcInput.stationsCount ? 'var(--color-cz-orange)' : '#888888',
              display: 'inline-block',
            }}
          />
          {t('stationsFreeOfTotal', { available: availability.available, total: availability.total })}
        </div>
      )}

      {dateWarning && (
        <div
          className="font-body"
          style={{
            background: 'rgba(232,74,26,0.08)',
            border: '1px solid rgba(232,74,26,0.4)',
            borderLeft: '2px solid var(--color-cz-orange)',
            padding: '12px 16px',
            fontSize: 16,
            lineHeight: 1.75,
            color: 'var(--color-cz-white-soft)',
          }}
        >
          {dateWarning}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="font-display"
        style={{
          width: '100%',
          height: 56,
          background: canProceed ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)',
          border: `1.5px solid ${canProceed ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)'}`,
          borderRadius: 'var(--radius-control)',
          color: canProceed ? '#FFFFFF' : '#888888',
          fontSize: 18,
          letterSpacing: 1.5,
          lineHeight: 1,
          cursor: canProceed ? 'pointer' : 'not-allowed',
          textTransform: 'uppercase',
        }}
      >
        {t('continueToContact')}
      </button>
    </div>
  );
}
