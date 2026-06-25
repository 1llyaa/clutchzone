import { createAdminClient } from '@/lib/supabase/admin';
import { getLocale } from 'next-intl/server';

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
}

async function fetchStats() {
  const admin = createAdminClient();
  const today = new Date().toISOString().split('T')[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const [todayBookings, weekBookings, unreadMessages, recentBookings] = await Promise.all([
    admin.from('bookings').select('id, total_price').eq('date', today).neq('status', 'cancelled'),
    admin.from('bookings').select('id, total_price').gte('date', weekStartStr).neq('status', 'cancelled'),
    admin.from('contact_messages').select('id').eq('is_read', false),
    admin
      .from('bookings')
      .select('id, reference, customer_name, date, start_time, total_price, status, stations(label, type)')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const todayCount   = todayBookings.data?.length ?? 0;
  const todayRevenue = todayBookings.data?.reduce((s, b) => s + b.total_price, 0) ?? 0;
  const weekCount    = weekBookings.data?.length ?? 0;
  const weekRevenue  = weekBookings.data?.reduce((s, b) => s + b.total_price, 0) ?? 0;
  const unread       = unreadMessages.data?.length ?? 0;

  return {
    todayCount, todayRevenue, weekCount, weekRevenue, unread,
    recent: recentBookings.data ?? [],
  };
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Potvrzeno',
  pending:   'Čeká',
  cancelled: 'Zrušeno',
  completed: 'Dokončeno',
};
const STATUS_COLOR: Record<string, string> = {
  confirmed: '#22c55e',
  pending:   '#eab308',
  cancelled: '#ef4444',
  completed: '#888888',
};

export default async function AdminDashboard() {
  const [stats, locale] = await Promise.all([fetchStats(), getLocale()]);

  const cards: StatCard[] = [
    { label: 'REZERVACE DNES',   value: stats.todayCount,              sub: `${stats.todayRevenue} Kč` },
    { label: 'PŘÍJMY DNES',      value: `${stats.todayRevenue} Kč`,   sub: `${stats.todayCount} rezervací` },
    { label: 'REZERVACE TÝDEN',  value: stats.weekCount,               sub: `${stats.weekRevenue} Kč` },
    { label: 'NEPŘEČTENÉ ZPRÁVY', value: stats.unread,                 sub: stats.unread > 0 ? 'Nové zprávy' : 'Vše přečteno' },
  ];

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>
          DASHBOARD
        </h1>
        <p className="font-mono text-cz-gray-mid" style={{ fontSize: 11, letterSpacing: 2, marginTop: 4 }}>
          {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 48 }}>
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-cz-black-mid rounded-cz"
            style={{ padding: '24px 28px', border: '1px solid #2A2A2A' }}
          >
            <div className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>
              {card.label}
            </div>
            <div className="font-display text-white" style={{ fontSize: 40, lineHeight: 1, letterSpacing: 1 }}>
              {card.value}
            </div>
            {card.sub && (
              <div className="font-mono text-cz-gray-light" style={{ fontSize: 11, marginTop: 8 }}>
                {card.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div>
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: 16 }}
        >
          <h2 className="font-display text-white uppercase" style={{ fontSize: 20, letterSpacing: 2 }}>
            POSLEDNÍ REZERVACE
          </h2>
          <a
            href={`/${locale}/admin/bookings`}
            className="font-mono text-cz-orange uppercase hover:underline"
            style={{ fontSize: 10, letterSpacing: 2 }}
          >
            ZOBRAZIT VŠE →
          </a>
        </div>

        <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid #2A2A2A' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                {['REFERENCE', 'ZÁKAZNÍK', 'STANICE', 'DATUM', 'ČAS', 'CELKEM', 'STATUS'].map((h) => (
                  <th
                    key={h}
                    className="font-mono text-cz-gray-mid uppercase text-left"
                    style={{ padding: '12px 16px', fontSize: 10, letterSpacing: 2 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recent.length === 0 ? (
                <tr>
                  <td colSpan={7} className="font-mono text-cz-gray-mid text-center" style={{ padding: 32, fontSize: 12 }}>
                    Žádné rezervace
                  </td>
                </tr>
              ) : (
                stats.recent.map((b: any) => (
                  <tr
                    key={b.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td className="font-mono text-cz-orange" style={{ padding: '12px 16px', fontSize: 12 }}>
                      {b.reference}
                    </td>
                    <td className="font-body text-white" style={{ padding: '12px 16px', fontSize: 13 }}>
                      {b.customer_name}
                    </td>
                    <td className="font-mono text-cz-gray-light" style={{ padding: '12px 16px', fontSize: 12 }}>
                      {b.stations?.label ?? '—'}
                    </td>
                    <td className="font-mono text-cz-gray-light" style={{ padding: '12px 16px', fontSize: 12 }}>
                      {new Date(b.date).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="font-mono text-cz-gray-light" style={{ padding: '12px 16px', fontSize: 12 }}>
                      {b.start_time?.slice(0, 5)}
                    </td>
                    <td className="font-body text-white" style={{ padding: '12px 16px', fontSize: 13 }}>
                      {b.total_price} Kč
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className="font-mono uppercase rounded-[2px]"
                        style={{
                          fontSize: 9,
                          letterSpacing: 1,
                          padding: '3px 8px',
                          color: STATUS_COLOR[b.status] ?? '#888',
                          background: (STATUS_COLOR[b.status] ?? '#888') + '20',
                        }}
                      >
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
