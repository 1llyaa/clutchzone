import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSafeExternalUrl, storageHosts } from '@/lib/validation/url';

export async function GET() {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('sponsors')
    .select('*')
    .order('sort_order')
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sponsors: data ?? [] });
}

export async function POST(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, storage_path, name, website_url } = await request.json();
  if (!url || !storage_path) {
    return NextResponse.json({ error: 'url and storage_path required' }, { status: 400 });
  }

  const hosts = storageHosts();
  if (!isSafeExternalUrl(url, hosts.length ? { allowHosts: hosts } : undefined)) {
    return NextResponse.json({ error: 'Invalid logo URL' }, { status: 400 });
  }
  if (website_url && !isSafeExternalUrl(website_url)) {
    return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: maxRow } = await admin
    .from('sponsors')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await admin
    .from('sponsors')
    .insert({
      url,
      storage_path,
      name: name || null,
      website_url: website_url || null,
      sort_order,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
