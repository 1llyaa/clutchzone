'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { useReservation } from '@/components/reservation/ReservationContext';

interface Props {
  heroImage?: string;
  stationsFree?: number;
  stationsTotal?: number;
  fromHourPrice?: number | null;
}

export default function Hero({ heroImage, stationsFree, stationsTotal, fromHourPrice }: Props) {
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
        className="relative z-10 grid items-center mx-auto max-w-[1440px] px-6 py-16 md:px-16 md:py-[120px] lg:grid-cols-[1.15fr_0.85fr]"
        style={{ gap: 48 }}
      >
        {/* Left */}
        <div>
          <div className="flex items-center mb-6 md:mb-7" style={{ gap: 12 }}>
            <span className="inline-block bg-cz-orange" style={{ width: 40, height: 1.5 }} />
            <span className="font-mono text-cz-orange uppercase" style={{ fontSize: 16, letterSpacing: 4 }}>
              {t('eyebrow')}
            </span>
          </div>

          {/* The three <br>-separated lines are the intended composition, so no
              line may wrap inside itself: without `nowrap` the browser takes the
              hyphen in "E-SPORTOVÁ" as a break opportunity and splits it. That
              makes the longest line's width the binding constraint, so the size
              is per-locale via --hero-h1 (see globals.css). */}
          <h1
            className="font-display text-white uppercase"
            style={{ fontSize: 'var(--hero-h1)', lineHeight: 0.94, letterSpacing: 1.5, whiteSpace: 'nowrap' }}
          >
            {t('h1Line1')}
            <br />
            <span className="text-cz-orange">{t('h1Line2')}</span>
            <br />
            <span className="relative inline-block" style={{ paddingBottom: 10 }}>
              {t('h1Line3')}
              <span
                className="absolute left-0 bg-cz-orange animate-underline-in origin-left"
                style={{ bottom: 0, width: '100%', height: 5, animationDelay: '0.5s' }}
              />
            </span>
          </h1>

          <p
            className="font-body text-cz-white-soft"
            style={{ fontSize: 'clamp(16px, 2vw, 19px)', lineHeight: 1.7, maxWidth: 480, marginTop: 28 }}
          >
            {t('subhead')}
          </p>

          <div className="flex flex-wrap gap-4" style={{ marginTop: 36 }}>
            <Button type="button" size="responsive" onClick={() => open()}>
              {t('ctaPrimary')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="responsive"
              onClick={() => document.getElementById('cenik')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('ctaSecondary')}
            </Button>
          </div>

          <div
            className="flex flex-wrap gap-8 md:gap-12"
            style={{ marginTop: 48, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            {[
              { value: stationsTotal != null ? String(stationsTotal) : t('stat1Value'), label: t('stat1Label') },
              { value: fromHourPrice != null ? `${fromHourPrice} Kč` : t('stat2Value'), label: t('stat2Label') },
              { value: t('stat3Value'), label: t('stat3Label') },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-white" style={{ fontSize: 40, lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div className="font-mono text-cz-white-soft uppercase" style={{ fontSize: 16, letterSpacing: 2, marginTop: 6 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: station counter */}
          {stationsFree != null && stationsTotal != null && (
            <div
              className="flex lg:hidden items-center bg-cz-black-mid border border-cz-gray-dark rounded-control self-start"
              style={{ padding: '10px 16px', gap: 10, marginTop: 24 }}
            >
              <span
                className="rounded-full animate-flicker flex-shrink-0"
                style={{ width: 8, height: 8, background: stationsFree > 0 ? 'var(--color-cz-orange)' : 'var(--color-cz-danger)' }}
              />
              <span className="font-mono text-cz-white-soft uppercase tabular-nums" style={{ fontSize: 16, letterSpacing: 1.5 }}>
                {stationsFree} / {stationsTotal} {t('stationsFree')}
              </span>
            </div>
          )}
        </div>

        {/* Mobile: character image */}
        <div className="relative flex lg:hidden items-center justify-center" style={{ marginTop: -16 }}>
          <div
            className="absolute animate-hero-glow-pulse"
            style={{
              width: 336, height: 336,
              background: 'radial-gradient(circle, rgba(232,74,26,0.2) 0%, rgba(232,74,26,0.05) 50%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          <div className="relative animate-hero-char" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <Image
              priority
              src={heroImage || '/terrorist_cs2.png'}
              alt="Hero Character"
              width={312}
              height={416}
              style={{
                objectFit: 'contain',
                maxHeight: 416,
                width: 'auto',
                height: 'auto',
                filter: 'drop-shadow(0 0 30px rgba(232,74,26,0.3)) drop-shadow(0 16px 40px rgba(0,0,0,0.6))',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Desktop: character graphic */}
        <div className="relative hidden lg:flex items-center justify-center" style={{ minHeight: 520 }}>
          {/* Corner accents */}
          <span className="absolute border-t-[1.5px] border-l-[1.5px] border-cz-orange" style={{ top: 0, left: '8%', width: 40, height: 40 }} />
          <span className="absolute border-b-[1.5px] border-r-[1.5px] border-cz-orange" style={{ bottom: 0, right: '8%', width: 40, height: 40 }} />

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
              <Image
                priority
                src={heroImage || '/terrorist_cs2.png'}
                alt="Hero Character"
                width={420}
                height={560}
                style={{
                  objectFit: 'contain',
                  maxHeight: 560,
                  width: 'auto',
                  height: 'auto',
                  filter: 'drop-shadow(0 0 40px rgba(232,74,26,0.3)) drop-shadow(0 20px 60px rgba(0,0,0,0.6))',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Status badge */}
          {stationsFree != null && stationsTotal != null && (
            <div
              className="absolute flex items-center bg-cz-black-mid border border-cz-gray-dark rounded-control"
              style={{ bottom: '6%', left: 0, padding: '12px 16px', gap: 10 }}
            >
              <span
                className="rounded-full animate-flicker flex-shrink-0"
                style={{ width: 8, height: 8, background: stationsFree > 0 ? 'var(--color-cz-orange)' : 'var(--color-cz-danger)' }}
              />
              <span className="font-mono text-cz-white-soft uppercase tabular-nums" style={{ fontSize: 16, letterSpacing: 1.5 }}>
                {stationsFree} / {stationsTotal} {t('stationsFree')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator, hidden on mobile */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center" style={{ bottom: 36 }}>
        <span className="bg-cz-orange animate-scroll-pulse" style={{ width: 1.5, height: 48, display: 'block' }} />
      </div>
    </section>
  );
}
