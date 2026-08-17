import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// `id` here is booking_group_id — a booking spans N rows (one per
// station), so fulfilling it means every row in the group. "Fulfilled"
// covers whatever staff owes the customer from this booking at the
// club — hour credit for hours/hours_upsell, and/or the coins from an
// online card payment (a pass booking has no hours but can still owe
// coins).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireAdmin();
  if (!profile) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: groupId } = await params;
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from('bookings')
    .select('status, fulfilled_at, coins_awarded, offer_kind')
    .eq('booking_group_id', groupId);

  if (!rows?.length) return NextResponse.json({ error: 'Rezervace nenalezena' }, { status: 404 });
  const owesSomething = rows.some((r) => ['hours', 'hours_upsell'].includes(r.offer_kind) || (r.coins_awarded ?? 0) > 0);
  if (!owesSomething) {
    return NextResponse.json({ error: 'Tahle rezervace nic negeneruje (bez hodin i mincí)' }, { status: 400 });
  }
  if (rows.some((r) => r.status === 'cancelled')) {
    return NextResponse.json({ error: 'Rezervace je zrušená' }, { status: 400 });
  }
  if (rows.some((r) => r.fulfilled_at)) {
    return NextResponse.json({ error: 'Už bylo vyřízeno' }, { status: 409 });
  }

  const { data, error } = await admin
    .from('bookings')
    .update({ fulfilled_at: new Date().toISOString(), fulfilled_by: profile.id })
    .eq('booking_group_id', groupId)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rows: data });
}
