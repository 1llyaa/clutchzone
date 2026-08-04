import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('bookings')
    .select('reference, date, start_time, total_price, payment_status, coins_awarded, stations(label)')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Rezervace nenalezena' }, { status: 404 });
  }

  return NextResponse.json({
    reference: data.reference,
    stationLabel: data.stations?.[0]?.label ?? null,
    date: data.date,
    startTime: data.start_time,
    totalPrice: data.total_price,
    paymentStatus: data.payment_status,
    coinsAwarded: data.coins_awarded,
  });
}
