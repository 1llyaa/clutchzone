'use client';

import { useTranslations } from 'next-intl';
import Reveal from '@/components/ui/Reveal';

interface Props {
  image?: string;
}

export default function PrivateEvents({ image }: Props) {
  const t = useTranslations('privateEvents');

  return (
    <section
      id="akce"
      className="bg-cz-black px-6 py-14 md:px-16 md:py-[120px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

        {/* Left — image */}
        <Reveal>
          <div className="relative overflow-hidden rounded-cz" style={{ aspectRatio: '4/3', border: '1px solid #2A2A2A' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              loading="lazy"
              decoding="async"
              src={image || '/terrorist_cs2.png'}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </Reveal>

        {/* Right — heading + info + CTA */}
        <Reveal delay={70}>
          <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 16, letterSpacing: 4, marginBottom: 10 }}>
            {t('eyebrow')}
          </span>
          <h2 className="font-display text-white uppercase" style={{ fontSize: 'clamp(32px, 5vw, 60px)', letterSpacing: 1.5, lineHeight: 0.95, marginBottom: 20 }}>
            {t('heading')}
          </h2>
          <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.8, maxWidth: 460, marginBottom: 28 }}>
            {t('subtext')}
          </p>

          <div style={{ marginBottom: 32 }}>
            <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 4 }}>
              {t('priceLabel')}
            </div>
            <div className="font-display text-white uppercase" style={{ fontSize: 20, letterSpacing: 1 }}>
              {t('priceValue')}
            </div>
          </div>

          <a
            href="#kontakt"
            className="inline-block bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark active:scale-[0.96] transition-[background-color,scale] duration-150 ease-out rounded-[2px] text-center"
            style={{ fontSize: 19, letterSpacing: 2, padding: '14px 36px' }}
          >
            {t('cta')}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
