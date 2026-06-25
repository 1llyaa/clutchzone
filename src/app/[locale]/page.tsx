import { createAdminClient } from '@/lib/supabase/admin';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Pricing from '@/components/sections/Pricing';
import Tournaments from '@/components/sections/Tournaments';
import Games from '@/components/sections/Games';
import Gallery from '@/components/sections/Gallery';
import Contact from '@/components/sections/Contact';
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

async function fetchGallery() {
  const admin = createAdminClient();
  const [imagesRes, configRes] = await Promise.all([
    admin.from('gallery_images').select('id, url, caption, sort_order').eq('is_active', true).order('sort_order').order('created_at'),
    admin.from('gallery_config').select('display_type').single(),
  ]);
  return {
    images:      imagesRes.data ?? [],
    displayType: configRes.data?.display_type ?? 'masonry',
  };
}

async function fetchGames() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('games')
    .select('id, title, genre, description, platform, cover_url')
    .eq('is_active', true)
    .order('sort_order')
    .order('created_at');
  return data ?? [];
}

export default async function HomePage() {
  const [tournaments, gallery, games] = await Promise.all([
    fetchTournaments(),
    fetchGallery(),
    fetchGames(),
  ]);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Games games={games} />
        <Pricing />
        <Tournaments tournaments={tournaments} />
        <Gallery images={gallery.images} displayType={gallery.displayType} />
        <Contact />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
