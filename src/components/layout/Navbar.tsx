'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter, usePathname } from '@/navigation';
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
    { label: t('akce'), href: '#akce' },
    { label: t('kontakt'), href: '#kontakt' },
  ];

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between bg-cz-black px-6 py-5 md:px-16 md:py-7"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <Link href="/" className="no-underline flex items-center" aria-label="Clutch Zone — domů">
        <LogoLockup size={36} />
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-10">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="font-body text-cz-white-soft uppercase hover:text-white transition-[color] duration-200 ease-out cz-link-underline"
            style={{ fontSize: 12, fontWeight: 500, letterSpacing: 1.2 }}
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
                style={{ fontSize: 12, letterSpacing: 1, color: locale === l ? '#E84A1A' : '#888888' }}
              >
                {l.toUpperCase()}
              </button>
            </span>
          ))}
        </div>

        <button
          onClick={open}
          className="bg-cz-orange text-white font-display uppercase border-[1.5px] border-cz-orange hover:bg-cz-orange-dark hover:border-cz-orange-dark hover:shadow-[0_0_18px_rgba(232,74,26,0.35)] active:scale-[0.96] transition-[background-color,border-color,scale,box-shadow] duration-150 ease-out rounded-[2px] cursor-pointer"
          style={{ fontSize: 16, letterSpacing: 1.5, lineHeight: 1, padding: '11px 22px' }}
        >
          {t('cta')}
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden flex flex-col justify-center gap-[5px] bg-transparent border-none cursor-pointer"
        style={{ width: 44, height: 44, padding: '10px 9px' }}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        <span
          className="block w-6 h-[1.5px] bg-white origin-center"
          style={{
            transition: 'transform 220ms cubic-bezier(0.2,0,0,1)',
            transform: menuOpen ? 'translateY(6.5px) rotate(45deg)' : 'none',
          }}
        />
        <span
          className="block w-6 h-[1.5px] bg-white origin-center"
          style={{
            transition: 'opacity 160ms ease-out, scale 160ms ease-out',
            opacity: menuOpen ? 0 : 1,
            scale: menuOpen ? '0.2' : '1',
          }}
        />
        <span
          className="block w-6 h-[1.5px] bg-white origin-center"
          style={{
            transition: 'transform 220ms cubic-bezier(0.2,0,0,1)',
            transform: menuOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
          }}
        />
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="absolute top-full left-0 right-0 bg-cz-black-mid md:hidden flex flex-col animate-menu-in"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px' }}
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-body text-cz-white-soft uppercase hover:text-white transition-[color] duration-200 ease-out py-3"
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: 1.2, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
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
                style={{ fontSize: 12, letterSpacing: 1, color: locale === l ? '#E84A1A' : '#888888' }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => { open(); setMenuOpen(false); }}
            className="bg-cz-orange text-white font-display uppercase border-[1.5px] border-cz-orange hover:bg-cz-orange-dark hover:border-cz-orange-dark active:scale-[0.96] transition-[background-color,border-color,scale] duration-150 ease-out rounded-[2px] cursor-pointer"
            style={{ fontSize: 16, letterSpacing: 1.5, lineHeight: 1, padding: '11px 22px' }}
          >
            {t('cta')}
          </button>
        </div>
      )}
    </nav>
  );
}
