'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import Reveal from '@/components/ui/Reveal';

interface Game {
  id: string;
  title: string;
  genre: string | null;
  description: string | null;
  platform: string;
  cover_url: string | null;
}

const PLATFORM_COLOR: Record<string, string> = {
  pc:   'var(--color-cz-orange)',
  ps5:  'var(--color-cz-gray-dark)',
  both: 'var(--color-cz-gray-dark)',
};

function GameCard({ game }: { game: Game }) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="relative flex-shrink-0 overflow-hidden cursor-pointer"
      style={{ width: 220, height: 330, borderRadius: 4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover image */}
      {game.cover_url ? (
        <Image
          src={game.cover_url}
          alt={game.title}
          fill
          sizes="220px"
          className="object-cover"
          style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.5s ease', willChange: 'transform' }}
        />
      ) : (
        <ImagePlaceholder label="NO IMAGE" />
      )}

      {/* Platform badge */}
      <div
        className="absolute top-3 left-3 font-mono uppercase rounded-[2px]"
        style={{ fontSize: 16, letterSpacing: 2, padding: '3px 7px', color: '#fff', background: PLATFORM_COLOR[game.platform] ?? 'var(--color-cz-orange)' }}
      >
        {game.platform === 'both' ? 'PC + PS5' : game.platform.toUpperCase()}
      </div>

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.65)', opacity: hovered ? 1 : 0, transition: 'opacity 0.3s ease' }}
      />

      {/* Info panel — slides up on hover */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          padding: '20px 18px',
          transform: hovered ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'linear-gradient(to top, rgba(0,0,0,0.98) 55%, transparent)',
        }}
      >
        {game.genre && (
          <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 6 }}>
            {game.genre}
          </span>
        )}
        <h3 className="font-display text-white uppercase" style={{ fontSize: 26, letterSpacing: 1, lineHeight: 1.1, marginBottom: game.description ? 8 : 0 }}>
          {game.title}
        </h3>
        {game.description && (
          <p className="font-body text-cz-white-soft" style={{ fontSize: 19, lineHeight: 1.6 }}>
            {game.description.length > 90 ? `${game.description.slice(0, 90)}…` : game.description}
          </p>
        )}
      </div>
    </article>
  );
}

export default function Games({ games }: { games: Game[] }) {
  const t = useTranslations('games');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -480 : 480, behavior: 'smooth' });
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  if (games.length === 0) return null;

  return (
    <section
      id="herna"
      className="bg-cz-black py-14 md:py-[104px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Heading */}
      <Reveal className="max-w-[1440px] mx-auto flex items-end justify-between px-6 pb-8 md:px-16 md:pb-[40px]">
        <div>
          <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 16, letterSpacing: 4, marginBottom: 10 }}>
            {t('eyebrow')}
          </span>
          <h2 className="font-display text-white uppercase" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', letterSpacing: 1.5, lineHeight: 0.98 }}>
            {t('heading')}
          </h2>
        </div>

        {/* Scroll arrows */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            iconOnly
            onClick={() => scroll('left')}
            disabled={!canLeft}
            aria-label="Předchozí"
          >
            <CaretLeft size={20} weight="bold" />
          </Button>
          <Button
            variant="ghost"
            iconOnly
            onClick={() => scroll('right')}
            disabled={!canRight}
            aria-label="Další"
          >
            <CaretRight size={20} weight="bold" />
          </Button>
        </div>
      </Reveal>

      {/* Scrollable row */}
      <Reveal delay={100}>
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="max-w-[1440px] mx-auto px-6 md:px-16"
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            paddingBottom: 4,
          }}
        >
          {games.map((game) => (
            <div key={game.id} style={{ scrollSnapAlign: 'start' }}>
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
