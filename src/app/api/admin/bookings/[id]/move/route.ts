import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { releaseExpiredHolds } from '@/lib/bookings/holds';
import { occupiedStationIds } from '@/lib/bookings/occupancy';
import { planMove, type MoveRow } from '@/lib/bookings/move';
import { isUuid } from '@/lib/validation/identifier';

/**
 * Move one reservation on the admin timeline: to another station, another
 * start time, or both.
 *
 * `id` is a single `bookings.id` — NOT a booking_group_id. A station change
 * is per row: an N-station reservation with one broken PC moves that one row.
 * A time change moves the whole group, because emails, receipts and the cancel
 * page all show one start time per reservation.
 *
 * The price is left alone. It was set by the day type, and a move stays on the
 * same station type and (from the board) the same club day.
 */

const MoveSchema = z.object({
  stationId: z.string().uuid(),
  // A whole club day either way is more than any drag on one board can make.
  shiftMinutes: z.number().int().min(-1440).max(1440).multipleOf(15),
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

  const parsed = MoveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
  }
  const { stationId, shiftMinutes } = parsed.data;

  const admin = createAdminClient();

  // A lapsed online hold still holds its station until something cancels it,
  // and staff would be told the target is taken by a booking that is gone.
  await releaseExpiredHolds();

  const { data: booking, error: bookingErr } = await admin
    .from('bookings')
    .select('id, booking_group_id, station_id, date, start_time, duration_minutes, status, stations(type)')
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

  const groupId = booking.booking_group_id ?? booking.id;
  const { data: group, error: groupErr } = await admin
    .from('bookings')
    .select('id, station_id, start_time, duration_minutes, status')
    .or(`booking_group_id.eq.${groupId},id.eq.${groupId}`);

  if (groupErr) return NextResponse.json({ error: groupErr.message }, { status: 500 });

  const plan = planMove(booking as MoveRow, (group ?? []) as MoveRow[], stationId, shiftMinutes);
  // A no-op must not stamp a move that never happened.
  if (plan === 'noop') return NextResponse.json({ ok: true });
  if (plan === 'onto-sibling') {
    return NextResponse.json(
      { error: 'Na stanici je jiné místo z téže rezervace' },
      { status: 409 },
    );
  }

  if (stationId !== booking.station_id) {
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

    // Same type only. total_price came from the tier for the original type.
    const currentType = (booking.stations as unknown as { type: string } | null)?.type;
    if (currentType && target.type !== currentType) {
      return NextResponse.json(
        { error: 'Přesunout lze jen na stanici stejného typu' },
        { status: 400 },
      );
    }
  }

  // Pre-check only, for a legible message. bookings_no_overlap and the
  // cross-table trigger from 024 are the real guard and fire on UPDATE.
  const occupied = await occupiedStationIds(admin, {
    date: booking.date,
    stationIds: plan.targetStationIds,
    startMinutes: plan.startMinutes,
    endMinutes: plan.endMinutes,
    excludeBookingIds: plan.movingIds,
  });

  if (occupied.size) {
    return NextResponse.json({ error: 'Cílové místo je v tomto čase obsazené' }, { status: 409 });
  }

  const { error: moveErr } = await admin.rpc('admin_move_booking', {
    p_booking_id: booking.id,
    p_station_id: stationId,
    p_shift_minutes: shiftMinutes,
    p_admin_id: profile.id,
  });

  if (moveErr) {
    // Something landed on the target between the pre-check and the update.
    if (moveErr.code === '23P01') {
      return NextResponse.json(
        { error: 'Místo bylo mezitím obsazeno, zkuste to znovu' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: moveErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
