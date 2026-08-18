'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import TournamentRegisterModal from '@/components/tournament/TournamentRegisterModal';
import TournamentDetailModal from '@/components/tournament/TournamentDetailModal';
import Button from '@/components/ui/Button';
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
        <Image
          src="/characters/apex.png"
          alt=""
          aria-hidden="true"
          fill
          sizes="260px"
          style={{
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

        {tournaments.length === 0 ? (
          <Reveal>
            <div className="font-mono text-cz-gray-light uppercase text-center border-t border-cz-gray-dark" style={{ padding: '40px 0', fontSize: 16, letterSpacing: 3 }}>
              ŽÁDNÉ NADCHÁZEJÍCÍ TURNAJE
            </div>
          </Reveal>
        ) : (
          <div className="flex flex-col">
            {tournaments.map((row, i) => {
              const isFull = row.filled_slots >= row.max_slots;
              return (
                <Reveal key={row.id} delay={Math.min(i, 4) * 60}>
                <div className="border-t border-cz-gray-dark">
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
                      <div className="font-display text-cz-orange" style={{ fontSize: 40, lineHeight: 1 }}>{formatDate(row.date)}</div>
                      <span className="font-mono text-cz-gray-light block" style={{ fontSize: 16, letterSpacing: 2, marginTop: 2 }}>{new Date(row.date).getUTCFullYear()}</span>
                    </div>
                    <span className="font-mono text-cz-gray-light uppercase justify-self-start border border-cz-gray-dark" style={{ fontSize: 16, letterSpacing: 2, borderRadius: 2, padding: '6px 10px' }}>
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
                      <span className="font-mono text-cz-gray-light uppercase block" style={{ fontSize: 16, letterSpacing: 2 }}>{t('prizePool')}</span>
                      <span className="font-display text-white" style={{ fontSize: 28 }}>
                        {row.prize_pool ? `${row.prize_pool.toLocaleString('cs-CZ')} Kč` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-cz-gray-light uppercase block" style={{ fontSize: 16, letterSpacing: 2 }}>{t('registered')}</span>
                      <span className={`font-display tabular-nums ${isFull ? 'text-cz-orange' : 'text-white'}`} style={{ fontSize: 28 }}>
                        {row.filled_slots}<span className="font-mono text-cz-gray-light" style={{ fontSize: 17 }}>/{row.max_slots}</span>
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => !isFull && setSelected(row)}
                        disabled={isFull}
                      >
                        {isFull ? 'PLNÝ' : t('cta')}
                      </Button>
                    </div>
                  </div>

                  {/* ── Mobile card (< md) ── */}
                  <div className="md:hidden" style={{ padding: '20px 4px' }}>
                    <div className="flex items-center gap-4" style={{ marginBottom: 12 }}>
                      <div>
                        <div className="font-display text-cz-orange" style={{ fontSize: 32, lineHeight: 1 }}>{formatDate(row.date)}</div>
                        <span className="font-mono text-cz-gray-light" style={{ fontSize: 16, letterSpacing: 2 }}>{new Date(row.date).getUTCFullYear()}</span>
                      </div>
                      <span className="font-mono text-cz-gray-light uppercase border border-cz-gray-dark" style={{ fontSize: 16, letterSpacing: 2, borderRadius: 2, padding: '4px 8px' }}>
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
                            <span className="font-mono text-cz-gray-light uppercase block" style={{ fontSize: 16, letterSpacing: 2 }}>{t('prizePool')}</span>
                            <span className="font-display text-white" style={{ fontSize: 22 }}>
                              {row.prize_pool.toLocaleString('cs-CZ')} Kč
                            </span>
                          </div>
                        ) : null}
                        <div>
                          <span className="font-mono text-cz-gray-light uppercase block" style={{ fontSize: 16, letterSpacing: 2 }}>{t('registered')}</span>
                          <span className={`font-display tabular-nums ${isFull ? 'text-cz-orange' : 'text-white'}`} style={{ fontSize: 22 }}>
                            {row.filled_slots}<span className="font-mono text-cz-gray-light" style={{ fontSize: 17 }}>/{row.max_slots}</span>
                          </span>
                        </div>
                      </div>
                      <Button
                        variant={isFull ? 'ghost' : 'primary'}
                        size="sm"
                        onClick={() => !isFull && setSelected(row)}
                        disabled={isFull}
                      >
                        {isFull ? 'PLNÝ' : t('cta')}
                      </Button>
                    </div>
                  </div>
                </div>
                </Reveal>
              );
            })}
            <div className="border-t border-cz-gray-dark" />
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
