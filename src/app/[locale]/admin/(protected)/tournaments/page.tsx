import { createAdminClient } from '@/lib/supabase/admin';
import TournamentsClient from './TournamentsClient';

async function fetchTournaments() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('tournaments')
    .select('id, title, game, date, format, prize_pool, max_slots, filled_slots, registration_deadline, is_active')
    .order('date', { ascending: false });
  return data ?? [];
}

export default async function TournamentsPage() {
  const tournaments = await fetchTournaments();
  return <TournamentsClient tournaments={tournaments} />;
}
