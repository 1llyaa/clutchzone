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
      <div style={{ background: '#0A0A0A', border: '1px solid #2A2A2A', padding: 20 }}>
        <div style={{ fontFamily: "'Space Mono',monospace", ...labelText, letterSpacing: 1.5, color: '#E8E8E8', textTransform: 'uppercase' }}>
          {calcInput.stationType === 'pc' ? tc('pc') : tc('ps5')} · {dayType?.label} · {String(calcInput.startHour % 24).padStart(2, '0')}:00 ·{' '}
          {hours} {hoursWord} · {stations} {stationsWord}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginTop: 14 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 1, color: '#FFFFFF', textTransform: 'uppercase' }}>
            {shownOffer.label}
          </span>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 34, color: '#FFFFFF' }}>
            {shownOffer.totalAmount} <span style={{ fontFamily: "'Space Mono',monospace", ...secondaryText, letterSpacing: 1.5, color: '#E8E8E8' }}>KČ</span>
          </span>
        </div>
        <div style={{ textAlign: 'right', marginTop: 10 }}>
          <button
            onClick={onEditCalculator}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Space Mono',monospace", ...labelText, letterSpacing: 2, color: '#E84A1A', textTransform: 'uppercase' }}
          >
            {t('editCalculator')}
          </button>
        </div>
      </div>

      <div>
        <div style={{ fontFamily: "'Space Mono',monospace", ...labelText, letterSpacing: 2.5, color: '#E8E8E8', textTransform: 'uppercase', marginBottom: 10 }}>
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
                style={{
                  padding: '10px 6px',
                  border: `1px solid ${active ? '#E84A1A' : '#2A2A2A'}`,
                  background: active ? 'rgba(232,74,26,0.12)' : '#111111',
                  color: active ? '#FFFFFF' : '#E8E8E8',
                  fontFamily: "'Space Mono',monospace",
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Space Mono',monospace", ...labelText, letterSpacing: 1, color: '#E8E8E8', textTransform: 'uppercase' }}>
          <span
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              background: availability.available >= calcInput.stationsCount ? '#E84A1A' : '#888888',
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
            borderLeft: '2px solid #E84A1A',
            padding: '12px 16px',
            fontSize: 16,
            lineHeight: 1.75,
            color: '#E8E8E8',
          }}
        >
          {dateWarning}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        style={{
          width: '100%',
          height: 56,
          background: canProceed ? '#E84A1A' : '#2A2A2A',
          border: `1.5px solid ${canProceed ? '#E84A1A' : '#2A2A2A'}`,
          borderRadius: 'var(--radius-control)',
          color: canProceed ? '#FFFFFF' : '#888888',
          fontFamily: "'Bebas Neue',sans-serif",
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
