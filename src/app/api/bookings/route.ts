import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const BookingSchema = z.object({
  stationType: z.enum(['pc', 'ps5']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(60).max(720),
  totalPrice: z.number().int().min(1),
  packageLabel: z.string(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(9),
  customerDiscord: z.string().optional(),
});

function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'CZ-';
  for (let i = 0; i < 4; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = BookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Neplatné údaje', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  // Find all active stations of the requested type
  const { data: stations, error: stErr } = await supabase
    .from('stations')
    .select('id, label')
    .eq('type', data.stationType)
    .eq('is_active', true);

  if (stErr || !stations?.length) {
    return NextResponse.json({ error: 'Žádné stanice nejsou k dispozici' }, { status: 503 });
  }

  // Find existing bookings that overlap our time window
  const { data: bookings } = await supabase
    .from('bookings')
    .select('station_id, start_time, duration_minutes')
    .in('station_id', stations.map((s) => s.id))
    .neq('status', 'cancelled')
    .eq('date', data.date);

  const [sh, sm] = data.startTime.split(':').map(Number);
  const ourStart = sh * 60 + sm;
  const ourEnd = ourStart + data.durationMinutes;

  const occupiedIds = new Set<string>();
  for (const b of bookings ?? []) {
    const [bh, bm] = (b.start_time as string).split(':').map(Number);
    const bStart = bh * 60 + bm;
    const bEnd = bStart + b.duration_minutes;
    if (bStart < ourEnd && bEnd > ourStart) {
      occupiedIds.add(b.station_id);
    }
  }

  const freeStation = stations.find((s) => !occupiedIds.has(s.id));
  if (!freeStation) {
    return NextResponse.json({ error: 'Všechny stanice jsou obsazeny v tomto čase' }, { status: 409 });
  }

  // Get pricing_id (use 'standard' as the reference tier for now)
  const { data: pricing } = await supabase
    .from('pricing_tiers')
    .select('id')
    .eq('tier', 'standard')
    .single();

  const reference = generateReference();

  const { error: insertErr } = await supabase.from('bookings').insert({
    reference,
    station_id: freeStation.id,
    pricing_id: pricing?.id,
    customer_name: data.customerName,
    customer_email: data.customerEmail,
    customer_phone: data.customerPhone,
    customer_discord: data.customerDiscord ?? null,
    date: data.date,
    start_time: data.startTime,
    duration_minutes: data.durationMinutes,
    total_price: data.totalPrice,
    status: 'confirmed',
  });

  if (insertErr) {
    // Could be a race-condition constraint violation
    if (insertErr.code === '23505') {
      return NextResponse.json({ error: 'Všechny stanice jsou obsazeny v tomto čase' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Chyba při vytváření rezervace' }, { status: 500 });
  }

  return NextResponse.json({ reference, stationLabel: freeStation.label });
}
