'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Tournament {
  id: string;
  title: string;
  game: string;
  max_slots: number;
  filled_slots: number;
}

interface Props {
  tournament: Tournament | null;
  onClose: () => void;
}

const EMPTY = {
  team_name:       '',
  captain_name:    '',
  captain_email:   '',
  captain_discord: '',
  players_raw:     '',
};

export default function TournamentRegisterModal({ tournament, onClose }: Props) {
  const t = useTranslations('tournamentReg');
  const [form, setForm]       = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');

  // Reset form when a new tournament is opened
  useEffect(() => {
    if (tournament) {
      setForm(EMPTY);
      setDone(false);
      setError('');
    }
  }, [tournament?.id]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!tournament) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const player_names = form.players_raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch(`/api/tournaments/${tournament!.id}/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_name:       form.team_name,
        captain_name:    form.captain_name,
        captain_email:   form.captain_email,
        captain_discord: form.captain_discord || undefined,
        player_names:    player_names.length > 0 ? player_names : undefined,
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      setDone(true);
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (data.error === 'full') {
      setError(t('errorFull'));
    } else {
      setError(t('errorGeneral'));
    }
  }

  function field(id: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [id]: e.target.value }));
  }

  const slotsLeft = tournament.max_slots - tournament.filled_slots;

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
        {/* Orange top bar */}
        <span className="absolute top-0 left-0 right-0" style={{ height: 2, background: '#E84A1A' }} />

        {/* Header */}
        <div
          className="flex items-start justify-between px-5 pb-5 pt-7 md:px-8 md:pt-7"
        >
          <div>
            <div className="font-mono text-cz-orange uppercase" style={{ fontSize: 10, letterSpacing: 3 }}>
              {t('title')}
            </div>
            <div className="font-display text-white uppercase" style={{ fontSize: 28, letterSpacing: 1, marginTop: 4 }}>
              {tournament.title}
            </div>
            <div className="font-mono text-cz-gray-mid" style={{ fontSize: 11, marginTop: 4 }}>
              {tournament.game} · {slotsLeft} {slotsLeft === 1 ? 'místo' : 'míst'} zbývá
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

        {done ? (
          /* Success state */
          <div className="px-5 pb-8 pt-6 md:px-8">
            <div
              className="flex flex-col items-center text-center"
              style={{ padding: '32px 0' }}
            >
              <span style={{ fontSize: 40 }}>✓</span>
              <p className="font-body text-white" style={{ fontSize: 15, lineHeight: 1.7, marginTop: 16, maxWidth: 340 }}>
                {t('success')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark transition-colors rounded-[2px] border-none cursor-pointer"
              style={{ fontSize: 15, letterSpacing: 2, padding: 13 }}
            >
              {t('close')}
            </button>
          </div>
        ) : (
          /* Registration form */
          <form onSubmit={handleSubmit} className="px-5 pb-8 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Team name – full width */}
              <div className="flex flex-col gap-2" style={{ gridColumn: '1 / -1' }}>
                <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
                  {t('teamName')}
                </label>
                <input
                  type="text"
                  value={form.team_name}
                  onChange={field('team_name')}
                  required
                  maxLength={100}
                  placeholder={t('teamPlaceholder')}
                  className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange transition-colors"
                  style={{ padding: '10px 14px', fontSize: 14, border: '1px solid #2A2A2A' }}
                />
              </div>

              {/* Captain name */}
              <div className="flex flex-col gap-2">
                <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
                  {t('captainName')}
                </label>
                <input
                  type="text"
                  value={form.captain_name}
                  onChange={field('captain_name')}
                  required
                  maxLength={100}
                  placeholder={t('captainPlaceholder')}
                  className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange transition-colors"
                  style={{ padding: '10px 14px', fontSize: 14, border: '1px solid #2A2A2A' }}
                />
              </div>

              {/* Discord */}
              <div className="flex flex-col gap-2">
                <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
                  {t('discord')}
                </label>
                <input
                  type="text"
                  value={form.captain_discord}
                  onChange={field('captain_discord')}
                  maxLength={100}
                  placeholder={t('discordPlaceholder')}
                  className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange transition-colors"
                  style={{ padding: '10px 14px', fontSize: 14, border: '1px solid #2A2A2A' }}
                />
              </div>

              {/* Email – full width */}
              <div className="flex flex-col gap-2" style={{ gridColumn: '1 / -1' }}>
                <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={form.captain_email}
                  onChange={field('captain_email')}
                  required
                  placeholder={t('emailPlaceholder')}
                  className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange transition-colors"
                  style={{ padding: '10px 14px', fontSize: 14, border: '1px solid #2A2A2A' }}
                />
              </div>

              {/* Player names textarea – full width */}
              <div className="flex flex-col gap-2" style={{ gridColumn: '1 / -1' }}>
                <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
                  {t('players')}
                  <span className="ml-2 normal-case font-body text-cz-gray-mid" style={{ fontSize: 11, letterSpacing: 0 }}>
                    — {t('playersHint')}
                  </span>
                </label>
                <textarea
                  value={form.players_raw}
                  onChange={field('players_raw')}
                  rows={3}
                  placeholder={t('playersPlaceholder')}
                  className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange transition-colors resize-none"
                  style={{ padding: '10px 14px', fontSize: 14, border: '1px solid #2A2A2A' }}
                />
              </div>
            </div>

            {error && (
              <p className="font-mono text-red-400" style={{ fontSize: 11, letterSpacing: 1, marginTop: 12 }}>
                {error}
              </p>
            )}

            <div className="flex gap-3" style={{ marginTop: 20 }}>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark transition-colors rounded-[2px] border-none cursor-pointer disabled:opacity-50"
                style={{ fontSize: 15, letterSpacing: 2, padding: 13 }}
              >
                {submitting ? '...' : t('submit')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="font-display uppercase text-cz-gray-mid hover:text-white transition-colors rounded-[2px] cursor-pointer"
                style={{ fontSize: 15, letterSpacing: 2, padding: '13px 24px', border: '1px solid #2A2A2A', background: 'transparent' }}
              >
                {t('close')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
