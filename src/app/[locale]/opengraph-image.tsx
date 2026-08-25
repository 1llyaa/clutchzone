import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const alt = 'Clutch Zone — Esport Club České Budějovice';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clutchzone.club';
const TAGLINE = 'ESPORT CLUB · ČESKÉ BUDĚJOVICE';

async function loadGoogleFont(family: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
  if (match) {
    const res = await fetch(match[1]);
    if (res.ok) return res.arrayBuffer();
  }
  return null;
}

async function getHeroImageUrl() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('site_settings')
      .select('value')
      .eq('key', 'hero_image')
      .single();
    if (data?.value) return data.value as string;
  } catch {
    // fall through to gallery fallback
  }
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('gallery_images')
      .select('url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .single();
    if (data?.url) return data.url as string;
  } catch {
    // fall through to bundled fallback
  }
  return `${SITE_URL}/terrorist_cs2.png`;
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hero' });
  const headline = `${t('h1Line1')} ${t('h1Line2')} ${t('h1Line3')}`;

  const [heroImageUrl, bebas, mono] = await Promise.all([
    getHeroImageUrl(),
    loadGoogleFont('Bebas+Neue', 400, `CLUTCH ZONE${headline}`),
    loadGoogleFont('Space+Mono', 700, TAGLINE),
  ]);

  const fonts = [
    bebas && { name: 'Bebas Neue', data: bebas, style: 'normal' as const, weight: 400 as const },
    mono && { name: 'Space Mono', data: mono, style: 'normal' as const, weight: 700 as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; style: 'normal'; weight: 400 | 700 }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0A0A0A',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -140,
            right: -100,
            width: 640,
            height: 640,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,74,26,0.35), transparent 65%)',
            display: 'flex',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 72px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 680 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 14,
                  background: '#0A0A0A',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 18,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: '#E8E5DC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: '#141414',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#E84A1A',
                      }}
                    />
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontFamily: 'Bebas Neue',
                  fontSize: 40,
                  color: '#fff',
                  letterSpacing: 2,
                }}
              >
                CLUTCH ZONE
              </span>
            </div>

            <span
              style={{
                fontFamily: 'Space Mono',
                fontSize: 18,
                color: '#E84A1A',
                letterSpacing: 4,
                marginBottom: 32,
              }}
            >
              {TAGLINE}
            </span>

            <span
              style={{
                fontFamily: 'Bebas Neue',
                fontSize: 68,
                color: '#fff',
                lineHeight: 1,
                letterSpacing: 1,
              }}
            >
              {headline}
            </span>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImageUrl}
            width={440}
            height={588}
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
