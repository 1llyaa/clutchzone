import { useTranslations } from 'next-intl';

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

  function formatDate(iso: string) {
    const d = new Date(iso);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  }

  return (
    <section
      id="turnaje"
      className="relative bg-cz-black"
      style={{ padding: '120px 64px', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-[1440px] mx-auto">
        <div style={{ marginBottom: 56 }}>
          <span
            className="font-mono text-cz-orange uppercase block"
            style={{ fontSize: 11, letterSpacing: 4, marginBottom: 10 }}
          >
            {t('eyebrow')}
          </span>
          <h2
            className="font-display text-white uppercase"
            style={{ fontSize: 60, letterSpacing: 1.5, lineHeight: 0.95 }}
          >
            {t('heading')}
          </h2>
        </div>

        <div className="flex flex-col">
          {tournaments.length === 0 ? (
            <div
              className="font-mono text-cz-gray-mid uppercase text-center"
              style={{ padding: '48px 0', borderTop: '1px solid #2A2A2A', fontSize: 12, letterSpacing: 3 }}
            >
              ŽÁDNÉ NADCHÁZEJÍCÍ TURNAJE
            </div>
          ) : (
            tournaments.map((row) => (
              <div
                key={row.id}
                className="group transition-colors duration-150 hover:bg-cz-black-mid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 130px 1fr 160px 180px',
                  alignItems: 'center',
                  gap: 24,
                  padding: '28px 8px',
                  borderTop: '1px solid #2A2A2A',
                }}
              >
                {/* Date */}
                <div>
                  <div className="font-display text-cz-orange" style={{ fontSize: 40, lineHeight: 1 }}>
                    {formatDate(row.date)}
                  </div>
                  <span className="font-mono text-cz-gray-mid block" style={{ fontSize: 11, letterSpacing: 2, marginTop: 2 }}>
                    {t('year')}
                  </span>
                </div>

                {/* Game */}
                <span
                  className="font-mono text-cz-gray-light uppercase justify-self-start"
                  style={{
                    fontSize: 11,
                    letterSpacing: 2,
                    border: '1px solid #2A2A2A',
                    borderRadius: 2,
                    padding: '6px 10px',
                  }}
                >
                  {row.game}
                </span>

                {/* Title */}
                <h3
                  className="font-display text-white uppercase"
                  style={{ fontSize: 32, letterSpacing: 1 }}
                >
                  {row.title}
                </h3>

                {/* Prize */}
                <div>
                  <span
                    className="font-mono text-cz-gray-mid uppercase block"
                    style={{ fontSize: 10, letterSpacing: 2 }}
                  >
                    {t('prizePool')}
                  </span>
                  <span className="font-display text-white" style={{ fontSize: 28 }}>
                    {row.prize_pool ? `${row.prize_pool.toLocaleString('cs-CZ')} Kč` : '—'}
                  </span>
                </div>

                {/* Slots + CTA */}
                <div className="flex flex-col items-end gap-2">
                  <span className="font-mono text-cz-gray-light" style={{ fontSize: 11, letterSpacing: 1 }}>
                    {row.filled_slots} / {row.max_slots}
                  </span>
                  <button
                    className="bg-transparent text-white font-display uppercase hover:text-cz-orange hover:border-cz-orange transition-all duration-150 rounded-[2px] cursor-pointer"
                    style={{ fontSize: 15, letterSpacing: 2, padding: '9px 22px', border: '1.5px solid #2A2A2A' }}
                  >
                    {t('cta')}
                  </button>
                </div>
              </div>
            ))
          )}
          <div style={{ borderTop: '1px solid #2A2A2A' }} />
        </div>
      </div>
    </section>
  );
}
