import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Releases a whole block group. Blocking four PCs is four rows sharing one
 * block_group_id, and they are released the same way they were created — as
 * one unit. There is no per-row release and no soft delete: a block carries no
 * money and no customer, so there is nothing to keep for history.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { groupId } = await params;

  const admin = createAdminClient();
  const { error } = await admin.from('station_blocks').delete().eq('block_group_id', groupId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
