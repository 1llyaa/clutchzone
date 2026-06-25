import { useTranslations } from 'next-intl';
import LogoLockup from '@/components/ui/LogoLockup';

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
      <div
        className="max-w-[1440px] mx-auto flex flex-wrap justify-between"
        style={{ gap: 40 }}
      >
        {/* Logo + lockup */}
        <LogoLockup size={40} subtitle={t('lockup')} />

        {/* Opening hours */}
        <div>
          <span
            className="font-mono text-cz-orange uppercase block"
            style={{ fontSize: 10, letterSpacing: 3, marginBottom: 16 }}
          >
            {t('hoursHeading')}
          </span>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {hours.map((row) => (
              <div key={row.days} className="flex items-baseline" style={{ gap: 24 }}>
                <span
                  className="font-mono text-cz-gray-light uppercase"
                  style={{ fontSize: 11, letterSpacing: 1, minWidth: 100 }}
                >
                  {row.days}
                </span>
                <span
                  className="font-mono uppercase"
                  style={{
                    fontSize: 11,
                    letterSpacing: 1,
                    color: row.closed ? '#555' : '#E8E8E8',
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
            { label: t('instagram'), href: '#' },
            { label: t('discord'), href: '#' },
            { label: t('contact'), href: '#' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors duration-150 no-underline"
              style={{ fontSize: 12, letterSpacing: 2 }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div className="flex items-end">
          <span className="font-mono text-cz-gray-mid" style={{ fontSize: 11, letterSpacing: 1 }}>
            {t('copy')}
          </span>
        </div>
      </div>
    </footer>
  );
}
