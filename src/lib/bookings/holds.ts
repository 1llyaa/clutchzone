import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Stripe will not create a Checkout Session expiring sooner than 30 minutes
 * out, and the hold window is pinned to the session expiry so Stripe refuses
 * payment for a slot we have already released. A shorter hold would open a gap
 * where a live session outlives its hold.
 */
export const MIN_ONLINE_HOLD_MINUTES = 30;

/** Clamps whatever site_settings holds up to what Stripe will actually accept. */
export function clampHoldMinutes(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return MIN_ONLINE_HOLD_MINUTES;
  return Math.max(parsed, MIN_ONLINE_HOLD_MINUTES);
}

export async function getOnlineHoldMinutes(): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'online_hold_minutes')
    .maybeSingle();
  return clampHoldMinutes(data?.value);
}

export function holdExpiryFrom(holdMinutes: number, now = new Date()): string {
  return new Date(now.getTime() + holdMinutes * 60_000).toISOString();
}

/**
 * Releases online bookings whose payment window ran out.
 *
 * There is no cron in this project, so expiry is lazy: the two endpoints that
 * read availability reap first, which is enough because a slot only matters at
 * the moment someone looks at it.
 *
 * `cancelled` is the only status that frees a slot — every availability query
 * and the bookings_no_overlap exclusion constraint key off it — so an expired
 * hold has to land there rather than in a status of its own.
 *
 * Never throws: a reap that fails must not take an availability lookup with it.
 * The stale hold simply survives until the next attempt.
 */
export async function releaseExpiredHolds(): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('status', 'pending')
    .not('hold_expires_at', 'is', null)
    .lt('hold_expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to release expired booking holds:', error);
  }
}
