'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import Reveal from '@/components/ui/Reveal';
import 'swiper/css';

interface Sponsor {
  id: string;
  url: string;
  name: string | null;
  website_url: string | null;
}

interface Props {
  sponsors: Sponsor[];
}

function Logo({ sponsor }: { sponsor: Sponsor }) {
  const img = (
    <Image
      src={sponsor.url}
      alt={sponsor.name || 'Sponsor'}
      width={200}
      height={48}
      sizes="200px"
      className="cz-sponsor-logo"
      style={{ height: 48, width: 'auto', objectFit: 'contain' }}
    />
  );

  if (!sponsor.website_url) return img;

  return (
    <a
      href={sponsor.website_url}
      target="_blank"
      // `sponsored` is the correct rel for a paid placement; without it these
      // links pass ranking signal we are not entitled to pass.
      rel="noopener noreferrer sponsored"
      className="inline-flex items-center"
    >
      {img}
    </a>
  );
}

export default function Sponsors({ sponsors }: Props) {
  const t = useTranslations('sponsors');
  // The marquee is mounted only after hydration, so a reduced-motion visitor
  // never sees a frame of it before the static row takes over.
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setAnimate(true);
  }, []);

  // No admin toggle for this section: it simply is not there when there is
  // nothing to show, so a toggle and the content can never disagree.
  if (sponsors.length === 0) return null;

  return (
    <section
      id="sponzori"
      className="bg-cz-black px-6 py-14 md:px-16 md:py-[104px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-[1440px] mx-auto">
        <Reveal>
          <div style={{ marginBottom: 40 }}>
            <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 16, letterSpacing: 4, marginBottom: 10 }}>
              {t('eyebrow')}
            </span>
            <h2 className="font-display text-white uppercase" style={{ fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: 1.5, lineHeight: 0.95 }}>
              {t('heading')}
            </h2>
          </div>
        </Reveal>

        <Reveal delay={100}>
          {animate ? (
            <Swiper
              modules={[Autoplay, FreeMode]}
              loop
              slidesPerView="auto"
              spaceBetween={64}
              speed={5000}
              allowTouchMove={false}
              freeMode={{ enabled: true, momentum: false }}
              autoplay={{ delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true }}
              className="cz-sponsor-marquee"
            >
              {/* Doubled so a short sponsor list still fills the track and the
                  loop has something to wrap onto. */}
              {[...sponsors, ...sponsors].map((s, i) => (
                <SwiperSlide key={`${s.id}-${i}`} style={{ width: 'auto' }}>
                  <Logo sponsor={s} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8">
              {sponsors.map((s) => (
                <Logo key={s.id} sponsor={s} />
              ))}
            </div>
          )}
        </Reveal>
      </div>

      <style>{`
        /* Deliberate exception to the global img outline in AGENTS.md: a 1px
           box around a transparent logo is exactly what that rule is meant to
           prevent elsewhere, and here it draws the bounding box instead of the
           mark. Scoped to this section only. */
        .cz-sponsor-logo { outline: none; filter: grayscale(1); opacity: .6; transition: filter .3s cubic-bezier(0.2, 0, 0, 1), opacity .3s cubic-bezier(0.2, 0, 0, 1); }
        .cz-sponsor-logo:hover { filter: grayscale(0); opacity: 1; }
        /* Linear timing is what turns Swiper's autoplay into a marquee — the
           default easing would visibly stutter at every slide boundary. */
        .cz-sponsor-marquee .swiper-wrapper { transition-timing-function: linear !important; }
        .cz-sponsor-marquee .swiper-slide { display: flex; align-items: center; }
        @media (prefers-reduced-motion: reduce) {
          .cz-sponsor-logo { transition-duration: 0.01ms; }
        }
      `}</style>
    </section>
  );
}
