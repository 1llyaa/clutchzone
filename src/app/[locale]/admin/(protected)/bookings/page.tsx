import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import BookingsClient from './BookingsClient';

async function fetchBookingsData(from: string, to: string) {
  const admin = createAdminClient();

  const [bookingsRes, stationsRes, passesRes, blocksRes, hoursRes] = await Promise.all([
    admin
      .from('bookings')
      .select('id, reference, customer_name, customer_email, customer_phone, customer_discord, clutchzone_account, date, start_time, duration_minutes, total_price, status, station_id, payment_method, payment_status, pays_with_credit, coins_awarded, booking_group_id, stations_count, time_pass_id, offer_kind, stations(label, type)')
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('start_time'),
    admin
      .from('stations')
      .select('id, label, type, is_active')
      .order('label'),
    admin.from('time_passes').select('id, name_cs'),
    // Admin blocks share the grid with bookings but never the table below it —
    // a block is not a customer reservation and has no row there.
    admin
      .from('station_blocks')
      .select('id, block_group_id, station_id, date, start_time, duration_minutes, note')
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('start_time'),
    admin.from('opening_hours').select('day_of_week, open_time, is_closed'),
  ]);

  const passNameById = Object.fromEntries((passesRes.data ?? []).map((p) => [p.id, p.name_cs]));

  // The block action bar opens on the club's opening time when the admin is
  // looking at a future date, where "now" would be meaningless.
  const dow = new Date(from + 'T12:00:00').getDay();
  const openingRow = (hoursRes.data ?? []).find((r) => r.day_of_week === dow);
  const openTime: string | null =
    openingRow && !openingRow.is_closed ? (openingRow.open_time as string)?.slice(0, 5) ?? null : null;

  return {
    bookings: (bookingsRes.data ?? []).map((b) => ({
      ...b,
      stations: b.stations?.[0] ?? null,
    })),
    stations: stationsRes.data ?? [],
    blocks: blocksRes.data ?? [],
    passNameById,
    openTime,
  };
}

/** Wall-clock HH:MM in Prague, floored to the quarter hour. */
function pragueNowFloored(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Prague',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const minute = Math.floor(get('minute') / 15) * 15;
  return `${String(get('hour')).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  // Checked here as well as in layout.tsx: a layout is not a security
  // boundary — Next renders pages and layouts independently, so a page that
  // relies on its layout alone can be reached on its own.
  const profile = await requireAdmin();
  if (!profile) redirect(`/${await getLocale()}/admin/login`);

  const today = new Date().toISOString().split('T')[0];
  const from = params.from || today;
  const to   = params.to   || from;

  const { bookings, stations, blocks, passNameById, openTime } = await fetchBookingsData(from, to);

  // Computed here rather than in the client: "now" resolved during hydration
  // would not match what the server rendered a moment earlier.
  const isToday = from === today;
  const defaultStartTime = isToday ? pragueNowFloored() : openTime ?? '14:00';

  return (
    <BookingsClient
      bookings={bookings}
      stations={stations}
      blocks={blocks}
      passNameById={passNameById}
      defaultStartTime={defaultStartTime}
      from={from}
      to={to}
    />
  );
}
