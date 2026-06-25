'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Tier {
  id: string;
  tier: string;
  label: string;
  amount: number;
  unit: string;
  description: string | null;
  is_featured: boolean;
}
interface DurationPrice { duration_h: number; amount: number }

export default function PricingClient({
  tiers,
  pcPrices,
  ps5Prices,
}: {
  tiers: Tier[];
  pcPrices: DurationPrice[];
  ps5Prices: DurationPrice[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState<string | null>(null);

  // Editable amounts keyed by id/key
  const [tierAmounts, setTierAmounts]   = useState<Record<string, number>>(
    Object.fromEntries(tiers.map((t) => [t.id, t.amount]))
  );
  const [pcAmounts, setPcAmounts]       = useState<Record<number, number>>(
    Object.fromEntries(pcPrices.map((p) => [p.duration_h, p.amount]))
  );
  const [ps5Amounts, setPs5Amounts]     = useState<Record<number, number>>(
    Object.fromEntries(ps5Prices.map((p) => [p.duration_h, p.amount]))
  );

  async function saveTier(id: string) {
    setSaving(id);
    await fetch(`/api/admin/pricing/tier/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: tierAmounts[id] }),
    });
    setSaving(null);
    startTransition(() => router.refresh());
  }

  async function saveDuration(table: 'pc' | 'ps5', duration_h: number, amount: number) {
    const key = `${table}-${duration_h}`;
    setSaving(key);
    await fetch(`/api/admin/pricing/duration`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, duration_h, amount }),
    });
    setSaving(null);
    startTransition(() => router.refresh());
  }

  function Row({ label, value, onSave, onChange, saveKey }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    onSave: () => void;
    saveKey: string;
  }) {
    return (
      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <td className="font-mono text-white" style={{ padding: '12px 16px', fontSize: 13 }}>
          {label}
        </td>
        <td style={{ padding: '8px 16px' }}>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="bg-cz-black text-white font-mono rounded-[2px] focus:outline-none focus:border-cz-orange"
              style={{ padding: '7px 12px', fontSize: 14, border: '1px solid #2A2A2A', width: 100 }}
            />
            <span className="font-mono text-cz-gray-mid" style={{ fontSize: 12 }}>Kč</span>
            <button
              onClick={onSave}
              disabled={saving === saveKey}
              className="font-mono text-cz-orange uppercase hover:underline disabled:opacity-50"
              style={{ fontSize: 10, letterSpacing: 1 }}
            >
              {saving === saveKey ? '...' : 'ULOŽIT'}
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>
          CENÍK
        </h1>
        <p className="font-mono text-cz-gray-mid" style={{ fontSize: 11, letterSpacing: 2, marginTop: 4 }}>
          ÚPRAVA PŘÍMÝCH CENOVEK
        </p>
      </div>

      {/* Special packages */}
      <div style={{ marginBottom: 40 }}>
        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 11, letterSpacing: 3, marginBottom: 16 }}>
          ZVÝHODNĚNÉ BALÍČKY
        </div>
        <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid #2A2A2A' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                {['BALÍČEK', 'CENA'].map((h) => (
                  <th key={h} className="font-mono text-cz-gray-mid uppercase text-left" style={{ padding: '12px 16px', fontSize: 10, letterSpacing: 2 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <Row
                  key={tier.id}
                  label={`${tier.label}  (${tier.description ?? tier.unit})`}
                  value={tierAmounts[tier.id]}
                  onChange={(v) => setTierAmounts((prev) => ({ ...prev, [tier.id]: v }))}
                  onSave={() => saveTier(tier.id)}
                  saveKey={tier.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PC duration prices */}
      <div style={{ marginBottom: 40 }}>
        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 11, letterSpacing: 3, marginBottom: 16 }}>
          PC — DÉLKOVÉ CENY
        </div>
        <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid #2A2A2A' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                {['DÉLKA', 'CENA'].map((h) => (
                  <th key={h} className="font-mono text-cz-gray-mid uppercase text-left" style={{ padding: '12px 16px', fontSize: 10, letterSpacing: 2 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pcPrices.map((p) => (
                <Row
                  key={p.duration_h}
                  label={`${p.duration_h} hodin`}
                  value={pcAmounts[p.duration_h]}
                  onChange={(v) => setPcAmounts((prev) => ({ ...prev, [p.duration_h]: v }))}
                  onSave={() => saveDuration('pc', p.duration_h, pcAmounts[p.duration_h])}
                  saveKey={`pc-${p.duration_h}`}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PS5 duration prices */}
      <div>
        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 11, letterSpacing: 3, marginBottom: 16 }}>
          PS5 — DÉLKOVÉ CENY
        </div>
        <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid #2A2A2A' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                {['DÉLKA', 'CENA'].map((h) => (
                  <th key={h} className="font-mono text-cz-gray-mid uppercase text-left" style={{ padding: '12px 16px', fontSize: 10, letterSpacing: 2 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ps5Prices.map((p) => (
                <Row
                  key={p.duration_h}
                  label={`${p.duration_h} hodin`}
                  value={ps5Amounts[p.duration_h]}
                  onChange={(v) => setPs5Amounts((prev) => ({ ...prev, [p.duration_h]: v }))}
                  onSave={() => saveDuration('ps5', p.duration_h, ps5Amounts[p.duration_h])}
                  saveKey={`ps5-${p.duration_h}`}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
