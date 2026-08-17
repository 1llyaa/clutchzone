import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from('credit_orders')
    .select('reference, total_amount, payment_status, expires_at')
    .eq('id', id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Objednávka nenalezena' }, { status: 404 });
  }

  const { data: items } = await admin
    .from('credit_order_items')
    .select('station_type, hours, quantity')
    .eq('order_id', id);

  return NextResponse.json({
    reference: order.reference,
    totalAmount: order.total_amount,
    paymentStatus: order.payment_status,
    expiresAt: order.expires_at,
    items: items ?? [],
  });
}
