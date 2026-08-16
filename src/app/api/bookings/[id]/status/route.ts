import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('bookings')
    .select('reference, date, start_time, total_price, payment_status, coins_awarded, stations(label)')
    .eq('booking_group_id', groupId);

  if (error || !data?.length) {
    return NextResponse.json({ error: 'Rezervace nenalezena' }, { status: 404 });
  }

  const first = data[0];
  return NextResponse.json({
    reference: first.reference,
    stationLabel: data.map((r) => r.stations?.[0]?.label).filter(Boolean).join(', '),
    date: first.date,
    startTime: first.start_time,
    totalPrice: data.reduce((sum, r) => sum + r.total_price, 0),
    paymentStatus: first.payment_status,
    coinsAwarded: first.coins_awarded,
  });
}
