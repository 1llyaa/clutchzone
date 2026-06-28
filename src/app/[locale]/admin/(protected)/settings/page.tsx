import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

async function fetchData() {
  const admin = createAdminClient();

  const [profiles, stations, settings] = await Promise.all([
    admin.from('profiles').select('id, email, display_name, role, created_at').order('created_at'),
    admin.from('stations').select('id, label, type, is_active').order('label'),
    admin.from('site_settings').select('key, value'),
  ]);

  return {
    profiles: profiles.data ?? [],
    stations: stations.data ?? [],
    siteSettings: Object.fromEntries((settings.data ?? []).map((r) => [r.key, r.value])) as Record<string, string>,
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

  const { profiles, stations, siteSettings } = await fetchData();
  return <SettingsClient profiles={profiles} stations={stations} currentUserId={me.id} siteSettings={siteSettings} />;
}
