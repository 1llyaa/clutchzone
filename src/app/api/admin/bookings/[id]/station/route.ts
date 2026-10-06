import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { releaseExpiredHolds } from '@/lib/bookings/holds';
import { occupiedStationIds, parseTimeToMinutes } from '@/lib/bookings/occupancy';
import { isUuid } from '@/lib/validation/identifier';

/**
 * Move one reservation to a different station.
 *
 * `id` here is a single `bookings.id` — NOT a booking_group_id. That is the
 * one thing to get right in this file: the sibling route `../route.ts` takes
 * a group id and updates every row of the group at once
 * (`.or(booking_group_id.eq…,id.eq…)`). A reassignment is per-station by
 * design: an N-station reservation with one broken PC moves that one row and
 * leaves the rest where they are.
 *
 * The customer never chooses a station — POST /api/bookings assigns one — and
 * this does not change that. It is staff-only.
 */

const ReassignSchema = z.object({
  stationId: z.string().uuid(),
});

/** Nothing to reseat: one is already over, the other released its slot. */
const UNMOVABLE_STATUSES = ['cancelled', 'completed'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
  }

  const parsed = ReassignSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
  }
  const { stationId } = parsed.data;

  const admin = createAdminClient();

  // Same reason POST /api/bookings reaps first: a lapsed online hold still
  // holds its station until something cancels it, and staff would be told the
  // target is occupied by a booking that no longer exists.
  await releaseExpiredHolds();

  const { data: booking, error: bookingErr } = await admin
    .from('bookings')
    .select('id, station_id, date, start_time, duration_minutes, status, stations(type)')
    .eq('id', id)
    .maybeSingle();

  if (bookingErr) return NextResponse.json({ error: bookingErr.message }, { status: 500 });
  if (!booking) return NextResponse.json({ error: 'Rezervace nenalezena' }, { status: 404 });

  if (UNMOVABLE_STATUSES.includes(booking.status)) {
    return NextResponse.json(
      { error: 'Zrušenou ani dokončenou rezervaci nelze přesunout' },
      { status: 409 },
    );
  }

  // A no-op must not stamp a reassignment that never happened.
  if (stationId === booking.station_id) {
    return NextResponse.json({ ok: true });
  }

  const { data: target, error: stationErr } = await admin
    .from('stations')
    .select('id, label, type, is_active')
    .eq('id', stationId)
    .maybeSingle();

  if (stationErr) return NextResponse.json({ error: stationErr.message }, { status: 500 });
  if (!target) return NextResponse.json({ error: 'Stanice neexistuje' }, { status: 404 });
  if (!target.is_active) {
    return NextResponse.json({ error: 'Stanice je vyřazená z provozu' }, { status: 400 });
  }

  // Same type only. total_price was computed from the pricing tier for the
  // original type, so a pc <-> ps5 move would leave the booking priced as
  // something it no longer is.
  const currentType = (booking.stations as unknown as { type: string } | null)?.type;
  if (currentType && target.type !== currentType) {
    return NextResponse.json(
      { error: 'Přesunout lze jen na stanici stejného typu' },
      { status: 400 },
    );
  }

  const startMinutes = parseTimeToMinutes(booking.start_time);
  const endMinutes = startMinutes + booking.duration_minutes;

  // Pre-check only, for a legible message. bookings_no_overlap and the
  // cross-table trigger from migration 024 are the real guard and fire on
  // UPDATE just as they do on INSERT.
  const occupied = await occupiedStationIds(admin, {
    date: booking.date,
    stationIds: [stationId],
    startMinutes,
    endMinutes,
    excludeBookingIds: [booking.id],
  });

  if (occupied.has(stationId)) {
    return NextResponse.json(
      { error: `Stanice ${target.label} je v tomto čase obsazená` },
      { status: 409 },
    );
  }

  const { error: updateErr } = await admin
    .from('bookings')
    .update({
      station_id: stationId,
      station_reassigned_at: new Date().toISOString(),
      station_reassigned_by: profile.id,
    })
    .eq('id', booking.id);

  if (updateErr) {
    // Something landed on the target between the pre-check and the update.
    if (updateErr.code === '23P01') {
      return NextResponse.json(
        { error: 'Stanice byla mezitím obsazena, zkuste to znovu' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
