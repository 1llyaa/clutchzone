import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';
import Logo from '@/components/ui/Logo';
import Reveal from '@/components/ui/Reveal';
import { BUSINESS } from '@/lib/business';
import { getPricingConfig } from '@/lib/pricing/config-server';

const DAY_NAMES_CS = ['NEDĚLE', 'PONDĚLÍ', 'ÚTERÝ', 'STŘEDA', 'ČTVRTEK', 'PÁTEK', 'SOBOTA'];

function formatClose(time: string): string {
  return time.slice(0, 5) === '24:00' ? '00:00' : time.slice(0, 5);
}

export default async function Footer() {
  const t = await getTranslations('footer');
  const config = await getPricingConfig();

  const closedLabel = config.openingHours
    .filter((d) => d.isClosed)
    .map((d) => DAY_NAMES_CS[d.dayOfWeek])
    .join(', ');

  const hours = [
    ...(closedLabel ? [{ days: closedLabel, time: t('closed'), closed: true }] : []),
    ...config.dayTypes.map((g) => ({
      days: g.label,
      time: g.openTime ? `${g.openTime.slice(0, 5)} – ${formatClose(g.closeTime ?? '')}` : '—',
      closed: false,
    })),
  ];

  return (
    <footer className="bg-cz-black px-6 py-9 md:px-16" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <Reveal>
      <div
        className="max-w-[1440px] mx-auto flex flex-wrap justify-between"
        style={{ gap: 40 }}
      >
        {/* Logo + lockup */}
        <Link
          href="/"
          className="no-underline flex items-center"
          style={{ gap: 12 }}
          aria-label="Clutch Zone — domů"
        >
          <Logo size={34} />
          <div className="flex flex-col" style={{ lineHeight: 1 }}>
            <span
              className="font-display text-white uppercase"
              style={{ fontSize: 19, letterSpacing: 2 }}
            >
              CLUTCH ZONE
            </span>
            <span
              className="font-mono text-cz-orange uppercase"
              style={{ fontSize: 16, letterSpacing: 3, marginTop: 4 }}
            >
              {t('lockup')}
            </span>
          </div>
        </Link>

        {/* Opening hours */}
        <div>
          <span
            className="font-mono text-cz-orange uppercase block"
            style={{ fontSize: 16, letterSpacing: 3, marginBottom: 16 }}
          >
            {t('hoursHeading')}
          </span>
          <div className="flex flex-col" style={{ gap: 6 }}>
            {hours.map((row) => (
              <div key={row.days} className="flex items-baseline" style={{ gap: 24 }}>
                <span
                  className="font-body font-medium text-cz-white-soft uppercase"
                  style={{ fontSize: 16, letterSpacing: 0.5, minWidth: 100 }}
                >
                  {row.days}
                </span>
                <span
                  className={`font-mono uppercase ${row.closed ? 'text-cz-gray-light' : 'text-cz-white-soft'}`}
                  style={{ fontSize: 16, letterSpacing: 1 }}
                >
                  {row.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <span
            className="font-mono text-cz-orange uppercase block"
            style={{ fontSize: 16, letterSpacing: 3, marginBottom: 16 }}
          >
            {t('followUs')}
          </span>
          <div className="flex flex-col" style={{ gap: 16 }}>
            {[
              { label: t('instagram'), href: 'https://www.instagram.com/clutchzone.club/' },
              { label: t('discord'), href: '#' },
              { label: t('contact'), href: '#' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-body font-medium text-cz-white-soft uppercase hover:text-white transition-colors duration-150 no-underline"
                style={{ fontSize: 16, letterSpacing: 1 }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="flex items-end">
          <span className="font-mono text-cz-gray-light" style={{ fontSize: 16, letterSpacing: 1 }}>
            {t('copy')}
          </span>
        </div>
      </div>
      </Reveal>

      {/* Legal */}
      <Reveal>
        <div
          className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between"
          style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)', gap: 16 }}
        >
          <span className="font-body text-cz-gray-light" style={{ fontSize: 16 }}>
            {BUSINESS.ownerName} · IČO: {BUSINESS.ico} · {BUSINESS.registeredAddress}
          </span>
          <div className="flex" style={{ gap: 24 }}>
            <Link
              href="/terms"
              className="font-body font-medium text-cz-white-soft uppercase hover:text-white transition-colors duration-150 no-underline"
              style={{ fontSize: 16, letterSpacing: 0.5 }}
            >
              {t('terms')}
            </Link>
            <Link
              href="/privacy"
              className="font-body font-medium text-cz-white-soft uppercase hover:text-white transition-colors duration-150 no-underline"
              style={{ fontSize: 16, letterSpacing: 0.5 }}
            >
              {t('privacy')}
            </Link>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
