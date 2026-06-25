import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('games')
    .select('*')
    .order('sort_order')
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { title, genre, description, platform, cover_url, storage_path } = body;
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const admin = createAdminClient();

  const { data: maxRow } = await admin
    .from('games')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const sort_order = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await admin
    .from('games')
    .insert({ title, genre: genre || null, description: description || null, platform: platform || 'pc', cover_url: cover_url || null, storage_path: storage_path || null, sort_order })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
