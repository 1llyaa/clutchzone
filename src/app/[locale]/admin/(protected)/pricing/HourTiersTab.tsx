'use client';

import { useState } from 'react';
import { Warning } from '@phosphor-icons/react';
import type { HourTier, StationType } from '@/lib/pricing/types';
import { labelText, secondaryText } from '@/lib/typography';

interface Props {
  hourTiers: HourTier[];
  onUpdate: (tier: HourTier) => void;
  onCreate: (tier: HourTier) => void;
}

function Table({ stationType, tiers, onUpdate, onCreate }: { stationType: StationType; tiers: HourTier[]; onUpdate: (t: HourTier) => void; onCreate: (t: HourTier) => void }) {
  const [drafts, setDrafts] = useState<Record<string, { hours: number; amount: number }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newHours, setNewHours] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [creating, setCreating] = useState(false);

  const sorted = [...tiers].sort((a, b) => a.hours - b.hours);
  const baseAmount = sorted.find((t) => t.isActive)?.amount ?? sorted[0]?.amount ?? 0;
  const baseHours = sorted.find((t) => t.isActive)?.hours ?? 1;

  // spec §11.2: warn when a bigger bundle costs more per hour than a smaller one
  const active = sorted.filter((t) => t.isActive);
  const nonMonotonic: string[] = [];
  for (let i = 1; i < active.length; i++) {
    const prevRate = active[i - 1].amount / active[i - 1].hours;
    const rate = active[i].amount / active[i].hours;
    if (rate > prevRate) nonMonotonic.push(`${active[i].hours}H (${Math.round(rate)} Kč/h) je dražší za hodinu než ${active[i - 1].hours}H (${Math.round(prevRate)} Kč/h)`);
  }

  function draftFor(t: HourTier) {
    return drafts[t.id] ?? { hours: t.hours, amount: t.amount };
  }

  async function save(t: HourTier) {
    const d = draftFor(t);
    setSaving(t.id);
    setError(null);
    const res = await fetch(`/api/admin/hour-tiers/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: d.hours, amount: d.amount }),
    });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) { setError(data.error); return; }
    onUpdate({ ...t, hours: d.hours, amount: d.amount });
  }

  async function toggleActive(t: HourTier) {
    setSaving(t.id);
    setError(null);
    const res = await fetch(`/api/admin/hour-tiers/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) { setError(data.error); return; }
    onUpdate({ ...t, isActive: !t.isActive });
  }

  async function create() {
    const hours = Number(newHours);
    const amount = Number(newAmount);
    if (!Number.isInteger(hours) || hours <= 0 || !Number.isInteger(amount) || amount <= 0) {
      setError('Zadej platný počet hodin a cenu');
      return;
    }
    setCreating(true);
    setError(null);
    const res = await fetch('/api/admin/hour-tiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stationType, hours, amount }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setError(data.error); return; }
    onCreate({ id: data.id, stationType, hours, amount, isActive: true, sortOrder: data.sort_order });
    setNewHours('');
    setNewAmount('');
  }

  return (
    <div style={{ marginBottom: 40 }}>
      <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 16 }}>
        {stationType === 'pc' ? 'GAMING PC' : 'PS5'}
      </div>
      {nonMonotonic.length > 0 && (
        <div style={{ background: 'rgba(232,74,26,0.08)', border: '1px solid rgba(232,74,26,0.35)', borderRadius: 'var(--radius-control)', padding: '12px 16px', marginBottom: 12 }}>
          {nonMonotonic.map((msg) => (
            <p key={msg} className="font-mono flex items-center gap-1.5" style={{ ...secondaryText, letterSpacing: 0.5, color: 'var(--color-cz-orange)', margin: 0 }}>
              <Warning size={16} weight="bold" /> {msg}
            </p>
          ))}
        </div>
      )}
      <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid var(--color-cz-gray-dark)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-cz-gray-dark)' }}>
              {['HODIN', 'CENA', 'KČ/H', 'ÚSPORA VS 1H', 'AKTIVNÍ', ''].map((h) => (
                <th key={h} className="font-mono text-cz-gray-light uppercase text-left" style={{ padding: '10px 14px', ...labelText, letterSpacing: 1.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const d = draftFor(t);
              const perHour = d.hours ? Math.round(d.amount / d.hours) : 0;
              const savings = baseHours ? d.hours * Math.round(baseAmount / baseHours) - d.amount : 0;
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: t.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: '8px 14px' }}>
                    <input type="number" value={d.hours} onChange={(e) => setDrafts((p) => ({ ...p, [t.id]: { ...d, hours: Number(e.target.value) } }))}
                      className="bg-cz-black text-white font-mono rounded-control" style={{ padding: '6px 10px', fontSize: 17, border: '1px solid var(--color-cz-gray-dark)', width: 64 }} />
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    <div className="flex items-center gap-2">
                      <input type="number" value={d.amount} onChange={(e) => setDrafts((p) => ({ ...p, [t.id]: { ...d, amount: Number(e.target.value) } }))}
                        className="bg-cz-black text-white font-mono rounded-control" style={{ padding: '6px 10px', fontSize: 17, border: '1px solid var(--color-cz-gray-dark)', width: 90 }} />
                      <span className="font-mono text-cz-gray-light" style={{ ...secondaryText }}>Kč</span>
                    </div>
                  </td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '8px 14px', fontSize: 16 }}>{perHour}</td>
                  <td className="font-mono" style={{ padding: '8px 14px', fontSize: 16, color: savings > 0 ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-light)' }}>{savings > 0 ? `−${savings} Kč` : '—'}</td>
                  <td style={{ padding: '8px 14px' }}>
                    <button onClick={() => toggleActive(t)} disabled={saving === t.id} className="font-mono uppercase" style={{ ...labelText, letterSpacing: 1, color: t.isActive ? 'var(--color-cz-orange)' : '#888', background: 'transparent', border: `1px solid ${t.isActive ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)'}`, borderRadius: 'var(--radius-control)', padding: '4px 10px', cursor: 'pointer' }}>
                      {t.isActive ? 'AKTIVNÍ' : 'VYPNUTO'}
                    </button>
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    <button onClick={() => save(t)} disabled={saving === t.id} className="font-mono text-cz-orange uppercase hover:underline disabled:opacity-50" style={{ ...labelText, letterSpacing: 1 }}>
                      {saving === t.id ? '...' : 'ULOŽIT'}
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td style={{ padding: '10px 14px' }}>
                <input type="number" placeholder="h" value={newHours} onChange={(e) => setNewHours(e.target.value)}
                  className="bg-cz-black text-white font-mono rounded-control placeholder:text-cz-gray-dark" style={{ padding: '6px 10px', fontSize: 17, border: '1px solid var(--color-cz-gray-dark)', width: 64 }} />
              </td>
              <td style={{ padding: '10px 14px' }}>
                <input type="number" placeholder="Kč" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                  className="bg-cz-black text-white font-mono rounded-control placeholder:text-cz-gray-dark" style={{ padding: '6px 10px', fontSize: 17, border: '1px solid var(--color-cz-gray-dark)', width: 90 }} />
              </td>
              <td colSpan={3} />
              <td style={{ padding: '10px 14px' }}>
                <button onClick={create} disabled={creating} className="font-mono text-cz-orange uppercase hover:underline disabled:opacity-50" style={{ ...labelText, letterSpacing: 1 }}>
                  {creating ? '...' : '+ PŘIDAT'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {error && <p className="font-mono" style={{ ...secondaryText, color: 'var(--color-cz-orange)', marginTop: 8 }}>{error}</p>}
    </div>
  );
}

export default function HourTiersTab({ hourTiers, onUpdate, onCreate }: Props) {
  return (
    <div>
      <Table stationType="pc" tiers={hourTiers.filter((t) => t.stationType === 'pc')} onUpdate={onUpdate} onCreate={onCreate} />
      <Table stationType="ps5" tiers={hourTiers.filter((t) => t.stationType === 'ps5')} onUpdate={onUpdate} onCreate={onCreate} />
    </div>
  );
}
