'use client';

import { useEffect, useRef, useState } from 'react';

const MONTH_NAMES_CS = ['LEDEN', 'ÚNOR', 'BŘEZEN', 'DUBEN', 'KVĚTEN', 'ČERVEN', 'ČERVENEC', 'SRPEN', 'ZÁŘÍ', 'ŘÍJEN', 'LISTOPAD', 'PROSINEC'];
const MONTH_NAMES_EN = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const DAY_NAMES_CS = ['PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO', 'NE'];
const DAY_NAMES_EN = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

interface Props {
  value: string | null;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  locale?: 'cs' | 'en';
  placeholder?: string;
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m: m - 1, d };
}

function formatDisplay(iso: string): string {
  const { y, m, d } = parseISO(iso);
  return `${String(d).padStart(2, '0')}.${String(m + 1).padStart(2, '0')}.${y}`;
}

const navBtnStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  border: '1px solid var(--color-cz-gray-dark)',
  background: '#1A1A1A',
  color: '#FFFFFF',
  cursor: 'pointer',
  borderRadius: 'var(--radius-control)',
  fontSize: 14,
  lineHeight: 1,
};

export default function DatePicker({ value, onChange, min, max, locale = 'cs', placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const base = value ? parseISO(value) : parseISO(new Date().toISOString().slice(0, 10));
  const [viewY, setViewY] = useState(base.y);
  const [viewM, setViewM] = useState(base.m);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = value ? parseISO(value) : parseISO(new Date().toISOString().slice(0, 10));
    setViewY(p.y);
    setViewM(p.m);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const monthNames = locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_CS;
  const dayNames = locale === 'en' ? DAY_NAMES_EN : DAY_NAMES_CS;

  const startWeekday = (new Date(viewY, viewM, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function isDisabled(d: number): boolean {
    const iso = toISO(viewY, viewM, d);
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  }

  function selectDay(d: number) {
    if (isDisabled(d)) return;
    onChange(toISO(viewY, viewM, d));
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    let m = viewM + delta;
    let y = viewY;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewM(m);
    setViewY(y);
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="font-mono"
        style={{
          width: '100%',
          padding: '10px 14px',
          background: '#0A0A0A',
          border: `1px solid ${open ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)'}`,
          borderRadius: 'var(--radius-control)',
          color: value ? '#FFFFFF' : 'var(--color-cz-white-soft)',
          letterSpacing: 1,
          textAlign: 'left',
          cursor: 'pointer',
          fontSize: 16,
        }}
      >
        {value ? formatDisplay(value) : (placeholder ?? '—')}
      </button>

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
            padding: 14,
            width: 260,
            boxShadow: 'var(--shadow-float-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button type="button" onClick={() => shiftMonth(-1)} style={navBtnStyle}>‹</button>
            <div style={{ color: '#FFFFFF', letterSpacing: 1.5, fontSize: 14 }}>
              {monthNames[viewM]} {viewY}
            </div>
            <button type="button" onClick={() => shiftMonth(1)} style={navBtnStyle}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
            {dayNames.map((n) => (
              <div key={n} style={{ textAlign: 'center', fontSize: 11, color: '#888888', letterSpacing: 0.5 }}>
                {n}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const iso = toISO(viewY, viewM, d);
              const disabled = isDisabled(d);
              const active = value === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(d)}
                  style={{
                    height: 30,
                    fontSize: 13,
                    border: 'none',
                    borderRadius: 'var(--radius-control)',
                    background: active ? 'var(--color-cz-orange)' : 'transparent',
                    color: disabled ? '#444444' : active ? '#FFFFFF' : 'var(--color-cz-white-soft)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
