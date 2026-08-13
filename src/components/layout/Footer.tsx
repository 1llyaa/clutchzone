import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import LogoLockup from '@/components/ui/LogoLockup';
import Reveal from '@/components/ui/Reveal';
import { BUSINESS } from '@/lib/business';

export default function Footer() {
  const t = useTranslations('footer');

  const hours = [
    { days: t('hours1days'), time: t('hours1time'), closed: true },
    { days: t('hours2days'), time: t('hours2time'), closed: false },
    { days: t('hours3days'), time: t('hours3time'), closed: false },
  ];

  return (
    <footer
      className="bg-cz-black px-6 py-14 md:px-16 md:py-[56px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <Reveal>
      <div
        className="max-w-[1440px] mx-auto flex flex-wrap justify-between"
        style={{ gap: 40 }}
      >
        {/* Logo + lockup */}
        <Link href="/" className="no-underline flex items-center" aria-label="Clutch Zone — domů">
          <LogoLockup size={40} subtitle={t('lockup')} />
        </Link>

        {/* Opening hours */}
        <div>
          <span
            className="font-mono text-cz-orange uppercase block"
            style={{ fontSize: 16, letterSpacing: 3, marginBottom: 16 }}
          >
            {t('hoursHeading')}
          </span>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {hours.map((row) => (
              <div key={row.days} className="flex items-baseline" style={{ gap: 24 }}>
                <span
                  className="font-mono text-cz-gray-light uppercase"
                  style={{ fontSize: 16, letterSpacing: 1, minWidth: 100 }}
                >
                  {row.days}
                </span>
                <span
                  className="font-mono uppercase"
                  style={{
                    fontSize: 16,
                    letterSpacing: 1,
                    color: row.closed ? '#888888' : '#E8E8E8',
                  }}
                >
                  {row.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col" style={{ gap: 16 }}>
          {[
            { label: t('instagram'), href: 'https://www.instagram.com/clutchzone.club/' },
            { label: t('discord'), href: '#' },
            { label: t('contact'), href: '#' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors duration-150 no-underline"
              style={{ fontSize: 16, letterSpacing: 2 }}
            >
              {link.label}
            </a>
          ))}
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
          style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', gap: 16 }}
        >
          <span className="font-mono text-cz-gray-light" style={{ fontSize: 16, letterSpacing: 0.5 }}>
            {BUSINESS.ownerName} · IČO: {BUSINESS.ico} · {BUSINESS.registeredAddress}
          </span>
          <div className="flex" style={{ gap: 24 }}>
            <Link
              href="/terms"
              className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors duration-150 no-underline"
              style={{ fontSize: 16, letterSpacing: 1.5 }}
            >
              {t('terms')}
            </Link>
            <Link
              href="/privacy"
              className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors duration-150 no-underline"
              style={{ fontSize: 16, letterSpacing: 1.5 }}
            >
              {t('privacy')}
            </Link>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
