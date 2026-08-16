import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { stationType, hours, amount } = body;
  if (
    !['pc', 'ps5'].includes(stationType) ||
    !Number.isInteger(hours) || hours <= 0 ||
    !Number.isInteger(amount) || amount <= 0
  ) {
    return NextResponse.json({ error: 'Neplatné údaje' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('hour_tiers')
    .select('sort_order')
    .eq('station_type', stationType)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextSortOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { data, error } = await admin
    .from('hour_tiers')
    .insert({ station_type: stationType, hours, amount, sort_order: nextSortOrder })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: `Cenovka ${hours}h pro ${stationType.toUpperCase()} už existuje` }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag('pricing');
  return NextResponse.json(data);
}
