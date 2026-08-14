'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import TournamentRegisterModal from '@/components/tournament/TournamentRegisterModal';
import TournamentDetailModal from '@/components/tournament/TournamentDetailModal';
import Reveal from '@/components/ui/Reveal';

interface Tournament {
  id: string;
  title: string;
  game: string;
  date: string;
  prize_pool: number | null;
  max_slots: number;
  filled_slots: number;
  description: string | null;
}

export default function Tournaments({ tournaments }: { tournaments: Tournament[] }) {
  const t = useTranslations('tournaments');
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [detail, setDetail] = useState<Tournament | null>(null);

  function formatDate(iso: string) {
    const d = new Date(iso);
    const day   = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  }

  return (
    <section
      id="turnaje"
      className="relative bg-cz-black px-6 py-14 md:px-16 md:py-[104px] overflow-hidden"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Character peeking from right — behind content */}
      <div className="absolute right-0 top-0 bottom-0 pointer-events-none" style={{ width: 'clamp(120px, 20vw, 260px)', zIndex: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          loading="lazy"
          decoding="async"
          src="/characters/apex.png"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 0,
            right: -20,
            height: '80%',
            maxHeight: 480,
            width: 'auto',
            objectFit: 'contain',
            objectPosition: 'bottom right',
            outline: 'none',
            opacity: 0.6,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #0A0A0A 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0A0A0A 0%, transparent 30%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #0A0A0A 0%, transparent 20%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, #0A0A0A 0%, transparent 30%)' }} />
        {/* Kill top-right corner where white bg can bleed */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, #0A0A0A 15%, transparent 55%)' }} />
      </div>
      <div className="relative z-10 max-w-[1440px] mx-auto">
        <Reveal className="mb-8 md:mb-[40px]">
          <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 13, letterSpacing: 2.5, marginBottom: 12 }}>
            {t('eyebrow')}
          </span>
          <h2 className="font-display text-white uppercase" style={{ fontSize: 52, letterSpacing: 1.5, lineHeight: 0.98 }}>
            {t('heading')}
          </h2>
        </Reveal>

        {tournaments.length === 0 ? (
          <Reveal>
            <div className="font-mono text-cz-gray-light uppercase text-center" style={{ padding: '40px 0', borderTop: '1px solid #2A2A2A', fontSize: 12, letterSpacing: 3 }}>
              ŽÁDNÉ NADCHÁZEJÍCÍ TURNAJE
            </div>
          </Reveal>
        ) : (
          <div className="flex flex-col">
            {tournaments.map((row, i) => {
              const isFull = row.filled_slots >= row.max_slots;
              return (
                <Reveal key={row.id} delay={Math.min(i, 4) * 60}>
                <div style={{ borderTop: '1px solid #2A2A2A' }}>
                  {/* ── Desktop row (md+) ── */}
                  <div
                    className="hidden md:grid transition-colors duration-200 hover:bg-white/[0.02]"
                    style={{
                      gridTemplateColumns: '140px 130px 1fr 160px 140px 160px',
                      alignItems: 'center',
                      gap: 24,
                      padding: '28px 8px',
                    }}
                  >
                    <div>
                      <div className="font-display text-cz-orange" style={{ fontSize: 36, lineHeight: 1 }}>{formatDate(row.date)}</div>
                      <span className="font-mono text-cz-white-soft block" style={{ fontSize: 12, letterSpacing: 1.5, marginTop: 4 }}>{new Date(row.date).getUTCFullYear()}</span>
                    </div>
                    <span className="font-mono text-white uppercase justify-self-start" style={{ fontSize: 13, letterSpacing: 1.5, border: '1px solid #2A2A2A', borderRadius: 2, padding: '7px 11px' }}>
                      {row.game}
                    </span>
                    <button
                      onClick={() => setDetail(row)}
                      className="font-display text-white uppercase text-left hover:text-cz-orange transition-colors duration-150 cursor-pointer bg-transparent border-none"
                      style={{ fontSize: 30, letterSpacing: 1, padding: 0 }}
                    >
                      {row.title}
                    </button>
                    <div>
                      <span className="font-mono text-cz-white-soft uppercase block" style={{ fontSize: 12, letterSpacing: 1.5 }}>{t('prizePool')}</span>
                      <span className="font-display text-white" style={{ fontSize: 26 }}>
                        {row.prize_pool ? `${row.prize_pool.toLocaleString('cs-CZ')} Kč` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-cz-white-soft uppercase block" style={{ fontSize: 12, letterSpacing: 1.5 }}>{t('registered')}</span>
                      <span className={`font-display tabular-nums ${isFull ? 'text-cz-orange' : 'text-white'}`} style={{ fontSize: 26 }}>
                        {row.filled_slots}<span className="font-mono text-cz-gray-light" style={{ fontSize: 14 }}>/{row.max_slots}</span>
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => !isFull && setSelected(row)}
                        disabled={isFull}
                        className={`font-display uppercase transition-[color,border-color,scale] duration-200 ease-out rounded-[2px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:not-disabled:scale-[0.96] ${!isFull ? 'hover:text-cz-orange hover:border-cz-orange' : ''} ${isFull ? 'text-cz-gray-light' : 'text-white'}`}
                        style={{ fontSize: 16, lineHeight: 1, letterSpacing: 1.5, padding: '11px 22px', background: 'transparent', border: '1.5px solid #2A2A2A' }}
                      >
                        {isFull ? 'PLNÝ' : t('cta')}
                      </button>
                    </div>
                  </div>

                  {/* ── Mobile card (< md) ── */}
                  <div className="md:hidden" style={{ padding: '20px 4px' }}>
                    <div className="flex items-center gap-4" style={{ marginBottom: 12 }}>
                      <div>
                        <div className="font-display text-cz-orange" style={{ fontSize: 36, lineHeight: 1 }}>{formatDate(row.date)}</div>
                        <span className="font-mono text-cz-white-soft" style={{ fontSize: 12, letterSpacing: 1.5 }}>{new Date(row.date).getUTCFullYear()}</span>
                      </div>
                      <span className="font-mono text-white uppercase" style={{ fontSize: 13, letterSpacing: 1.5, border: '1px solid #2A2A2A', borderRadius: 2, padding: '7px 11px' }}>
                        {row.game}
                      </span>
                    </div>

                    <button
                      onClick={() => setDetail(row)}
                      className="font-display text-white uppercase text-left hover:text-cz-orange transition-colors duration-150 cursor-pointer bg-transparent border-none block"
                      style={{ fontSize: 30, letterSpacing: 1, marginBottom: 14, padding: 0 }}
                    >
                      {row.title}
                    </button>

                    <div className="flex items-end justify-between flex-wrap gap-3">
                      <div className="flex gap-6">
                        {row.prize_pool ? (
                          <div>
                            <span className="font-mono text-cz-white-soft uppercase block" style={{ fontSize: 12, letterSpacing: 1.5 }}>{t('prizePool')}</span>
                            <span className="font-display text-white" style={{ fontSize: 26 }}>
                              {row.prize_pool.toLocaleString('cs-CZ')} Kč
                            </span>
                          </div>
                        ) : null}
                        <div>
                          <span className="font-mono text-cz-white-soft uppercase block" style={{ fontSize: 12, letterSpacing: 1.5 }}>{t('registered')}</span>
                          <span className={`font-display tabular-nums ${isFull ? 'text-cz-orange' : 'text-white'}`} style={{ fontSize: 26 }}>
                            {row.filled_slots}<span className="font-mono text-cz-gray-light" style={{ fontSize: 12 }}>/{row.max_slots}</span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => !isFull && setSelected(row)}
                        disabled={isFull}
                        className={`font-display uppercase rounded-[2px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color,color,scale] duration-150 active:not-disabled:scale-[0.96] ${isFull ? 'text-cz-gray-light' : 'text-white'}`}
                        style={{ fontSize: 16, lineHeight: 1, letterSpacing: 1.5, padding: '11px 22px', background: isFull ? 'transparent' : '#E84A1A', border: isFull ? '1.5px solid #2A2A2A' : 'none' }}
                      >
                        {isFull ? 'PLNÝ' : t('cta')}
                      </button>
                    </div>
                  </div>
                </div>
                </Reveal>
              );
            })}
            <div style={{ borderTop: '1px solid #2A2A2A' }} />
          </div>
        )}
      </div>

      <TournamentDetailModal
        tournament={detail}
        onClose={() => setDetail(null)}
        onRegister={(row) => { setDetail(null); setSelected(row); }}
      />
      <TournamentRegisterModal tournament={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
