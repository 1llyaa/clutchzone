import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const TIME_RE = /^\d{2}:\d{2}$/;
const FIELD_MAP: Record<string, string> = {
  nameCs: 'name_cs',
  nameEn: 'name_en',
  descriptionCs: 'description_cs',
  descriptionEn: 'description_en',
  stationType: 'station_type',
  priceMode: 'price_mode',
  amount: 'amount',
  daysOfWeek: 'days_of_week',
  windowStart: 'window_start',
  windowEnd: 'window_end',
  crossesMidnight: 'crosses_midnight',
  maxHours: 'max_hours',
  isActive: 'is_active',
};

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

  if (body.stationType !== undefined && !['pc', 'ps5', 'any'].includes(body.stationType)) {
    return NextResponse.json({ error: 'Neplatný typ stanice' }, { status: 400 });
  }
  if (body.priceMode !== undefined && !['per_hour', 'flat'].includes(body.priceMode)) {
    return NextResponse.json({ error: 'Neplatný režim ceny' }, { status: 400 });
  }
  if (body.amount !== undefined && (!Number.isInteger(body.amount) || body.amount <= 0)) {
    return NextResponse.json({ error: 'Neplatná částka' }, { status: 400 });
  }
  if (body.daysOfWeek !== undefined && (!Array.isArray(body.daysOfWeek) || !body.daysOfWeek.length || body.daysOfWeek.some((d: unknown) => !Number.isInteger(d) || (d as number) < 0 || (d as number) > 6))) {
    return NextResponse.json({ error: 'Vyber aspoň jeden den' }, { status: 400 });
  }
  if (body.windowStart !== undefined && !TIME_RE.test(body.windowStart)) {
    return NextResponse.json({ error: 'Neplatný začátek okna' }, { status: 400 });
  }
  if (body.windowEnd !== undefined && !TIME_RE.test(body.windowEnd)) {
    return NextResponse.json({ error: 'Neplatný konec okna' }, { status: 400 });
  }
  for (const key of ['nameCs', 'nameEn', 'descriptionCs', 'descriptionEn'] as const) {
    if (body[key] !== undefined && !String(body[key]).trim()) {
      return NextResponse.json({ error: 'Název i popis jsou povinné v obou jazycích (CS/EN)' }, { status: 400 });
    }
  }

  const patch: Record<string, unknown> = {};
  for (const [camel, snake] of Object.entries(FIELD_MAP)) {
    if (body[camel] !== undefined) patch[snake] = body[camel];
  }
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'Nic k uložení' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from('time_passes').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag('pricing');
  return NextResponse.json(data);
}
