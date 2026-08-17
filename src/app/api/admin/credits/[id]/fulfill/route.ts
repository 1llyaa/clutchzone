import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireAdmin();
  if (!profile) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: order } = await admin.from('credit_orders').select('payment_status, fulfilled_at').eq('id', id).single();
  if (!order) return NextResponse.json({ error: 'Objednávka nenalezena' }, { status: 404 });
  if (order.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Objednávka ještě není zaplacená' }, { status: 400 });
  }
  if (order.fulfilled_at) {
    return NextResponse.json({ error: 'Hodiny už byly připsány' }, { status: 409 });
  }

  const { data, error } = await admin
    .from('credit_orders')
    .update({ fulfilled_at: new Date().toISOString(), fulfilled_by: profile.id })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
