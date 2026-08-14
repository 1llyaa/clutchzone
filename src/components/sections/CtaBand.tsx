'use client';

import { useTranslations } from 'next-intl';
import { useReservation } from '@/components/reservation/ReservationContext';
import Reveal from '@/components/ui/Reveal';

export default function CtaBand() {
  const t = useTranslations('ctaBand');
  const { open } = useReservation();

  return (
    <section
      className="relative bg-cz-black px-6 pb-20 md:px-16 md:pb-[104px]"
    >
      <Reveal>
      <div
        className="relative max-w-[1440px] mx-auto rounded-cz overflow-hidden text-center bg-cz-black-mid border border-cz-gray-dark"
        style={{ padding: 'clamp(48px, 8vw, 72px) clamp(24px, 6vw, 64px)' }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 80% 100% at 50% 50%, #000, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 50% 50%, #000, transparent 75%)',
          }}
        />
        {/* Orange glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-40%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(232,74,26,0.13), transparent 60%)',
          }}
        />

        {/* Character peeking from right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          loading="lazy"
          decoding="async"
          src="/characters/red_hair.png"
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 right-0 pointer-events-none"
          style={{
            height: '115%',
            width: 'auto',
            maxWidth: 'clamp(140px, 30vw, 260px)',
            objectFit: 'contain',
            objectPosition: 'bottom right',
            outline: 'none',
            maskImage: 'linear-gradient(to right, transparent 0%, black 40%), linear-gradient(to bottom, transparent 0%, black 20%), linear-gradient(to top, transparent 0%, black 18%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%), linear-gradient(to bottom, transparent 0%, black 20%), linear-gradient(to top, transparent 0%, black 18%)',
            maskComposite: 'intersect, intersect',
            WebkitMaskComposite: 'source-in, source-in',
          }}
        />

        <div className="relative">
          <span
            className="font-mono text-cz-orange uppercase"
            style={{ fontSize: 13, letterSpacing: 2.5 }}
          >
            {t('eyebrow')}
          </span>
          <h2
            className="font-display text-white uppercase"
            style={{ fontSize: 60, letterSpacing: 1.5, lineHeight: 0.98, margin: '16px 0 28px' }}
          >
            {t('heading')}
          </h2>
          <div className="flex gap-4 md:gap-5 justify-center flex-wrap">
            <button
              onClick={open}
              className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark hover:shadow-[0_0_18px_rgba(232,74,26,0.35)] active:scale-[0.96] transition-[background-color,scale,box-shadow] duration-150 ease-out rounded-[2px] cursor-pointer"
              style={{ fontSize: 18, letterSpacing: 1.5, lineHeight: 1, padding: '14px 32px', border: '1.5px solid #E84A1A' }}
            >
              {t('primary')}
            </button>
            <button
              onClick={() => document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-transparent text-white font-display uppercase hover:text-cz-orange hover:border-cz-orange active:scale-[0.96] transition-[color,border-color,scale] duration-150 ease-out rounded-[2px] cursor-pointer"
              style={{ fontSize: 18, letterSpacing: 1.5, lineHeight: 1, padding: '14px 32px', border: '1.5px solid rgba(255,255,255,0.2)' }}
            >
              {t('secondary')}
            </button>
          </div>
        </div>
      </div>
      </Reveal>
    </section>
  );
}
