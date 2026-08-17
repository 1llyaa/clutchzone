import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireAdmin();
  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const admin = createAdminClient();

  const patch: Record<string, unknown> = {};
  if (body.hours !== undefined) {
    if (!Number.isInteger(body.hours) || body.hours <= 0) {
      return NextResponse.json({ error: 'Neplatný počet hodin' }, { status: 400 });
    }
    patch.hours = body.hours;
  }
  if (body.amount !== undefined) {
    if (!Number.isInteger(body.amount) || body.amount <= 0) {
      return NextResponse.json({ error: 'Neplatná cena' }, { status: 400 });
    }
    patch.amount = body.amount;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ error: 'Neplatná hodnota' }, { status: 400 });
    }
    if (body.isActive === false) {
      const { data: current } = await admin.from('hour_tiers').select('station_type').eq('id', id).single();
      if (current) {
        const { count } = await admin
          .from('hour_tiers')
          .select('id', { count: 'exact', head: true })
          .eq('station_type', current.station_type)
          .eq('is_active', true)
          .neq('id', id);
        if (!count) {
          return NextResponse.json(
            { error: `Musí zůstat aspoň jedna aktivní cenovka pro ${current.station_type.toUpperCase()}` },
            { status: 400 },
          );
        }
      }
    }
    patch.is_active = body.isActive;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'Nic k uložení' }, { status: 400 });
  }

  const { data, error } = await admin.from('hour_tiers').update(patch).eq('id', id).select().single();
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Cenovka s tímto počtem hodin už existuje' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag('pricing');
  return NextResponse.json(data);
}
