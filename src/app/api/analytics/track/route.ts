import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

const TrackSchema = z.object({
  event: z.enum(ANALYTICS_EVENTS),
  properties: z.record(z.string(), z.unknown()).default({}),
  sessionId: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = TrackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }
  const { event, properties, sessionId } = parsed.data;

  const admin = createAdminClient();
  const { error: insertError } = await admin.from('analytics_events').insert({
    event_name: event,
    properties,
    session_id: sessionId ?? null,
  });
  if (insertError) {
    // Never fail the request over analytics — just log for debugging.
    console.error('analytics_events insert failed:', insertError.message);
  }

  return NextResponse.json({ ok: true });
}
