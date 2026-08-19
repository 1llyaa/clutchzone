'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageContainer from '@/components/admin/AdminPageContainer';
import Button from '@/components/ui/Button';

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
    <AdminPageContainer>
      <div style={{ marginBottom: 40 }}>
        <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>
          ZPRÁVY
        </h1>
        <p className="font-mono text-cz-gray-light" style={{ fontSize: 16, letterSpacing: 2, marginTop: 4 }}>
          {unreadCount > 0
            ? `${unreadCount} NEPŘEČTENÝCH ZPRÁV`
            : 'VŠE PŘEČTENO'}
        </p>
      </div>

      <div className="flex gap-6" style={{ height: 'calc(100vh - 180px)', minHeight: 400 }}>
        {/* List */}
        <div
          className="bg-cz-black-mid rounded-cz overflow-auto flex-shrink-0 w-full max-w-[380px]"
          style={{ border: '1px solid var(--color-cz-gray-dark)' }}
        >
          {messages.length === 0 ? (
            <div className="font-mono text-cz-gray-light text-center" style={{ padding: 40, fontSize: 17 }}>
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
                  borderBottom: '1px solid var(--color-cz-gray-dark)',
                  background: selected?.id === m.id ? 'rgba(232,74,26,0.08)' : 'transparent',
                  borderLeft: selected?.id === m.id ? '2px solid var(--color-cz-orange)' : '2px solid transparent',
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span
                    className="font-body"
                    style={{ fontSize: 17, fontWeight: m.is_read ? 400 : 700, color: m.is_read ? '#888' : '#fff' }}
                  >
                    {m.name}
                  </span>
                  {!m.is_read && (
                    <span className="rounded-full bg-cz-orange" style={{ width: 7, height: 7, flexShrink: 0 }} />
                  )}
                </div>
                <div className="font-body text-cz-gray-light truncate" style={{ fontSize: 17 }}>
                  {m.message.slice(0, 60)}{m.message.length > 60 ? '…' : ''}
                </div>
                <div className="font-mono text-cz-gray-light" style={{ fontSize: 17, marginTop: 6 }}>
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
            style={{ border: '1px solid var(--color-cz-gray-dark)' }}
          >
            <div
              className="flex items-start justify-between"
              style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-cz-gray-dark)' }}
            >
              <div>
                <div className="font-display text-white uppercase" style={{ fontSize: 22, letterSpacing: 1 }}>
                  {selected.name}
                </div>
                <div className="font-mono text-cz-gray-light" style={{ fontSize: 17, marginTop: 4 }}>
                  {selected.email}
                </div>
                <div className="font-mono text-cz-gray-light" style={{ fontSize: 17, marginTop: 4 }}>
                  {new Date(selected.created_at).toLocaleString('cs-CZ')}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => markRead(selected.id, !selected.is_read)}
                  className="font-mono text-cz-gray-light uppercase hover:text-white transition-colors"
                  style={{ fontSize: 16, letterSpacing: 2 }}
                >
                  {selected.is_read ? 'OZNAČIT NEPŘEČTENÉ' : 'OZNAČIT PŘEČTENÉ'}
                </button>
                <Button
                  onClick={() => deleteMessage(selected.id)}
                  disabled={acting}
                  variant="danger"
                  size="xs"
                >
                  SMAZAT
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto" style={{ padding: 28 }}>
              <p className="font-body text-cz-white-soft" style={{ fontSize: 19, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {selected.message}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="flex-1 bg-cz-black-mid rounded-cz flex items-center justify-center"
            style={{ border: '1px solid var(--color-cz-gray-dark)' }}
          >
            <p className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3 }}>
              VYBERTE ZPRÁVU
            </p>
          </div>
        )}
      </div>
    </AdminPageContainer>
  );
}
