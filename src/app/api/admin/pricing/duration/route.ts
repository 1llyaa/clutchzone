import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { table, duration_h, amount } = await request.json();

  if (!['pc', 'ps5'].includes(table) || typeof duration_h !== 'number' || typeof amount !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const tableName = table === 'pc' ? 'pc_duration_prices' : 'ps5_duration_prices';
  const admin = createAdminClient();
  const { error } = await admin
    .from(tableName)
    .update({ amount })
    .eq('duration_h', duration_h);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
