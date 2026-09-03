import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendTournamentRegistrationNotification, sendTournamentRegistrationReceived } from '@/lib/email';

const schema = z.object({
  team_name:       z.string().min(1).max(100),
  captain_name:    z.string().min(1).max(100),
  captain_email:   z.string().email(),
  captain_discord: z.string().max(100).optional(),
  player_names:    z.array(z.string().max(100)).optional(),
  // Language the captain registered in — the "registration received" mail goes
  // back in it. Not persisted, so the later confirmation mail falls back to cs.
  locale:          z.enum(['cs', 'en', 'de', 'ua']).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: tournament, error: tErr } = await admin
    .from('tournaments')
    .select('id, title, date, is_active, max_slots, filled_slots, registration_deadline')
    .eq('id', id)
    .single();

  if (tErr || !tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  if (!tournament.is_active) {
    return NextResponse.json({ error: 'Tournament is not active' }, { status: 409 });
  }

  if (tournament.filled_slots >= tournament.max_slots) {
    return NextResponse.json({ error: 'full' }, { status: 409 });
  }

  if (tournament.registration_deadline) {
    const deadline = new Date(tournament.registration_deadline);
    deadline.setHours(23, 59, 59, 999);
    if (new Date() > deadline) {
      return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 409 });
    }
  }

  // Atomically claim a slot using optimistic locking: only succeeds if filled_slots
  // hasn't changed since we read it, preventing double-registration under concurrency.
  const { data: claimed } = await admin
    .from('tournaments')
    .update({ filled_slots: tournament.filled_slots + 1 })
    .eq('id', id)
    .eq('filled_slots', tournament.filled_slots)
    .select('id')
    .maybeSingle();

  if (!claimed) {
    return NextResponse.json({ error: 'full' }, { status: 409 });
  }

  const { error: insErr } = await admin.from('tournament_registrations').insert({
    tournament_id:   id,
    team_name:       parsed.data.team_name,
    captain_name:    parsed.data.captain_name,
    captain_email:   parsed.data.captain_email,
    captain_discord: parsed.data.captain_discord ?? null,
    player_names:    parsed.data.player_names ?? [],
    status:          'pending',
  });

  if (insErr) {
    // Roll back the slot claim
    await admin
      .from('tournaments')
      .update({ filled_slots: tournament.filled_slots })
      .eq('id', id)
      .eq('filled_slots', tournament.filled_slots + 1);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  const tournamentEmailData = {
    tournamentTitle: tournament.title,
    tournamentDate: tournament.date,
    teamName: parsed.data.team_name,
    captainName: parsed.data.captain_name,
    captainEmail: parsed.data.captain_email,
    captainDiscord: parsed.data.captain_discord,
    locale: parsed.data.locale,
  };
  sendTournamentRegistrationNotification(tournamentEmailData).catch(() => {});
  sendTournamentRegistrationReceived(tournamentEmailData).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}
