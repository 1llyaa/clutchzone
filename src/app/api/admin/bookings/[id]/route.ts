import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// `id` is normally a booking_group_id (every row in the N-station group
// gets updated/deleted together) — the `id.eq` fallback covers legacy
// rows from before booking_group_id existed, where a row is its own group.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const allowed = ['status', 'payment_status'];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];
  if ('status' in updates && !VALID_STATUSES.includes(updates.status as string)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Staff marks "zaplatím v klubu" bookings paid once the money is in hand.
  // This is what decides whether a later cancellation owes credit back
  // (see creditHoursOwedFor in lib/bookings/cancellation.ts), so it must not
  // accept anything outside the column's CHECK constraint.
  const VALID_PAYMENT_STATUSES = ['unpaid', 'paid'];
  if (
    'payment_status' in updates &&
    !VALID_PAYMENT_STATUSES.includes(updates.payment_status as string)
  ) {
    return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('bookings')
    .update(updates)
    .or(`booking_group_id.eq.${id},id.eq.${id}`);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from('bookings')
    .delete()
    .or(`booking_group_id.eq.${id},id.eq.${id}`);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
