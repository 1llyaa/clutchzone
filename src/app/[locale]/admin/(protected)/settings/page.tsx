import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

async function fetchData() {
  const admin = createAdminClient();

  const [profiles, stations] = await Promise.all([
    admin.from('profiles').select('id, email, display_name, role, created_at').order('created_at'),
    admin.from('stations').select('id, label, type, is_active').order('label'),
  ]);

  return {
    profiles: profiles.data ?? [],
    stations: stations.data ?? [],
  };
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const me = await requireAdmin();

  if (!me || me.role !== 'owner') {
    redirect(`/${locale}/admin`);
  }

  const { profiles, stations } = await fetchData();
  return <SettingsClient profiles={profiles} stations={stations} currentUserId={me.id} />;
}
