'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Bell } from '@phosphor-icons/react';

interface BookingRow {
  id: string;
  reference: string;
  customer_name: string;
  date: string;
  start_time: string;
  station_id: string;
  total_price: number;
}

interface RegistrationRow {
  id: string;
  tournament_id: string;
  team_name: string;
  captain_name: string;
}

interface LogEntry {
  id: string;
  title: string;
  body: string;
  href: string;   // where to navigate on click
  at: number;     // received timestamp
  read: boolean;
}

const LOG_KEY = 'cz_admin_notifications';
const LOG_CAP = 50;

function loadLog(): LogEntry[] {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]'); } catch { return []; }
}

function saveLog(log: LogEntry[]) {
  localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, LOG_CAP)));
}

export default function AdminNotifications({ locale }: { locale: string }) {
  const router = useRouter();
  const [toasts, setToasts] = useState<LogEntry[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(null);

  function getSupabase() {
    if (!supabaseRef.current) {
      supabaseRef.current = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    return supabaseRef.current;
  }

  const goToEntry = useCallback((entry: LogEntry) => {
    setLog((prev) => {
      const next = prev.map((e) => (e.id === entry.id ? { ...e, read: true } : e));
      saveLog(next);
      return next;
    });
    setToasts((prev) => prev.filter((t) => t.id !== entry.id));
    setPanelOpen(false);
    router.push(entry.href);
  }, [router]);

  const addEntry = useCallback((entry: LogEntry) => {
    setLog((prev) => {
      const next = [entry, ...prev];
      saveLog(next);
      return next;
    });
    setToasts((prev) => [...prev, entry]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== entry.id));
    }, 8000);
  }, []);

  useEffect(() => {
    setPermission(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
    setLog(loadLog());

    const supabase = getSupabase();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // bookings RLS is admin-only (migration 010): realtime must be
    // authenticated with the admin session BEFORE subscribing, otherwise
    // the channel joins as anon and receives no events.
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
      .channel('admin-bookings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        async (payload: { new: BookingRow }) => {
          const b = payload.new;

          let stationLabel = '';
          const { data: station } = await supabase
            .from('stations')
            .select('label')
            .eq('id', b.station_id)
            .single();
          if (station) stationLabel = station.label as string;

          const href = `/${locale}/admin/bookings?from=${b.date}&to=${b.date}`;
          const entry: LogEntry = {
            id: b.id,
            title: 'Nová rezervace',
            body: `${b.customer_name} · ${stationLabel || 'stanice'} · ${b.date} ${String(b.start_time).slice(0, 5)} · ${b.total_price} Kč (${b.reference})`,
            href,
            at: Date.now(),
            read: false,
          };

          addEntry(entry);

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const n = new Notification(entry.title, { body: entry.body, icon: '/favicon.ico', tag: b.id });
            n.onclick = () => {
              window.focus();
              window.location.href = href;
              n.close();
            };
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tournament_registrations' },
        async (payload: { new: RegistrationRow }) => {
          const r = payload.new;

          let tournamentTitle = '';
          const { data: tournament } = await supabase
            .from('tournaments')
            .select('title')
            .eq('id', r.tournament_id)
            .single();
          if (tournament) tournamentTitle = tournament.title as string;

          const href = `/${locale}/admin/tournaments`;
          const entry: LogEntry = {
            id: r.id,
            title: 'Nová registrace na turnaj',
            body: `${r.team_name} (${r.captain_name}) · ${tournamentTitle || 'turnaj'}`,
            href,
            at: Date.now(),
            read: false,
          };

          addEntry(entry);

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const n = new Notification(entry.title, { body: entry.body, icon: '/favicon.ico', tag: r.id });
            n.onclick = () => {
              window.focus();
              window.location.href = href;
              n.close();
            };
          }
        }
      )
      .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [addEntry, locale]);

  async function enableSystemNotifications() {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      new Notification('Notifikace zapnuty', { body: 'Budete upozorněni na nové rezervace i registrace na turnaje.', icon: '/favicon.ico' });
    }
  }

  function markAllRead() {
    setLog((prev) => {
      const next = prev.map((e) => ({ ...e, read: true }));
      saveLog(next);
      return next;
    });
  }

  const unread = log.filter((e) => !e.read).length;

  return (
    <>
      {/* Bottom-right controls: permission prompt + bell */}
      <div className="fixed bottom-5 right-5 z-[90] flex items-center gap-2">
        {permission === 'default' && (
          <button
            onClick={enableSystemNotifications}
            className="flex items-center gap-2 bg-cz-black-mid font-mono text-cz-white-soft uppercase rounded-[2px] cursor-pointer hover:border-cz-orange transition-[border-color] duration-150"
            style={{ fontSize: 16, letterSpacing: 1.5, padding: '13px 14px', border: '1px solid #2A2A2A' }}
          >
            <span className="rounded-full bg-cz-orange" style={{ width: 6, height: 6 }} />
            POVOLIT NOTIFIKACE
          </button>
        )}
        <button
          onClick={() => { setPanelOpen((o) => !o); if (!panelOpen) markAllRead(); }}
          aria-label="Notifikace"
          className="relative flex items-center justify-center bg-cz-black-mid rounded-[2px] cursor-pointer hover:border-cz-orange transition-[border-color] duration-150"
          style={{ width: 44, height: 44, border: '1px solid #2A2A2A' }}
        >
          <Bell size={20} weight="bold" className="text-cz-white-soft" />
          {unread > 0 && (
            <span
              className="absolute font-mono text-white bg-cz-orange rounded-full flex items-center justify-center tabular-nums"
              style={{ top: -8, right: -8, minWidth: 24, height: 24, fontSize: 16, padding: '0 5px' }}
            >
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* Log panel */}
      {panelOpen && (
        <div
          className="fixed bottom-[76px] right-5 z-[95] bg-cz-black-mid rounded-cz overflow-hidden animate-menu-in flex flex-col"
          style={{ width: 380, maxWidth: 'min(380px, 92vw)', maxHeight: 480, border: '1px solid #2A2A2A', boxShadow: 'var(--shadow-float-lg)' }}
        >
          <div className="flex items-center justify-between" style={{ padding: '14px 16px', borderBottom: '1px solid #2A2A2A' }}>
            <span className="font-mono text-cz-orange uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>
              HISTORIE NOTIFIKACÍ
            </span>
            <button
              onClick={() => { setLog([]); saveLog([]); }}
              className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors cursor-pointer"
              style={{ fontSize: 16, letterSpacing: 1 }}
            >
              VYMAZAT
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            {log.length === 0 ? (
              <div className="font-mono text-cz-gray-light text-center uppercase" style={{ padding: 32, fontSize: 16, letterSpacing: 2 }}>
                Žádné notifikace
              </div>
            ) : (
              log.map((e) => (
                <button
                  key={e.id + e.at}
                  onClick={() => goToEntry(e)}
                  className="w-full text-left cursor-pointer hover:bg-white/[0.03] transition-colors duration-150"
                  style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'transparent', border: 'none', borderBottomStyle: 'solid', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                    {!e.read && <span className="rounded-full bg-cz-orange flex-shrink-0" style={{ width: 6, height: 6 }} />}
                    <span className="font-mono text-cz-orange uppercase" style={{ fontSize: 16, letterSpacing: 1.5 }}>{e.title}</span>
                    <span className="font-mono text-cz-gray-light" style={{ fontSize: 17, marginLeft: 'auto' }}>
                      {new Date(e.at).toLocaleString('cs-CZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="font-body text-cz-white-soft" style={{ fontSize: 19, lineHeight: 1.5 }}>{e.body}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toast stack — click goes to bookings for that date; sits above the bell */}
      <div className="fixed bottom-[76px] right-5 z-[100] flex flex-col gap-2" style={{ maxWidth: 'min(380px, 92vw)' }}>
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => goToEntry(t)}
            className="text-left bg-cz-black-mid rounded-cz animate-menu-in cursor-pointer hover:bg-cz-black-light transition-colors duration-150"
            style={{ border: '1px solid #E84A1A', padding: '14px 16px', boxShadow: 'var(--shadow-float-lg)' }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <span className="rounded-full bg-cz-orange animate-flicker flex-shrink-0" style={{ width: 7, height: 7 }} />
              <span className="font-mono text-cz-orange uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>{t.title}</span>
            </div>
            <p className="font-body text-cz-white-soft" style={{ fontSize: 19, lineHeight: 1.5 }}>{t.body}</p>
          </button>
        ))}
      </div>
    </>
  );
}
