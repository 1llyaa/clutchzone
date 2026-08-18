'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import 'swiper/css';
import 'swiper/css/pagination';

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
  sort_order: number;
}

interface Props {
  images: GalleryImage[];
  displayType: string;
}

// ─── Mobile swiper (all modes on small screens) ───────────────────────────────
function MobileGallery({ images }: { images: GalleryImage[] }) {
  return (
    <div className="relative">
      <Swiper
        modules={[Pagination, Autoplay]}
        spaceBetween={12}
        slidesPerView={1.15}
        centeredSlides={false}
        pagination={{ clickable: true, bulletActiveClass: 'swiper-bullet-active' }}
        autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        loop={images.length > 2}
        className="px-6 pb-10"
      >
        {images.map((img) => (
          <SwiperSlide key={img.id}>
            <div className="relative overflow-hidden rounded-[4px]" style={{ aspectRatio: '4/3' }}>
              <Image src={img.url} alt={img.caption || ''} fill sizes="90vw" className="object-cover" />
              {img.caption && (
                <div
                  className="absolute bottom-0 left-0 right-0 font-body text-white"
                  style={{ padding: '12px 14px', background: 'linear-gradient(transparent, rgba(0,0,0,0.72))', fontSize: 17 }}
                >
                  {img.caption}
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <style>{`
        .swiper-pagination-bullet { background: var(--color-cz-gray-mid) !important; opacity: 1 !important; }
        .swiper-bullet-active { background: var(--color-cz-orange) !important; width: 20px !important; border-radius: 3px !important; }
      `}</style>
    </div>
  );
}

// ─── Desktop Carousel ─────────────────────────────────────────────────────────
function Carousel({ images }: { images: GalleryImage[] }) {
  const [idx, setIdx] = useState(0);

  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const t = setTimeout(next, 5000);
    return () => clearTimeout(t);
  }, [idx, next]);

  return (
    <div className="relative overflow-hidden" style={{ height: 560 }}>
      {images.map((img, i) => (
        <div
          key={img.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === idx ? 1 : 0, pointerEvents: i === idx ? 'auto' : 'none' }}
        >
          <Image src={img.url} alt={img.caption || ''} fill sizes="1440px" className="object-cover" />
          {img.caption && (
            <div
              className="absolute bottom-0 left-0 right-0 font-body text-white"
              style={{ padding: '24px 40px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', fontSize: 17 }}
            >
              {img.caption}
            </div>
          )}
        </div>
      ))}

      {images.length > 1 && (
        <>
          <Button variant="ghost" iconOnly onClick={prev} aria-label="Předchozí" className="absolute left-6 top-1/2 -translate-y-1/2">
            <CaretLeft size={20} weight="bold" />
          </Button>
          <Button variant="ghost" iconOnly onClick={next} aria-label="Další" className="absolute right-6 top-1/2 -translate-y-1/2">
            <CaretRight size={20} weight="bold" />
          </Button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="rounded-full transition-all"
                style={{ width: i === idx ? 20 : 6, height: 6, background: i === idx ? 'var(--color-cz-orange)' : 'rgba(255,255,255,0.4)' }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Desktop Masonry ──────────────────────────────────────────────────────────
function Masonry({ images }: { images: GalleryImage[] }) {
  return (
    <div className="columns-3" style={{ columnGap: 6 }}>
      {images.map((img) => (
        <div key={img.id} className="relative" style={{ breakInside: 'avoid', marginBottom: 6 }}>
          {/* Masonry columns rely on each image's own intrinsic aspect ratio to
              set its height — there's no fixed-size parent for `fill`, and we
              don't have stored width/height to pass next/image, so this stays
              a plain <img>. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async" src={img.url} alt={img.caption || ''} className="w-full block" />
          {img.caption && (
            <div
              className="absolute bottom-0 left-0 right-0 font-body text-white"
              style={{ padding: '16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', fontSize: 17 }}
            >
              {img.caption}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Desktop Mosaic ───────────────────────────────────────────────────────────
function Mosaic({ images }: { images: GalleryImage[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: 240, gap: 6 }}>
      {images.map((img, i) => (
        <div
          key={img.id}
          className="relative overflow-hidden"
          style={{ gridColumn: i === 0 ? 'span 2' : 'span 1', gridRow: i === 0 ? 'span 2' : 'span 1' }}
        >
          <Image
            src={img.url}
            alt={img.caption || ''}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
          {img.caption && (
            <div
              className="absolute bottom-0 left-0 right-0 font-body text-white opacity-0 hover:opacity-100 transition-opacity duration-300"
              style={{ padding: '16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', fontSize: 17 }}
            >
              {img.caption}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
export default function Gallery({ images, displayType }: Props) {
  const t = useTranslations('gallery');

  if (images.length === 0) return null;

  return (
    <section
      id="galerie"
      className="bg-cz-black py-14 md:py-[104px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Heading */}
      <Reveal className="max-w-[1440px] mx-auto px-6 mb-8 md:px-16 md:mb-12">
        <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 16, letterSpacing: 4, marginBottom: 10 }}>
          {t('eyebrow')}
        </span>
        <h2 className="font-display text-white uppercase" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', letterSpacing: 1.5, lineHeight: 0.98 }}>
          {t('heading')}
        </h2>
      </Reveal>

      <Reveal delay={100}>
        {/* Mobile: Swiper (all modes) */}
        <div className="md:hidden">
          <MobileGallery images={images} />
        </div>

        {/* Desktop: configured layout */}
        <div className={`hidden md:block ${displayType === 'carousel' ? '' : 'px-16'}`}>
          {displayType === 'carousel' && <Carousel images={images} />}
          {displayType === 'masonry'  && <Masonry  images={images} />}
          {displayType === 'mosaic'   && <Mosaic   images={images} />}
        </div>
      </Reveal>
    </section>
  );
}
