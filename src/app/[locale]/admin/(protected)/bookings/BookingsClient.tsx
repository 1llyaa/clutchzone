'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Coins, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { addDays, parseTimeToMinutes, rangesOverlap } from '@/lib/bookings/occupancy';
import { minutesLabel, type OpeningRow } from '@/lib/bookings/timeline';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import AdminPageContainer from '@/components/admin/AdminPageContainer';
import GgLeapHoursCell from '@/components/admin/GgLeapHoursCell';
import TimelineBoard from './TimelineBoard';

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
interface Booking {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string | null;
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
  station_reassigned_at: string | null;
  station_reassigned_by: string | null;
  rescheduled_at: string | null;
  rescheduled_by: string | null;
  source: string;
  created_by: string | null;
}

/**
 * One station of a reservation. A group of N shares everything but this —
 * the customer, the time and the price live on GroupedBooking, and an admin
 * reassignment moves exactly one of these rows.
 */
interface StationRow {
  id: string;
  station_id: string;
  label: string;
  type: string;
  reassignedAt: string | null;
  reassignedByName: string | null;
}

interface GroupedBooking {
  groupKey: string;
  reference: string;
  customer_name: string;
  customer_email: string | null;
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
  rows: StationRow[];
  stationLabels: string[];
  stationsCount: number;
  variant: string;
  /** Admin who entered it; null for a customer's own web booking. */
  createdByName: string | null;
  isAdminEntered: boolean;
  rescheduledAt: string | null;
  rescheduledByName: string | null;
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

/** One label/value row of the detail panel. */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 4 }}>{label}</div>
      <div className="font-body text-white" style={{ fontSize: 17 }}>{value}</div>
    </div>
  );
}

function variantLabel(b: Booking, passNameById: Record<string, string>): string {
  if (b.offer_kind === 'pass') return (b.time_pass_id && passNameById[b.time_pass_id]) || 'Pas';
  if (b.offer_kind === 'hours_upsell') return 'Hodiny (navíc)';
  if (b.offer_kind === 'hours') return 'Hodiny';
  return '—';
}

/** 90 → "1,5 h", 120 → "2 h", 30 → "30 min". */
function durationLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = min / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1).replace('.', ',')} h`;
}

function groupBookings(
  bookings: Booking[],
  passNameById: Record<string, string>,
  adminNameById: Record<string, string>,
): GroupedBooking[] {
  const byGroup = new Map<string, Booking[]>();
  for (const b of bookings) {
    const key = b.booking_group_id ?? b.id;
    const list = byGroup.get(key) ?? [];
    list.push(b);
    byGroup.set(key, list);
  }
  return [...byGroup.values()].map((rows) => {
    const first = rows[0];
    // The station rows, kept whole: the detail panel reassigns one at a time
    // and needs each row's own booking id, not just its label.
    const stationRows: StationRow[] = rows.map((r) => ({
      id: r.id,
      station_id: r.station_id,
      label: r.stations?.label ?? '—',
      type: r.stations?.type ?? 'pc',
      reassignedAt: r.station_reassigned_at,
      reassignedByName: r.station_reassigned_by ? adminNameById[r.station_reassigned_by] ?? null : null,
    }));
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
      rows: stationRows,
      stationLabels: stationRows.map((r) => r.label).filter((l) => l !== '—'),
      stationsCount: first.stations_count ?? rows.length,
      variant: variantLabel(first, passNameById),
      createdByName: first.created_by ? adminNameById[first.created_by] ?? null : null,
      isAdminEntered: first.source === 'admin',
      rescheduledAt: first.rescheduled_at,
      rescheduledByName: first.rescheduled_by ? adminNameById[first.rescheduled_by] ?? null : null,
    };
  });
}

export default function BookingsClient({
  bookings,
  stations,
  blocks,
  passNameById,
  adminNameById,
  opening,
  view,
  boardDate,
  today,
  from,
  to,
}: {
  bookings: Booking[];
  stations: Station[];
  blocks: StationBlock[];
  passNameById: Record<string, string>;
  adminNameById: Record<string, string>;
  opening: OpeningRow | null;
  view: 'timeline' | 'list';
  boardDate: string;
  today: string;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Station reassignment (one row of the group at a time) ─────────────────
  // The keyboard path for what the timeline does by dragging.
  const [reassignRowId, setReassignRowId]   = useState<string | null>(null);
  const [reassignTo, setReassignTo]         = useState('');
  const [reassignSaving, setReassignSaving] = useState(false);
  const [reassignError, setReassignError]   = useState<string | null>(null);
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo,   setLocalTo]   = useState(to);

  const [openBlock, setOpenBlock] = useState<StationBlock | null>(null);
  const [releasing, setReleasing] = useState(false);

  const isSingleDay = from === to;

  const grouped = useMemo(
    () => groupBookings(bookings, passNameById, adminNameById),
    [bookings, passNameById, adminNameById],
  );

  // Re-derived on every render rather than held: after a move the panel must
  // show the new station, not the snapshot it was opened with.
  const selected = useMemo(
    () => grouped.find((g) => g.groupKey === selectedKey) ?? null,
    [grouped, selectedKey],
  );

  const reassignRow = selected?.rows.find((r) => r.id === reassignRowId) ?? null;

  /**
   * Stations this row could move to: free for its window, in service, and of
   * the same type. Computed from the data already on the page — stale data
   * only costs a 409 from the server, which is the real guard.
   */
  const reassignTargets = useMemo(() => {
    if (!selected || !reassignRow) return [];
    const start = parseTimeToMinutes(selected.start_time);
    const end = start + selected.duration_minutes;
    const busy = new Set<string>();
    for (const b of bookings) {
      // The row being moved must not rule out its own station.
      if (b.id === reassignRow.id) continue;
      if (b.date !== selected.date || b.status === 'cancelled') continue;
      const s = parseTimeToMinutes(b.start_time);
      if (rangesOverlap(start, end, s, s + b.duration_minutes)) busy.add(b.station_id);
    }
    for (const bl of blocks) {
      if (bl.date !== selected.date) continue;
      const s = parseTimeToMinutes(bl.start_time);
      if (rangesOverlap(start, end, s, s + bl.duration_minutes)) busy.add(bl.station_id);
    }
    return stations.filter(
      (st) => st.is_active && st.type === reassignRow.type && !busy.has(st.id),
    );
  }, [selected, reassignRow, bookings, blocks, stations]);

  // ── Navigation ────────────────────────────────────────────────────────────
  function go(query: string) {
    startTransition(() => router.push(`?${query}`));
  }
  const goBoard = (date: string) => go(`date=${date}`);
  const goList = (f: string, t: string) => go(`view=list&from=${f}&to=${t < f ? f : t}`);

  function handleFromChange(val: string) {
    setLocalFrom(val);
    const safeTo = localTo < val ? val : localTo;
    setLocalTo(safeTo);
    goList(val, safeTo);
  }

  function handleToChange(val: string) {
    setLocalTo(val);
    goList(localFrom, val);
  }

  function openDetail(groupKey: string) {
    setSelectedKey(groupKey);
    closeReassign();
  }

  function closeDetail() {
    setSelectedKey(null);
    closeReassign();
  }

  function closeReassign() {
    setReassignRowId(null);
    setReassignTo('');
    setReassignError(null);
  }

  function startReassign(row: StationRow) {
    setReassignRowId(row.id);
    setReassignTo('');
    setReassignError(null);
  }

  async function submitReassign() {
    if (!reassignRow || !reassignTo) return;
    setReassignSaving(true);
    setReassignError(null);

    // Per-row endpoint: `reassignRow.id` is a bookings.id, unlike the group id
    // the sibling routes below take.
    const res = await fetch(`/api/admin/bookings/${reassignRow.id}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stationId: reassignTo, shiftMinutes: 0 }),
    });
    const data = await res.json().catch(() => ({}));
    setReassignSaving(false);

    if (!res.ok) {
      setReassignError(data.error ?? 'Stanici se nepodařilo změnit');
      return;
    }

    closeReassign();
    // The panel stays open: `selected` re-derives and shows the new station.
    startTransition(() => router.refresh());
  }

  async function updateStatus(groupKey: string, status: string) {
    setUpdating(true);
    await fetch(`/api/admin/bookings/${groupKey}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUpdating(false);
    closeDetail();
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
    closeDetail();
    startTransition(() => router.refresh());
  }

  async function deleteBooking(groupKey: string) {
    if (!confirm('Opravdu smazat rezervaci? Tato akce je nevratná.')) return;
    setDeleting(true);
    await fetch(`/api/admin/bookings/${groupKey}`, { method: 'DELETE' });
    setDeleting(false);
    closeDetail();
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

  const boardLabel = new Date(boardDate + 'T12:00:00')
    .toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase();
  const rangeLabel = isSingleDay
    ? new Date(from + 'T12:00:00').toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()
    : `${new Date(from + 'T12:00:00').toLocaleDateString('cs-CZ')} – ${new Date(to + 'T12:00:00').toLocaleDateString('cs-CZ')}`;

  // The board also fetches the next date for tonight's small hours; anything
  // stored there after tonight's close belongs to tomorrow.
  const boardCount = useMemo(() => {
    if (view !== 'timeline') return 0;
    const nextDate = addDays(boardDate, 1);
    const cutoff = opening?.crosses_midnight && opening.close_time ? opening.close_time : '00:00';
    return grouped.filter(
      (g) => g.status !== 'cancelled' && (g.date === boardDate || (g.date === nextDate && g.start_time < cutoff)),
    ).length;
  }, [grouped, view, boardDate, opening]);
  const listGroups = view === 'list' ? grouped : [];

  const tabClass = (active: boolean) =>
    `font-mono uppercase transition-colors ${active ? 'text-cz-orange' : 'text-cz-gray-light hover:text-white'}`;

  return (
    <AdminPageContainer>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>
            REZERVACE
          </h1>
          <p className="font-mono text-cz-gray-light" style={{ fontSize: 16, letterSpacing: 2, marginTop: 4 }}>
            {view === 'timeline'
              ? `${boardCount} REZERVACÍ · ${boardLabel}`
              : `${listGroups.length} REZERVACÍ · ${rangeLabel}`}
          </p>
          <div className="flex gap-6" role="tablist" style={{ marginTop: 16 }}>
            <button
              role="tab"
              aria-selected={view === 'timeline'}
              onClick={() => goBoard(view === 'list' ? from : boardDate)}
              className={tabClass(view === 'timeline')}
              style={{ fontSize: 16, letterSpacing: 2 }}
            >
              ČASOVÁ OSA
            </button>
            <button
              role="tab"
              aria-selected={view === 'list'}
              onClick={() => goList(boardDate, boardDate)}
              className={tabClass(view === 'list')}
              style={{ fontSize: 16, letterSpacing: 2 }}
            >
              SEZNAM
            </button>
          </div>
        </div>

        {view === 'timeline' ? (
          <div className="flex items-center gap-3" style={{ opacity: isPending ? 0.6 : 1 }}>
            <Button size="xs" variant="ghost" iconOnly aria-label="Předchozí den" onClick={() => goBoard(addDays(boardDate, -1))}>
              <CaretLeft size={18} weight="bold" />
            </Button>
            <div className="w-full" style={{ maxWidth: 160 }}>
              <DatePicker value={boardDate} onChange={goBoard} locale="cs" />
            </div>
            <Button size="xs" variant="ghost" iconOnly aria-label="Další den" onClick={() => goBoard(addDays(boardDate, 1))}>
              <CaretRight size={18} weight="bold" />
            </Button>
            {boardDate !== today && (
              <button
                onClick={() => goBoard(today)}
                className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors"
                style={{ fontSize: 16, letterSpacing: 2 }}
              >
                DNES
              </button>
            )}
          </div>
        ) : (
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
                  setLocalFrom(today);
                  setLocalTo(today);
                  goList(today, today);
                }}
                className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors"
                style={{ fontSize: 16, letterSpacing: 2, marginTop: 16 }}
              >
                DNES
              </button>
            )}
          </div>
        )}
      </div>

      {view === 'timeline' && (
        <TimelineBoard
          boardDate={boardDate}
          stations={stations}
          bookings={bookings}
          blocks={blocks}
          opening={opening}
          onOpenBooking={openDetail}
          onOpenBlock={setOpenBlock}
        />
      )}

      {/* Booking table */}
      {view === 'list' && (
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
            {listGroups.length === 0 ? (
              <tr>
                <td colSpan={isSingleDay ? 12 : 13} className="font-mono text-cz-gray-light text-center" style={{ padding: 40, fontSize: 19 }}>
                  Žádné rezervace pro zvolené období
                </td>
              </tr>
            ) : (
              listGroups.map((b) => (
                <tr
                  key={b.groupKey}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: b.status === 'cancelled' ? 0.45 : 1 }}
                >
                  <td className="font-mono text-cz-orange" style={{ padding: '12px 14px', fontSize: 17 }}>{b.reference}</td>
                  <td className="font-body text-white" style={{ padding: '12px 14px', fontSize: 17 }}>{b.customer_name}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div className="font-mono text-cz-gray-light" style={{ fontSize: 17 }}>{b.customer_email ?? '—'}</div>
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
                  <td className="font-mono text-cz-gray-light" style={{ padding: '12px 14px', fontSize: 17 }}>{durationLabel(b.duration_minutes)}</td>
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
                    <button onClick={() => openDetail(b.groupKey)} className="font-mono text-cz-orange uppercase hover:underline" style={{ fontSize: 16, letterSpacing: 1 }}>
                      DETAIL
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-end" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={closeDetail}>
          <div className="bg-cz-black-mid h-full flex flex-col w-full" style={{ maxWidth: 'min(400px, 92vw)', borderLeft: '1px solid var(--color-cz-gray-dark)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-cz-gray-dark)' }}>
              <div>
                <div className="font-mono text-cz-orange" style={{ fontSize: 17 }}>{selected.reference}</div>
                <div className="font-display text-white uppercase" style={{ fontSize: 20 }}>DETAIL REZERVACE</div>
              </div>
              <button onClick={closeDetail} aria-label="Zavřít" className="text-cz-gray-light hover:text-white transition-colors">
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-auto" style={{ padding: 28 }}>
              {[
                ['Zákazník',  selected.customer_name],
                ['E-mail',    selected.customer_email || '—'],
                ['Telefon',   selected.customer_phone || '—'],
                ['Discord',   selected.customer_discord || '—'],
              ].map(([label, value]) => <Field key={label} label={label} value={value} />)}

              {/* Stations, one row each. The customer never picks a station —
                  the server assigns it at booking time — but staff have to be
                  able to move someone off a broken PC without rebooking. One
                  row moves at a time: the rest of an N-station group stays. */}
              <div style={{ marginBottom: 16 }}>
                <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 4 }}>Stanice</div>
                <div className="flex flex-col gap-2">
                  {selected.rows.map((row) => (
                    <div key={row.id}>
                      {reassignRowId === row.id ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={reassignTo}
                            onChange={(e) => setReassignTo(e.target.value)}
                            disabled={reassignSaving || !reassignTargets.length}
                            aria-label={`Nová stanice místo ${row.label}`}
                            className="bg-cz-black text-white font-mono rounded-control focus:outline-none focus:border-cz-orange"
                            style={{ padding: '6px 10px', fontSize: 17, border: '1px solid var(--color-cz-gray-dark)' }}
                          >
                            <option value="">
                              {reassignTargets.length ? `${row.label} →` : 'ŽÁDNÁ VOLNÁ STANICE'}
                            </option>
                            {reassignTargets.map((st) => (
                              <option key={st.id} value={st.id}>{st.label}</option>
                            ))}
                          </select>
                          <Button size="xs" disabled={reassignSaving || !reassignTo} onClick={submitReassign}>
                            {reassignSaving ? '...' : 'PŘESUNOUT'}
                          </Button>
                          <button
                            onClick={closeReassign}
                            disabled={reassignSaving}
                            className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors disabled:opacity-50"
                            style={{ fontSize: 16, letterSpacing: 1 }}
                          >
                            ZPĚT
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="font-body text-white" style={{ fontSize: 17 }}>{row.label}</span>
                          {selected.status !== 'cancelled' && selected.status !== 'completed' && (
                            <button
                              onClick={() => startReassign(row)}
                              className="font-mono text-cz-orange uppercase hover:underline"
                              style={{ fontSize: 16, letterSpacing: 1 }}
                            >
                              ZMĚNIT
                            </button>
                          )}
                        </div>
                      )}
                      {row.reassignedAt && (
                        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 1, marginTop: 2 }}>
                          PŘESUNUTO {new Date(row.reassignedAt).toLocaleString('cs-CZ')}
                          {row.reassignedByName ? ` · ${row.reassignedByName}` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {reassignError && (
                  <div className="font-mono uppercase" style={{ fontSize: 16, letterSpacing: 1, marginTop: 8, color: 'var(--color-cz-danger)' }}>
                    {reassignError}
                  </div>
                )}
              </div>

              {[
                ['Počet stanic', String(selected.stationsCount)],
                ['Varianta',  selected.variant],
                ['Datum',     new Date(selected.date).toLocaleDateString('cs-CZ')],
                ['Čas',       selected.rescheduledAt
                  ? `${selected.start_time?.slice(0, 5)} · změněno ${new Date(selected.rescheduledAt).toLocaleString('cs-CZ')}${selected.rescheduledByName ? ` · ${selected.rescheduledByName}` : ''}`
                  : selected.start_time?.slice(0, 5)],
                ['Délka',     durationLabel(selected.duration_minutes)],
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
                ['Vytvořeno', selected.isAdminEntered
                  ? `Obsluhou${selected.createdByName ? ` · ${selected.createdByName}` : ''}`
                  : 'Zákazníkem online'],
              ].map(([label, value]) => <Field key={label} label={label} value={value} />)}

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
                  `${openBlock.start_time.slice(0, 5)}–${minutesLabel(
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
