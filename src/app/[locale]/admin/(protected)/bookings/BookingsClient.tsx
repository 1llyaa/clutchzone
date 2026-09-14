'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Coins } from '@phosphor-icons/react';
import { parseTimeToMinutes, rangesOverlap } from '@/lib/bookings/occupancy';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import AdminPageContainer from '@/components/admin/AdminPageContainer';
import GgLeapHoursCell from '@/components/admin/GgLeapHoursCell';

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Potvrzeno',
  // Only online bookings land here: the slot is held, but the hold expires and
  // releases itself if the card payment never arrives.
  pending:   'Čeká na platbu',
  cancelled: 'Zrušeno',
  completed: 'Dokončeno',
};
const STATUS_COLOR: Record<string, string> = {
  confirmed: 'var(--color-cz-success)',
  pending:   'var(--color-cz-warning)',
  cancelled: 'var(--color-cz-danger)',
  completed: 'var(--color-cz-gray-light)',
};
type PaymentFields = { payment_method: string; payment_status: string; pays_with_credit: boolean; status: string };

function PAYMENT_LABEL(b: PaymentFields): string {
  // Credit bookings ride on payment_method 'onsite' but nothing is ever due —
  // hours come off the ggLeap account for time actually played.
  if (b.pays_with_credit) return 'KREDIT';
  if (b.payment_method === 'online') {
    if (b.payment_status === 'paid') return 'ONLINE · ZAPLACENO';
    // A live hold, not an outstanding debt — it lapses on its own.
    return b.status === 'pending' ? 'ONLINE · ČEKÁ NA PLATBU' : 'ONLINE · NEZAPLACENO';
  }
  return b.payment_status === 'paid' ? 'V KLUBU · ZAPLACENO' : 'V KLUBU · NEZAPLACENO';
}
function PAYMENT_COLOR(b: PaymentFields): string {
  if (b.pays_with_credit) return 'var(--color-cz-gray-light)';
  return b.payment_status === 'paid' ? 'var(--color-cz-success)' : 'var(--color-cz-warning)';
}
// A block is yellow, a real booking orange: staff must be able to tell at a
// glance whether a station is taken by a customer or taken out of circulation
// by them. Semantic status colours are already the admin system per AGENTS.md.
const TILE_BG: Record<string, string> = {
  free:     '#1a1a1a',
  occupied: 'rgba(232,74,26,0.15)',
  blocked:  'color-mix(in srgb, var(--color-cz-warning) 15%, transparent)',
  inactive: '#0f0f0f',
};
const TILE_BORDER: Record<string, string> = {
  free:     'var(--color-cz-gray-dark)',
  occupied: 'var(--color-cz-orange)',
  blocked:  'var(--color-cz-warning)',
  inactive: '#1a1a1a',
};
const TILE_LABEL: Record<string, string> = {
  free:     'VOLNÉ',
  occupied: 'OBSAZENO',
  blocked:  'BLOKOVÁNO',
  inactive: 'INACTIVE',
};
const TILE_TEXT: Record<string, string> = {
  free:     'var(--color-cz-gray-light)',
  occupied: 'var(--color-cz-orange)',
  blocked:  'var(--color-cz-warning)',
  inactive: 'var(--color-cz-gray-light)',
};

/** Durations a walk-in or a repair realistically takes. */
const BLOCK_DURATIONS: [number, string][] = [
  [30,  '30 MIN'],
  [60,  '1 H'],
  [90,  '1,5 H'],
  [120, '2 H'],
  [180, '3 H'],
  [240, '4 H'],
  [360, '6 H'],
  [600, '10 H'],
];

interface Booking {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_discord: string | null;
  clutchzone_account: string | null;
  date: string;
  start_time: string;
  duration_minutes: number;
  total_price: number;
  status: string;
  station_id: string;
  payment_method: string;
  payment_status: string;
  pays_with_credit: boolean;
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
  clutchzone_account: string | null;
  date: string;
  start_time: string;
  duration_minutes: number;
  total_price: number;
  status: string;
  payment_method: string;
  payment_status: string;
  pays_with_credit: boolean;
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

interface StationBlock {
  id: string;
  block_group_id: string;
  station_id: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  note: string | null;
}

/** Minutes from midnight back to a HH:MM label, wrapping past midnight. */
function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function StationTile({
  station,
  state,
  selected,
  padding,
  onSelect,
  onOpenBlock,
}: {
  station: Station;
  state: string;
  selected: boolean;
  padding: string;
  onSelect: () => void;
  onOpenBlock: () => void;
}) {
  // A booked or deactivated station is not actionable: blocks exist to take a
  // *free* station out of circulation, and a booked one is already out.
  const interactive = state === 'free' || state === 'blocked';

  const style: React.CSSProperties = {
    padding,
    background: TILE_BG[state],
    border: `1px solid ${TILE_BORDER[state]}`,
    outline: selected ? '1.5px solid var(--color-cz-orange)' : 'none',
    outlineOffset: 1,
  };

  const content = (
    <>
      <span className="font-mono text-white" style={{ fontSize: 17, letterSpacing: 1 }}>{station.label}</span>
      <span
        className="font-mono uppercase"
        style={{ fontSize: 16, letterSpacing: 1, marginTop: 3, color: TILE_TEXT[state] }}
      >
        {TILE_LABEL[state]}
      </span>
    </>
  );

  if (!interactive) {
    return (
      <div className="rounded-control flex flex-col items-center justify-center" style={style}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={state === 'blocked' ? onOpenBlock : onSelect}
      aria-pressed={state === 'free' ? selected : undefined}
      aria-label={`${station.label} — ${TILE_LABEL[state]}`}
      className="rounded-control flex flex-col items-center justify-center cursor-pointer transition-[filter] duration-150 ease-out hover:brightness-125"
      style={style}
    >
      {content}
    </button>
  );
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
      clutchzone_account: first.clutchzone_account,
      date: first.date,
      start_time: first.start_time,
      duration_minutes: first.duration_minutes,
      total_price: rows.reduce((sum, r) => sum + r.total_price, 0),
      status: first.status,
      payment_method: first.payment_method,
      payment_status: first.payment_status,
      pays_with_credit: first.pays_with_credit,
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
  blocks,
  passNameById,
  defaultStartTime,
  from,
  to,
}: {
  bookings: Booking[];
  stations: Station[];
  blocks: StationBlock[];
  passNameById: Record<string, string>;
  defaultStartTime: string;
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

  // ── Station block composer ─────────────────────────────────────────────────
  const [pickedStations, setPickedStations] = useState<string[]>([]);
  const [blockStart, setBlockStart]         = useState(defaultStartTime);
  const [blockDuration, setBlockDuration]   = useState(60);
  const [blockNote, setBlockNote]           = useState('');
  const [blockSaving, setBlockSaving]       = useState(false);
  const [blockError, setBlockError]         = useState<string | null>(null);
  const [blockClashes, setBlockClashes]     = useState<string[]>([]);
  const [openBlock, setOpenBlock]           = useState<StationBlock | null>(null);
  const [releasing, setReleasing]           = useState(false);

  const isSingleDay = from === to;

  const grouped = useMemo(() => groupBookings(bookings, passNameById), [bookings, passNameById]);

  const windowStart = parseTimeToMinutes(blockStart);
  const windowEnd = windowStart + blockDuration;

  // Occupancy is per time window, not per day.
  //
  // The grid used to read OBSAZENO if a station had any non-cancelled booking
  // anywhere on the date, ignoring time entirely. A block *is* a time window,
  // so a grid that cannot express "free at 14:00, taken at 19:00" would have
  // staff blocking against a display that does not match what they are
  // blocking. The composer's start time and duration therefore drive the grid.
  const occupiedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const b of bookings) {
      if (b.date !== from || b.status === 'cancelled') continue;
      const start = parseTimeToMinutes(b.start_time);
      if (rangesOverlap(windowStart, windowEnd, start, start + b.duration_minutes)) {
        ids.add(b.station_id);
      }
    }
    return ids;
  }, [bookings, from, windowStart, windowEnd]);

  /** Station id → the block covering the selected window, if any. */
  const blockByStation = useMemo(() => {
    const map = new Map<string, StationBlock>();
    for (const bl of blocks) {
      if (bl.date !== from) continue;
      const start = parseTimeToMinutes(bl.start_time);
      if (rangesOverlap(windowStart, windowEnd, start, start + bl.duration_minutes)) {
        map.set(bl.station_id, bl);
      }
    }
    return map;
  }, [blocks, from, windowStart, windowEnd]);

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

  // Recording an on-site payment is what lets a later cancellation return
  // credit — without it the booking looks unpaid and gets nothing back.
  async function updatePaymentStatus(groupKey: string, payment_status: string) {
    setUpdating(true);
    await fetch(`/api/admin/bookings/${groupKey}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status }),
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

  function toggleStation(id: string) {
    setBlockError(null);
    setBlockClashes([]);
    setPickedStations((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function submitBlock() {
    if (!pickedStations.length) return;
    setBlockSaving(true);
    setBlockError(null);
    setBlockClashes([]);

    const res = await fetch('/api/admin/station-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stationIds: pickedStations,
        date: from,
        startTime: blockStart,
        durationMinutes: blockDuration,
        note: blockNote.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBlockSaving(false);

    if (!res.ok) {
      setBlockError(data.error ?? 'Blokaci se nepodařilo uložit');
      setBlockClashes(Array.isArray(data.stations) ? data.stations : []);
      return;
    }

    setPickedStations([]);
    setBlockNote('');
    startTransition(() => router.refresh());
  }

  async function releaseBlock(block: StationBlock) {
    if (!confirm('Opravdu uvolnit blokaci? Stanice se vrátí do prodeje.')) return;
    setReleasing(true);
    await fetch(`/api/admin/station-blocks/${block.block_group_id}`, { method: 'DELETE' });
    setReleasing(false);
    setOpenBlock(null);
    startTransition(() => router.refresh());
  }

  const pcStations  = stations.filter((s) => s.type === 'pc');
  const ps5Stations = stations.filter((s) => s.type === 'ps5');

  function tileState(station: Station): string {
    if (!station.is_active) return 'inactive';
    if (blockByStation.has(station.id)) return 'blocked';
    if (occupiedIds.has(station.id)) return 'occupied';
    return 'free';
  }

  const windowLabel = `${blockStart}–${minutesToLabel(windowEnd)}`;

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
          {/* Window controls. These drive the grid, so they are always visible:
              the tiles below show occupancy for this window, not for the whole
              day, and staff must be able to move the window before picking
              anything. Note and BLOKOVAT appear once something is picked. */}
          <div
            className="bg-cz-black-mid rounded-cz flex flex-wrap items-end gap-4"
            style={{ border: '1px solid var(--color-cz-gray-dark)', padding: 16, marginBottom: 16 }}
          >
            <div className="flex flex-col gap-1">
              <label
                htmlFor="block-start"
                className="font-mono text-cz-gray-light uppercase"
                style={{ fontSize: 16, letterSpacing: 2 }}
              >
                OD
              </label>
              <input
                id="block-start"
                type="time"
                step={900}
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value || '00:00')}
                className="bg-cz-black text-white font-mono rounded-control focus:outline-none focus:border-cz-orange"
                style={{ padding: '8px 12px', fontSize: 17, border: '1px solid var(--color-cz-gray-dark)' }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="block-duration"
                className="font-mono text-cz-gray-light uppercase"
                style={{ fontSize: 16, letterSpacing: 2 }}
              >
                DÉLKA
              </label>
              <select
                id="block-duration"
                value={blockDuration}
                onChange={(e) => setBlockDuration(Number(e.target.value))}
                className="bg-cz-black text-white font-mono rounded-control focus:outline-none focus:border-cz-orange"
                style={{ padding: '8px 12px', fontSize: 17, border: '1px solid var(--color-cz-gray-dark)' }}
              >
                {BLOCK_DURATIONS.map(([minutes, label]) => (
                  <option key={minutes} value={minutes}>{label}</option>
                ))}
              </select>
            </div>

            <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2, paddingBottom: 10 }}>
              OBSAZENOST {windowLabel}
            </div>

            {pickedStations.length > 0 && (
              <>
                <div className="flex flex-col gap-1 flex-1" style={{ minWidth: 200 }}>
                  <label
                    htmlFor="block-note"
                    className="font-mono text-cz-gray-light uppercase"
                    style={{ fontSize: 16, letterSpacing: 2 }}
                  >
                    POZNÁMKA (NEPOVINNÁ)
                  </label>
                  <input
                    id="block-note"
                    type="text"
                    value={blockNote}
                    onChange={(e) => setBlockNote(e.target.value)}
                    maxLength={500}
                    placeholder="Výměna GPU, walk-in…"
                    className="bg-cz-black text-white font-body rounded-control focus:outline-none focus:border-cz-orange w-full"
                    style={{ padding: '8px 12px', fontSize: 17, border: '1px solid var(--color-cz-gray-dark)' }}
                  />
                </div>

                <div className="flex items-center gap-3" style={{ paddingBottom: 1 }}>
                  <span className="font-mono text-cz-orange uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>
                    {pickedStations.length} VYBRÁNO
                  </span>
                  <button
                    type="button"
                    onClick={() => { setPickedStations([]); setBlockError(null); setBlockClashes([]); }}
                    className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors"
                    style={{ fontSize: 16, letterSpacing: 2 }}
                  >
                    ZRUŠIT VÝBĚR
                  </button>
                  <Button onClick={submitBlock} disabled={blockSaving} size="sm">
                    {blockSaving ? '...' : 'BLOKOVAT'}
                  </Button>
                </div>
              </>
            )}

            {blockError && (
              <div className="w-full font-mono" style={{ fontSize: 17, color: 'var(--color-cz-danger)' }}>
                {blockError}
                {blockClashes.length > 0 && `: ${blockClashes.join(', ')}`}
              </div>
            )}
          </div>

          <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 12 }}>
            PC STANICE
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(10, 1fr)', marginBottom: 16 }}>
            {pcStations.map((s) => (
              <StationTile
                key={s.id}
                station={s}
                state={tileState(s)}
                selected={pickedStations.includes(s.id)}
                padding="10px 4px"
                onSelect={() => toggleStation(s.id)}
                onOpenBlock={() => setOpenBlock(blockByStation.get(s.id) ?? null)}
              />
            ))}
          </div>

          <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 12 }}>
            PS5 STANICE
          </div>
          <div className="flex gap-2">
            {ps5Stations.map((s) => (
              <StationTile
                key={s.id}
                station={s}
                state={tileState(s)}
                selected={pickedStations.includes(s.id)}
                padding="10px 20px"
                onSelect={() => toggleStation(s.id)}
                onOpenBlock={() => setOpenBlock(blockByStation.get(s.id) ?? null)}
              />
            ))}
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
                ['Platba', selected.pays_with_credit
                  ? 'Kredit — hodiny z účtu, nic se neplatí'
                  : selected.payment_method === 'online'
                    ? (selected.payment_status === 'paid'
                        ? 'Online · zaplaceno'
                        : selected.status === 'pending'
                          ? 'Online · čeká na platbu (rezervace propadne)'
                          : 'Online · nezaplaceno')
                    : (selected.payment_status === 'paid' ? 'V klubu · zaplaceno' : 'V klubu · nezaplaceno')],
                ['Mince k připsání', selected.coins_awarded > 0 ? `${selected.coins_awarded}` : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 4 }}>{label}</div>
                  <div className="font-body text-white" style={{ fontSize: 17 }}>{value}</div>
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 4 }}>ggLeap účet</div>
                <div className="font-body text-white flex items-center gap-3" style={{ fontSize: 17 }}>
                  {selected.clutchzone_account || '—'}
                  <GgLeapHoursCell username={selected.clutchzone_account} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3" style={{ padding: '20px 28px', borderTop: '1px solid var(--color-cz-gray-dark)' }}>
              {/* Credit bookings never owe anything — hours come off the ggLeap
                  account for time played. Online ones are normally settled by
                  the Stripe webhook, but staff needs the manual override for
                  when it never lands, otherwise the booking is stuck unpaid.
                  Marking paid sends the customer their payment receipt. */}
              {!selected.pays_with_credit && selected.status !== 'cancelled' && (
                  <Button
                    disabled={updating}
                    variant="ghost"
                    active={selected.payment_status === 'paid'}
                    onClick={() =>
                      updatePaymentStatus(
                        selected.groupKey,
                        selected.payment_status === 'paid' ? 'unpaid' : 'paid',
                      )
                    }
                    size="sm"
                  >
                    {selected.payment_status === 'paid'
                      ? 'ZAPLACENO ✓ — ZRUŠIT OZNAČENÍ'
                      : 'OZNAČIT JAKO ZAPLACENO'}
                  </Button>
                )}
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
      {/* Block release panel. A block carries no customer and no money, so
          this deliberately shares nothing with the booking detail panel — it
          shows the window, the staff note, and the one action there is. */}
      {openBlock && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', padding: 16 }}
          onClick={() => setOpenBlock(null)}
        >
          <div
            className="bg-cz-black-mid rounded-cz w-full"
            style={{ maxWidth: 'min(400px, 92vw)', border: '1px solid var(--color-cz-gray-dark)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between"
              style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-cz-gray-dark)' }}
            >
              <div>
                <div className="font-mono uppercase" style={{ fontSize: 16, letterSpacing: 2, color: 'var(--color-cz-warning)' }}>
                  BLOKOVÁNO
                </div>
                <div className="font-display text-white uppercase" style={{ fontSize: 20 }}>
                  {stations.find((s) => s.id === openBlock.station_id)?.label ?? 'STANICE'}
                </div>
              </div>
              <button
                onClick={() => setOpenBlock(null)}
                aria-label="Zavřít"
                className="text-cz-gray-light hover:text-white transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {[
                ['Datum', new Date(openBlock.date).toLocaleDateString('cs-CZ')],
                [
                  'Čas',
                  `${openBlock.start_time.slice(0, 5)}–${minutesToLabel(
                    parseTimeToMinutes(openBlock.start_time) + openBlock.duration_minutes,
                  )}`,
                ],
                ['Poznámka', openBlock.note || '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 4 }}>
                    {label}
                  </div>
                  <div className="font-body text-white" style={{ fontSize: 17 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '0 24px 24px' }}>
              <Button
                onClick={() => releaseBlock(openBlock)}
                disabled={releasing}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                {releasing ? '...' : 'UVOLNIT'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </AdminPageContainer>
  );
}
