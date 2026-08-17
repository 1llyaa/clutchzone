import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const TIME_RE = /^\d{2}:\d{2}$/;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ day: string }> }
) {
  const profile = await requireAdmin();
  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const day = Number((await params).day);
  if (!Number.isInteger(day) || day < 0 || day > 6) {
    return NextResponse.json({ error: 'Neplatný den' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.isClosed !== 'boolean') {
    return NextResponse.json({ error: 'Neplatná hodnota' }, { status: 400 });
  }

  let patch: Record<string, unknown>;
  if (body.isClosed) {
    patch = { is_closed: true, open_time: null, close_time: null, crosses_midnight: false };
  } else {
    if (!TIME_RE.test(body.openTime) || !TIME_RE.test(body.closeTime)) {
      return NextResponse.json({ error: 'Vyplň otevírací i zavírací čas' }, { status: 400 });
    }
    patch = {
      is_closed: false,
      open_time: body.openTime,
      close_time: body.closeTime,
      crosses_midnight: !!body.crossesMidnight,
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from('opening_hours').update(patch).eq('day_of_week', day).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag('pricing');
  return NextResponse.json(data);
}
