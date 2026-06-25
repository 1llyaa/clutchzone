'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface GalleryImage {
  id: string;
  storage_path: string;
  url: string;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const DISPLAY_TYPES = [
  { value: 'carousel', label: 'CAROUSEL' },
  { value: 'masonry',  label: 'MASONRY' },
  { value: 'mosaic',   label: 'MOZAIKA' },
];

export default function GalleryClient() {
  const [images, setImages]           = useState<GalleryImage[]>([]);
  const [displayType, setDisplayType] = useState('masonry');
  const [loading, setLoading]         = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [dragOver, setDragOver]       = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadData = useCallback(async () => {
    const res = await fetch('/api/admin/gallery');
    const data = await res.json();
    setImages(data.images ?? []);
    setDisplayType(data.config?.display_type ?? 'masonry');
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleFiles(files: File[]) {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    setUploading(true);

    for (const file of imageFiles) {
      const ext  = file.name.split('.').pop() ?? 'jpg';
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage.from('gallery').upload(path, file);
      if (upErr) { console.error(upErr); continue; }

      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(path);

      await fetch('/api/admin/gallery', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: publicUrl, storage_path: path }),
      });
    }

    setUploading(false);
    loadData();
  }

  async function updateDisplayType(type: string) {
    setDisplayType(type);
    await fetch('/api/admin/gallery', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ display_type: type }),
    });
  }

  async function toggleActive(img: GalleryImage) {
    await fetch(`/api/admin/gallery/${img.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_active: !img.is_active }),
    });
    loadData();
  }

  async function move(img: GalleryImage, dir: 'up' | 'down') {
    const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((i) => i.id === img.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];

    await Promise.all([
      fetch(`/api/admin/gallery/${img.id}`,   { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: other.sort_order }) }),
      fetch(`/api/admin/gallery/${other.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: img.sort_order }) }),
    ]);
    loadData();
  }

  async function saveCaption(id: string) {
    await fetch(`/api/admin/gallery/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ caption: editCaption || null }),
    });
    setEditId(null);
    loadData();
  }

  async function deleteImage(img: GalleryImage) {
    if (!confirm('Smazat fotografii?')) return;
    await fetch(`/api/admin/gallery/${img.id}`, { method: 'DELETE' });
    loadData();
  }

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 40 }}>
        <div>
          <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>GALERIE</h1>
          <p className="font-mono text-cz-gray-mid" style={{ fontSize: 11, letterSpacing: 2, marginTop: 4 }}>
            {images.length} FOTOGRAFIÍ · {images.filter((i) => i.is_active).length} AKTIVNÍCH
          </p>
        </div>

        {/* Display type selector */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 9, letterSpacing: 2, marginRight: 4 }}>TYP ZOBRAZENÍ</span>
          {DISPLAY_TYPES.map((dt) => (
            <button
              key={dt.value}
              onClick={() => updateDisplayType(dt.value)}
              className="font-mono uppercase rounded-[2px] transition-colors"
              style={{
                fontSize: 10, letterSpacing: 2, padding: '6px 14px',
                color:      displayType === dt.value ? '#fff' : '#555',
                background: displayType === dt.value ? '#E84A1A' : 'transparent',
                border:     `1px solid ${displayType === dt.value ? '#E84A1A' : '#2A2A2A'}`,
              }}
            >
              {dt.label}
            </button>
          ))}
        </div>
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
          border: `2px dashed ${dragOver ? '#E84A1A' : '#2A2A2A'}`,
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
          <p className="font-mono text-cz-orange uppercase" style={{ fontSize: 12, letterSpacing: 3 }}>NAHRÁVÁNÍ...</p>
        ) : (
          <>
            <div className="font-display text-white uppercase" style={{ fontSize: 18, letterSpacing: 2 }}>+ PŘIDAT FOTOGRAFIE</div>
            <p className="font-mono text-cz-gray-mid" style={{ fontSize: 10, letterSpacing: 2, marginTop: 8 }}>
              PŘETÁHNĚTE SOUBORY NEBO KLIKNĚTE · JPG, PNG, WEBP
            </p>
          </>
        )}
      </div>

      {/* Image grid */}
      {loading ? (
        <p className="font-mono text-cz-gray-mid text-center" style={{ fontSize: 12, padding: 40 }}>NAČÍTÁNÍ...</p>
      ) : sorted.length === 0 ? (
        <p className="font-mono text-cz-gray-mid text-center uppercase" style={{ fontSize: 12, letterSpacing: 3, padding: 40 }}>Žádné fotografie</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {sorted.map((img, idx) => (
            <div
              key={img.id}
              className="bg-cz-black-mid rounded-cz overflow-hidden flex flex-col"
              style={{ border: `1px solid ${img.is_active ? '#2A2A2A' : '#1a1a1a'}`, opacity: img.is_active ? 1 : 0.5 }}
            >
              {/* Thumbnail */}
              <div className="relative" style={{ aspectRatio: '4/3', background: '#111' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.caption || ''}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => move(img, 'up')}
                    disabled={idx === 0}
                    className="font-mono text-white rounded-[2px] disabled:opacity-20 hover:bg-white/20 transition-colors"
                    style={{ fontSize: 11, padding: '2px 6px', background: 'rgba(0,0,0,0.6)' }}
                  >↑</button>
                  <button
                    onClick={() => move(img, 'down')}
                    disabled={idx === sorted.length - 1}
                    className="font-mono text-white rounded-[2px] disabled:opacity-20 hover:bg-white/20 transition-colors"
                    style={{ fontSize: 11, padding: '2px 6px', background: 'rgba(0,0,0,0.6)' }}
                  >↓</button>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-2 flex-1" style={{ padding: '10px 12px' }}>
                {/* Caption */}
                {editId === img.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveCaption(img.id); if (e.key === 'Escape') setEditId(null); }}
                      autoFocus
                      placeholder="Popis..."
                      className="flex-1 bg-cz-black text-white font-body rounded-[2px] focus:outline-none"
                      style={{ fontSize: 11, padding: '4px 8px', border: '1px solid #E84A1A' }}
                    />
                    <button onClick={() => saveCaption(img.id)} className="font-mono text-cz-orange" style={{ fontSize: 10 }}>✓</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditId(img.id); setEditCaption(img.caption ?? ''); }}
                    className="text-left font-body text-cz-gray-mid hover:text-white transition-colors truncate"
                    style={{ fontSize: 11 }}
                  >
                    {img.caption || <span className="italic text-cz-gray-mid" style={{ fontSize: 10 }}>+ přidat popis</span>}
                  </button>
                )}

                <div className="flex items-center justify-between" style={{ marginTop: 'auto' }}>
                  <button
                    onClick={() => toggleActive(img)}
                    className="font-mono uppercase rounded-[2px] transition-colors"
                    style={{
                      fontSize: 9, letterSpacing: 1, padding: '3px 8px',
                      color:      img.is_active ? '#22c55e' : '#888',
                      background: img.is_active ? '#22c55e20' : '#88888820',
                    }}
                  >
                    {img.is_active ? 'AKTIVNÍ' : 'SKRYTÉ'}
                  </button>
                  <button
                    onClick={() => deleteImage(img)}
                    className="font-mono text-red-400 uppercase hover:underline"
                    style={{ fontSize: 9, letterSpacing: 1 }}
                  >
                    SMAZAT
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
