import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { lookupUser } from '@/lib/ggleap/client';

/**
 * Staff-only ggLeap lookup. Unlike the public endpoint this returns the account
 * status and lock flag too, and is not rate limited — it is called on demand
 * from a per-row button, never on page load.
 */
export async function GET(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const username = new URL(request.url).searchParams.get('username')?.trim() ?? '';
  if (username.length < 2) {
    return NextResponse.json({ error: 'Chybí přezdívka' }, { status: 400 });
  }

  const lookup = await lookupUser(username);
  if (lookup.status !== 'ok') return NextResponse.json({ status: lookup.status });

  return NextResponse.json({
    status: 'ok',
    username: lookup.user.username,
    minutes: lookup.user.minutes,
    locked: lookup.user.locked,
    accountStatus: lookup.user.accountStatus,
  });
}
