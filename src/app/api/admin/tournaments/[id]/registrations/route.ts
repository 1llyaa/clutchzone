import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('tournament_registrations')
    .select('id, team_name, captain_name, captain_email, captain_discord, player_names, status, created_at')
    .eq('tournament_id', id)
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { registrationId, status } = await request.json();
  if (!registrationId || !status) {
    return NextResponse.json({ error: 'registrationId and status required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('tournament_registrations')
    .update({ status })
    .eq('id', registrationId)
    .eq('tournament_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { registrationId } = await request.json();
  if (!registrationId) {
    return NextResponse.json({ error: 'registrationId required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Remove the registration
  const { error } = await admin
    .from('tournament_registrations')
    .delete()
    .eq('id', registrationId)
    .eq('tournament_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Decrement filled_slots without going below 0
  const { data: t } = await admin.from('tournaments').select('filled_slots').eq('id', id).single();
  if (t && t.filled_slots > 0) {
    await admin.from('tournaments').update({ filled_slots: t.filled_slots - 1 }).eq('id', id);
  }

  return NextResponse.json({ ok: true });
}
