import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('site_settings')
    .select('key, value');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { key, value } = body;

  if (!key || typeof value !== 'string') {
    return NextResponse.json({ error: 'key and value required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
