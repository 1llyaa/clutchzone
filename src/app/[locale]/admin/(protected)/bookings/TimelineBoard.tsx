'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type Announcements,
  type DragMoveEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core';
import Button from '@/components/ui/Button';
import { addDays, calendarStartMinutes } from '@/lib/bookings/occupancy';
import {
  CELL_MINUTES,
  boardMinutes,
  boardRange,
  checkDrop,
  isFree,
  minutesLabel,
  snapToCell,
  type BoardItem,
  type OpeningRow,
} from '@/lib/bookings/timeline';
import type { MoveRow } from '@/lib/bookings/move';
import CreateBookingModal, { type CellSelection } from './CreateBookingModal';

export interface BoardBooking {
  id: string;
  reference: string;
  customer_name: string;
  station_id: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  status: string;
  payment_method: string;
  payment_status: string;
  pays_with_credit: boolean;
  booking_group_id: string | null;
  stations: { label: string; type: string } | null;
}

export interface BoardStation {
  id: string;
  label: string;
  type: string;
  is_active: boolean;
}

export interface BoardBlock {
  id: string;
  block_group_id: string;
  station_id: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  note: string | null;
}

const ROW_H = 44;
const LABEL_W = 104;
const MIN_CELL_W = 36;
/** Pixels the pointer must travel before a press on a bar becomes a drag. */
const DRAG_THRESHOLD = 4;

const TYPE_LABEL: Record<string, string> = { pc: 'PC', ps5: 'PS5' };

type BarKind = 'paid' | 'unpaid' | 'hold' | 'completed' | 'block';

function bookingKind(b: BoardBooking): BarKind {
  if (b.status === 'completed') return 'completed';
  // A live Stripe hold: the slot is taken, but it lapses on its own.
  if (b.status === 'pending') return 'hold';
  if (b.pays_with_credit || b.payment_status === 'paid') return 'paid';
  return 'unpaid';
}

// Orange is a customer, yellow is staff taking a station out of circulation —
// the same split the old tile grid used. Semantic colours are the admin
// system per AGENTS.md.
const BAR_STYLE: Record<BarKind, React.CSSProperties> = {
  paid: { background: 'var(--color-cz-orange)', border: '1px solid var(--color-cz-orange)', color: 'var(--color-cz-white)' },
  unpaid: {
    background: 'color-mix(in srgb, var(--color-cz-orange) 22%, transparent)',
    border: '1px solid var(--color-cz-orange)',
    color: 'var(--color-cz-white)',
  },
  hold: {
    background:
      'repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-cz-warning) 28%, transparent) 0 6px, transparent 6px 12px)',
    border: '1px dashed var(--color-cz-warning)',
    color: 'var(--color-cz-white)',
  },
  completed: {
    background: 'var(--color-cz-black-light)',
    border: '1px solid var(--color-cz-gray-dark)',
    color: 'var(--color-cz-gray-light)',
  },
  block: {
    background: 'color-mix(in srgb, var(--color-cz-warning) 15%, transparent)',
    border: '1px solid var(--color-cz-warning)',
    color: 'var(--color-cz-warning)',
  },
};

const LEGEND: [BarKind, string][] = [
  ['paid', 'Zaplaceno / kredit'],
  ['unpaid', 'Nezaplaceno'],
  ['hold', 'Čeká na platbu kartou'],
  ['completed', 'Dokončeno'],
  ['block', 'Blokace'],
];

type DragState = {
  booking: BoardBooking;
  originStart: number;
  /** Viewport Y of the bar's centre when picked up; plus the drag delta = target row. */
  originCenterY: number;
  moved: boolean;
  targetStationId: string;
  targetStart: number;
};

type SelectState = {
  type: string;
  anchorIdx: number;
  anchorMin: number;
  curIdx: number;
  curMin: number;
};

/** Prague wall clock as minutes on `boardDate`'s axis, or null if off the board. */
function pragueNowOnBoard(boardDate: string): number | null {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const date = `${get('year')}-${get('month')}-${get('day')}`;
  const minutes = (Number(get('hour')) % 24) * 60 + Number(get('minute'));
  if (date === boardDate) return minutes;
  if (date === addDays(boardDate, 1)) return 1440 + minutes;
  return null;
}

export default function TimelineBoard({
  boardDate,
  stations,
  bookings,
  blocks,
  opening,
  onOpenBooking,
  onOpenBlock,
}: {
  boardDate: string;
  stations: BoardStation[];
  bookings: BoardBooking[];
  blocks: BoardBlock[];
  opening: OpeningRow | null;
  onOpenBooking: (groupKey: string) => void;
  onOpenBlock: (block: BoardBlock) => void;
}) {
  const router = useRouter();
  const nextDate = addDays(boardDate, 1);

  // PC first, then PS5 — the order staff walk the floor in.
  const rows = useMemo(
    () => [...stations.filter((s) => s.type === 'pc'), ...stations.filter((s) => s.type !== 'pc')],
    [stations],
  );
  const stationById = useMemo(() => new Map(stations.map((s) => [s.id, s])), [stations]);

  // ── Optimistic moves: row id → where it was dropped, until the refresh lands.
  const [overrides, setOverrides] = useState<Map<string, { station_id: string; start: number }>>(new Map());
  useEffect(() => setOverrides(new Map()), [bookings]);

  const liveBookings = useMemo(() => bookings.filter((b) => b.status !== 'cancelled'), [bookings]);

  const placed = useMemo(() => {
    const out: { booking: BoardBooking; item: BoardItem }[] = [];
    for (const b of liveBookings) {
      const start = boardMinutes(boardDate, nextDate, b);
      if (start === null) continue;
      const o = overrides.get(b.id);
      const s = o?.start ?? start;
      out.push({
        booking: b,
        item: { id: b.id, station_id: o?.station_id ?? b.station_id, start: s, end: s + b.duration_minutes },
      });
    }
    return out;
  }, [liveBookings, boardDate, nextDate, overrides]);

  const placedBlocks = useMemo(() => {
    const out: { block: BoardBlock; item: BoardItem }[] = [];
    for (const bl of blocks) {
      const start = boardMinutes(boardDate, nextDate, bl);
      if (start === null) continue;
      out.push({ block: bl, item: { id: `block:${bl.id}`, station_id: bl.station_id, start, end: start + bl.duration_minutes } });
    }
    return out;
  }, [blocks, boardDate, nextDate]);

  const items = useMemo(
    () => [...placed.map((p) => p.item), ...placedBlocks.map((p) => p.item)],
    [placed, placedBlocks],
  );

  const range = useMemo(() => boardRange(opening, items), [opening, items]);
  const span = range.end - range.start;
  const cellCount = span / CELL_MINUTES;
  const pct = (min: number) => ((min - range.start) / span) * 100;

  // ── Now line, client-only so it never disagrees with the server render.
  const [nowMin, setNowMin] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNowMin(pragueNowOnBoard(boardDate));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [boardDate]);

  // ── Realtime: another admin's change, or a customer booking online, shows
  // up without a reload. Debounced — a group insert fires once per row.
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 400);
    };
    (async () => {
      // RLS is staff-only: authenticate the socket before joining, otherwise
      // it joins as anon and receives nothing.
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.access_token) await supabase.realtime.setAuth(session.access_token);
      channel = supabase
        .channel(`admin-timeline-${boardDate}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'station_blocks' }, refresh)
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [boardDate, router]);

  // ── Pointer geometry ──────────────────────────────────────────────────────
  const laneRefs = useRef(new Map<string, HTMLDivElement>());

  const minuteAt = useCallback(
    (clientX: number): number => {
      const any = laneRefs.current.values().next().value as HTMLDivElement | undefined;
      if (!any) return range.start;
      const rect = any.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      return range.start + (x / rect.width) * span;
    },
    [range.start, span],
  );

  const rowIndexAt = useCallback(
    (clientY: number): number | null => {
      for (let i = 0; i < rows.length; i++) {
        const el = laneRefs.current.get(rows[i].id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (clientY >= r.top && clientY < r.bottom) return i;
      }
      return null;
    },
    [rows],
  );

  // ── Drag to move (dnd-kit: pointer, touch and keyboard) ───────────────────
  // dnd-kit only reports how far the bar travelled; where it lands on the
  // board — row and snapped start — is worked out here from that delta. The
  // bar itself stays put and a ghost shows the target.
  const [drag, setDrag] = useState<DragState | null>(null);
  // Read on drop: the end handler must see the last move, not the state its
  // closure was created with.
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;
  const suppressClick = useRef(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  const groupOf = useCallback(
    (b: BoardBooking): MoveRow[] => {
      const key = b.booking_group_id ?? b.id;
      return bookings.filter((r) => (r.booking_group_id ?? r.id) === key);
    },
    [bookings],
  );

  const checkFor = useCallback(
    (d: DragState) => {
      const target = stationById.get(d.targetStationId);
      return checkDrop({
        dragged: d.booking,
        group: groupOf(d.booking),
        targetStationId: d.targetStationId,
        targetType: target?.type ?? null,
        targetActive: target?.is_active ?? false,
        draggedType: d.booking.stations?.type ?? null,
        shiftMinutes: d.targetStart - d.originStart,
        items,
        draggedStart: d.originStart,
      });
    },
    [stationById, groupOf, items],
  );

  const dropCheck = useMemo(() => (drag?.moved ? checkFor(drag) : null), [drag, checkFor]);

  /** One cell and one row in pixels, for the keyboard sensor's arrow steps. */
  const stepPx = useCallback(() => {
    const lane = laneRefs.current.values().next().value as HTMLDivElement | undefined;
    const width = lane?.getBoundingClientRect().width ?? 0;
    return { x: cellCount ? width / cellCount : 0, y: ROW_H + 1 };
  }, [cellCount]);

  const keyboardCoordinates: KeyboardCoordinateGetter = useCallback(
    (event, { currentCoordinates }) => {
      const step = stepPx();
      const delta: Record<string, [number, number]> = {
        ArrowRight: [step.x, 0],
        ArrowLeft: [-step.x, 0],
        ArrowDown: [0, step.y],
        ArrowUp: [0, -step.y],
      };
      const d = delta[event.code];
      if (!d) return undefined;
      event.preventDefault();
      return { x: currentCoordinates.x + d[0], y: currentCoordinates.y + d[1] };
    },
    [stepPx],
  );

  const sensors = useSensors(
    // A few pixels of travel before a press becomes a drag, so a click still
    // opens the detail panel.
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_THRESHOLD } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: keyboardCoordinates,
      // Enter stays a click (open detail); Space picks up and puts down.
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  function onDragStart(e: DragStartEvent) {
    const data = e.active.data.current as { booking: BoardBooking; start: number } | undefined;
    if (!data) return;
    setMoveError(null);
    // The booking's own lane, not dnd-kit's measured rect: that is still
    // unset when onDragStart fires, which pinned every drag to its row.
    const overrideStation = overrides.get(data.booking.id)?.station_id;
    const lane = laneRefs.current.get(overrideStation ?? data.booking.station_id);
    const rect = lane?.getBoundingClientRect();
    setDrag({
      booking: data.booking,
      originStart: data.start,
      originCenterY: rect ? rect.top + rect.height / 2 : 0,
      moved: false,
      targetStationId: data.booking.station_id,
      targetStart: data.start,
    });
  }

  function onDragMove(e: DragMoveEvent) {
    setDrag((d) => {
      if (!d) return d;
      const lane = laneRefs.current.values().next().value as HTMLDivElement | undefined;
      const width = lane?.getBoundingClientRect().width ?? 0;
      const deltaMin = width ? (e.delta.x / width) * span : 0;
      const duration = d.booking.duration_minutes;
      const raw = snapToCell(d.originStart + deltaMin);
      const targetStart = Math.min(Math.max(raw, range.start), Math.max(range.start, range.end - duration));
      const idx = rowIndexAt(d.originCenterY + e.delta.y);
      return {
        ...d,
        moved: true,
        targetStationId: idx === null ? d.targetStationId : rows[idx].id,
        targetStart,
      };
    });
  }

  function onDragEnd() {
    const d = dragRef.current;
    setDrag(null);
    if (!d?.moved) return;
    // The pointer is released over the bar's old spot or another element;
    // either way the click that may follow is not an "open detail".
    suppressClick.current = true;
    setTimeout(() => { suppressClick.current = false; }, 0);
    commitMove(d);
  }

  async function commitMove(d: DragState) {
    const shiftMinutes = d.targetStart - d.originStart;
    const check = checkFor(d);
    if (!check.ok) {
      setMoveError(check.reason);
      return;
    }
    if (check.noop) return;

    // Show the result now; the refresh after the request confirms it.
    setOverrides(() => {
      const next = new Map<string, { station_id: string; start: number }>();
      for (const id of check.movingIds) {
        const p = placed.find((x) => x.booking.id === id);
        if (!p) continue;
        next.set(id, {
          station_id: id === d.booking.id ? d.targetStationId : p.item.station_id,
          start: p.item.start + shiftMinutes,
        });
      }
      return next;
    });

    const res = await fetch(`/api/admin/bookings/${d.booking.id}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stationId: d.targetStationId, shiftMinutes }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setOverrides(new Map());
      setMoveError(data.error ?? 'Rezervaci se nepodařilo přesunout');
      return;
    }
    router.refresh();
  }

  const ghostLabel = drag?.moved
    ? `${stationById.get(drag.targetStationId)?.label ?? ''} ${minutesLabel(drag.targetStart)}–${minutesLabel(drag.targetStart + drag.booking.duration_minutes)}${dropCheck && !dropCheck.ok ? ` · ${dropCheck.reason}` : ''}`
    : '';

  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      const b = (active.data.current as { booking: BoardBooking } | undefined)?.booking;
      return b ? `Rezervace ${b.customer_name} zvednuta.` : undefined;
    },
    onDragOver: () => undefined,
    onDragEnd: () => 'Rezervace položena.',
    onDragCancel: () => 'Přesun zrušen.',
  };

  // ── Select empty cells to create a booking or a block ──────────────────────
  const [select, setSelect] = useState<SelectState | null>(null);
  const selectRef = useRef<SelectState | null>(null);
  selectRef.current = select;
  const [selection, setSelection] = useState<CellSelection | null>(null);
  const [creating, setCreating] = useState(false);
  const [blockNote, setBlockNote] = useState('');
  const [blockSaving, setBlockSaving] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  function startSelect(e: React.PointerEvent, idx: number) {
    // Touch scrolls the board instead; selecting is a mouse/pen gesture.
    if (e.button !== 0 || e.pointerType === 'touch') return;
    const station = rows[idx];
    if (!station.is_active) return;
    e.preventDefault();
    const m = Math.floor(minuteAt(e.clientX) / CELL_MINUTES) * CELL_MINUTES;
    setSelection(null);
    setSelectionError(null);
    setMoveError(null);
    setSelect({ type: station.type, anchorIdx: idx, anchorMin: m, curIdx: idx, curMin: m });
  }

  const selecting = select !== null;
  useEffect(() => {
    if (!selecting) return;
    const onMove = (e: PointerEvent) => {
      setSelect((s) => {
        if (!s) return s;
        const idx = rowIndexAt(e.clientY);
        // A reservation is one station type; the selection stays inside it.
        const curIdx = idx !== null && rows[idx].type === s.type ? idx : s.curIdx;
        const m = Math.floor(minuteAt(e.clientX) / CELL_MINUTES) * CELL_MINUTES;
        const curMin = Math.min(Math.max(m, range.start), range.end - CELL_MINUTES);
        return { ...s, curIdx, curMin };
      });
    };
    const onUp = (e: PointerEvent) => {
      const s = selectRef.current;
      setSelect(null);
      if (s && e.type === 'pointerup') setSelection(toSelectionRef.current(s));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [selecting, minuteAt, rowIndexAt, rows, range.start, range.end]);

  function toSelection(s: SelectState): CellSelection | null {
    const [i0, i1] = [Math.min(s.anchorIdx, s.curIdx), Math.max(s.anchorIdx, s.curIdx)];
    const picked = rows.slice(i0, i1 + 1).filter((r) => r.is_active && r.type === s.type);
    if (!picked.length) return null;
    const start = Math.min(s.anchorMin, s.curMin);
    const end = Math.max(s.anchorMin, s.curMin) + CELL_MINUTES;
    return {
      stationIds: picked.map((r) => r.id),
      stationLabels: picked.map((r) => r.label),
      stationType: s.type,
      start,
      end,
    };
  }

  const toSelectionRef = useRef(toSelection);
  toSelectionRef.current = toSelection;

  const selectionClash = useMemo(() => {
    if (!selection) return [];
    return selection.stationIds
      .filter((id) => !isFree(items, id, selection.start, selection.end))
      .map((id) => stationById.get(id)?.label ?? id);
  }, [selection, items, stationById]);

  async function submitBlock() {
    if (!selection) return;
    setBlockSaving(true);
    setSelectionError(null);
    const { date, startTime } = calendarStartMinutes(boardDate, selection.start);
    const res = await fetch('/api/admin/station-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stationIds: selection.stationIds,
        date,
        startTime,
        durationMinutes: selection.end - selection.start,
        note: blockNote.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBlockSaving(false);
    if (!res.ok) {
      const clashes = Array.isArray(data.stations) && data.stations.length ? `: ${data.stations.join(', ')}` : '';
      setSelectionError((data.error ?? 'Blokaci se nepodařilo uložit') + clashes);
      return;
    }
    setSelection(null);
    setBlockNote('');
    router.refresh();
  }

  // Live rectangle while the mouse is down.
  const liveSel = select ? toSelection(select) : null;
  const shownSel = liveSel ?? selection;

  // ── Render ────────────────────────────────────────────────────────────────
  const hours: number[] = [];
  for (let m = Math.ceil(range.start / 60) * 60; m < range.end; m += 60) hours.push(m);

  const gridMinWidth = LABEL_W + cellCount * MIN_CELL_W;
  const cellBg = `repeating-linear-gradient(to right, transparent 0 calc(${100 / cellCount}% - 1px), rgba(255,255,255,0.06) calc(${100 / cellCount}% - 1px) calc(${100 / cellCount}%))`;

  const dateLabel = new Date(boardDate + 'T12:00:00').toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' });

  return (
    <div>
      {range.closed && (
        <div
          className="font-mono uppercase rounded-cz"
          style={{ fontSize: 16, letterSpacing: 2, padding: '10px 14px', marginBottom: 12, color: 'var(--color-cz-warning)', border: '1px solid var(--color-cz-warning)' }}
        >
          V tento den je zavřeno — zobrazeno 14:00–24:00
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDrag(null)}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              'Mezerníkem rezervaci zvedneš, šipkami ji posuneš o půl hodiny nebo o stanici, mezerníkem nebo Enterem ji položíš. Escape přesun zruší. Enter bez zvednutí otevře detail.',
          },
        }}
      >
      <div
        className="bg-cz-black-mid rounded-cz overflow-x-auto"
        style={{ border: '1px solid var(--color-cz-gray-dark)', userSelect: drag || select ? 'none' : undefined }}
      >
        <div style={{ minWidth: gridMinWidth }}>
          {/* Hour header */}
          <div className="flex" style={{ borderBottom: '1px solid var(--color-cz-gray-dark)' }}>
            <div
              className="shrink-0 sticky left-0 z-20 bg-cz-black-mid"
              style={{ width: LABEL_W, borderRight: '1px solid var(--color-cz-gray-dark)' }}
            />
            <div className="relative flex-1" style={{ height: 40 }}>
              {hours.map((m) => (
                <div
                  key={m}
                  className="absolute top-0 bottom-0 flex items-center font-mono text-cz-white-soft"
                  style={{ left: `${pct(m)}%`, paddingLeft: 6, fontSize: 16, borderLeft: '1px solid var(--color-cz-gray-dark)' }}
                >
                  {minutesLabel(m)}
                </div>
              ))}
            </div>
          </div>

          {rows.map((station, idx) => {
            const firstOfType = idx === 0 || rows[idx - 1].type !== station.type;
            const rowBookings = placed.filter((p) => p.item.station_id === station.id);
            const rowBlocks = placedBlocks.filter((p) => p.item.station_id === station.id);
            const ghostHere = drag?.moved && drag.targetStationId === station.id;
            const selHere = shownSel && shownSel.stationIds.includes(station.id);

            return (
              <div key={station.id}>
                {firstOfType && (
                  <div
                    className="font-mono text-cz-gray-light uppercase sticky left-0"
                    style={{ fontSize: 16, letterSpacing: 3, padding: '10px 14px 6px', borderTop: idx ? '1px solid var(--color-cz-gray-dark)' : undefined }}
                  >
                    {TYPE_LABEL[station.type] ?? station.type}
                  </div>
                )}
                <div className="flex" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div
                    className="shrink-0 sticky left-0 z-20 bg-cz-black-mid flex items-center font-mono"
                    style={{
                      width: LABEL_W, height: ROW_H, paddingLeft: 14, fontSize: 16,
                      borderRight: '1px solid var(--color-cz-gray-dark)',
                      color: station.is_active ? 'var(--color-cz-white)' : 'var(--color-cz-gray-light)',
                      textDecoration: station.is_active ? undefined : 'line-through',
                    }}
                    title={station.is_active ? undefined : 'Vyřazeno z provozu'}
                  >
                    {station.label}
                  </div>

                  <div
                    ref={(el) => {
                      if (el) laneRefs.current.set(station.id, el);
                      else laneRefs.current.delete(station.id);
                    }}
                    className="relative flex-1"
                    style={{
                      height: ROW_H,
                      backgroundImage: cellBg,
                      backgroundColor: station.is_active ? undefined : 'rgba(255,255,255,0.02)',
                      cursor: station.is_active ? 'cell' : 'not-allowed',
                      touchAction: 'pan-x pan-y',
                    }}
                    onPointerDown={(e) => {
                      if (e.target === e.currentTarget) startSelect(e, idx);
                    }}
                  >
                    {nowMin !== null && nowMin >= range.start && nowMin <= range.end && (
                      <div
                        aria-hidden
                        className="absolute top-0 bottom-0 pointer-events-none z-10"
                        style={{ left: `${pct(nowMin)}%`, width: 2, background: 'var(--color-cz-orange)' }}
                      />
                    )}

                    {selHere && (
                      <div
                        className="absolute pointer-events-none rounded-control"
                        style={{
                          left: `${pct(shownSel.start)}%`,
                          width: `${pct(shownSel.end) - pct(shownSel.start)}%`,
                          top: 3, bottom: 3,
                          border: '1.5px solid var(--color-cz-orange)',
                          background: 'color-mix(in srgb, var(--color-cz-orange) 12%, transparent)',
                        }}
                      />
                    )}

                    {rowBlocks.map(({ block, item }) => {
                      if (item.end <= range.start || item.start >= range.end) return null;
                      return (
                        <button
                          key={block.id}
                          type="button"
                          onClick={() => onOpenBlock(block)}
                          title={`Blokace · ${minutesLabel(item.start)}–${minutesLabel(item.end)}${block.note ? ` · ${block.note}` : ''}`}
                          className="absolute rounded-cz font-mono uppercase truncate text-left cursor-pointer"
                          style={{
                            ...BAR_STYLE.block,
                            left: `calc(${pct(Math.max(item.start, range.start))}% + 1px)`,
                            width: `calc(${pct(Math.min(item.end, range.end)) - pct(Math.max(item.start, range.start))}% - 2px)`,
                            top: 4, bottom: 4, padding: '0 8px', fontSize: 16, letterSpacing: 1,
                          }}
                        >
                          {block.note || 'BLOKACE'}
                        </button>
                      );
                    })}

                    {rowBookings.map(({ booking, item }) => {
                      if (item.end <= range.start || item.start >= range.end) return null;
                      const kind = bookingKind(booking);
                      const isDragged = drag?.moved && drag.booking.id === booking.id;
                      const groupKey = booking.booking_group_id ?? booking.id;
                      return (
                        <BookingBar
                          key={booking.id}
                          booking={booking}
                          start={item.start}
                          disabled={kind === 'completed'}
                          dragging={!!drag}
                          dimmed={!!isDragged}
                          title={`${booking.reference} · ${booking.customer_name} · ${minutesLabel(item.start)}–${minutesLabel(item.end)}`}
                          style={{
                            ...BAR_STYLE[kind],
                            left: `calc(${pct(Math.max(item.start, range.start))}% + 1px)`,
                            width: `calc(${pct(Math.min(item.end, range.end)) - pct(Math.max(item.start, range.start))}% - 2px)`,
                          }}
                          onOpen={() => {
                            if (suppressClick.current) return;
                            onOpenBooking(groupKey);
                          }}
                        />
                      );
                    })}

                    {ghostHere && drag && (
                      <div
                        className="absolute pointer-events-none rounded-cz flex items-center font-mono z-10"
                        style={{
                          left: `calc(${pct(drag.targetStart)}% + 1px)`,
                          width: `calc(${pct(drag.targetStart + drag.booking.duration_minutes) - pct(drag.targetStart)}% - 2px)`,
                          top: 4, bottom: 4, padding: '0 8px', fontSize: 16,
                          border: `2px dashed ${dropCheck?.ok ? 'var(--color-cz-orange)' : 'var(--color-cz-danger)'}`,
                          background: dropCheck?.ok
                            ? 'color-mix(in srgb, var(--color-cz-orange) 30%, transparent)'
                            : 'color-mix(in srgb, var(--color-cz-danger) 20%, transparent)',
                          color: 'var(--color-cz-white)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {minutesLabel(drag.targetStart)}–{minutesLabel(drag.targetStart + drag.booking.duration_minutes)}
                        {dropCheck && !dropCheck.ok ? ` · ${dropCheck.reason}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      </DndContext>

      {/* The ghost's position, read out while moving with the keyboard. */}
      <div aria-live="polite" className="sr-only">{ghostLabel}</div>

      {moveError && (
        <div className="font-mono" role="alert" style={{ fontSize: 17, marginTop: 12, color: 'var(--color-cz-danger)' }}>
          {moveError}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2" style={{ marginTop: 12 }}>
        {LEGEND.map(([kind, label]) => (
          <span key={kind} className="flex items-center gap-2 font-mono text-cz-gray-light" style={{ fontSize: 16 }}>
            <span className="rounded-control inline-block" style={{ ...BAR_STYLE[kind], width: 18, height: 12 }} />
            {label}
          </span>
        ))}
        <span className="font-mono text-cz-gray-light" style={{ fontSize: 16 }}>
          Táhni prázdná pole pro novou rezervaci · táhni rezervaci pro přesun
        </span>
      </div>

      {/* Action bar for a cell selection */}
      {selection && !select && (
        <div
          className="bg-cz-black-mid rounded-cz flex flex-wrap items-end gap-4"
          style={{ border: '1px solid var(--color-cz-orange)', padding: 16, marginTop: 16 }}
        >
          <div className="flex flex-col gap-1">
            <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>VÝBĚR</span>
            <span className="font-mono text-white" style={{ fontSize: 17 }}>
              {selection.stationLabels.join(', ')} · {dateLabel} · {minutesLabel(selection.start)}–{minutesLabel(selection.end)}
            </span>
          </div>

          <div className="flex flex-col gap-1 flex-1" style={{ minWidth: 200 }}>
            <label htmlFor="block-note" className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>
              POZNÁMKA K BLOKACI (NEPOVINNÁ)
            </label>
            <input
              id="block-note"
              type="text"
              value={blockNote}
              onChange={(e) => setBlockNote(e.target.value)}
              maxLength={500}
              placeholder="Výměna GPU, turnaj…"
              className="bg-cz-black text-white font-body rounded-control focus:outline-none focus:border-cz-orange w-full"
              style={{ padding: '8px 12px', fontSize: 17, border: '1px solid var(--color-cz-gray-dark)' }}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => setCreating(true)} disabled={selectionClash.length > 0}>
              REZERVACE
            </Button>
            <Button size="sm" variant="ghost" onClick={submitBlock} disabled={blockSaving || selectionClash.length > 0}>
              {blockSaving ? '...' : 'BLOKOVAT'}
            </Button>
            <button
              type="button"
              onClick={() => { setSelection(null); setSelectionError(null); }}
              className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors"
              style={{ fontSize: 16, letterSpacing: 2 }}
            >
              ZRUŠIT VÝBĚR
            </button>
          </div>

          {(selectionClash.length > 0 || selectionError) && (
            <div className="w-full font-mono" style={{ fontSize: 17, color: 'var(--color-cz-danger)' }}>
              {selectionError ?? `Obsazeno: ${selectionClash.join(', ')}`}
            </div>
          )}
        </div>
      )}

      {creating && selection && (
        <CreateBookingModal
          boardDate={boardDate}
          selection={selection}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            setSelection(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/** One reservation on a lane: a button that opens the detail, and a drag handle. */
function BookingBar({
  booking,
  start,
  disabled,
  dragging,
  dimmed,
  title,
  style,
  onOpen,
}: {
  booking: BoardBooking;
  start: number;
  disabled: boolean;
  dragging: boolean;
  dimmed: boolean;
  title: string;
  style: React.CSSProperties;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: booking.id,
    data: { booking, start },
    disabled,
    attributes: { roleDescription: 'přesouvatelná rezervace' },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={onOpen}
      title={title}
      className="absolute rounded-cz font-body truncate text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cz-white"
      style={{
        ...style,
        top: 4,
        bottom: 4,
        padding: '0 8px',
        fontSize: 16,
        fontWeight: 500,
        cursor: disabled ? 'pointer' : dragging ? 'grabbing' : 'grab',
        opacity: dimmed ? 0.35 : 1,
        // Lets a touch drag move the bar instead of scrolling the board.
        touchAction: disabled ? undefined : 'none',
      }}
    >
      {booking.customer_name}
    </button>
  );
}
