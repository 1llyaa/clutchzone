'use client';

import { useTranslations } from 'next-intl';
import { useReservation } from '@/components/reservation/ReservationContext';

export default function CtaBand() {
  const t = useTranslations('ctaBand');
  const { open } = useReservation();

  return (
    <section
      className="relative bg-cz-black px-6 pb-20 md:px-16 md:pb-[120px]"
    >
      <div
        className="relative max-w-[1440px] mx-auto rounded-cz overflow-hidden text-center bg-cz-black-mid border border-cz-gray-dark"
        style={{ padding: 'clamp(48px, 8vw, 80px) clamp(24px, 6vw, 64px)' }}
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

        <div className="relative">
          <span
            className="font-mono text-cz-orange uppercase"
            style={{ fontSize: 12, letterSpacing: 4 }}
          >
            {t('eyebrow')}
          </span>
          <h2
            className="font-display text-white uppercase"
            style={{ fontSize: 'clamp(40px, 7vw, 72px)', letterSpacing: 2, lineHeight: 0.95, margin: '18px 0 32px' }}
          >
            {t('heading')}
          </h2>
          <div className="flex gap-4 md:gap-5 justify-center flex-wrap">
            <button
              onClick={open}
              className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark transition-colors duration-150 rounded-[2px] border-none cursor-pointer"
              style={{ fontSize: 'clamp(15px, 2vw, 19px)', letterSpacing: 2, padding: 'clamp(12px, 2vw, 16px) clamp(28px, 4vw, 44px)' }}
            >
              {t('primary')}
            </button>
            <button
              onClick={() => document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-transparent text-white font-display uppercase hover:text-cz-orange hover:border-cz-orange transition-all duration-150 rounded-[2px] cursor-pointer"
              style={{ fontSize: 'clamp(15px, 2vw, 19px)', letterSpacing: 2, padding: 'clamp(11px, 2vw, 15px) clamp(28px, 4vw, 44px)', border: '1.5px solid #2A2A2A' }}
            >
              {t('secondary')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
