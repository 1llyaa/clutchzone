import { createAdminClient } from '@/lib/supabase/admin';
import { CANCELLATION_WINDOW_MINUTES } from '@/lib/business';

export type CancellableBooking = {
  groupId: string;
  reference: string;
  customerName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  stationLabels: string[];
  totalPrice: number;
  creditHours: number;
  paysWithCredit: boolean;
  status: string;
  /**
   * Whether money has actually arrived. False for "zaplatím v klubu" bookings
   * that were never paid on site, and for online bookings where checkout was
   * abandoned — neither can be refunded, because nothing was ever received.
   */
  paid: boolean;
  paymentMethod: string;
  /** Negative once the reservation has already started. */
  minutesBeforeStart: number;
  /** Whether cancelling right now still earns the credit under VOP §3.4.1. */
  withinFreeWindow: boolean;
  alreadyCancelled: boolean;
};

/**
 * How many hours the club owes back for a cancellation.
 *
 * Money has to have actually come in, otherwise cancelling mints credit out of
 * nothing. Three ways it hasn't:
 *  - `paid` is false — a "zaplatím v klubu" booking never paid on site, or an
 *    online one where checkout was abandoned;
 *  - `paysWithCredit` — banked ggLeap hours, and those only come off the
 *    account for time actually played, so nothing was ever taken;
 *  - outside the free window — a late cancel or no-show forfeits (VOP §3.4.2).
 *
 * The booking still cancels in all three; only the credit line is withheld.
 */
export function creditHoursOwedFor(booking: {
  withinFreeWindow: boolean;
  paid: boolean;
  paysWithCredit: boolean;
  creditHours: number;
}): number {
  if (!booking.withinFreeWindow) return 0;
  if (!booking.paid) return 0;
  if (booking.paysWithCredit) return 0;
  return booking.creditHours;
}

export async function getCancellationWindowMinutes(): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'cancellation_window_minutes')
    .maybeSingle();
  const parsed = Number(data?.value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : CANCELLATION_WINDOW_MINUTES;
}

/**
 * The club is in Europe/Prague and bookings are stored as a naive local date +
 * time, so "how long until this starts" has to be computed in that zone rather
 * than in whatever zone the server happens to run in.
 */
export function minutesUntil(date: string, startTime: string, now = new Date()): number {
  const [h, m] = startTime.split(':').map(Number);
  // Format `now` as wall-clock time in Prague, then compare like-for-like.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const nowUtcMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));

  const [y, mo, d] = date.split('-').map(Number);
  // start_time can be '24:00'/'25:00' for after-midnight slots — Date.UTC
  // rolls those into the next day on its own.
  const startUtcMs = Date.UTC(y, mo - 1, d, h, m);

  return Math.round((startUtcMs - nowUtcMs) / 60000);
}

export async function loadBookingForCancellation(
  groupId: string,
): Promise<CancellableBooking | null> {
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from('bookings')
    .select(
      'booking_group_id, reference, customer_name, date, start_time, duration_minutes, total_price, credit_hours, pays_with_credit, status, payment_status, payment_method, stations(label)',
    )
    .eq('booking_group_id', groupId);

  if (error || !rows?.length) return null;

  const first = rows[0] as unknown as {
    booking_group_id: string;
    reference: string;
    customer_name: string;
    date: string;
    start_time: string;
    duration_minutes: number;
    total_price: number;
    credit_hours: number | null;
    pays_with_credit: boolean;
    status: string;
    payment_status: string;
    payment_method: string;
    stations: { label: string } | { label: string }[] | null;
  };

  const windowMinutes = await getCancellationWindowMinutes();
  const minutesBeforeStart = minutesUntil(first.date, first.start_time);

  const stationLabels = rows
    .map((r) => {
      const s = (r as unknown as { stations: { label: string } | { label: string }[] | null }).stations;
      return Array.isArray(s) ? s[0]?.label : s?.label;
    })
    .filter((l): l is string => Boolean(l));

  return {
    groupId: first.booking_group_id,
    reference: first.reference,
    customerName: first.customer_name,
    date: first.date,
    startTime: first.start_time,
    durationMinutes: first.duration_minutes,
    stationLabels,
    // total_price is per station (see api/bookings/route.ts) — sum the group.
    totalPrice: rows.reduce((sum, r) => sum + ((r as { total_price: number }).total_price ?? 0), 0),
    creditHours: rows.reduce(
      (sum, r) => sum + ((r as { credit_hours: number | null }).credit_hours ?? 0),
      0,
    ),
    paysWithCredit: first.pays_with_credit,
    status: first.status,
    paid: first.payment_status === 'paid',
    paymentMethod: first.payment_method,
    minutesBeforeStart,
    withinFreeWindow: minutesBeforeStart > windowMinutes,
    alreadyCancelled: rows.every((r) => (r as { status: string }).status === 'cancelled'),
  };
}
