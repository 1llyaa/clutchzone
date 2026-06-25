import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const date = searchParams.get('date');
  const startTime = searchParams.get('start');
  const durationMinutes = parseInt(searchParams.get('duration') ?? '60');
  const type = searchParams.get('type') as 'pc' | 'ps5';

  if (!date || !startTime || !type) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Get all active stations of this type
  const { data: stations, error: stErr } = await supabase
    .from('stations')
    .select('id')
    .eq('type', type)
    .eq('is_active', true);

  if (stErr || !stations) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  const stationIds = stations.map((s) => s.id);

  // Find stations with conflicting bookings using raw SQL via rpc or just check manually
  // A booking conflicts if its tsrange overlaps our desired tsrange
  const { data: conflicts, error: bErr } = await supabase
    .from('bookings')
    .select('station_id')
    .in('station_id', stationIds)
    .neq('status', 'cancelled')
    .eq('date', date)
    .or(
      // overlap: existing start < our end AND existing end > our start
      // existing end = start_time + duration_minutes
      // We check by time arithmetic — use a stored procedure approach:
      // For simplicity: fetch all bookings for this date+type and filter in JS
      `date.eq.${date}`
    );

  // Simpler: fetch all non-cancelled bookings for this date+stations, check overlap in JS
  const { data: bookings, error: bErr2 } = await supabase
    .from('bookings')
    .select('station_id, start_time, duration_minutes')
    .in('station_id', stationIds)
    .neq('status', 'cancelled')
    .eq('date', date);

  if (bErr2) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  // Parse our desired range in minutes from midnight
  const [sh, sm] = startTime.split(':').map(Number);
  const ourStart = sh * 60 + sm;
  const ourEnd = ourStart + durationMinutes;

  // Find which stations are occupied during our time window
  const occupiedIds = new Set<string>();
  for (const b of bookings ?? []) {
    const [bh, bm] = (b.start_time as string).split(':').map(Number);
    const bStart = bh * 60 + bm;
    const bEnd = bStart + b.duration_minutes;
    // Overlap check: intervals [ourStart, ourEnd) and [bStart, bEnd) overlap if bStart < ourEnd && bEnd > ourStart
    if (bStart < ourEnd && bEnd > ourStart) {
      occupiedIds.add(b.station_id);
    }
  }

  const available = stationIds.filter((id) => !occupiedIds.has(id));

  return NextResponse.json({
    available: available.length,
    total: stationIds.length,
  });
}
