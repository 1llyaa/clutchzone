'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import TournamentRegisterModal from '@/components/tournament/TournamentRegisterModal';
import TournamentDetailModal from '@/components/tournament/TournamentDetailModal';

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
      className="relative bg-cz-black px-6 py-20 md:px-16 md:py-[120px] overflow-hidden"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Character peeking from right — behind content */}
      <div className="absolute right-0 top-0 bottom-0 pointer-events-none" style={{ width: 'clamp(120px, 20vw, 260px)', zIndex: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
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
        <div style={{ marginBottom: 40 }}>
          <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 11, letterSpacing: 4, marginBottom: 10 }}>
            {t('eyebrow')}
          </span>
          <h2 className="font-display text-white uppercase" style={{ fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: 1.5, lineHeight: 0.95 }}>
            {t('heading')}
          </h2>
        </div>

        {tournaments.length === 0 ? (
          <div className="font-mono text-cz-gray-mid uppercase text-center" style={{ padding: '40px 0', borderTop: '1px solid #2A2A2A', fontSize: 12, letterSpacing: 3 }}>
            ŽÁDNÉ NADCHÁZEJÍCÍ TURNAJE
          </div>
        ) : (
          <div className="flex flex-col">
            {tournaments.map((row) => {
              const isFull = row.filled_slots >= row.max_slots;
              return (
                <div key={row.id} style={{ borderTop: '1px solid #2A2A2A' }}>
                  {/* ── Desktop row (md+) ── */}
                  <div
                    className="hidden md:grid"
                    style={{
                      gridTemplateColumns: '140px 130px 1fr 160px 140px 160px',
                      alignItems: 'center',
                      gap: 24,
                      padding: '28px 8px',
                    }}
                  >
                    <div>
                      <div className="font-display text-cz-orange" style={{ fontSize: 40, lineHeight: 1 }}>{formatDate(row.date)}</div>
                      <span className="font-mono text-cz-gray-mid block" style={{ fontSize: 11, letterSpacing: 2, marginTop: 2 }}>{new Date(row.date).getUTCFullYear()}</span>
                    </div>
                    <span className="font-mono text-cz-gray-light uppercase justify-self-start" style={{ fontSize: 11, letterSpacing: 2, border: '1px solid #2A2A2A', borderRadius: 2, padding: '6px 10px' }}>
                      {row.game}
                    </span>
                    <button
                      onClick={() => setDetail(row)}
                      className="font-display text-white uppercase text-left hover:text-cz-orange transition-colors duration-150 cursor-pointer bg-transparent border-none"
                      style={{ fontSize: 32, letterSpacing: 1, padding: 0 }}
                    >
                      {row.title}
                    </button>
                    <div>
                      <span className="font-mono text-cz-gray-mid uppercase block" style={{ fontSize: 10, letterSpacing: 2 }}>{t('prizePool')}</span>
                      <span className="font-display text-white" style={{ fontSize: 28 }}>
                        {row.prize_pool ? `${row.prize_pool.toLocaleString('cs-CZ')} Kč` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-cz-gray-mid uppercase block" style={{ fontSize: 10, letterSpacing: 2 }}>{t('registered')}</span>
                      <span className={`font-display tabular-nums ${isFull ? 'text-cz-orange' : 'text-white'}`} style={{ fontSize: 28 }}>
                        {row.filled_slots}<span className="font-mono text-cz-gray-mid" style={{ fontSize: 14 }}>/{row.max_slots}</span>
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => !isFull && setSelected(row)}
                        disabled={isFull}
                        className={`font-display uppercase transition-[color,border-color,scale] duration-200 ease-out rounded-[2px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:not-disabled:scale-[0.96] ${!isFull ? 'hover:text-cz-orange hover:border-cz-orange' : ''}`}
                        style={{ fontSize: 15, letterSpacing: 2, padding: '9px 22px', background: 'transparent', color: isFull ? '#555' : '#fff', border: '1.5px solid #2A2A2A' }}
                      >
                        {isFull ? 'PLNÝ' : t('cta')}
                      </button>
                    </div>
                  </div>

                  {/* ── Mobile card (< md) ── */}
                  <div className="md:hidden" style={{ padding: '20px 4px' }}>
                    <div className="flex items-center gap-4" style={{ marginBottom: 12 }}>
                      <div>
                        <div className="font-display text-cz-orange" style={{ fontSize: 32, lineHeight: 1 }}>{formatDate(row.date)}</div>
                        <span className="font-mono text-cz-gray-mid" style={{ fontSize: 10, letterSpacing: 2 }}>{new Date(row.date).getUTCFullYear()}</span>
                      </div>
                      <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2, border: '1px solid #2A2A2A', borderRadius: 2, padding: '4px 8px' }}>
                        {row.game}
                      </span>
                    </div>

                    <button
                      onClick={() => setDetail(row)}
                      className="font-display text-white uppercase text-left hover:text-cz-orange transition-colors duration-150 cursor-pointer bg-transparent border-none block"
                      style={{ fontSize: 'clamp(20px, 5vw, 28px)', letterSpacing: 1, marginBottom: 14, padding: 0 }}
                    >
                      {row.title}
                    </button>

                    <div className="flex items-end justify-between flex-wrap gap-3">
                      <div className="flex gap-6">
                        {row.prize_pool ? (
                          <div>
                            <span className="font-mono text-cz-gray-mid uppercase block" style={{ fontSize: 9, letterSpacing: 2 }}>{t('prizePool')}</span>
                            <span className="font-display text-white" style={{ fontSize: 22 }}>
                              {row.prize_pool.toLocaleString('cs-CZ')} Kč
                            </span>
                          </div>
                        ) : null}
                        <div>
                          <span className="font-mono text-cz-gray-mid uppercase block" style={{ fontSize: 9, letterSpacing: 2 }}>{t('registered')}</span>
                          <span className={`font-display tabular-nums ${isFull ? 'text-cz-orange' : 'text-white'}`} style={{ fontSize: 22 }}>
                            {row.filled_slots}<span className="font-mono text-cz-gray-mid" style={{ fontSize: 12 }}>/{row.max_slots}</span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => !isFull && setSelected(row)}
                        disabled={isFull}
                        className="font-display uppercase rounded-[2px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color,color,scale] duration-150 active:not-disabled:scale-[0.96]"
                        style={{ fontSize: 13, letterSpacing: 2, padding: '10px 20px', background: isFull ? 'transparent' : '#E84A1A', color: '#fff', border: isFull ? '1.5px solid #2A2A2A' : 'none' }}
                      >
                        {isFull ? 'PLNÝ' : t('cta')}
                      </button>
                    </div>
                  </div>
                </div>
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
