import { createAdminClient } from '@/lib/supabase/admin';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Pricing from '@/components/sections/Pricing';
import Tournaments from '@/components/sections/Tournaments';
import CtaBand from '@/components/sections/CtaBand';

async function fetchTournaments() {
  const admin = createAdminClient();
  const today = new Date().toISOString().split('T')[0];
  const { data } = await admin
    .from('tournaments')
    .select('id, title, game, date, prize_pool, max_slots, filled_slots')
    .eq('is_active', true)
    .gte('date', today)
    .order('date')
    .limit(5);
  return data ?? [];
}

export default async function HomePage() {
  const tournaments = await fetchTournaments();

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Tournaments tournaments={tournaments} />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
