'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import Logo from '@/components/ui/Logo';
import type { AdminProfile } from '@/lib/admin/auth';

const NAV = [
  { href: '/admin',             label: 'DASHBOARD',  exact: true },
  { href: '/admin/bookings',    label: 'REZERVACE' },
  { href: '/admin/tournaments', label: 'TURNAJE' },
  { href: '/admin/gallery',     label: 'GALERIE' },
  { href: '/admin/games',       label: 'HRY' },
  { href: '/admin/pricing',     label: 'CENÍK',      ownerOnly: true },
  { href: '/admin/messages',    label: 'ZPRÁVY' },
  { href: '/admin/settings',    label: 'NASTAVENÍ',  ownerOnly: true },
];

const STATUS_DOT: Record<string, string> = {
  owner: '#E84A1A',
  staff: '#888888',
};
const ROLE_LABEL: Record<string, string> = {
  owner: 'MAJITEL',
  staff: 'RECEPCE',
};

export default function AdminSidebar({
  profile,
  locale,
}: {
  profile: AdminProfile;
  locale: string;
}) {
  const pathname = usePathname();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = `/${locale}/admin/login`;
  }

  function isActive(href: string, exact?: boolean) {
    const full = `/${locale}${href}`;
    return exact ? pathname === full : pathname.startsWith(full);
  }

  const visibleNav = NAV.filter((item) => !item.ownerOnly || profile.role === 'owner');

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-cz-black-mid"
      style={{ width: 240, borderRight: '1px solid #2A2A2A' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3"
        style={{ padding: '22px 20px', borderBottom: '1px solid #2A2A2A' }}
      >
        <Logo size={30} />
        <div>
          <div className="font-display text-white uppercase" style={{ fontSize: 15, letterSpacing: 1 }}>
            CLUTCH ZONE
          </div>
          <div className="font-mono text-cz-orange uppercase" style={{ fontSize: 9, letterSpacing: 3 }}>
            ADMIN
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col" style={{ padding: '12px 10px', gap: 2 }}>
        {visibleNav.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className="flex items-center gap-3 rounded-[2px] font-mono uppercase transition-colors duration-100"
              style={{
                padding: '9px 12px',
                fontSize: 11,
                letterSpacing: 2,
                color: active ? '#E84A1A' : '#888888',
                background: active ? 'rgba(232,74,26,0.08)' : 'transparent',
              }}
            >
              {active && (
                <span
                  className="flex-shrink-0"
                  style={{ width: 3, height: 12, background: '#E84A1A', borderRadius: 1 }}
                />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #2A2A2A' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
          <span
            className="rounded-full flex-shrink-0"
            style={{ width: 7, height: 7, background: STATUS_DOT[profile.role] }}
          />
          <div className="min-w-0">
            <div
              className="font-body text-white truncate"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              {profile.display_name || profile.email}
            </div>
            <div
              className="font-mono uppercase"
              style={{ fontSize: 9, letterSpacing: 2, color: STATUS_DOT[profile.role] }}
            >
              {ROLE_LABEL[profile.role]}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="font-mono text-cz-gray-mid uppercase hover:text-white transition-colors"
          style={{ fontSize: 10, letterSpacing: 2 }}
        >
          ODHLÁSIT SE →
        </button>
      </div>
    </aside>
  );
}
