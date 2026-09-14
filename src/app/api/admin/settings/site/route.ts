import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { toMapView } from '@/lib/maps/view';

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

  const ALLOWED_KEYS = [
    'hero_image', 'stream_url', 'stream_visible', 'pay_now_coins_amount',
    'private_events_image', 'map_embed_url', 'map_visible',
  ];
  if (!key || !ALLOWED_KEYS.includes(key) || typeof value !== 'string' || value.length > 2000) {
    return NextResponse.json({ error: 'Invalid key or value' }, { status: 400 });
  }

  // Validated here and not only in the client: the map centre is read back
  // out of this row on every homepage render, and a value nothing can parse
  // would silently hide the section with no clue why. An empty value clears
  // the map deliberately.
  if (key === 'map_embed_url' && value.trim() && !toMapView(value)) {
    return NextResponse.json(
      { error: 'Nepodařilo se z odkazu přečíst souřadnice' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
