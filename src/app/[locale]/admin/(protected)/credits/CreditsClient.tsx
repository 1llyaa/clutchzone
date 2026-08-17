'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Item { station_type: string; hours: number; quantity: number; unit_amount: number }
interface Profile { id: string; display_name: string | null; email: string }
interface Order {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  clutchzone_account: string | null;
  total_amount: number;
  expires_at: string;
  terms_accepted_at: string;
  terms_version: string;
  fulfilled_at: string | null;
  created_at: string;
  items: Item[];
  fulfilledByProfile: Profile | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function withdrawalLabel(createdAt: string): { text: string; color: string } {
  const deadline = new Date(createdAt);
  deadline.setDate(deadline.getDate() + 14);
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return { text: 'vypršela', color: '#555555' };
  return { text: `zbývá ${daysLeft} ${daysLeft === 1 ? 'den' : daysLeft < 5 ? 'dny' : 'dní'}`, color: '#E84A1A' };
}

export default function CreditsClient({ orders, showAll }: { orders: Order[]; showAll: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [fulfilling, setFulfilling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleFilter() {
    router.push(showAll ? '?' : '?all=1');
  }

  async function fulfill(id: string) {
    setFulfilling(id);
    setError(null);
    const res = await fetch(`/api/admin/credits/${id}/fulfill`, { method: 'POST' });
    const data = await res.json();
    setFulfilling(null);
    if (!res.ok) { setError(data.error); return; }
    startTransition(() => router.refresh());
  }

  const th = (label: string) => (
    <th key={label} className="font-mono text-cz-gray-light uppercase text-left" style={{ padding: '10px 14px', fontSize: 14, letterSpacing: 1.5, whiteSpace: 'nowrap' }}>
      {label}
    </th>
  );

  return (
    <div style={{ padding: '40px 48px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>KREDITY</h1>
          <p className="font-mono text-cz-gray-light" style={{ fontSize: 16, letterSpacing: 2, marginTop: 4 }}>
            ZAPLACENÉ OBJEDNÁVKY KREDITU
          </p>
        </div>
        <button
          onClick={toggleFilter}
          className="font-mono uppercase"
          style={{ fontSize: 14, letterSpacing: 1.5, padding: '8px 16px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 2, color: '#888', cursor: 'pointer' }}
        >
          {showAll ? 'ZOBRAZIT JEN NEPŘIPSANÉ' : 'ZOBRAZIT VŠE'}
        </button>
      </div>

      {error && <p className="font-mono" style={{ fontSize: 15, color: '#E84A1A', marginBottom: 16 }}>{error}</p>}

      <div className="bg-cz-black-mid rounded-cz overflow-x-auto" style={{ border: '1px solid #2A2A2A' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
              {['REFERENCE', 'ZÁKAZNÍK', 'TYP + HODIN', 'ČÁSTKA', 'ZAPLACENO', 'PLATNOST DO', 'STAV', 'LHŮTA NA ODSTOUPENÍ', 'KDO/KDY PŘIPSAL', 'SOUHLAS'].map(th)}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={10} className="font-mono text-cz-gray-light text-center" style={{ padding: 32, fontSize: 16 }}>Žádné objednávky</td></tr>
            )}
            {orders.map((o) => {
              const withdrawal = withdrawalLabel(o.created_at);
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="font-mono text-white" style={{ padding: '10px 14px', fontSize: 15, letterSpacing: 1 }}>{o.reference}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="font-body text-white" style={{ fontSize: 15 }}>{o.customer_name}</div>
                    <div className="font-mono text-cz-gray-light" style={{ fontSize: 13 }}>{o.customer_email}{o.customer_phone ? ` · ${o.customer_phone}` : ''}</div>
                    <div className="font-mono" style={{ fontSize: 13, color: o.clutchzone_account ? '#888' : '#E84A1A' }}>
                      {o.clutchzone_account ?? 'nemá zatím účet'}
                    </div>
                  </td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '10px 14px', fontSize: 14 }}>
                    {o.items.map((i) => `${i.station_type.toUpperCase()} · ${i.quantity}× ${i.hours}h`).join(', ')}
                  </td>
                  <td className="font-mono text-white" style={{ padding: '10px 14px', fontSize: 15 }}>{o.total_amount} Kč</td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '10px 14px', fontSize: 14 }}>{formatDate(o.created_at)}</td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '10px 14px', fontSize: 14 }}>{formatDate(o.expires_at)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {o.fulfilled_at ? (
                      <span className="font-mono uppercase" style={{ fontSize: 13, letterSpacing: 1, color: '#22c55e' }}>PŘIPSÁNO</span>
                    ) : (
                      <button
                        onClick={() => fulfill(o.id)}
                        disabled={fulfilling === o.id}
                        className="font-mono uppercase"
                        style={{ fontSize: 13, letterSpacing: 1, color: '#E84A1A', background: 'transparent', border: '1px solid #E84A1A', borderRadius: 2, padding: '4px 10px', cursor: 'pointer' }}
                      >
                        {fulfilling === o.id ? '...' : 'NEPŘIPSÁNO — PŘIPSAT'}
                      </button>
                    )}
                  </td>
                  <td className="font-mono" style={{ padding: '10px 14px', fontSize: 14, color: withdrawal.color }}>{withdrawal.text}</td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '10px 14px', fontSize: 13 }}>
                    {o.fulfilledByProfile ? `${o.fulfilledByProfile.display_name ?? o.fulfilledByProfile.email} · ${formatDateTime(o.fulfilled_at!)}` : '—'}
                  </td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '10px 14px', fontSize: 13 }}>
                    {formatDate(o.terms_accepted_at)} ({o.terms_version})
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
