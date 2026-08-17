import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const TIME_RE = /^\d{2}:\d{2}$/;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function validatePassBody(body: Record<string, unknown>): string | null {
  if (!body.nameCs || !body.nameEn || !body.descriptionCs || !body.descriptionEn) {
    return 'Název i popis jsou povinné v obou jazycích (CS/EN)';
  }
  if (!['pc', 'ps5', 'any'].includes(body.stationType as string)) return 'Neplatný typ stanice';
  if (!['per_hour', 'flat'].includes(body.priceMode as string)) return 'Neplatný režim ceny';
  if (!Number.isInteger(body.amount) || (body.amount as number) <= 0) return 'Neplatná částka';
  if (!Array.isArray(body.daysOfWeek) || !body.daysOfWeek.length || body.daysOfWeek.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
    return 'Vyber aspoň jeden den';
  }
  if (!TIME_RE.test(body.windowStart as string) || !TIME_RE.test(body.windowEnd as string)) return 'Neplatné časové okno';
  if (typeof body.crossesMidnight !== 'boolean') return 'Neplatná hodnota přesahu půlnoci';
  if (body.maxHours != null && (!Number.isInteger(body.maxHours) || (body.maxHours as number) <= 0)) return 'Neplatný max. počet hodin';
  return null;
}

export async function POST(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const err = validatePassBody(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const admin = createAdminClient();
  const { data: existing } = await admin.from('time_passes').select('sort_order').order('sort_order', { ascending: false }).limit(1);
  const nextSortOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const baseSlug = slugify(body.nameCs) || 'pas';
  let slug = baseSlug;
  for (let i = 2; ; i++) {
    const { count } = await admin.from('time_passes').select('id', { count: 'exact', head: true }).eq('slug', slug);
    if (!count) break;
    slug = `${baseSlug}-${i}`;
  }

  const { data, error } = await admin
    .from('time_passes')
    .insert({
      slug,
      name_cs: body.nameCs,
      name_en: body.nameEn,
      description_cs: body.descriptionCs,
      description_en: body.descriptionEn,
      station_type: body.stationType,
      price_mode: body.priceMode,
      amount: body.amount,
      days_of_week: body.daysOfWeek,
      window_start: body.windowStart,
      window_end: body.windowEnd,
      crosses_midnight: body.crossesMidnight,
      max_hours: body.maxHours ?? null,
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag('pricing');
  return NextResponse.json(data);
}
