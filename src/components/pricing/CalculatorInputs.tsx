'use client';

import { useLocale, useTranslations } from 'next-intl';
import { dayTypeCloseHour, dayTypeOpenHour } from '@/lib/pricing/dayTypes';
import type { DayTypeGroup, PricingConfig, StationType } from '@/lib/pricing/types';

interface Props {
  config: PricingConfig;
  stationType: StationType;
  onStationType: (t: StationType) => void;
  dayType: DayTypeGroup;
  onDayType: (key: string) => void;
  startHour: number;
  onStartHour: (h: number) => void;
  durationHours: number;
  onDurationHours: (h: number) => void;
  stationsCount: number;
  onStationsCount: (n: number) => void;
  fitNote: string | null;
  maxStations?: number;
}

const MAX_DURATION = 12;
const MAX_STATIONS = 5;

function formatHour(h: number): string {
  return `${String(h % 24).padStart(2, '0')}:00`;
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    height: 40,
    border: `1px solid ${active ? '#E84A1A' : '#2A2A2A'}`,
    background: active ? 'rgba(232,74,26,0.12)' : '#111111',
    color: active ? '#FFFFFF' : '#E8E8E8',
    fontFamily: "'Bebas Neue',sans-serif",
    fontSize: 15,
    letterSpacing: 1,
    cursor: 'pointer',
    borderRadius: 2,
    padding: '0 14px',
    position: 'relative',
    whiteSpace: 'nowrap',
  };
}

export default function CalculatorInputs({
  config,
  stationType,
  onStationType,
  dayType,
  onDayType,
  startHour,
  onStartHour,
  durationHours,
  onDurationHours,
  stationsCount,
  onStationsCount,
  fitNote,
  maxStations = MAX_STATIONS,
}: Props) {
  const t = useTranslations('calculator');
  const locale = useLocale() === 'en' ? 'en' : 'cs';

  const closeHour = Math.round(dayTypeCloseHour(dayType));
  const openHour = Math.round(dayTypeOpenHour(dayType));
  const hourSlots: number[] = [];
  for (let h = openHour; h <= closeHour - 1; h++) hourSlots.push(h);

  const activePassesForStation = config.timePasses.filter(
    (p) => p.isActive && dayType.passIds.includes(p.id) && (p.stationType === 'any' || p.stationType === stationType),
  );
  const hourHasPass = (h: number) =>
    activePassesForStation.some((p) => {
      const ws = Number(p.windowStart.slice(0, 2)) + Number(p.windowStart.slice(3, 5)) / 60;
      const we = Number(p.windowEnd.slice(0, 2)) + Number(p.windowEnd.slice(3, 5)) / 60 + (p.crossesMidnight ? 24 : 0);
      return h >= ws && h < we;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, minWidth: 0 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 2.5, color: '#E8E8E8', textTransform: 'uppercase', marginBottom: 10 }}>
          {t('stationTypeLabel')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button style={pillStyle(stationType === 'pc')} onClick={() => onStationType('pc')}>{t('pc')}</button>
          <button style={pillStyle(stationType === 'ps5')} onClick={() => onStationType('ps5')}>{t('ps5')}</button>
        </div>
      </div>

      <div>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 2.5, color: '#E8E8E8', textTransform: 'uppercase', marginBottom: 10 }}>
          {t('dayLabel')}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {config.dayTypes.map((d) => (
            <button key={d.key} style={pillStyle(d.key === dayType.key)} onClick={() => onDayType(d.key)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 2.5, color: '#E8E8E8', textTransform: 'uppercase', marginBottom: 10 }}>
          {t('hourLabel')}
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {hourSlots.map((h) => (
            <button key={h} style={pillStyle(h === startHour)} onClick={() => onStartHour(h)}>
              {formatHour(h)}
              {hourHasPass(h) && (
                <span style={{ position: 'absolute', top: 5, right: 6, width: 5, height: 5, borderRadius: 100, background: '#E84A1A' }} />
              )}
            </button>
          ))}
        </div>
        {activePassesForStation.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 1.5, color: '#E8E8E8', marginTop: 12 }}>
            <span style={{ width: 5, height: 5, borderRadius: 100, background: '#E84A1A', display: 'inline-block' }} />
            {t('cheaperTime', { names: activePassesForStation.map((p) => (locale === 'en' ? p.nameEn : p.nameCs)).join(' · ') })}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 2.5, color: '#E8E8E8', textTransform: 'uppercase', marginBottom: 10 }}>
          {t('durationLabel')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #2A2A2A', background: '#111111', padding: '12px 16px' }}>
          <button
            style={{ width: 40, height: 40, border: '1px solid #2A2A2A', background: '#1A1A1A', color: '#FFFFFF', fontSize: 18, cursor: 'pointer', borderRadius: 2 }}
            onClick={() => onDurationHours(Math.max(1, durationHours - 1))}
          >
            −
          </button>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 1, color: '#FFFFFF', textTransform: 'uppercase' }}>
            {durationHours}H
          </div>
          <button
            style={{ width: 40, height: 40, border: '1px solid #2A2A2A', background: '#1A1A1A', color: '#FFFFFF', fontSize: 18, cursor: 'pointer', borderRadius: 2 }}
            onClick={() => onDurationHours(Math.min(MAX_DURATION, durationHours + 1))}
          >
            +
          </button>
        </div>
        <input
          type="range"
          min={1}
          max={MAX_DURATION}
          step={1}
          value={durationHours}
          onChange={(e) => onDurationHours(Number(e.target.value))}
          style={{ width: '100%', marginTop: 16 }}
        />
        {fitNote && (
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, lineHeight: 1.75, color: '#E8E8E8', background: '#111111', borderLeft: '2px solid #E84A1A', padding: '10px 14px', marginTop: 12 }}>
            {fitNote}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 2.5, color: '#E8E8E8', textTransform: 'uppercase', marginBottom: 10 }}>
          {t('stationsLabel')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #2A2A2A', background: '#111111', padding: '12px 16px' }}>
          <button
            style={{ width: 40, height: 40, border: '1px solid #2A2A2A', background: '#1A1A1A', color: '#FFFFFF', fontSize: 18, cursor: 'pointer', borderRadius: 2 }}
            onClick={() => onStationsCount(Math.max(1, stationsCount - 1))}
          >
            −
          </button>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 1, color: '#FFFFFF', textTransform: 'uppercase' }}>
            {stationsCount}
          </div>
          <button
            style={{ width: 40, height: 40, border: '1px solid #2A2A2A', background: '#1A1A1A', color: '#FFFFFF', fontSize: 18, cursor: 'pointer', borderRadius: 2 }}
            onClick={() => onStationsCount(Math.min(maxStations, stationsCount + 1))}
          >
            +
          </button>
        </div>
        {stationsCount >= maxStations && (
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, color: '#888888', marginTop: 12 }}>
            {t('morePrivate', { max: maxStations })} <a href="#privatni">{t('privateEventsLink')}</a>
          </div>
        )}
      </div>
    </div>
  );
}
