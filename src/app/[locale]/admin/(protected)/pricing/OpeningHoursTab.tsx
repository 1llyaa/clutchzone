'use client';

import { useState } from 'react';
import type { OpeningHoursRow } from '@/lib/pricing/types';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES: Record<number, string> = { 0: 'NEDĚLE', 1: 'PONDĚLÍ', 2: 'ÚTERÝ', 3: 'STŘEDA', 4: 'ČTVRTEK', 5: 'PÁTEK', 6: 'SOBOTA' };

type Draft = { isClosed: boolean; openTime: string; closeTime: string; crossesMidnight: boolean };

function toDraft(r: OpeningHoursRow): Draft {
  return { isClosed: r.isClosed, openTime: r.openTime?.slice(0, 5) ?? '14:00', closeTime: r.closeTime?.slice(0, 5) ?? '24:00', crossesMidnight: r.crossesMidnight };
}

export default function OpeningHoursTab({ openingHours, onUpdate }: { openingHours: OpeningHoursRow[]; onUpdate: (r: OpeningHoursRow) => void }) {
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});

  function draftFor(r: OpeningHoursRow) {
    return drafts[r.dayOfWeek] ?? toDraft(r);
  }

  async function save(r: OpeningHoursRow) {
    const d = draftFor(r);
    setSaving(r.dayOfWeek);
    setErrors((e) => ({ ...e, [r.dayOfWeek]: '' }));
    const res = await fetch(`/api/admin/opening-hours/${r.dayOfWeek}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) { setErrors((e) => ({ ...e, [r.dayOfWeek]: data.error })); return; }
    onUpdate({
      dayOfWeek: r.dayOfWeek,
      isClosed: d.isClosed,
      openTime: d.isClosed ? null : d.openTime,
      closeTime: d.isClosed ? null : d.closeTime,
      crossesMidnight: d.isClosed ? false : d.crossesMidnight,
    });
  }

  const rows = WEEK_ORDER.map((dow) => openingHours.find((r) => r.dayOfWeek === dow)).filter((r): r is OpeningHoursRow => !!r);

  return (
    <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid #2A2A2A' }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
            {['DEN', 'ZAVŘENO', 'OTEVÍRÁ', 'ZAVÍRÁ', 'PŘESAHUJE PŮLNOC', ''].map((h) => (
              <th key={h} className="font-mono text-cz-gray-light uppercase text-left" style={{ padding: '10px 14px', fontSize: 15, letterSpacing: 1.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const d = draftFor(r);
            return (
              <tr key={r.dayOfWeek} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="font-mono text-white" style={{ padding: '10px 14px', fontSize: 16, letterSpacing: 1 }}>{DAY_NAMES[r.dayOfWeek]}</td>
                <td style={{ padding: '10px 14px' }}>
                  <input type="checkbox" checked={d.isClosed} onChange={(e) => setDrafts((p) => ({ ...p, [r.dayOfWeek]: { ...d, isClosed: e.target.checked } }))} />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <input type="time" disabled={d.isClosed} value={d.openTime} onChange={(e) => setDrafts((p) => ({ ...p, [r.dayOfWeek]: { ...d, openTime: e.target.value } }))}
                    className="bg-cz-black text-white font-mono rounded-[2px]" style={{ padding: '6px 10px', fontSize: 16, border: '1px solid #2A2A2A', colorScheme: 'dark', opacity: d.isClosed ? 0.4 : 1 }} />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <input type="time" disabled={d.isClosed} value={d.closeTime} onChange={(e) => setDrafts((p) => ({ ...p, [r.dayOfWeek]: { ...d, closeTime: e.target.value } }))}
                    className="bg-cz-black text-white font-mono rounded-[2px]" style={{ padding: '6px 10px', fontSize: 16, border: '1px solid #2A2A2A', colorScheme: 'dark', opacity: d.isClosed ? 0.4 : 1 }} />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <input type="checkbox" disabled={d.isClosed} checked={d.crossesMidnight} onChange={(e) => setDrafts((p) => ({ ...p, [r.dayOfWeek]: { ...d, crossesMidnight: e.target.checked } }))} />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <button onClick={() => save(r)} disabled={saving === r.dayOfWeek} className="font-mono text-cz-orange uppercase hover:underline disabled:opacity-50" style={{ fontSize: 15, letterSpacing: 1 }}>
                    {saving === r.dayOfWeek ? '...' : 'ULOŽIT'}
                  </button>
                  {errors[r.dayOfWeek] && <p className="font-mono" style={{ fontSize: 13, color: '#E84A1A', marginTop: 4 }}>{errors[r.dayOfWeek]}</p>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
