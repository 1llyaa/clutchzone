'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Potvrzeno',
  pending:   'Čeká',
  cancelled: 'Zrušeno',
  completed: 'Dokončeno',
};
const STATUS_COLOR: Record<string, string> = {
  confirmed: '#22c55e',
  pending:   '#eab308',
  cancelled: '#ef4444',
  completed: '#888888',
};
const TILE_BG: Record<string, string> = {
  free:     '#1a1a1a',
  occupied: 'rgba(232,74,26,0.15)',
  inactive: '#0f0f0f',
};
const TILE_BORDER: Record<string, string> = {
  free:     '#2A2A2A',
  occupied: '#E84A1A',
  inactive: '#1a1a1a',
};

interface Booking {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_discord: string | null;
  date: string;
  start_time: string;
  duration_minutes: number;
  total_price: number;
  status: string;
  station_id: string;
  stations: { label: string; type: string } | null;
}

interface Station {
  id: string;
  label: string;
  type: string;
  is_active: boolean;
}

export default function BookingsClient({
  bookings,
  stations,
  from,
  to,
}: {
  bookings: Booking[];
  stations: Station[];
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo,   setLocalTo]   = useState(to);

  const isSingleDay = from === to;

  const occupiedIds = new Set(
    bookings.filter((b) => b.status !== 'cancelled').map((b) => b.station_id)
  );

  function applyRange(newFrom: string, newTo: string) {
    const safeFrom = newFrom;
    const safeTo   = newTo < newFrom ? newFrom : newTo;
    startTransition(() => {
      router.push(`?from=${safeFrom}&to=${safeTo}`);
    });
  }

  function handleFromChange(val: string) {
    setLocalFrom(val);
    const safeTo = localTo < val ? val : localTo;
    setLocalTo(safeTo);
    applyRange(val, safeTo);
  }

  function handleToChange(val: string) {
    setLocalTo(val);
    applyRange(localFrom, val);
  }

  async function updateStatus(bookingId: string, status: string) {
    setUpdating(true);
    await fetch(`/api/admin/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUpdating(false);
    setSelected(null);
    startTransition(() => router.refresh());
  }

  async function deleteBooking(bookingId: string) {
    if (!confirm('Opravdu smazat rezervaci? Tato akce je nevratná.')) return;
    setDeleting(true);
    await fetch(`/api/admin/bookings/${bookingId}`, { method: 'DELETE' });
    setDeleting(false);
    setSelected(null);
    startTransition(() => router.refresh());
  }

  const pcStations  = stations.filter((s) => s.type === 'pc');
  const ps5Stations = stations.filter((s) => s.type === 'ps5');

  function tileState(station: Station) {
    if (!station.is_active) return 'inactive';
    if (occupiedIds.has(station.id)) return 'occupied';
    return 'free';
  }

  const rangeLabel = isSingleDay
    ? new Date(from).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()
    : `${new Date(from).toLocaleDateString('cs-CZ')} – ${new Date(to).toLocaleDateString('cs-CZ')}`;

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 40 }}>
        <div>
          <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>
            REZERVACE
          </h1>
          <p className="font-mono text-cz-gray-mid" style={{ fontSize: 11, letterSpacing: 2, marginTop: 4 }}>
            {bookings.length} REZERVACÍ · {rangeLabel}
          </p>
        </div>

        {/* Date range picker */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 9, letterSpacing: 2 }}>OD</label>
            <input
              type="date"
              value={localFrom}
              onChange={(e) => handleFromChange(e.target.value)}
              className="bg-cz-black-mid text-white font-mono rounded-[2px] focus:outline-none focus:border-cz-orange"
              style={{ padding: '8px 12px', fontSize: 13, border: '1px solid #2A2A2A' }}
            />
          </div>
          <div className="font-mono text-cz-gray-mid" style={{ fontSize: 16, marginTop: 16 }}>–</div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 9, letterSpacing: 2 }}>DO</label>
            <input
              type="date"
              value={localTo}
              min={localFrom}
              onChange={(e) => handleToChange(e.target.value)}
              className="bg-cz-black-mid text-white font-mono rounded-[2px] focus:outline-none focus:border-cz-orange"
              style={{ padding: '8px 12px', fontSize: 13, border: '1px solid #2A2A2A' }}
            />
          </div>
          {!isSingleDay && (
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setLocalFrom(today);
                setLocalTo(today);
                applyRange(today, today);
              }}
              className="font-mono text-cz-gray-mid uppercase hover:text-white transition-colors"
              style={{ fontSize: 9, letterSpacing: 2, marginTop: 16 }}
            >
              DNES
            </button>
          )}
        </div>
      </div>

      {/* Station grid — only meaningful for a single day */}
      {isSingleDay && (
        <div style={{ marginBottom: 40 }}>
          <div className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 3, marginBottom: 12 }}>
            PC STANICE
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(10, 1fr)', marginBottom: 16 }}>
            {pcStations.map((s) => {
              const state = tileState(s);
              return (
                <div
                  key={s.id}
                  className="rounded-[2px] flex flex-col items-center justify-center"
                  style={{ padding: '10px 4px', background: TILE_BG[state], border: `1px solid ${TILE_BORDER[state]}` }}
                >
                  <span className="font-mono text-white" style={{ fontSize: 11, letterSpacing: 1 }}>{s.label}</span>
                  <span className="font-mono uppercase" style={{ fontSize: 8, letterSpacing: 1, marginTop: 3, color: state === 'occupied' ? '#E84A1A' : '#555' }}>
                    {state === 'occupied' ? 'OBSAZENO' : state === 'inactive' ? 'INACTIVE' : 'VOLNÉ'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 3, marginBottom: 12 }}>
            PS5 STANICE
          </div>
          <div className="flex gap-2">
            {ps5Stations.map((s) => {
              const state = tileState(s);
              return (
                <div
                  key={s.id}
                  className="rounded-[2px] flex flex-col items-center justify-center"
                  style={{ padding: '10px 20px', background: TILE_BG[state], border: `1px solid ${TILE_BORDER[state]}` }}
                >
                  <span className="font-mono text-white" style={{ fontSize: 11, letterSpacing: 1 }}>{s.label}</span>
                  <span className="font-mono uppercase" style={{ fontSize: 8, letterSpacing: 1, marginTop: 3, color: state === 'occupied' ? '#E84A1A' : '#555' }}>
                    {state === 'occupied' ? 'OBSAZENO' : 'VOLNÉ'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking table */}
      <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid #2A2A2A' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
              {[
                'REFERENCE', 'ZÁKAZNÍK', 'KONTAKT', 'STANICE',
                ...(!isSingleDay ? ['DATUM'] : []),
                'ČAS', 'DÉLKA', 'CELKEM', 'STATUS', '',
              ].map((h) => (
                <th key={h} className="font-mono text-cz-gray-mid uppercase text-left" style={{ padding: '12px 14px', fontSize: 10, letterSpacing: 2 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={isSingleDay ? 9 : 10} className="font-mono text-cz-gray-mid text-center" style={{ padding: 40, fontSize: 12 }}>
                  Žádné rezervace pro zvolené období
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr
                  key={b.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: b.status === 'cancelled' ? 0.45 : 1 }}
                >
                  <td className="font-mono text-cz-orange" style={{ padding: '12px 14px', fontSize: 12 }}>{b.reference}</td>
                  <td className="font-body text-white" style={{ padding: '12px 14px', fontSize: 13 }}>{b.customer_name}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div className="font-mono text-cz-gray-light" style={{ fontSize: 11 }}>{b.customer_email}</div>
                    {b.customer_phone && (
                      <div className="font-mono text-cz-gray-mid" style={{ fontSize: 10, marginTop: 2 }}>{b.customer_phone}</div>
                    )}
                  </td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '12px 14px', fontSize: 12 }}>{b.stations?.label ?? '—'}</td>
                  {!isSingleDay && (
                    <td className="font-mono text-cz-gray-light" style={{ padding: '12px 14px', fontSize: 12 }}>
                      {new Date(b.date).toLocaleDateString('cs-CZ')}
                    </td>
                  )}
                  <td className="font-mono text-white" style={{ padding: '12px 14px', fontSize: 12 }}>{b.start_time?.slice(0, 5)}</td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '12px 14px', fontSize: 12 }}>{Math.round(b.duration_minutes / 60)}h</td>
                  <td className="font-body text-white" style={{ padding: '12px 14px', fontSize: 13 }}>{b.total_price} Kč</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      className="font-mono uppercase rounded-[2px]"
                      style={{ fontSize: 9, letterSpacing: 1, padding: '3px 8px', color: STATUS_COLOR[b.status] ?? '#888', background: (STATUS_COLOR[b.status] ?? '#888') + '20' }}
                    >
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => setSelected(b)} className="font-mono text-cz-orange uppercase hover:underline" style={{ fontSize: 10, letterSpacing: 1 }}>
                      DETAIL
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-end" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setSelected(null)}>
          <div className="bg-cz-black-mid h-full flex flex-col" style={{ width: 400, borderLeft: '1px solid #2A2A2A' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ padding: '24px 28px', borderBottom: '1px solid #2A2A2A' }}>
              <div>
                <div className="font-mono text-cz-orange" style={{ fontSize: 13 }}>{selected.reference}</div>
                <div className="font-display text-white uppercase" style={{ fontSize: 20 }}>DETAIL REZERVACE</div>
              </div>
              <button onClick={() => setSelected(null)} className="font-mono text-cz-gray-mid hover:text-white" style={{ fontSize: 18 }}>×</button>
            </div>

            <div className="flex-1 overflow-auto" style={{ padding: 28 }}>
              {[
                ['Zákazník',  selected.customer_name],
                ['E-mail',    selected.customer_email],
                ['Telefon',   selected.customer_phone || '—'],
                ['Discord',   selected.customer_discord || '—'],
                ['Stanice',   selected.stations?.label || '—'],
                ['Datum',     new Date(selected.date).toLocaleDateString('cs-CZ')],
                ['Čas',       selected.start_time?.slice(0, 5)],
                ['Délka',     `${Math.round(selected.duration_minutes / 60)} hodin`],
                ['Celkem',    `${selected.total_price} Kč`],
              ].map(([label, value]) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>{label}</div>
                  <div className="font-body text-white" style={{ fontSize: 14 }}>{value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3" style={{ padding: '20px 28px', borderTop: '1px solid #2A2A2A' }}>
              {selected.status !== 'cancelled' && selected.status !== 'completed' && (
                <div className="flex gap-3">
                  <button
                    disabled={updating}
                    onClick={() => updateStatus(selected.id, 'completed')}
                    className="flex-1 bg-cz-orange text-white font-display uppercase rounded-[2px] hover:bg-cz-orange-dark transition-colors disabled:opacity-50"
                    style={{ fontSize: 13, letterSpacing: 2, padding: '10px 0' }}
                  >
                    DOKONČIT
                  </button>
                  <button
                    disabled={updating}
                    onClick={() => updateStatus(selected.id, 'cancelled')}
                    className="flex-1 font-display uppercase rounded-[2px] hover:border-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    style={{ fontSize: 13, letterSpacing: 2, padding: '10px 0', border: '1px solid #2A2A2A', color: '#888', background: 'transparent' }}
                  >
                    ZRUŠIT
                  </button>
                </div>
              )}
              <button
                disabled={deleting}
                onClick={() => deleteBooking(selected.id)}
                className="w-full font-display uppercase rounded-[2px] hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors disabled:opacity-50"
                style={{ fontSize: 13, letterSpacing: 2, padding: '10px 0', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent' }}
              >
                {deleting ? '...' : 'SMAZAT REZERVACI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
