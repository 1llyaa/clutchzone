'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

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

interface Props {
  tournament: Tournament | null;
  onClose: () => void;
  onRegister: (tournament: Tournament) => void;
}

export default function TournamentDetailModal({ tournament, onClose, onRegister }: Props) {
  const t = useTranslations('tournaments');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!tournament) return null;

  const isFull = tournament.filled_slots >= tournament.max_slots;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', padding: 24 }}
      onClick={onClose}
    >
      <div
        className="relative bg-cz-black-mid rounded-cz w-full max-w-lg overflow-y-auto"
        style={{ border: '1px solid #2A2A2A', maxHeight: '90dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="absolute top-0 left-0 right-0" style={{ height: 2, background: '#E84A1A' }} />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pb-5 pt-7 md:px-8 md:pt-7">
          <div>
            <div className="font-mono text-cz-orange uppercase" style={{ fontSize: 10, letterSpacing: 3 }}>
              {t('detailTitle')}
            </div>
            <div className="font-display text-white uppercase" style={{ fontSize: 28, letterSpacing: 1, marginTop: 4 }}>
              {tournament.title}
            </div>
            <div className="font-mono text-cz-gray-mid" style={{ fontSize: 11, marginTop: 4 }}>
              {tournament.game} · {formatDate(tournament.date)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-cz-gray-mid hover:text-white transition-colors"
            style={{ fontSize: 20, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div className="px-5 pb-8 md:px-8">
          {/* Stats row */}
          <div className="flex gap-8" style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #2A2A2A' }}>
            <div>
              <div className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>{t('prizePool')}</div>
              <div className="font-display text-white" style={{ fontSize: 24, marginTop: 2 }}>
                {tournament.prize_pool ? `${tournament.prize_pool.toLocaleString('cs-CZ')} Kč` : '—'}
              </div>
            </div>
            <div>
              <div className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>{t('registered')}</div>
              <div className={`font-display tabular-nums ${isFull ? 'text-cz-orange' : 'text-white'}`} style={{ fontSize: 24, marginTop: 2 }}>
                {tournament.filled_slots}<span className="font-mono text-cz-gray-mid" style={{ fontSize: 13 }}>/{tournament.max_slots}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p
            className="font-body text-cz-white-soft"
            style={{ fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: 28 }}
          >
            {tournament.description?.trim() || t('noDescription')}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => onRegister(tournament)}
              disabled={isFull}
              className="flex-1 bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark active:not-disabled:scale-[0.96] transition-[background-color,scale] duration-150 ease-out rounded-[2px] border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontSize: 15, letterSpacing: 2, padding: 13 }}
            >
              {isFull ? 'PLNÝ' : t('detailCta')}
            </button>
            <button
              onClick={onClose}
              className="font-display uppercase text-cz-gray-mid hover:text-white transition-colors rounded-[2px] cursor-pointer"
              style={{ fontSize: 15, letterSpacing: 2, padding: '13px 24px', border: '1px solid #2A2A2A', background: 'transparent' }}
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
