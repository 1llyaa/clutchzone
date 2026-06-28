import { createAdminClient } from '@/lib/supabase/admin';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Pricing from '@/components/sections/Pricing';
import Stream from '@/components/sections/Stream';
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

async function fetchStationAvailability() {
  const admin = createAdminClient();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  const [stationsRes, bookingsRes] = await Promise.all([
    admin.from('stations').select('id').eq('is_active', true),
    admin
      .from('bookings')
      .select('station_id')
      .eq('date', today)
      .neq('status', 'cancelled')
      .lte('start_time', currentTime)
      .gt('end_time', currentTime),
  ]);

  const total = stationsRes.data?.length ?? 0;
  const occupied = new Set((bookingsRes.data ?? []).map((b) => b.station_id)).size;
  return { total, free: total - occupied };
}

async function fetchSiteSettings() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('site_settings')
    .select('key, value')
    .in('key', ['hero_image', 'stream_url', 'stream_visible']);
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, string>;
}

async function fetchPricing() {
  const admin = createAdminClient();
  const [pc, ps5, tiers] = await Promise.all([
    admin.from('pc_duration_prices').select('duration_h, amount').order('duration_h'),
    admin.from('ps5_duration_prices').select('duration_h, amount').order('duration_h'),
    admin.from('pricing_tiers').select('tier, amount').in('tier', ['happy_hour', 'evening_pass', 'weekend_pass']),
  ]);
  return {
    pcPrices:       pc.data ?? [],
    ps5Prices:      ps5.data ?? [],
    packageAmounts: Object.fromEntries((tiers.data ?? []).map((t) => [t.tier, t.amount])) as Record<string, number>,
  };
}

export default async function HomePage() {
  const [tournaments, gallery, games, pricing, siteSettings, availability] = await Promise.all([
    fetchTournaments(),
    fetchGallery(),
    fetchGames(),
    fetchPricing(),
    fetchSiteSettings(),
    fetchStationAvailability(),
  ]);

  return (
    <>
      <Navbar />
      <main>
        <Hero heroImage={siteSettings.hero_image} stationsFree={availability.free} stationsTotal={availability.total} />
        <Features />
        <Games games={games} />
        <Pricing pcPrices={pricing.pcPrices} ps5Prices={pricing.ps5Prices} packageAmounts={pricing.packageAmounts} />
        {siteSettings.stream_visible === 'true' && siteSettings.stream_url && (
          <Stream streamUrl={siteSettings.stream_url} />
        )}
        <Tournaments tournaments={tournaments} />
        <Gallery images={gallery.images} displayType={gallery.displayType} />
        <Contact />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
