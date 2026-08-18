'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useReservation } from '@/components/reservation/ReservationContext';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';

export default function CtaBand() {
  const t = useTranslations('ctaBand');
  const { open } = useReservation();

  return (
    <section
      className="relative bg-cz-black px-6 py-14 md:px-16 md:py-[104px]"
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
        <div
          className="absolute bottom-0 right-0 pointer-events-none"
          style={{
            height: '115%',
            width: 'clamp(140px, 30vw, 260px)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 40%), linear-gradient(to bottom, transparent 0%, black 20%), linear-gradient(to top, transparent 0%, black 18%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%), linear-gradient(to bottom, transparent 0%, black 20%), linear-gradient(to top, transparent 0%, black 18%)',
            maskComposite: 'intersect, intersect',
            WebkitMaskComposite: 'source-in, source-in',
          }}
        >
          <Image
            src="/characters/red_hair.png"
            alt=""
            aria-hidden="true"
            fill
            sizes="260px"
            style={{ objectFit: 'contain', objectPosition: 'bottom right', outline: 'none' }}
          />
        </div>

        <div className="relative">
          <span
            className="font-mono text-cz-orange uppercase"
            style={{ fontSize: 16, letterSpacing: 4 }}
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
            <Button variant="primary" onClick={() => open()}>
              {t('primary')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('secondary')}
            </Button>
          </div>
        </div>
      </div>
      </Reveal>
    </section>
  );
}
