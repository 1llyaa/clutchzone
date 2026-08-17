import { createAdminClient } from '@/lib/supabase/admin';
import BookingsClient from './BookingsClient';

async function fetchBookingsData(from: string, to: string) {
  const admin = createAdminClient();

  const [bookingsRes, stationsRes, passesRes] = await Promise.all([
    admin
      .from('bookings')
      .select('id, reference, customer_name, customer_email, customer_phone, customer_discord, date, start_time, duration_minutes, total_price, status, station_id, payment_method, payment_status, coins_awarded, booking_group_id, stations_count, time_pass_id, offer_kind, stations(label, type)')
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('start_time'),
    admin
      .from('stations')
      .select('id, label, type, is_active')
      .order('label'),
    admin.from('time_passes').select('id, name_cs'),
  ]);

  const passNameById = Object.fromEntries((passesRes.data ?? []).map((p) => [p.id, p.name_cs]));

  return {
    bookings: (bookingsRes.data ?? []).map((b) => ({
      ...b,
      stations: b.stations?.[0] ?? null,
    })),
    stations: stationsRes.data ?? [],
    passNameById,
  };
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const today = new Date().toISOString().split('T')[0];
  const from = params.from || today;
  const to   = params.to   || from;

  const { bookings, stations, passNameById } = await fetchBookingsData(from, to);

  return (
    <BookingsClient
      bookings={bookings}
      stations={stations}
      passNameById={passNameById}
      from={from}
      to={to}
    />
  );
}
