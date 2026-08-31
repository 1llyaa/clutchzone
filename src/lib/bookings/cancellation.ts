import { createAdminClient } from '@/lib/supabase/admin';
import { CANCELLATION_WINDOW_MINUTES } from '@/lib/business';

export type CancellableBooking = {
  groupId: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  stationLabels: string[];
  totalPrice: number;
  creditHours: number;
  paysWithCredit: boolean;
  /**
   * A time pass is a flat price for a window (Happy Hours, Evening Pass…), not
   * a bundle of hours. It banks nothing, so `creditHours` is 0 and there is no
   * hour count to hand back on cancellation.
   */
  isPass: boolean;
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
 * What the club owes back for a cancellation — hours, money, or nothing.
 *
 * VOP §3.4.1 promises the paid amount back on a timely cancellation without
 * carving out any offer type, so the only question is what form it takes. The
 * three shapes are mutually exclusive, which is why this returns one value
 * rather than a credit figure and a refund flag that could both be set.
 */
export type CancellationSettlement =
  | { kind: 'credit'; hours: number }
  | { kind: 'refund'; amount: number }
  | { kind: 'none' };

export function cancellationSettlementFor(booking: {
  withinFreeWindow: boolean;
  paid: boolean;
  paysWithCredit: boolean;
  isPass: boolean;
  creditHours: number;
  totalPrice: number;
  /**
   * The customer asked for the money back on the card instead of credit
   * (VOP §3.4.1). Decided here rather than beside the call, so the amount can
   * never disagree with the form the settlement takes.
   */
  refundPreferred?: boolean;
}): CancellationSettlement {
  // A late cancel or no-show forfeits (VOP §3.4.2).
  if (!booking.withinFreeWindow) return { kind: 'none' };
  // Money has to have actually come in, otherwise cancelling mints credit out
  // of nothing — a "zaplatím v klubu" booking never paid on site, or an online
  // one whose checkout was abandoned.
  if (!booking.paid) return { kind: 'none' };
  // Banked ggLeap hours come off the account only for time actually played, so
  // nothing was ever taken and nothing goes back.
  if (booking.paysWithCredit) return { kind: 'none' };
  // A pass is a flat price for a time window, not hours — there is no hour
  // count to credit, so it is settled in money instead. The customer can also
  // ask for money over credit on any offer, and either way what goes back is
  // what they paid.
  if (booking.isPass || booking.refundPreferred) {
    return { kind: 'refund', amount: booking.totalPrice };
  }
  return { kind: 'credit', hours: booking.creditHours };
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
      'booking_group_id, reference, customer_name, customer_email, date, start_time, duration_minutes, total_price, credit_hours, pays_with_credit, offer_kind, status, payment_status, payment_method, stations(label)',
    )
    .eq('booking_group_id', groupId);

  if (error || !rows?.length) return null;

  const first = rows[0] as unknown as {
    booking_group_id: string;
    reference: string;
    customer_name: string;
    customer_email: string;
    date: string;
    start_time: string;
    duration_minutes: number;
    total_price: number;
    credit_hours: number | null;
    pays_with_credit: boolean;
    offer_kind: string | null;
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
    customerEmail: first.customer_email,
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
    isPass: first.offer_kind === 'pass',
    status: first.status,
    paid: first.payment_status === 'paid',
    paymentMethod: first.payment_method,
    minutesBeforeStart,
    withinFreeWindow: minutesBeforeStart > windowMinutes,
    alreadyCancelled: rows.every((r) => (r as { status: string }).status === 'cancelled'),
  };
}
