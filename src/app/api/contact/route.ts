import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkLimit, clientKey } from '@/lib/rate-limit';

const schema = z.object({
  name:    z.string().min(1).max(100),
  email:   z.string().email(),
  message: z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  if (!checkLimit('contact', clientKey(request), 3, 10 * 60_000)) {
    return NextResponse.json({ error: 'Příliš mnoho požadavků' }, { status: 429 });
  }


  const admin = createAdminClient();
  const { error } = await admin.from('contact_messages').insert({
    name:    parsed.data.name,
    email:   parsed.data.email,
    message: parsed.data.message,
  });

  if (error) {
    // Detail to the log, not to the caller: PostgREST messages name tables,
    // columns and constraints, which is a free schema map for an anonymous one.
    console.error('Contact message insert failed:', error);
    return NextResponse.json({ error: 'Zprávu se nepodařilo odeslat' }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
