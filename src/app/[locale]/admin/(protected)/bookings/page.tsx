import { createAdminClient } from '@/lib/supabase/admin';
import BookingsClient from './BookingsClient';

async function fetchBookingsData(from: string, to: string) {
  const admin = createAdminClient();

  const [bookingsRes, stationsRes] = await Promise.all([
    admin
      .from('bookings')
      .select('id, reference, customer_name, customer_email, customer_phone, customer_discord, date, start_time, duration_minutes, total_price, status, station_id, stations(label, type)')
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('start_time'),
    admin
      .from('stations')
      .select('id, label, type, is_active')
      .order('label'),
  ]);

  return {
    bookings: (bookingsRes.data ?? []) as any[],
    stations: stationsRes.data ?? [],
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

  const { bookings, stations } = await fetchBookingsData(from, to);

  return (
    <BookingsClient
      bookings={bookings}
      stations={stations}
      from={from}
      to={to}
    />
  );
}
