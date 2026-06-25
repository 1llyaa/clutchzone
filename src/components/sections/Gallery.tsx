'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
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
            <div className="relative overflow-hidden rounded-[2px]" style={{ aspectRatio: '4/3' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover" />
              {img.caption && (
                <div
                  className="absolute bottom-0 left-0 right-0 font-body text-white"
                  style={{ padding: '12px 14px', background: 'linear-gradient(transparent, rgba(0,0,0,0.72))', fontSize: 12 }}
                >
                  {img.caption}
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <style>{`
        .swiper-pagination-bullet { background: #555 !important; opacity: 1 !important; }
        .swiper-bullet-active { background: #E84A1A !important; width: 20px !important; border-radius: 3px !important; }
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover" />
          {img.caption && (
            <div
              className="absolute bottom-0 left-0 right-0 font-body text-white"
              style={{ padding: '24px 40px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', fontSize: 14 }}
            >
              {img.caption}
            </div>
          )}
        </div>
      ))}

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-6 top-1/2 -translate-y-1/2 font-display text-white hover:text-cz-orange transition-colors"
            style={{ fontSize: 32, background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: 2 }}
          >
            ←
          </button>
          <button
            onClick={next}
            className="absolute right-6 top-1/2 -translate-y-1/2 font-display text-white hover:text-cz-orange transition-colors"
            style={{ fontSize: 32, background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: 2 }}
          >
            →
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="rounded-full transition-all"
                style={{ width: i === idx ? 20 : 6, height: 6, background: i === idx ? '#E84A1A' : 'rgba(255,255,255,0.4)' }}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.caption || ''} className="w-full block" />
          {img.caption && (
            <div
              className="absolute bottom-0 left-0 right-0 font-body text-white"
              style={{ padding: '16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', fontSize: 12 }}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
          {img.caption && (
            <div
              className="absolute bottom-0 left-0 right-0 font-body text-white opacity-0 hover:opacity-100 transition-opacity duration-300"
              style={{ padding: '16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', fontSize: 12 }}
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
      className="bg-cz-black py-14 md:py-[120px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Heading */}
      <div className="max-w-[1440px] mx-auto px-6 mb-8 md:px-16 md:mb-12">
        <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 11, letterSpacing: 4, marginBottom: 10 }}>
          {t('eyebrow')}
        </span>
        <h2 className="font-display text-white uppercase" style={{ fontSize: 'clamp(32px, 5vw, 60px)', letterSpacing: 1.5, lineHeight: 0.95 }}>
          {t('heading')}
        </h2>
      </div>

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
    </section>
  );
}
