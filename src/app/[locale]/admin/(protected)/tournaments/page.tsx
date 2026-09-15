import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import TournamentsClient from './TournamentsClient';

async function fetchTournaments() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('tournaments')
    .select('id, title, game, date, format, prize_pool, max_slots, filled_slots, registration_deadline, is_active, description')
    .order('date', { ascending: false });
  return data ?? [];
}

export default async function TournamentsPage() {
  // Checked here as well as in layout.tsx: a layout is not a security
  // boundary — Next renders pages and layouts independently, so a page that
  // relies on its layout alone can be reached on its own.
  const profile = await requireAdmin();
  if (!profile) redirect(`/${await getLocale()}/admin/login`);

  const tournaments = await fetchTournaments();
  return <TournamentsClient tournaments={tournaments} />;
}
