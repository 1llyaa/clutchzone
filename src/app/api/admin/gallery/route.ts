import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const [imagesRes, configRes] = await Promise.all([
    admin.from('gallery_images').select('*').order('sort_order').order('created_at'),
    admin.from('gallery_config').select('*').single(),
  ]);

  return NextResponse.json({
    images: imagesRes.data ?? [],
    config: configRes.data ?? { display_type: 'masonry' },
  });
}

export async function POST(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, storage_path, caption } = await request.json();
  if (!url || !storage_path) return NextResponse.json({ error: 'url and storage_path required' }, { status: 400 });

  const admin = createAdminClient();
  const { data: maxRow } = await admin
    .from('gallery_images')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const sort_order = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await admin
    .from('gallery_images')
    .insert({ url, storage_path, caption: caption || null, sort_order })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { display_type } = await request.json();
  if (!['carousel', 'masonry', 'mosaic'].includes(display_type)) {
    return NextResponse.json({ error: 'Invalid display_type' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('gallery_config')
    .update({ display_type })
    .eq('id', 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
