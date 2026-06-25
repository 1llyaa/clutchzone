'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/navigation';
import LogoLockup from '@/components/ui/LogoLockup';
import { useReservation } from '@/components/reservation/ReservationContext';

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { open } = useReservation();

  const switchLocale = (next: string) => {
    router.replace(pathname, { locale: next });
  };

  const links = [
    { label: t('herna'), href: '#herna' },
    { label: t('cenik'), href: '#cenik' },
    { label: t('turnaje'), href: '#turnaje' },
    { label: t('kontakt'), href: '#kontakt' },
  ];

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between bg-cz-black px-6 py-5 md:px-16 md:py-7"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <LogoLockup size={36} />

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-10">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors duration-150"
            style={{ fontSize: 12, letterSpacing: 2 }}
          >
            {link.label}
          </a>
        ))}

        <div className="flex items-center gap-2 ml-2">
          {(['cs', 'en'] as const).map((l, i) => (
            <span key={l} className="flex items-center gap-2">
              {i > 0 && <span className="text-cz-gray-dark font-mono text-xs">|</span>}
              <button
                onClick={() => switchLocale(l)}
                className="font-mono uppercase transition-colors duration-150 bg-transparent border-none cursor-pointer"
                style={{ fontSize: 11, letterSpacing: 2, color: locale === l ? '#E84A1A' : '#555' }}
              >
                {l.toUpperCase()}
              </button>
            </span>
          ))}
        </div>

        <button
          onClick={open}
          className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark active:scale-[0.96] transition-[background-color,scale] duration-150 ease-out rounded-[2px] cursor-pointer border-none"
          style={{ fontSize: 16, letterSpacing: 2, padding: '11px 26px' }}
        >
          {t('cta')}
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-2"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        <span className="block w-6 h-[1.5px] bg-white transition-[opacity] duration-150" style={{ opacity: menuOpen ? 0 : 1 }} />
        <span className="block w-6 h-[1.5px] bg-white" />
        <span className="block w-6 h-[1.5px] bg-white transition-[opacity] duration-150" style={{ opacity: menuOpen ? 0 : 1 }} />
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="absolute top-full left-0 right-0 bg-cz-black-mid md:hidden flex flex-col"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px' }}
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors py-3"
              style={{ fontSize: 13, letterSpacing: 2, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-3 mt-4 mb-4">
            {(['cs', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => { switchLocale(l); setMenuOpen(false); }}
                className="font-mono uppercase transition-colors bg-transparent border-none cursor-pointer"
                style={{ fontSize: 11, letterSpacing: 2, color: locale === l ? '#E84A1A' : '#555' }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => { open(); setMenuOpen(false); }}
            className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark active:scale-[0.96] transition-[background-color,scale] duration-150 ease-out rounded-[2px] border-none cursor-pointer"
            style={{ fontSize: 15, letterSpacing: 2, padding: '13px 0' }}
          >
            {t('cta')}
          </button>
        </div>
      )}
    </nav>
  );
}
