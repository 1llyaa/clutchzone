'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { labelText, secondaryText } from '@/lib/typography';

export interface QueueEntry {
  id: string; // credit_orders.id OR booking_group_id
  source: 'kredit' | 'booking';
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  clutchzoneAccount: string | null;
  description: string;
  amount: number;
  paidAt: string;
  expiresAt: string;
  fulfilledAt: string | null;
  fulfilledByName: string | null;
  termsAcceptedAt: string;
  termsVersion: string;
  totalHours?: number;
  needsCredit: boolean;
  coinsAwarded: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function withdrawalLabel(paidAt: string): { text: string; color: string } {
  const deadline = new Date(paidAt);
  deadline.setDate(deadline.getDate() + 14);
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return { text: 'vypršela', color: 'var(--color-cz-gray-light)' };
  return { text: `zbývá ${daysLeft} ${daysLeft === 1 ? 'den' : daysLeft < 5 ? 'dny' : 'dní'}`, color: '#E84A1A' };
}
function fulfillUrl(entry: QueueEntry): string {
  return entry.source === 'kredit' ? `/api/admin/credits/${entry.id}/fulfill` : `/api/admin/bookings/${entry.id}/fulfill`;
}

export default function CreditsClient({ entries, showAll }: { entries: QueueEntry[]; showAll: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [fulfilling, setFulfilling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleFilter() {
    router.push(showAll ? '?' : '?all=1');
  }

  async function fulfill(entry: QueueEntry) {
    setFulfilling(entry.id);
    setError(null);
    const res = await fetch(fulfillUrl(entry), { method: 'POST' });
    const data = await res.json();
    setFulfilling(null);
    if (!res.ok) { setError(data.error); return; }
    startTransition(() => router.refresh());
  }

  const th = (label: string) => (
    <th key={label} className="font-mono text-cz-gray-light uppercase text-left" style={{ padding: '10px 14px', ...labelText, letterSpacing: 1.5, whiteSpace: 'nowrap' }}>
      {label}
    </th>
  );

  return (
    <div style={{ padding: '40px 48px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>KREDITY</h1>
          <p className="font-mono text-cz-gray-light" style={{ fontSize: 16, letterSpacing: 2, marginTop: 4 }}>
            HODINOVÝ KREDIT A MINCE Z KARETNÍCH PLATEB
          </p>
        </div>
        <button
          onClick={toggleFilter}
          className="font-mono uppercase"
          style={{ ...labelText, letterSpacing: 1.5, padding: '8px 16px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 'var(--radius-control)', color: '#888', cursor: 'pointer' }}
        >
          {showAll ? 'ZOBRAZIT JEN NEPŘIPSANÉ' : 'ZOBRAZIT VŠE'}
        </button>
      </div>

      {error && <p className="font-mono" style={{ ...secondaryText, color: '#E84A1A', marginBottom: 16 }}>{error}</p>}

      <div className="bg-cz-black-mid rounded-cz overflow-x-auto" style={{ border: '1px solid #2A2A2A' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
              {['ZDROJ', 'REFERENCE', 'ZÁKAZNÍK', 'POLOŽKY', 'ČÁSTKA', 'MINCE', 'ZAPLACENO', 'PLATNOST DO', 'STAV', 'LHŮTA NA ODSTOUPENÍ', 'KDO/KDY PŘIPSAL', 'SOUHLAS'].map(th)}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr><td colSpan={12} className="font-mono text-cz-gray-light text-center" style={{ padding: 32, fontSize: 16 }}>Žádné objednávky</td></tr>
            )}
            {entries.map((e) => {
              const withdrawal = withdrawalLabel(e.paidAt);
              return (
                <tr key={`${e.source}-${e.id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      className="font-mono uppercase"
                      style={{ ...labelText, letterSpacing: 1, color: e.source === 'kredit' ? '#E84A1A' : '#888', background: e.source === 'kredit' ? 'rgba(232,74,26,0.12)' : '#1A1A1A', border: `1px solid ${e.source === 'kredit' ? 'rgba(232,74,26,0.3)' : '#2A2A2A'}`, borderRadius: 'var(--radius-control)', padding: '3px 8px' }}
                    >
                      {e.source === 'kredit' ? 'NÁKUP' : 'REZERVACE'}
                    </span>
                  </td>
                  <td className="font-mono text-white" style={{ padding: '10px 14px', ...secondaryText, letterSpacing: 1 }}>{e.reference}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="font-body text-white" style={{ ...secondaryText }}>{e.customerName}</div>
                    <div className="font-mono text-cz-gray-light" style={{ ...secondaryText }}>{e.customerEmail}{e.customerPhone ? ` · ${e.customerPhone}` : ''}</div>
                    <div className="font-mono" style={{ ...secondaryText, color: e.clutchzoneAccount ? '#888' : '#E84A1A' }}>
                      {e.clutchzoneAccount ?? 'nemá zatím účet'}
                    </div>
                  </td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '10px 14px', ...secondaryText }}>{e.description}</td>
                  <td className="font-mono text-white" style={{ padding: '10px 14px', ...secondaryText }}>{e.amount} Kč</td>
                  <td className="font-mono" style={{ padding: '10px 14px', ...secondaryText, color: e.coinsAwarded ? '#E84A1A' : 'var(--color-cz-gray-light)' }}>{e.coinsAwarded || '—'}</td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '10px 14px', ...secondaryText }}>{formatDate(e.paidAt)}</td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '10px 14px', ...secondaryText }}>{e.needsCredit ? formatDate(e.expiresAt) : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {!e.needsCredit && !e.coinsAwarded ? (
                      <span className="font-mono uppercase" style={{ ...labelText, letterSpacing: 1, color: 'var(--color-cz-gray-light)' }}>NIC K PŘIPSÁNÍ</span>
                    ) : e.fulfilledAt ? (
                      <span className="font-mono uppercase" style={{ ...labelText, letterSpacing: 1, color: 'var(--color-cz-success)' }}>VYŘÍZENO</span>
                    ) : (
                      <button
                        onClick={() => fulfill(e)}
                        disabled={fulfilling === e.id}
                        className="font-mono uppercase"
                        style={{ ...labelText, letterSpacing: 1, color: '#E84A1A', background: 'transparent', border: '1px solid #E84A1A', borderRadius: 'var(--radius-control)', padding: '4px 10px', cursor: 'pointer' }}
                      >
                        {fulfilling === e.id ? '...' : e.needsCredit ? 'PŘIPSAT HODINY' : 'PŘIPSAT MINCE'}
                      </button>
                    )}
                  </td>
                  <td className="font-mono" style={{ padding: '10px 14px', ...secondaryText, color: withdrawal.color }}>{withdrawal.text}</td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '10px 14px', ...secondaryText }}>
                    {e.fulfilledByName ? `${e.fulfilledByName} · ${formatDateTime(e.fulfilledAt!)}` : '—'}
                  </td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '10px 14px', ...secondaryText }}>
                    {formatDate(e.termsAcceptedAt)} ({e.termsVersion})
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
