import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { email, locale } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const safeLocale = ['cs', 'en'].includes(locale) ? locale : 'cs';
  const admin = createAdminClient();

  // Send Supabase Auth invite email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/${safeLocale}/admin/accept-invite`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Explicit, because migration 027 removes the trigger that used to create
  // this row for every auth user. Granting staff is now a deliberate act by an
  // owner rather than a side effect of existing. Upsert so this is safe to
  // deploy both before and after that migration lands.
  if (data.user) {
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({ id: data.user.id, email, role: 'staff' }, { onConflict: 'id' });
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: data.user?.id }, { status: 201 });
}
