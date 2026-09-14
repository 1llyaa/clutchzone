import { createAdminClient } from '@/lib/supabase/admin';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import PriceCalculator from '@/components/pricing/PriceCalculator';
import { getPricingConfig } from '@/lib/pricing/config-server';
import { minEffectiveHourly } from '@/lib/pricing/engine';
import { occupiedStationIds } from '@/lib/bookings/occupancy';
import Stream from '@/components/sections/Stream';
import Tournaments from '@/components/sections/Tournaments';
import Games from '@/components/sections/Games';
import Gallery from '@/components/sections/Gallery';
import PrivateEvents from '@/components/sections/PrivateEvents';
import Contact from '@/components/sections/Contact';
import Sponsors from '@/components/sections/Sponsors';
import CtaBand from '@/components/sections/CtaBand';
import MapSection from '@/components/sections/MapSection';

// Always render fresh — prices, tournaments, and the station counter
// come from the DB and must not be frozen at build time.
export const dynamic = 'force-dynamic';

async function fetchTournaments() {
  const admin = createAdminClient();
  const today = new Date().toISOString().split('T')[0];
  const { data } = await admin
    .from('tournaments')
    .select('id, title, game, date, prize_pool, max_slots, filled_slots, description')
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

  // This used to filter on `end_time`, a column migration 003 dropped in
  // favour of duration_minutes. PostgREST rejected the whole query, `data`
  // came back null, `occupied` was therefore always 0, and the hero counter
  // claimed every station was free no matter how full the club was.
  //
  // It also mixed zones: a UTC calendar date against the server's local
  // clock. The club is in Europe/Prague and bookings are stored as a naive
  // local date + time, so both halves have to be resolved there.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';

  const today = `${get('year')}-${get('month')}-${get('day')}`;
  const nowMinutes = Number(get('hour')) * 60 + Number(get('minute'));

  const { data: stations } = await admin
    .from('stations')
    .select('id')
    .eq('is_active', true);

  const stationIds = (stations ?? []).map((s) => s.id);
  if (!stationIds.length) return { total: 0, free: 0 };

  // A one-minute window: the hero says what is busy *right now*, not what is
  // booked at some point today. Going through the shared helper also means an
  // admin block counts as occupied here, the same as everywhere else.
  const occupied = await occupiedStationIds(admin, {
    date: today,
    stationIds,
    startMinutes: nowMinutes,
    endMinutes: nowMinutes + 1,
  });

  return { total: stationIds.length, free: stationIds.length - occupied.size };
}

async function fetchSponsors() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('sponsors')
    .select('id, url, name, website_url')
    .eq('is_active', true)
    .order('sort_order')
    .order('created_at');
  return data ?? [];
}

async function fetchSiteSettings() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('site_settings')
    .select('key, value')
    .in('key', [
      'hero_image', 'stream_url', 'stream_visible', 'private_events_image',
      'map_embed_url', 'map_visible',
    ]);
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, string>;
}

export default async function HomePage() {
  const [tournaments, gallery, games, pricingConfig, siteSettings, availability, sponsors] =
    await Promise.all([
      fetchTournaments(),
      fetchGallery(),
      fetchGames(),
      getPricingConfig(),
      fetchSiteSettings(),
      fetchStationAvailability(),
      fetchSponsors(),
    ]);

  // The hero stat is labelled "od / hodina", so it has to be the cheapest
  // hour we sell, not the 1h PC tier — that tier is the most expensive rate
  // on the ceník, which made the "od" claim read backwards.
  const fromHourPrice = minEffectiveHourly(pricingConfig);

  return (
    <>
      <Navbar />
      <main>
        <Hero
          heroImage={siteSettings.hero_image}
          stationsFree={availability.free}
          stationsTotal={availability.total}
          fromHourPrice={fromHourPrice}
        />
        <Features />
        <Games games={games} />
        <PriceCalculator config={pricingConfig} />
        {siteSettings.stream_visible === 'true' && siteSettings.stream_url && (
          <Stream streamUrl={siteSettings.stream_url} />
        )}
        <Tournaments tournaments={tournaments} />
        <Gallery images={gallery.images} displayType={gallery.displayType} />
        <PrivateEvents image={siteSettings.private_events_image} />
        <Contact />
        <Sponsors sponsors={sponsors} />
        <CtaBand />
        {/* Last inside <main> so the map band sits directly above the footer.
            `map_embed_url` is a historical key name: it now holds a pasted
            Google Maps link that the coordinates are read out of, not an
            iframe URL. Renaming it would cost a migration for no behaviour. */}
        <MapSection
          location={siteSettings.map_embed_url ?? ''}
          visible={siteSettings.map_visible === 'true'}
        />
      </main>
      <Footer />
    </>
  );
}
