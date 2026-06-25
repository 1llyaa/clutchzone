'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Tournament {
  id: string;
  title: string;
  game: string;
  date: string;
  format: string | null;
  prize_pool: number | null;
  max_slots: number;
  filled_slots: number;
  registration_deadline: string | null;
  is_active: boolean;
}

const EMPTY: Omit<Tournament, 'id' | 'filled_slots' | 'is_active'> = {
  title: '',
  game: '',
  date: '',
  format: '',
  prize_pool: null,
  max_slots: 16,
  registration_deadline: null,
};

export default function TournamentsClient({ tournaments }: { tournaments: Tournament[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<Tournament | null>(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  function openCreate() {
    setForm(EMPTY);
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(t: Tournament) {
    setForm({
      title: t.title,
      game: t.game,
      date: t.date,
      format: t.format ?? '',
      prize_pool: t.prize_pool,
      max_slots: t.max_slots,
      registration_deadline: t.registration_deadline,
    });
    setEditing(t);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const body = {
      ...form,
      prize_pool: form.prize_pool ? Number(form.prize_pool) : null,
      max_slots: Number(form.max_slots),
    };

    if (editing) {
      await fetch(`/api/admin/tournaments/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    setSaving(false);
    setShowForm(false);
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    if (!confirm('Opravdu smazat turnaj?')) return;
    setDeleting(id);
    setDeleteError('');
    const res = await fetch(`/api/admin/tournaments/${id}`, { method: 'DELETE' });
    setDeleting(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? `Chyba ${res.status}`);
      return;
    }
    startTransition(() => router.refresh());
  }

  async function toggleActive(t: Tournament) {
    await fetch(`/api/admin/tournaments/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !t.is_active }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div style={{ padding: '40px 48px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 40 }}>
        <div>
          <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>
            TURNAJE
          </h1>
          <p className="font-mono text-cz-gray-mid" style={{ fontSize: 11, letterSpacing: 2, marginTop: 4 }}>
            {tournaments.length} TURNAJŮ
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark transition-colors rounded-[2px]"
          style={{ fontSize: 13, letterSpacing: 2, padding: '10px 24px' }}
        >
          + NOVÝ TURNAJ
        </button>
      </div>
      {deleteError && (
        <div
          className="font-mono text-red-400 rounded-[2px]"
          style={{ fontSize: 11, padding: '10px 16px', background: '#ef444415', border: '1px solid #ef4444', marginBottom: 16 }}
        >
          Smazání selhalo: {deleteError}
        </div>
      )}

      <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid #2A2A2A' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
              {['DATUM', 'NÁZEV', 'HRA', 'FORMÁT', 'PRIZE POOL', 'SLOTY', 'STATUS', ''].map((h) => (
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
            {tournaments.length === 0 ? (
              <tr>
                <td colSpan={8} className="font-mono text-cz-gray-mid text-center" style={{ padding: 40, fontSize: 12 }}>
                  Žádné turnaje
                </td>
              </tr>
            ) : (
              tournaments.map((t) => (
                <tr
                  key={t.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: t.is_active ? 1 : 0.45 }}
                >
                  <td className="font-mono text-white" style={{ padding: '12px 16px', fontSize: 12 }}>
                    {new Date(t.date).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="font-body text-white" style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>
                    {t.title}
                  </td>
                  <td className="font-mono text-cz-orange" style={{ padding: '12px 16px', fontSize: 11 }}>
                    {t.game}
                  </td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '12px 16px', fontSize: 11 }}>
                    {t.format || '—'}
                  </td>
                  <td className="font-body text-white" style={{ padding: '12px 16px', fontSize: 13 }}>
                    {t.prize_pool ? `${t.prize_pool} Kč` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex items-center gap-2">
                      <div
                        className="rounded-full"
                        style={{
                          height: 4,
                          width: 80,
                          background: '#2A2A2A',
                        }}
                      >
                        <div
                          className="rounded-full bg-cz-orange"
                          style={{ height: 4, width: `${Math.min(100, (t.filled_slots / t.max_slots) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-cz-gray-light" style={{ fontSize: 11 }}>
                        {t.filled_slots}/{t.max_slots}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => toggleActive(t)}
                      className="font-mono uppercase rounded-[2px]"
                      style={{
                        fontSize: 9,
                        letterSpacing: 1,
                        padding: '3px 8px',
                        color: t.is_active ? '#22c55e' : '#888',
                        background: t.is_active ? '#22c55e20' : '#88888820',
                      }}
                    >
                      {t.is_active ? 'AKTIVNÍ' : 'INACTIVE'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEdit(t)}
                        className="font-mono text-cz-orange uppercase hover:underline"
                        style={{ fontSize: 10, letterSpacing: 1 }}
                      >
                        UPRAVIT
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting === t.id}
                        className="font-mono text-red-400 uppercase hover:underline disabled:opacity-50"
                        style={{ fontSize: 10, letterSpacing: 1 }}
                      >
                        SMAZAT
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-cz-black-mid rounded-cz w-full max-w-lg"
            style={{ padding: 40, border: '1px solid #2A2A2A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-white uppercase" style={{ fontSize: 24, letterSpacing: 2, marginBottom: 28 }}>
              {editing ? 'UPRAVIT TURNAJ' : 'NOVÝ TURNAJ'}
            </h2>

            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {[
                { label: 'NÁZEV',    key: 'title',       type: 'text',   full: true },
                { label: 'HRA',      key: 'game',        type: 'text' },
                { label: 'DATUM',    key: 'date',        type: 'date' },
                { label: 'FORMÁT',   key: 'format',      type: 'text' },
                { label: 'PRIZE POOL (Kč)', key: 'prize_pool', type: 'number' },
                { label: 'MAX SLOTY', key: 'max_slots',  type: 'number' },
                { label: 'DEADLINE REGISTRACE', key: 'registration_deadline', type: 'date', full: true },
              ].map(({ label, key, type, full }) => (
                <div
                  key={key}
                  className="flex flex-col gap-2"
                  style={{ gridColumn: full ? '1 / -1' : 'auto' }}
                >
                  <label className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    value={(form as any)[key] ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value || null }))}
                    className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange"
                    style={{ padding: '9px 12px', fontSize: 13, border: '1px solid #2A2A2A' }}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3" style={{ marginTop: 28 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark rounded-[2px] disabled:opacity-50"
                style={{ fontSize: 13, letterSpacing: 2, padding: '11px 28px' }}
              >
                {saving ? '...' : 'ULOŽIT'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="font-display uppercase text-cz-gray-mid hover:text-white rounded-[2px]"
                style={{ fontSize: 13, letterSpacing: 2, padding: '11px 28px', border: '1px solid #2A2A2A', background: 'transparent' }}
              >
                ZRUŠIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
