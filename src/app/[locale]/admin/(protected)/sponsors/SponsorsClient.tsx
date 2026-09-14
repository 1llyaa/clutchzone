'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import { Plus, Check, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import AdminPageContainer from '@/components/admin/AdminPageContainer';

interface Sponsor {
  id: string;
  storage_path: string;
  url: string;
  name: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// Sponsor logos are transparent PNGs, which are invisible against the admin's
// black. A checkerboard behind the thumbnail is the only way to see what was
// actually uploaded.
const CHECKERBOARD: React.CSSProperties = {
  backgroundColor: '#0f0f0f',
  backgroundImage:
    'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
};

export default function SponsorsClient() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSite, setEditSite] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const loadData = useCallback(async () => {
    const res = await fetch('/api/admin/sponsors');
    const data = await res.json();
    setSponsors(data.sponsors ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleFiles(files: File[]) {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    setUploading(true);

    for (const file of imageFiles) {
      const ext  = file.name.split('.').pop() ?? 'png';
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage.from('sponsors').upload(path, file);
      if (upErr) { console.error(upErr); continue; }

      const { data: { publicUrl } } = supabase.storage.from('sponsors').getPublicUrl(path);

      await fetch('/api/admin/sponsors', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: publicUrl, storage_path: path }),
      });
    }

    setUploading(false);
    loadData();
  }

  async function toggleActive(s: Sponsor) {
    await fetch(`/api/admin/sponsors/${s.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_active: !s.is_active }),
    });
    loadData();
  }

  async function move(s: Sponsor, dir: 'up' | 'down') {
    const sorted = [...sponsors].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((i) => i.id === s.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];

    await Promise.all([
      fetch(`/api/admin/sponsors/${s.id}`,     { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: other.sort_order }) }),
      fetch(`/api/admin/sponsors/${other.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: s.sort_order }) }),
    ]);
    loadData();
  }

  async function saveDetails(id: string) {
    await fetch(`/api/admin/sponsors/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name: editName.trim() || null,
        website_url: editSite.trim() || null,
      }),
    });
    setEditId(null);
    loadData();
  }

  async function deleteSponsor(s: Sponsor) {
    if (!confirm('Smazat sponzora?')) return;
    await fetch(`/api/admin/sponsors/${s.id}`, { method: 'DELETE' });
    loadData();
  }

  const sorted = [...sponsors].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <AdminPageContainer>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>SPONZOŘI</h1>
        <p className="font-mono text-cz-gray-light" style={{ fontSize: 16, letterSpacing: 2, marginTop: 4 }}>
          {sponsors.length} LOG · {sponsors.filter((s) => s.is_active).length} AKTIVNÍCH
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(Array.from(e.dataTransfer.files)); }}
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center rounded-cz cursor-pointer transition-colors"
        style={{
          marginBottom: 32,
          padding: '40px 24px',
          border: `2px dashed ${dragOver ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)'}`,
          background: dragOver ? 'rgba(232,74,26,0.05)' : 'transparent',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
        />
        {uploading ? (
          <p className="font-mono text-cz-orange uppercase" style={{ fontSize: 16, letterSpacing: 3 }}>NAHRÁVÁNÍ...</p>
        ) : (
          <>
            <div className="font-display text-white uppercase flex items-center gap-2" style={{ fontSize: 18, letterSpacing: 2 }}>
              <Plus size={18} weight="bold" /> PŘIDAT LOGA
            </div>
            <p className="font-mono text-cz-gray-light" style={{ fontSize: 16, letterSpacing: 2, marginTop: 8 }}>
              PŘETÁHNĚTE SOUBORY NEBO KLIKNĚTE · NEJLÉPE PNG S PRŮHLEDNÝM POZADÍM
            </p>
          </>
        )}
      </div>

      {/* Logo grid */}
      {loading ? (
        <p className="font-mono text-cz-gray-light text-center" style={{ fontSize: 17, padding: 40 }}>NAČÍTÁNÍ...</p>
      ) : sorted.length === 0 ? (
        <p className="font-mono text-cz-gray-light text-center uppercase" style={{ fontSize: 16, letterSpacing: 3, padding: 40 }}>
          Žádní sponzoři — sekce se na webu nezobrazí
        </p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {sorted.map((s, idx) => (
            <div
              key={s.id}
              className="bg-cz-black-mid rounded-cz overflow-hidden flex flex-col"
              style={{ border: `1px solid ${s.is_active ? 'var(--color-cz-gray-dark)' : '#1a1a1a'}`, opacity: s.is_active ? 1 : 0.5 }}
            >
              {/* Thumbnail */}
              <div className="relative" style={{ aspectRatio: '16/9', ...CHECKERBOARD }}>
                <Image
                  src={s.url}
                  alt={s.name || ''}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-contain"
                  style={{ padding: 16 }}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => move(s, 'up')}
                    disabled={idx === 0}
                    aria-label="Posunout nahoru"
                    className="font-mono text-white rounded-control disabled:opacity-20 hover:bg-white/20 transition-colors"
                    style={{ fontSize: 16, padding: '2px 6px', background: 'rgba(0,0,0,0.6)' }}
                  ><ArrowUp size={16} weight="bold" /></button>
                  <button
                    onClick={() => move(s, 'down')}
                    disabled={idx === sorted.length - 1}
                    aria-label="Posunout dolů"
                    className="font-mono text-white rounded-control disabled:opacity-20 hover:bg-white/20 transition-colors"
                    style={{ fontSize: 16, padding: '2px 6px', background: 'rgba(0,0,0,0.6)' }}
                  ><ArrowDown size={16} weight="bold" /></button>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-2 flex-1" style={{ padding: '10px 12px' }}>
                {editId === s.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveDetails(s.id); if (e.key === 'Escape') setEditId(null); }}
                      autoFocus
                      placeholder="Název (alt text)"
                      className="bg-cz-black text-white font-body rounded-control focus:outline-none"
                      style={{ fontSize: 19, padding: '4px 8px', border: '1px solid var(--color-cz-orange)' }}
                    />
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={editSite}
                        onChange={(e) => setEditSite(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveDetails(s.id); if (e.key === 'Escape') setEditId(null); }}
                        placeholder="https://…"
                        className="flex-1 bg-cz-black text-white font-body rounded-control focus:outline-none min-w-0"
                        style={{ fontSize: 19, padding: '4px 8px', border: '1px solid var(--color-cz-orange)' }}
                      />
                      <button onClick={() => saveDetails(s.id)} aria-label="Uložit" className="text-cz-orange flex-shrink-0">
                        <Check size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditId(s.id); setEditName(s.name ?? ''); setEditSite(s.website_url ?? ''); }}
                    className="text-left flex flex-col gap-1"
                  >
                    <span className="font-body text-cz-gray-light hover:text-white transition-colors truncate" style={{ fontSize: 17 }}>
                      {s.name || <span className="italic">+ přidat název</span>}
                    </span>
                    <span className="font-mono text-cz-gray-light truncate" style={{ fontSize: 16 }}>
                      {s.website_url || '— bez odkazu'}
                    </span>
                  </button>
                )}

                <div className="flex items-center justify-between" style={{ marginTop: 'auto' }}>
                  <button
                    onClick={() => toggleActive(s)}
                    className="font-mono uppercase rounded-control transition-colors"
                    style={{
                      fontSize: 16, letterSpacing: 1, padding: '3px 8px',
                      color:      s.is_active ? 'var(--color-cz-success)' : '#888',
                      background: s.is_active ? 'color-mix(in srgb, var(--color-cz-success) 12.5%, transparent)' : '#88888820',
                    }}
                  >
                    {s.is_active ? 'AKTIVNÍ' : 'SKRYTÉ'}
                  </button>
                  <button
                    onClick={() => deleteSponsor(s)}
                    className="font-mono text-red-400 uppercase hover:underline"
                    style={{ fontSize: 16, letterSpacing: 1 }}
                  >
                    SMAZAT
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageContainer>
  );
}
