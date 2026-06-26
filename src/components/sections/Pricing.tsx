'use client';

import { useTranslations } from 'next-intl';
import { useReservation } from '@/components/reservation/ReservationContext';

interface Props {
  pcPrices:       { duration_h: number; amount: number }[];
  ps5Prices:      { duration_h: number; amount: number }[];
  packageAmounts: Record<string, number>;
}

export default function Pricing({ pcPrices, ps5Prices, packageAmounts }: Props) {
  const t = useTranslations('pricing');
  const { open } = useReservation();

  const packages = [
    { name: t('happyName'),   time: t('happyTime'),   amount: packageAmounts.happy_hour   ?? 55,  unit: t('happyUnit'),   featured: true  },
    { name: t('eveningName'), time: t('eveningTime'),  amount: packageAmounts.evening_pass ?? 285, unit: t('eveningUnit'), featured: false },
    { name: t('weekendName'), time: t('weekendTime'),  amount: packageAmounts.weekend_pass ?? 340, unit: t('weekendUnit'), featured: false },
  ];

  return (
    <section
      id="cenik"
      className="relative bg-cz-black px-6 py-20 md:px-16 md:py-[120px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000, transparent 80%)',
        }}
      />

      <div className="relative max-w-[1440px] mx-auto">
        {/* Section header */}
        <div style={{ marginBottom: 48 }}>
          <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 11, letterSpacing: 4, marginBottom: 10 }}>
            {t('eyebrow')}
          </span>
          <h2
            className="font-display text-white uppercase inline-block"
            style={{ fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: 1.5, lineHeight: 0.95, paddingBottom: 14, borderBottom: '2px solid #E84A1A' }}
          >
            {t('heading')}
          </h2>
        </div>

        {/* PC pricing table */}
        <div
          className="relative bg-cz-black-mid border border-cz-gray-dark rounded-cz overflow-hidden"
          style={{ padding: 'clamp(20px, 4vw, 32px) clamp(20px, 4vw, 40px)', marginBottom: 20 }}
        >
          <span className="absolute top-0 left-0 right-0 bg-cz-orange" style={{ height: 2 }} />
          <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 11, letterSpacing: 3, marginBottom: 24 }}>
            {t('pcLabel')}
          </span>
          {/* Mobile: 3+2, Desktop: 5 in a row */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 md:gap-2">
            {pcPrices.map(({ duration_h, amount }) => (
              <div key={duration_h} className="flex flex-col items-center gap-1 text-center">
                <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 11, letterSpacing: 2 }}>
                  {duration_h}H
                </span>
                <span className="font-display text-white" style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1 }}>
                  {amount}
                </span>
                <span className="font-mono text-cz-gray-mid" style={{ fontSize: 10, letterSpacing: 1 }}>KČ</span>
              </div>
            ))}
          </div>
        </div>

        {/* PS5 pricing table */}
        <div
          className="relative bg-cz-black-mid border border-cz-gray-dark rounded-cz overflow-hidden"
          style={{ padding: 'clamp(20px, 4vw, 32px) clamp(20px, 4vw, 40px)', marginBottom: 40 }}
        >
          <span className="absolute top-0 left-0 right-0 bg-cz-gray-dark" style={{ height: 2 }} />
          <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 11, letterSpacing: 3, marginBottom: 24 }}>
            {t('ps5Label')}
          </span>
          <div className="grid grid-cols-3 gap-4 md:gap-2" style={{ maxWidth: 480, marginBottom: 24 }}>
            {ps5Prices.map(({ duration_h, amount }) => (
              <div key={duration_h} className="flex flex-col items-center gap-1 text-center">
                <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 11, letterSpacing: 2 }}>
                  {duration_h}H
                </span>
                <span className="font-display text-white" style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1 }}>
                  {amount}
                </span>
                <span className="font-mono text-cz-gray-mid" style={{ fontSize: 10, letterSpacing: 1 }}>KČ</span>
              </div>
            ))}
          </div>
          <span className="font-mono text-cz-gray-mid uppercase block" style={{ fontSize: 10, letterSpacing: 2, borderTop: '1px solid #2A2A2A', paddingTop: 20 }}>
            {t('ps5Note')}
          </span>
        </div>

        {/* Packages heading */}
        <div style={{ marginBottom: 20 }}>
          <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 11, letterSpacing: 3 }}>
            {t('packagesHeading')}
          </span>
        </div>

        {/* Package cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className="relative flex flex-col border border-cz-gray-dark rounded-cz"
              style={{ background: pkg.featured ? '#1A1A1A' : '#111111', padding: 'clamp(24px, 4vw, 32px) clamp(20px, 3vw, 28px)' }}
            >
              <span className="absolute top-0 left-0 right-0 rounded-t-cz" style={{ height: 2, background: pkg.featured ? '#E84A1A' : '#2A2A2A' }} />
              <span className="font-mono text-cz-orange uppercase" style={{ fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>
                {pkg.name}
              </span>
              <span className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 20 }}>
                {pkg.time}
              </span>
              <div className="flex items-baseline gap-2" style={{ marginTop: 'auto', marginBottom: 24 }}>
                <span className="font-display text-white" style={{ fontSize: 'clamp(48px, 6vw, 64px)', lineHeight: 1 }}>
                  {pkg.amount}
                </span>
                <span className="font-body text-cz-gray-light" style={{ fontSize: 18, fontWeight: 500 }}>
                  {pkg.unit}
                </span>
              </div>
              <button
                onClick={open}
                className="w-full bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark active:scale-[0.96] transition-[background-color,scale] duration-150 ease-out rounded-[2px] border-none cursor-pointer"
                style={{ fontSize: 17, letterSpacing: 2, padding: 13 }}
              >
                {t('cta')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
