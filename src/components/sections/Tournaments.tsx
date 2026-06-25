'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import TournamentRegisterModal from '@/components/tournament/TournamentRegisterModal';

interface Tournament {
  id: string;
  title: string;
  game: string;
  date: string;
  prize_pool: number | null;
  max_slots: number;
  filled_slots: number;
}

export default function Tournaments({ tournaments }: { tournaments: Tournament[] }) {
  const t = useTranslations('tournaments');
  const [selected, setSelected] = useState<Tournament | null>(null);

  function formatDate(iso: string) {
    const d = new Date(iso);
    const day   = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  }

  return (
    <section
      id="turnaje"
      className="relative bg-cz-black px-6 py-20 md:px-16 md:py-[120px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-[1440px] mx-auto">
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
                    className="hidden md:grid group transition-colors duration-150 hover:bg-cz-black-mid"
                    style={{
                      gridTemplateColumns: '140px 130px 1fr 160px 180px',
                      alignItems: 'center',
                      gap: 24,
                      padding: '28px 8px',
                    }}
                  >
                    <div>
                      <div className="font-display text-cz-orange" style={{ fontSize: 40, lineHeight: 1 }}>{formatDate(row.date)}</div>
                      <span className="font-mono text-cz-gray-mid block" style={{ fontSize: 11, letterSpacing: 2, marginTop: 2 }}>{t('year')}</span>
                    </div>
                    <span className="font-mono text-cz-gray-light uppercase justify-self-start" style={{ fontSize: 11, letterSpacing: 2, border: '1px solid #2A2A2A', borderRadius: 2, padding: '6px 10px' }}>
                      {row.game}
                    </span>
                    <h3 className="font-display text-white uppercase" style={{ fontSize: 32, letterSpacing: 1 }}>{row.title}</h3>
                    <div>
                      <span className="font-mono text-cz-gray-mid uppercase block" style={{ fontSize: 10, letterSpacing: 2 }}>{t('prizePool')}</span>
                      <span className="font-display text-white" style={{ fontSize: 28 }}>
                        {row.prize_pool ? `${row.prize_pool.toLocaleString('cs-CZ')} Kč` : '—'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-mono text-cz-gray-light" style={{ fontSize: 11, letterSpacing: 1 }}>{row.filled_slots} / {row.max_slots}</span>
                      <button
                        onClick={() => !isFull && setSelected(row)}
                        disabled={isFull}
                        className="font-display uppercase transition-all duration-150 rounded-[2px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ fontSize: 15, letterSpacing: 2, padding: '9px 22px', background: 'transparent', color: isFull ? '#555' : '#fff', border: '1.5px solid #2A2A2A' }}
                        onMouseEnter={(e) => { if (!isFull) { (e.currentTarget as HTMLButtonElement).style.color = '#E84A1A'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E84A1A'; } }}
                        onMouseLeave={(e) => { if (!isFull) { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#2A2A2A'; } }}
                      >
                        {isFull ? 'PLNÝ' : t('cta')}
                      </button>
                    </div>
                  </div>

                  {/* ── Mobile card (< md) ── */}
                  <div className="md:hidden py-5" style={{ padding: '20px 4px' }}>
                    <div className="flex items-start justify-between gap-4" style={{ marginBottom: 12 }}>
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-display text-cz-orange" style={{ fontSize: 32, lineHeight: 1 }}>{formatDate(row.date)}</div>
                          <span className="font-mono text-cz-gray-mid" style={{ fontSize: 10, letterSpacing: 2 }}>{t('year')}</span>
                        </div>
                        <span className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2, border: '1px solid #2A2A2A', borderRadius: 2, padding: '4px 8px' }}>
                          {row.game}
                        </span>
                      </div>
                      <span className="font-mono text-cz-gray-light" style={{ fontSize: 11, letterSpacing: 1, flexShrink: 0 }}>
                        {row.filled_slots}/{row.max_slots}
                      </span>
                    </div>

                    <h3 className="font-display text-white uppercase" style={{ fontSize: 'clamp(20px, 5vw, 28px)', letterSpacing: 1, marginBottom: 10 }}>
                      {row.title}
                    </h3>

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      {row.prize_pool ? (
                        <div>
                          <span className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 9, letterSpacing: 2 }}>{t('prizePool')}</span>
                          <span className="font-display text-white block" style={{ fontSize: 22 }}>
                            {row.prize_pool.toLocaleString('cs-CZ')} Kč
                          </span>
                        </div>
                      ) : <div />}
                      <button
                        onClick={() => !isFull && setSelected(row)}
                        disabled={isFull}
                        className="font-display uppercase rounded-[2px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

      <TournamentRegisterModal tournament={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
