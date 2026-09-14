import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { minutesUntil } from '@/lib/bookings/cancellation';
import { occupiedStationIds, parseTimeToMinutes } from '@/lib/bookings/occupancy';

const BlockSchema = z.object({
  stationIds: z.array(z.string().uuid()).min(1).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().positive().max(24 * 60),
  note: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = BlockSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
  }
  const { stationIds, date, startTime, durationMinutes, note } = parsed.data;

  // Unlike POST /api/bookings, a start time in the past is fine: blocking a
  // walk-in who sat down twenty minutes ago is the primary use case. The guard
  // is on the block's *end* instead — a window that has already fully elapsed
  // can never affect availability, so it is only clutter.
  if (minutesUntil(date, startTime) + durationMinutes <= 0) {
    return NextResponse.json({ error: 'Blokace už celá proběhla' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: stations, error: stErr } = await admin
    .from('stations')
    .select('id, label')
    .in('id', stationIds);

  if (stErr) return NextResponse.json({ error: stErr.message }, { status: 500 });
  if (!stations || stations.length !== stationIds.length) {
    return NextResponse.json({ error: 'Některá stanice neexistuje' }, { status: 400 });
  }

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;

  // Pre-check so the error can name the stations that clashed. The triggers in
  // migration 024 are the real guard — this only buys a legible message.
  const occupied = await occupiedStationIds(admin, {
    date,
    stationIds,
    startMinutes,
    endMinutes,
  });

  const clashing = stations.filter((s) => occupied.has(s.id)).map((s) => s.label);
  if (clashing.length) {
    return NextResponse.json(
      { error: 'Některé stanice jsou v tomto čase obsazené', stations: clashing },
      { status: 409 },
    );
  }

  const blockGroupId = crypto.randomUUID();
  const rows = stationIds.map((stationId) => ({
    block_group_id: blockGroupId,
    station_id: stationId,
    date,
    start_time: startTime,
    duration_minutes: durationMinutes,
    note: note || null,
    created_by: profile.id,
  }));

  const { error: insertErr } = await admin.from('station_blocks').insert(rows);

  if (insertErr) {
    // 23P01 here means a booking or another block landed between the
    // pre-check and the insert — the trigger or the exclusion constraint
    // caught it. Nothing useful left to name, so the message stays generic.
    if (insertErr.code === '23P01') {
      return NextResponse.json(
        { error: 'Stanice byla mezitím obsazena, zkuste to znovu' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ blockGroupId }, { status: 201 });
}
