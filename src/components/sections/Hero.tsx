'use client';

import { useTranslations } from 'next-intl';
import { useReservation } from '@/components/reservation/ReservationContext';

interface Props {
  heroImage?: string;
  stationsFree?: number;
  stationsTotal?: number;
}

export default function Hero({ heroImage, stationsFree, stationsTotal }: Props) {
  const t = useTranslations('hero');
  const { open } = useReservation();

  return (
    <section className="relative bg-cz-black overflow-hidden" style={{ minHeight: '100svh' }}>
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 90% 80% at 70% 35%, #000 30%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 70% 35%, #000 30%, transparent 85%)',
        }}
      />
      {/* Orange glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-12%', right: '-6%',
          width: 760, height: 760,
          background: 'radial-gradient(circle, rgba(232,74,26,0.15), transparent 62%)',
        }}
      />
      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{ height: 200, background: 'linear-gradient(transparent, #0A0A0A)' }}
      />

      {/* Content */}
      <div
        className="relative z-10 grid items-center mx-auto px-6 py-20 pb-28 md:px-16 md:py-[72px] md:pb-[120px] lg:grid-cols-[1.15fr_0.85fr]"
        style={{ gap: 48, maxWidth: 1440 }}
      >
        {/* Left */}
        <div>
          <div className="flex items-center mb-6 md:mb-7" style={{ gap: 12 }}>
            <span className="inline-block bg-cz-orange" style={{ width: 40, height: 1.5 }} />
            <span className="font-mono text-cz-orange uppercase" style={{ fontSize: 12, letterSpacing: 4 }}>
              {t('eyebrow')}
            </span>
          </div>

          <h1
            className="font-display text-white uppercase"
            style={{ fontSize: 'clamp(44px, 7.2vw, 104px)', lineHeight: 0.92, letterSpacing: 2 }}
          >
            {t('h1Line1')}
            <br />
            {t('h1Line2')}
            <br />
            <span className="relative inline-block">
              {t('h1Line3')}
              <span className="absolute left-0 bg-cz-orange" style={{ bottom: 6, width: '100%', height: 5 }} />
            </span>
          </h1>

          <p
            className="font-body text-cz-white-soft"
            style={{ fontWeight: 300, fontSize: 'clamp(15px, 2vw, 19px)', lineHeight: 1.7, maxWidth: 480, marginTop: 28 }}
          >
            {t('subhead')}
          </p>

          <div className="flex flex-wrap gap-4" style={{ marginTop: 36 }}>
            <button
              onClick={open}
              className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark active:scale-[0.96] transition-[background-color,scale] duration-150 ease-out rounded-[2px] border-none cursor-pointer"
              style={{ fontSize: 'clamp(15px, 2vw, 19px)', letterSpacing: 2, padding: 'clamp(12px, 2vw, 16px) clamp(24px, 4vw, 40px)' }}
            >
              {t('ctaPrimary')}
            </button>
            <button
              className="bg-transparent text-white font-display uppercase hover:text-cz-orange hover:border-cz-orange active:scale-[0.96] transition-[color,border-color,scale] duration-150 ease-out rounded-[2px] cursor-pointer"
              style={{ fontSize: 'clamp(15px, 2vw, 19px)', letterSpacing: 2, padding: 'clamp(11px, 2vw, 15px) clamp(24px, 4vw, 40px)', border: '1.5px solid #2A2A2A' }}
            >
              {t('ctaSecondary')}
            </button>
          </div>

          <div
            className="flex flex-wrap gap-8 md:gap-12"
            style={{ marginTop: 48, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            {[
              { value: t('stat1Value'), label: t('stat1Label') },
              { value: t('stat2Value'), label: t('stat2Label') },
              { value: t('stat3Value'), label: t('stat3Label') },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-white" style={{ fontSize: 'clamp(32px, 4vw, 44px)', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 11, letterSpacing: 2, marginTop: 6 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — character graphic (desktop only) */}
        <div className="relative hidden lg:flex items-center justify-center" style={{ minHeight: 520 }}>
          {/* Corner accents */}
          <span className="absolute" style={{ top: 0, left: '8%', width: 40, height: 40, borderTop: '1.5px solid #E84A1A', borderLeft: '1.5px solid #E84A1A' }} />
          <span className="absolute" style={{ bottom: 0, right: '8%', width: 40, height: 40, borderBottom: '1.5px solid #E84A1A', borderRight: '1.5px solid #E84A1A' }} />

          {/* Glow behind character */}
          <div
            className="absolute animate-hero-glow-pulse"
            style={{
              width: 420, height: 420,
              background: 'radial-gradient(circle, rgba(232,74,26,0.2) 0%, rgba(232,74,26,0.05) 50%, transparent 70%)',
              borderRadius: '50%',
            }}
          />

          {/* Character */}
          <div className="relative animate-hero-char" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <div className="animate-hero-float">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage || '/terrorist_cs2.png'}
                alt="Hero Character"
                width={420}
                height={560}
                style={{
                  objectFit: 'contain',
                  maxHeight: 560,
                  width: 'auto',
                  filter: 'drop-shadow(0 0 40px rgba(232,74,26,0.3)) drop-shadow(0 20px 60px rgba(0,0,0,0.6))',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Status badge */}
          {stationsFree != null && stationsTotal != null && (
            <div
              className="absolute flex items-center bg-cz-black-mid rounded-[2px]"
              style={{ bottom: '6%', left: 0, border: '1px solid #2A2A2A', padding: '12px 16px', gap: 10 }}
            >
              <span
                className="rounded-full animate-flicker flex-shrink-0"
                style={{ width: 8, height: 8, background: stationsFree > 0 ? '#22c55e' : '#ef4444' }}
              />
              <span className="font-mono text-cz-white-soft uppercase tabular-nums" style={{ fontSize: 11, letterSpacing: 1.5 }}>
                {stationsFree} / {stationsTotal} {t('stationsFree')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator — hide on mobile */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-3" style={{ bottom: 36 }}>
        <span className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 3 }}>{t('scroll')}</span>
        <span className="bg-cz-orange animate-scroll-pulse" style={{ width: 1.5, height: 48, display: 'block' }} />
      </div>
    </section>
  );
}
