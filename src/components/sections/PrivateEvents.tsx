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
      className="bg-cz-black px-6 py-14 md:px-16 md:py-[104px]"
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
          <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 13, letterSpacing: 2.5, marginBottom: 12 }}>
            {t('eyebrow')}
          </span>
          <h2 className="font-display text-white uppercase" style={{ fontSize: 52, letterSpacing: 1.5, lineHeight: 0.98, marginBottom: 20 }}>
            {t('heading')}
          </h2>
          <p className="font-body text-cz-white-soft" style={{ fontSize: 16, lineHeight: 1.8, maxWidth: 480, marginBottom: 28 }}>
            {t('subtext')}
          </p>

          <div style={{ marginBottom: 28 }}>
            <div className="font-mono text-cz-white-soft uppercase" style={{ fontSize: 12, letterSpacing: 2.5, marginBottom: 6 }}>
              {t('priceLabel')}
            </div>
            <div className="font-display text-white uppercase" style={{ fontSize: 28, letterSpacing: 1 }}>
              {t('priceValue')}
            </div>
          </div>

          <a
            href="#kontakt"
            className="inline-block bg-cz-orange text-white font-display uppercase border-[1.5px] border-cz-orange hover:bg-cz-orange-dark hover:border-cz-orange-dark active:scale-[0.96] transition-[background-color,border-color,scale] duration-150 ease-out rounded-[2px]"
            style={{ fontSize: 18, letterSpacing: 1.5, lineHeight: 1, padding: '14px 32px' }}
          >
            {t('cta')}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
