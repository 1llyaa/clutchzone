'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Game {
  id: string;
  title: string;
  genre: string | null;
  description: string | null;
  platform: string;
  cover_url: string | null;
  storage_path: string | null;
  sort_order: number;
  is_active: boolean;
}

const PLATFORM_LABEL: Record<string, string> = { pc: 'PC', ps5: 'PS5', both: 'PC + PS5' };

const EMPTY_FORM = { title: '', genre: '', description: '', platform: 'pc', cover_url: '' };

export default function GamesClient() {
  const [games, setGames]       = useState<Game[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Game | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadGames = useCallback(async () => {
    const res  = await fetch('/api/admin/games');
    const data = await res.json();
    setGames(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadGames(); }, [loadGames]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setCoverFile(null);
    setCoverPreview('');
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(g: Game) {
    setForm({ title: g.title, genre: g.genre ?? '', description: g.description ?? '', platform: g.platform, cover_url: g.cover_url ?? '' });
    setCoverFile(null);
    setCoverPreview(g.cover_url ?? '');
    setEditing(g);
    setShowForm(true);
  }

  function handleFileSelect(file: File | null) {
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);

    let cover_url    = form.cover_url || editing?.cover_url || null;
    let storage_path = editing?.storage_path || null;

    if (coverFile) {
      const ext  = coverFile.name.split('.').pop() ?? 'jpg';
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('games').upload(path, coverFile);
      if (!upErr) {
        if (storage_path) await supabase.storage.from('games').remove([storage_path]);
        storage_path = path;
        cover_url    = supabase.storage.from('games').getPublicUrl(path).data.publicUrl;
      }
    }

    const payload = {
      title:       form.title.trim(),
      genre:       form.genre.trim() || null,
      description: form.description.trim() || null,
      platform:    form.platform,
      cover_url,
      storage_path,
    };

    if (editing) {
      await fetch(`/api/admin/games/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/admin/games', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    setShowForm(false);
    loadGames();
  }

  async function toggleActive(g: Game) {
    await fetch(`/api/admin/games/${g.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !g.is_active }),
    });
    loadGames();
  }

  async function move(g: Game, dir: 'up' | 'down') {
    const sorted = [...games].sort((a, b) => a.sort_order - b.sort_order);
    const idx    = sorted.findIndex((i) => i.id === g.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      fetch(`/api/admin/games/${g.id}`,     { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: other.sort_order }) }),
      fetch(`/api/admin/games/${other.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: g.sort_order }) }),
    ]);
    loadGames();
  }

  async function deleteGame(g: Game) {
    if (!confirm(`Smazat "${g.title}"?`)) return;
    await fetch(`/api/admin/games/${g.id}`, { method: 'DELETE' });
    loadGames();
  }

  const sorted = [...games].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 40 }}>
        <div>
          <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>HERNÍ KNIHOVNA</h1>
          <p className="font-mono text-cz-gray-mid" style={{ fontSize: 11, letterSpacing: 2, marginTop: 4 }}>
            {games.length} HER · {games.filter((g) => g.is_active).length} AKTIVNÍCH
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark transition-colors rounded-[2px]"
          style={{ fontSize: 13, letterSpacing: 2, padding: '10px 24px' }}
        >
          + PŘIDAT HRU
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="font-mono text-cz-gray-mid text-center" style={{ padding: 40, fontSize: 12 }}>NAČÍTÁNÍ...</p>
      ) : (
        <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid #2A2A2A' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                {['', 'NÁZEV', 'ŽÁNR', 'PLATFORMA', 'STATUS', ''].map((h) => (
                  <th key={h} className="font-mono text-cz-gray-mid uppercase text-left" style={{ padding: '12px 16px', fontSize: 10, letterSpacing: 2 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={6} className="font-mono text-cz-gray-mid text-center" style={{ padding: 40, fontSize: 12 }}>Žádné hry</td></tr>
              ) : sorted.map((g, idx) => (
                <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: g.is_active ? 1 : 0.45 }}>
                  {/* Thumbnail */}
                  <td style={{ padding: '8px 16px', width: 52 }}>
                    {g.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.cover_url} alt={g.title} style={{ width: 36, height: 52, objectFit: 'cover', borderRadius: 2 }} />
                    ) : (
                      <div style={{ width: 36, height: 52, background: '#2A2A2A', borderRadius: 2 }} />
                    )}
                  </td>
                  <td className="font-body text-white" style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{g.title}</td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '12px 16px', fontSize: 11 }}>{g.genre || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="font-mono uppercase rounded-[2px]" style={{ fontSize: 9, letterSpacing: 1, padding: '3px 8px', color: g.platform === 'ps5' ? '#60a5fa' : '#E84A1A', background: g.platform === 'ps5' ? '#60a5fa20' : '#E84A1A20' }}>
                      {PLATFORM_LABEL[g.platform]}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => toggleActive(g)} className="font-mono uppercase rounded-[2px]" style={{ fontSize: 9, letterSpacing: 1, padding: '3px 8px', color: g.is_active ? '#22c55e' : '#888', background: g.is_active ? '#22c55e20' : '#88888820' }}>
                      {g.is_active ? 'AKTIVNÍ' : 'SKRYTÉ'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        <button onClick={() => move(g, 'up')} disabled={idx === 0} className="font-mono text-cz-gray-mid hover:text-white disabled:opacity-20" style={{ fontSize: 13 }}>↑</button>
                        <button onClick={() => move(g, 'down')} disabled={idx === sorted.length - 1} className="font-mono text-cz-gray-mid hover:text-white disabled:opacity-20" style={{ fontSize: 13 }}>↓</button>
                      </div>
                      <button onClick={() => openEdit(g)} className="font-mono text-cz-orange uppercase hover:underline" style={{ fontSize: 10, letterSpacing: 1 }}>UPRAVIT</button>
                      <button onClick={() => deleteGame(g)} className="font-mono text-red-400 uppercase hover:underline" style={{ fontSize: 10, letterSpacing: 1 }}>SMAZAT</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setShowForm(false)}>
          <div className="bg-cz-black-mid rounded-cz w-full max-w-xl overflow-auto" style={{ maxHeight: '90vh', padding: 40, border: '1px solid #2A2A2A' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-white uppercase" style={{ fontSize: 24, letterSpacing: 2, marginBottom: 28 }}>
              {editing ? 'UPRAVIT HRU' : 'PŘIDAT HRU'}
            </h2>

            <div className="flex gap-6">
              {/* Cover upload */}
              <div
                className="flex-shrink-0 flex flex-col items-center justify-center rounded-[2px] cursor-pointer overflow-hidden"
                style={{ width: 120, height: 172, border: '2px dashed #2A2A2A', background: '#111', position: 'relative' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 p-3 text-center">
                    <span className="font-mono text-cz-gray-mid" style={{ fontSize: 24 }}>+</span>
                    <span className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 8, letterSpacing: 2 }}>COVER</span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />
              </div>

              {/* Fields */}
              <div className="flex-1 flex flex-col gap-4">
                {[
                  { label: 'NÁZEV *', key: 'title',       type: 'text',     placeholder: 'Counter-Strike 2' },
                  { label: 'ŽÁNR',    key: 'genre',       type: 'text',     placeholder: 'FPS · Taktický' },
                  { label: 'COVER URL (alternativa k uploadu)', key: 'cover_url', type: 'text', placeholder: 'https://...' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} className="flex flex-col gap-2">
                    <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 9, letterSpacing: 2 }}>{label}</label>
                    <input
                      type={type}
                      value={(form as any)[key]}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange"
                      style={{ padding: '8px 12px', fontSize: 13, border: '1px solid #2A2A2A' }}
                    />
                  </div>
                ))}

                {/* Platform */}
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 9, letterSpacing: 2 }}>PLATFORMA</label>
                  <div className="flex gap-2">
                    {[{ value: 'pc', label: 'PC' }, { value: 'ps5', label: 'PS5' }, { value: 'both', label: 'PC + PS5' }].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, platform: opt.value }))}
                        className="font-mono uppercase rounded-[2px] transition-colors"
                        style={{ fontSize: 10, letterSpacing: 1, padding: '6px 14px', color: form.platform === opt.value ? '#fff' : '#555', background: form.platform === opt.value ? '#E84A1A' : 'transparent', border: `1px solid ${form.platform === opt.value ? '#E84A1A' : '#2A2A2A'}` }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2" style={{ marginTop: 16 }}>
              <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 9, letterSpacing: 2 }}>POPIS</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Krátký popis hry..."
                className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange resize-none"
                style={{ padding: '8px 12px', fontSize: 13, border: '1px solid #2A2A2A' }}
              />
            </div>

            <div className="flex gap-3" style={{ marginTop: 24 }}>
              <button onClick={handleSave} disabled={saving || !form.title.trim()} className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark rounded-[2px] disabled:opacity-50" style={{ fontSize: 13, letterSpacing: 2, padding: '11px 28px' }}>
                {saving ? '...' : 'ULOŽIT'}
              </button>
              <button onClick={() => setShowForm(false)} className="font-display uppercase text-cz-gray-mid hover:text-white rounded-[2px]" style={{ fontSize: 13, letterSpacing: 2, padding: '11px 28px', border: '1px solid #2A2A2A', background: 'transparent' }}>
                ZRUŠIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
