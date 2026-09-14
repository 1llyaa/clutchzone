import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { releaseExpiredHolds } from '@/lib/bookings/holds';
import { occupiedStationIds, parseTimeToMinutes } from '@/lib/bookings/occupancy';

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

  // Unpaid online holds only free their slot when someone looks — there is no
  // cron, so the reap happens here, before the occupancy read.
  await releaseExpiredHolds();

  // Occupancy is bookings *and* admin blocks — a blocked station is out of
  // circulation for the window even though no customer is attached to it.
  const ourStart = parseTimeToMinutes(startTime);
  const ourEnd = ourStart + durationMinutes;

  const occupiedIds = await occupiedStationIds(supabase, {
    date,
    stationIds,
    startMinutes: ourStart,
    endMinutes: ourEnd,
  });

  const available = stationIds.filter((id) => !occupiedIds.has(id));

  return NextResponse.json({
    available: available.length,
    total: stationIds.length,
  });
}
