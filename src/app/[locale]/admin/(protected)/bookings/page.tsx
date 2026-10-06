import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { addDays } from '@/lib/bookings/occupancy';
import BookingsClient from './BookingsClient';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

async function fetchBookingsData(from: string, to: string, boardDate: string) {
  const admin = createAdminClient();

  const [bookingsRes, stationsRes, passesRes, blocksRes, hoursRes, staffRes] = await Promise.all([
    admin
      .from('bookings')
      .select('id, reference, customer_name, customer_email, customer_phone, customer_discord, clutchzone_account, date, start_time, duration_minutes, total_price, status, station_id, payment_method, payment_status, pays_with_credit, coins_awarded, booking_group_id, stations_count, time_pass_id, offer_kind, station_reassigned_at, station_reassigned_by, rescheduled_at, rescheduled_by, source, created_by, stations(label, type)')
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('start_time'),
    admin
      .from('stations')
      .select('id, label, type, is_active')
      .order('label'),
    admin.from('time_passes').select('id, name_cs'),
    // Admin blocks share the board with bookings but never the list — a block
    // is not a customer reservation and has no row there.
    admin
      .from('station_blocks')
      .select('id, block_group_id, station_id, date, start_time, duration_minutes, note')
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('start_time'),
    admin.from('opening_hours').select('day_of_week, is_closed, open_time, close_time, crosses_midnight'),
    admin.from('profiles').select('id, display_name'),
  ]);

  const passNameById = Object.fromEntries((passesRes.data ?? []).map((p) => [p.id, p.name_cs]));
  // Who created or moved a booking. Only ever read for display.
  const adminNameById: Record<string, string> = Object.fromEntries(
    (staffRes.data ?? []).map((p) => [p.id, p.display_name ?? '—']),
  );

  const dow = new Date(boardDate + 'T12:00:00').getDay();
  const opening = (hoursRes.data ?? []).find((r) => r.day_of_week === dow) ?? null;

  return {
    bookings: (bookingsRes.data ?? []).map((b) => ({
      ...b,
      stations: b.stations?.[0] ?? null,
    })),
    stations: stationsRes.data ?? [],
    blocks: blocksRes.data ?? [],
    passNameById,
    adminNameById,
    opening,
  };
}

/** Today's date in Prague — the server may run in UTC, which flips at 01:00/02:00. */
function pragueToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(new Date());
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  // Checked here as well as in layout.tsx: a layout is not a security
  // boundary — Next renders pages and layouts independently, so a page that
  // relies on its layout alone can be reached on its own.
  const profile = await requireAdmin();
  if (!profile) redirect(`/${await getLocale()}/admin/login`);

  const today = pragueToday();
  const valid = (d?: string) => (d && ISO_DATE.test(d) ? d : undefined);
  const view = params.view === 'list' ? 'list' : 'timeline';

  // The timeline shows one club day. Its small hours are stored under the
  // next date, so that date is fetched too. Older links (notifications) carry
  // ?from=X&to=X and open the board for X.
  const boardDate = valid(params.date) ?? valid(params.from) ?? today;
  const from = view === 'list' ? valid(params.from) ?? today : boardDate;
  const to = view === 'list'
    ? (() => { const t = valid(params.to) ?? from; return t < from ? from : t; })()
    : addDays(boardDate, 1);

  const data = await fetchBookingsData(from, to, boardDate);

  return (
    <BookingsClient
      {...data}
      view={view}
      boardDate={boardDate}
      today={today}
      from={from}
      to={view === 'list' ? to : from}
    />
  );
}
