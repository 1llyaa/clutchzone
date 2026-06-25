'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface Game {
  id: string;
  title: string;
  genre: string | null;
  description: string | null;
  platform: string;
  cover_url: string | null;
}

const PLATFORM_COLOR: Record<string, string> = {
  pc:   '#E84A1A',
  ps5:  '#60a5fa',
  both: '#a78bfa',
};

function GameCard({ game }: { game: Game }) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="relative flex-shrink-0 overflow-hidden cursor-pointer"
      style={{ width: 220, height: 330, borderRadius: 2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover image */}
      {game.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={game.cover_url}
          alt={game.title}
          className="w-full h-full object-cover"
          style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.5s ease', willChange: 'transform' }}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)' }}
        >
          <span className="font-display text-cz-gray-mid uppercase" style={{ fontSize: 12, letterSpacing: 3 }}>NO IMAGE</span>
        </div>
      )}

      {/* Platform badge */}
      <div
        className="absolute top-3 left-3 font-mono uppercase rounded-[2px]"
        style={{ fontSize: 8, letterSpacing: 2, padding: '3px 7px', color: '#fff', background: PLATFORM_COLOR[game.platform] ?? '#E84A1A' }}
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
          <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 9, letterSpacing: 3, marginBottom: 6 }}>
            {game.genre}
          </span>
        )}
        <h3 className="font-display text-white uppercase" style={{ fontSize: 20, letterSpacing: 1, lineHeight: 1.1, marginBottom: game.description ? 10 : 0 }}>
          {game.title}
        </h3>
        {game.description && (
          <p className="font-body text-cz-gray-light" style={{ fontSize: 12, lineHeight: 1.6 }}>
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
      className="bg-cz-black py-20 md:py-[120px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Heading */}
      <div className="max-w-[1440px] mx-auto flex items-end justify-between px-6 pb-10 md:px-16 md:pb-12">
        <div>
          <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 11, letterSpacing: 4, marginBottom: 10 }}>
            {t('eyebrow')}
          </span>
          <h2 className="font-display text-white uppercase" style={{ fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: 1.5, lineHeight: 0.95 }}>
            {t('heading')}
          </h2>
        </div>

        {/* Scroll arrows */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canLeft}
            className="font-display text-white rounded-[2px] transition-all disabled:opacity-20 hover:bg-cz-orange hover:text-white"
            style={{ fontSize: 20, width: 44, height: 44, border: '1px solid #2A2A2A', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ←
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canRight}
            className="font-display text-white rounded-[2px] transition-all disabled:opacity-20 hover:bg-cz-orange hover:text-white"
            style={{ fontSize: 20, width: 44, height: 44, border: '1px solid #2A2A2A', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            →
          </button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="px-6 md:px-16"
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
    </section>
  );
}
