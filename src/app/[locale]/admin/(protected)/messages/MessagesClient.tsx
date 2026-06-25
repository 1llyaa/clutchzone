'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesClient({ messages }: { messages: Message[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Message | null>(null);
  const [acting, setActing] = useState(false);

  async function markRead(id: string, is_read: boolean) {
    await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read }),
    });
    startTransition(() => router.refresh());
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, is_read } : null);
  }

  async function deleteMessage(id: string) {
    if (!confirm('Smazat zprávu?')) return;
    setActing(true);
    await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
    setActing(false);
    if (selected?.id === id) setSelected(null);
    startTransition(() => router.refresh());
  }

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>
          ZPRÁVY
        </h1>
        <p className="font-mono text-cz-gray-mid" style={{ fontSize: 11, letterSpacing: 2, marginTop: 4 }}>
          {unreadCount > 0
            ? `${unreadCount} NEPŘEČTENÝCH ZPRÁV`
            : 'VŠE PŘEČTENO'}
        </p>
      </div>

      <div className="flex gap-6" style={{ height: 'calc(100vh - 180px)', minHeight: 400 }}>
        {/* List */}
        <div
          className="bg-cz-black-mid rounded-cz overflow-auto flex-shrink-0"
          style={{ width: 380, border: '1px solid #2A2A2A' }}
        >
          {messages.length === 0 ? (
            <div className="font-mono text-cz-gray-mid text-center" style={{ padding: 40, fontSize: 12 }}>
              Žádné zprávy
            </div>
          ) : (
            messages.map((m) => (
              <button
                key={m.id}
                onClick={() => { setSelected(m); if (!m.is_read) markRead(m.id, true); }}
                className="w-full text-left transition-colors hover:bg-white/5"
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #2A2A2A',
                  background: selected?.id === m.id ? 'rgba(232,74,26,0.08)' : 'transparent',
                  borderLeft: selected?.id === m.id ? '2px solid #E84A1A' : '2px solid transparent',
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span
                    className="font-body"
                    style={{ fontSize: 13, fontWeight: m.is_read ? 400 : 700, color: m.is_read ? '#888' : '#fff' }}
                  >
                    {m.name}
                  </span>
                  {!m.is_read && (
                    <span className="rounded-full bg-cz-orange" style={{ width: 7, height: 7, flexShrink: 0 }} />
                  )}
                </div>
                <div className="font-body text-cz-gray-mid truncate" style={{ fontSize: 12 }}>
                  {m.message.slice(0, 60)}{m.message.length > 60 ? '…' : ''}
                </div>
                <div className="font-mono text-cz-gray-mid" style={{ fontSize: 10, marginTop: 6 }}>
                  {new Date(m.created_at).toLocaleDateString('cs-CZ')}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        {selected ? (
          <div
            className="flex-1 bg-cz-black-mid rounded-cz flex flex-col"
            style={{ border: '1px solid #2A2A2A' }}
          >
            <div
              className="flex items-start justify-between"
              style={{ padding: '24px 28px', borderBottom: '1px solid #2A2A2A' }}
            >
              <div>
                <div className="font-display text-white uppercase" style={{ fontSize: 22, letterSpacing: 1 }}>
                  {selected.name}
                </div>
                <div className="font-mono text-cz-gray-light" style={{ fontSize: 12, marginTop: 4 }}>
                  {selected.email}
                </div>
                <div className="font-mono text-cz-gray-mid" style={{ fontSize: 10, marginTop: 4 }}>
                  {new Date(selected.created_at).toLocaleString('cs-CZ')}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => markRead(selected.id, !selected.is_read)}
                  className="font-mono text-cz-gray-mid uppercase hover:text-white transition-colors"
                  style={{ fontSize: 10, letterSpacing: 2 }}
                >
                  {selected.is_read ? 'OZNAČIT NEPŘEČTENÉ' : 'OZNAČIT PŘEČTENÉ'}
                </button>
                <button
                  onClick={() => deleteMessage(selected.id)}
                  disabled={acting}
                  className="font-mono text-red-400 uppercase hover:underline disabled:opacity-50"
                  style={{ fontSize: 10, letterSpacing: 2 }}
                >
                  SMAZAT
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto" style={{ padding: 28 }}>
              <p className="font-body text-cz-white-soft" style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {selected.message}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="flex-1 bg-cz-black-mid rounded-cz flex items-center justify-center"
            style={{ border: '1px solid #2A2A2A' }}
          >
            <p className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 11, letterSpacing: 3 }}>
              VYBERTE ZPRÁVU
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
