'use client';

import { useTranslations } from 'next-intl';
import { useReservation } from '@/components/reservation/ReservationContext';

const PC_PRICES = [
  { duration: '1H', amount: 75 },
  { duration: '3H', amount: 215 },
  { duration: '5H', amount: 345 },
  { duration: '7H', amount: 475 },
  { duration: '10H', amount: 660 },
];

const PS5_PRICES = [
  { duration: '1H', amount: 120 },
  { duration: '3H', amount: 330 },
  { duration: '5H', amount: 560 },
];

export default function Pricing() {
  const t = useTranslations('pricing');
  const { open } = useReservation();

  const packages = [
    { name: t('happyName'), time: t('happyTime'), amount: 55,  unit: t('happyUnit'),   featured: true  },
    { name: t('eveningName'), time: t('eveningTime'), amount: 285, unit: t('eveningUnit'), featured: false },
    { name: t('weekendName'), time: t('weekendTime'), amount: 340, unit: t('weekendUnit'), featured: false },
  ];

  return (
    <section
      id="cenik"
      className="relative bg-cz-black"
      style={{ padding: '120px 64px', borderTop: '1px solid rgba(255,255,255,0.06)' }}
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
        <div style={{ marginBottom: 64 }}>
          <span
            className="font-mono text-cz-orange uppercase block"
            style={{ fontSize: 11, letterSpacing: 4, marginBottom: 10 }}
          >
            {t('eyebrow')}
          </span>
          <h2
            className="font-display text-white uppercase inline-block"
            style={{ fontSize: 60, letterSpacing: 1.5, lineHeight: 0.95, paddingBottom: 14, borderBottom: '2px solid #E84A1A' }}
          >
            {t('heading')}
          </h2>
        </div>

        {/* PC pricing table */}
        <div
          className="relative bg-cz-black-mid border border-cz-gray-dark rounded-cz overflow-hidden"
          style={{ padding: '32px 40px', marginBottom: 24 }}
        >
          <span className="absolute top-0 left-0 right-0 bg-cz-orange" style={{ height: 2 }} />
          <span
            className="font-mono text-cz-orange uppercase block"
            style={{ fontSize: 11, letterSpacing: 3, marginBottom: 28 }}
          >
            {t('pcLabel')}
          </span>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${PC_PRICES.length}, 1fr)`, gap: 8 }}>
            {PC_PRICES.map(({ duration, amount }) => (
              <div key={duration} className="flex flex-col items-center gap-2 text-center">
                <span
                  className="font-mono text-cz-gray-light uppercase"
                  style={{ fontSize: 12, letterSpacing: 2 }}
                >
                  {duration}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-white" style={{ fontSize: 56, lineHeight: 1 }}>
                    {amount}
                  </span>
                </div>
                <span className="font-mono text-cz-gray-mid" style={{ fontSize: 10, letterSpacing: 1 }}>
                  KČ
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PS5 pricing table */}
        <div
          className="relative bg-cz-black-mid border border-cz-gray-dark rounded-cz overflow-hidden"
          style={{ padding: '32px 40px', marginBottom: 48 }}
        >
          <span className="absolute top-0 left-0 right-0 bg-cz-gray-dark" style={{ height: 2 }} />
          <span
            className="font-mono text-cz-orange uppercase block"
            style={{ fontSize: 11, letterSpacing: 3, marginBottom: 28 }}
          >
            {t('ps5Label')}
          </span>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${PS5_PRICES.length}, minmax(0, 160px))`,
              gap: 8,
              marginBottom: 28,
            }}
          >
            {PS5_PRICES.map(({ duration, amount }) => (
              <div key={duration} className="flex flex-col items-center gap-2 text-center">
                <span
                  className="font-mono text-cz-gray-light uppercase"
                  style={{ fontSize: 12, letterSpacing: 2 }}
                >
                  {duration}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-white" style={{ fontSize: 56, lineHeight: 1 }}>
                    {amount}
                  </span>
                </div>
                <span className="font-mono text-cz-gray-mid" style={{ fontSize: 10, letterSpacing: 1 }}>
                  KČ
                </span>
              </div>
            ))}
          </div>
          <span
            className="font-mono text-cz-gray-mid uppercase block"
            style={{ fontSize: 10, letterSpacing: 2, borderTop: '1px solid #2A2A2A', paddingTop: 20 }}
          >
            {t('ps5Note')}
          </span>
        </div>

        {/* Special packages heading */}
        <div style={{ marginBottom: 24 }}>
          <span
            className="font-mono text-cz-gray-light uppercase"
            style={{ fontSize: 11, letterSpacing: 3 }}
          >
            {t('packagesHeading')}
          </span>
        </div>

        {/* Package cards */}
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className="relative flex flex-col border border-cz-gray-dark rounded-cz"
              style={{ background: pkg.featured ? '#1A1A1A' : '#111111', padding: '32px 28px' }}
            >
              <span
                className="absolute top-0 left-0 right-0 rounded-t-cz"
                style={{ height: 2, background: pkg.featured ? '#E84A1A' : '#2A2A2A' }}
              />
              <span
                className="font-mono text-cz-orange uppercase"
                style={{ fontSize: 11, letterSpacing: 2, marginBottom: 8 }}
              >
                {pkg.name}
              </span>
              <span
                className="font-mono text-cz-gray-mid uppercase"
                style={{ fontSize: 10, letterSpacing: 2, marginBottom: 24 }}
              >
                {pkg.time}
              </span>
              <div className="flex items-baseline gap-2" style={{ marginTop: 'auto', marginBottom: 28 }}>
                <span className="font-display text-white" style={{ fontSize: 64, lineHeight: 1 }}>
                  {pkg.amount}
                </span>
                <span className="font-body text-cz-gray-light" style={{ fontSize: 18, fontWeight: 500 }}>
                  {pkg.unit}
                </span>
              </div>
              <button
                onClick={open}
                className="w-full bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark transition-colors duration-150 rounded-[2px] border-none cursor-pointer"
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
