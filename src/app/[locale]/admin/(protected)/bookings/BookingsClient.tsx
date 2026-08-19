'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Coins } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import AdminPageContainer from '@/components/admin/AdminPageContainer';

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Potvrzeno',
  pending:   'Čeká',
  cancelled: 'Zrušeno',
  completed: 'Dokončeno',
};
const STATUS_COLOR: Record<string, string> = {
  confirmed: 'var(--color-cz-success)',
  pending:   'var(--color-cz-warning)',
  cancelled: 'var(--color-cz-danger)',
  completed: 'var(--color-cz-gray-light)',
};
function PAYMENT_LABEL(b: { payment_method: string; payment_status: string }): string {
  if (b.payment_method === 'online') {
    return b.payment_status === 'paid' ? 'ONLINE · ZAPLACENO' : 'ONLINE · NEZAPLACENO';
  }
  return 'V KLUBU';
}
function PAYMENT_COLOR(b: { payment_method: string; payment_status: string }): string {
  if (b.payment_method === 'online') {
    return b.payment_status === 'paid' ? 'var(--color-cz-success)' : 'var(--color-cz-warning)';
  }
  return 'var(--color-cz-gray-light)';
}
const TILE_BG: Record<string, string> = {
  free:     '#1a1a1a',
  occupied: 'rgba(232,74,26,0.15)',
  inactive: '#0f0f0f',
};
const TILE_BORDER: Record<string, string> = {
  free:     'var(--color-cz-gray-dark)',
  occupied: 'var(--color-cz-orange)',
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
  payment_method: string;
  payment_status: string;
  coins_awarded: number;
  booking_group_id: string | null;
  stations_count: number | null;
  time_pass_id: string | null;
  offer_kind: string | null;
  stations: { label: string; type: string } | null;
}

interface GroupedBooking {
  groupKey: string;
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
  payment_method: string;
  payment_status: string;
  coins_awarded: number;
  stationLabels: string[];
  stationsCount: number;
  variant: string;
}

interface Station {
  id: string;
  label: string;
  type: string;
  is_active: boolean;
}

function variantLabel(b: Booking, passNameById: Record<string, string>): string {
  if (b.offer_kind === 'pass') return (b.time_pass_id && passNameById[b.time_pass_id]) || 'Pas';
  if (b.offer_kind === 'hours_upsell') return 'Hodiny (navíc)';
  if (b.offer_kind === 'hours') return 'Hodiny';
  return '—';
}

function groupBookings(bookings: Booking[], passNameById: Record<string, string>): GroupedBooking[] {
  const byGroup = new Map<string, Booking[]>();
  for (const b of bookings) {
    const key = b.booking_group_id ?? b.id;
    const list = byGroup.get(key) ?? [];
    list.push(b);
    byGroup.set(key, list);
  }
  return [...byGroup.values()].map((rows) => {
    const first = rows[0];
    return {
      groupKey: first.booking_group_id ?? first.id,
      reference: first.reference,
      customer_name: first.customer_name,
      customer_email: first.customer_email,
      customer_phone: first.customer_phone,
      customer_discord: first.customer_discord,
      date: first.date,
      start_time: first.start_time,
      duration_minutes: first.duration_minutes,
      total_price: rows.reduce((sum, r) => sum + r.total_price, 0),
      status: first.status,
      payment_method: first.payment_method,
      payment_status: first.payment_status,
      coins_awarded: rows.reduce((sum, r) => sum + (r.coins_awarded ?? 0), 0),
      stationLabels: rows.map((r) => r.stations?.label).filter((l): l is string => !!l),
      stationsCount: first.stations_count ?? rows.length,
      variant: variantLabel(first, passNameById),
    };
  });
}

export default function BookingsClient({
  bookings,
  stations,
  passNameById,
  from,
  to,
}: {
  bookings: Booking[];
  stations: Station[];
  passNameById: Record<string, string>;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<GroupedBooking | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo,   setLocalTo]   = useState(to);

  const isSingleDay = from === to;

  const grouped = useMemo(() => groupBookings(bookings, passNameById), [bookings, passNameById]);

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

  async function updateStatus(groupKey: string, status: string) {
    setUpdating(true);
    await fetch(`/api/admin/bookings/${groupKey}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUpdating(false);
    setSelected(null);
    startTransition(() => router.refresh());
  }

  async function deleteBooking(groupKey: string) {
    if (!confirm('Opravdu smazat rezervaci? Tato akce je nevratná.')) return;
    setDeleting(true);
    await fetch(`/api/admin/bookings/${groupKey}`, { method: 'DELETE' });
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
    <AdminPageContainer>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 40 }}>
        <div>
          <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>
            REZERVACE
          </h1>
          <p className="font-mono text-cz-gray-light" style={{ fontSize: 16, letterSpacing: 2, marginTop: 4 }}>
            {grouped.length} REZERVACÍ · {rangeLabel}
          </p>
        </div>

        {/* Date range picker */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>OD</label>
            <div className="w-full" style={{ maxWidth: 140 }}>
              <DatePicker value={localFrom} onChange={handleFromChange} locale="cs" />
            </div>
          </div>
          <div className="font-mono text-cz-gray-light" style={{ fontSize: 16, marginTop: 16 }}>–</div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>DO</label>
            <div className="w-full" style={{ maxWidth: 140 }}>
              <DatePicker value={localTo} onChange={handleToChange} min={localFrom} locale="cs" />
            </div>
          </div>
          {!isSingleDay && (
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setLocalFrom(today);
                setLocalTo(today);
                applyRange(today, today);
              }}
              className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors"
              style={{ fontSize: 16, letterSpacing: 2, marginTop: 16 }}
            >
              DNES
            </button>
          )}
        </div>
      </div>

      {/* Station grid — only meaningful for a single day */}
      {isSingleDay && (
        <div style={{ marginBottom: 40 }}>
          <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 12 }}>
            PC STANICE
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(10, 1fr)', marginBottom: 16 }}>
            {pcStations.map((s) => {
              const state = tileState(s);
              return (
                <div
                  key={s.id}
                  className="rounded-control flex flex-col items-center justify-center"
                  style={{ padding: '10px 4px', background: TILE_BG[state], border: `1px solid ${TILE_BORDER[state]}` }}
                >
                  <span className="font-mono text-white" style={{ fontSize: 17, letterSpacing: 1 }}>{s.label}</span>
                  <span className="font-mono uppercase" style={{ fontSize: 16, letterSpacing: 1, marginTop: 3, color: state === 'occupied' ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-light)' }}>
                    {state === 'occupied' ? 'OBSAZENO' : state === 'inactive' ? 'INACTIVE' : 'VOLNÉ'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 12 }}>
            PS5 STANICE
          </div>
          <div className="flex gap-2">
            {ps5Stations.map((s) => {
              const state = tileState(s);
              return (
                <div
                  key={s.id}
                  className="rounded-control flex flex-col items-center justify-center"
                  style={{ padding: '10px 20px', background: TILE_BG[state], border: `1px solid ${TILE_BORDER[state]}` }}
                >
                  <span className="font-mono text-white" style={{ fontSize: 17, letterSpacing: 1 }}>{s.label}</span>
                  <span className="font-mono uppercase" style={{ fontSize: 16, letterSpacing: 1, marginTop: 3, color: state === 'occupied' ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-light)' }}>
                    {state === 'occupied' ? 'OBSAZENO' : 'VOLNÉ'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking table */}
      <div className="bg-cz-black-mid rounded-cz overflow-x-auto" style={{ border: '1px solid var(--color-cz-gray-dark)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-cz-gray-dark)' }}>
              {[
                'REFERENCE', 'ZÁKAZNÍK', 'KONTAKT', 'STANICE', 'POČET STANIC', 'VARIANTA',
                ...(!isSingleDay ? ['DATUM'] : []),
                'ČAS', 'DÉLKA', 'CELKEM', 'PLATBA', 'STATUS', '',
              ].map((h) => (
                <th key={h} className="font-mono text-cz-gray-light uppercase text-left" style={{ padding: '12px 14px', fontSize: 16, letterSpacing: 2, whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.length === 0 ? (
              <tr>
                <td colSpan={isSingleDay ? 12 : 13} className="font-mono text-cz-gray-light text-center" style={{ padding: 40, fontSize: 19 }}>
                  Žádné rezervace pro zvolené období
                </td>
              </tr>
            ) : (
              grouped.map((b) => (
                <tr
                  key={b.groupKey}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: b.status === 'cancelled' ? 0.45 : 1 }}
                >
                  <td className="font-mono text-cz-orange" style={{ padding: '12px 14px', fontSize: 17 }}>{b.reference}</td>
                  <td className="font-body text-white" style={{ padding: '12px 14px', fontSize: 17 }}>{b.customer_name}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div className="font-mono text-cz-gray-light" style={{ fontSize: 17 }}>{b.customer_email}</div>
                    {b.customer_phone && (
                      <div className="font-mono text-cz-gray-light" style={{ fontSize: 17, marginTop: 2 }}>{b.customer_phone}</div>
                    )}
                  </td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '12px 14px', fontSize: 17 }}>{b.stationLabels.join(', ') || '—'}</td>
                  <td className="font-mono text-white" style={{ padding: '12px 14px', fontSize: 17, textAlign: 'center' }}>{b.stationsCount}</td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '12px 14px', fontSize: 17 }}>{b.variant}</td>
                  {!isSingleDay && (
                    <td className="font-mono text-cz-gray-light" style={{ padding: '12px 14px', fontSize: 17 }}>
                      {new Date(b.date).toLocaleDateString('cs-CZ')}
                    </td>
                  )}
                  <td className="font-mono text-white" style={{ padding: '12px 14px', fontSize: 17 }}>{b.start_time?.slice(0, 5)}</td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '12px 14px', fontSize: 17 }}>{Math.round(b.duration_minutes / 60)}h</td>
                  <td className="font-body text-white" style={{ padding: '12px 14px', fontSize: 17 }}>{b.total_price} Kč</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      className="font-mono uppercase rounded-control"
                      style={{
                        fontSize: 16, letterSpacing: 1, padding: '3px 8px',
                        color: PAYMENT_COLOR(b),
                        background: `color-mix(in srgb, ${PAYMENT_COLOR(b)} 12.5%, transparent)`,
                      }}
                    >
                      {PAYMENT_LABEL(b)}
                    </span>
                    {b.coins_awarded > 0 && (
                      <div className="font-mono text-cz-gray-light flex items-center gap-1" style={{ fontSize: 17, marginTop: 4 }}>
                        <Coins size={16} />
                        {b.coins_awarded}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      className="font-mono uppercase rounded-control"
                      style={{ fontSize: 16, letterSpacing: 1, padding: '3px 8px', color: STATUS_COLOR[b.status] ?? 'var(--color-cz-gray-light)', background: `color-mix(in srgb, ${STATUS_COLOR[b.status] ?? 'var(--color-cz-gray-light)'} 12.5%, transparent)` }}
                    >
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => setSelected(b)} className="font-mono text-cz-orange uppercase hover:underline" style={{ fontSize: 16, letterSpacing: 1 }}>
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
          <div className="bg-cz-black-mid h-full flex flex-col w-full" style={{ maxWidth: 'min(400px, 92vw)', borderLeft: '1px solid var(--color-cz-gray-dark)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-cz-gray-dark)' }}>
              <div>
                <div className="font-mono text-cz-orange" style={{ fontSize: 17 }}>{selected.reference}</div>
                <div className="font-display text-white uppercase" style={{ fontSize: 20 }}>DETAIL REZERVACE</div>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Zavřít" className="text-cz-gray-light hover:text-white transition-colors">
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-auto" style={{ padding: 28 }}>
              {[
                ['Zákazník',  selected.customer_name],
                ['E-mail',    selected.customer_email],
                ['Telefon',   selected.customer_phone || '—'],
                ['Discord',   selected.customer_discord || '—'],
                ['Stanice',   selected.stationLabels.join(', ') || '—'],
                ['Počet stanic', String(selected.stationsCount)],
                ['Varianta',  selected.variant],
                ['Datum',     new Date(selected.date).toLocaleDateString('cs-CZ')],
                ['Čas',       selected.start_time?.slice(0, 5)],
                ['Délka',     `${Math.round(selected.duration_minutes / 60)} hodin`],
                ['Celkem',    `${selected.total_price} Kč`],
                ['Platba', selected.payment_method === 'online'
                  ? (selected.payment_status === 'paid' ? 'Online · zaplaceno' : 'Online · nezaplaceno')
                  : 'V klubu'],
                ['Mince k připsání', selected.coins_awarded > 0 ? `${selected.coins_awarded}` : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 4 }}>{label}</div>
                  <div className="font-body text-white" style={{ fontSize: 17 }}>{value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3" style={{ padding: '20px 28px', borderTop: '1px solid var(--color-cz-gray-dark)' }}>
              {selected.status !== 'cancelled' && selected.status !== 'completed' && (
                <div className="flex gap-3">
                  <Button
                    disabled={updating}
                    onClick={() => updateStatus(selected.groupKey, 'completed')}
                    size="sm"
                    className="flex-1"
                  >
                    DOKONČIT
                  </Button>
                  <button
                    disabled={updating}
                    onClick={() => updateStatus(selected.groupKey, 'cancelled')}
                    className="flex-1 font-display uppercase rounded-control hover:border-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    style={{ fontSize: 16, letterSpacing: 2, padding: '10px 0', border: '1px solid var(--color-cz-gray-dark)', color: 'var(--color-cz-gray-light)', background: 'transparent' }}
                  >
                    ZRUŠIT
                  </button>
                </div>
              )}
              <button
                disabled={deleting}
                onClick={() => deleteBooking(selected.groupKey)}
                className="w-full font-display uppercase rounded-control hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors disabled:opacity-50"
                style={{ fontSize: 16, letterSpacing: 2, padding: '10px 0', border: '1px solid var(--color-cz-danger)', color: 'var(--color-cz-danger)', background: 'transparent' }}
              >
                {deleting ? '...' : 'SMAZAT REZERVACI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageContainer>
  );
}
